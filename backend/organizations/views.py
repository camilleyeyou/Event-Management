from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Organization, OrganizationMember
from .serializers import (
    OrganizationSerializer,
    OrganizationCreateSerializer,
    MemberSerializer,
    InviteMemberSerializer,
)
from .permissions import IsOrgMember, IsOrgOwner, IsOrgManagerOrAbove

User = get_user_model()


class OrganizationListCreateView(generics.ListCreateAPIView):
    """GET: list my orgs. POST: create a new org."""

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrganizationCreateSerializer
        return OrganizationSerializer

    def get_queryset(self):
        return Organization.objects.filter(
            members__user=self.request.user
        ).distinct()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = serializer.save()
        # Creator becomes the owner
        OrganizationMember.objects.create(
            organization=org,
            user=request.user,
            role=OrganizationMember.Role.OWNER,
            accepted_at=timezone.now(),
        )
        return Response(
            OrganizationSerializer(org, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    """GET: org detail. PATCH: update org (manager+)."""
    serializer_class = OrganizationSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "org_slug"

    def get_queryset(self):
        return Organization.objects.filter(members__user=self.request.user)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated(), IsOrgMember()]
        return [permissions.IsAuthenticated(), IsOrgManagerOrAbove()]


class MemberListView(generics.ListAPIView):
    """List team members of an organization."""
    serializer_class = MemberSerializer

    def get_queryset(self):
        org = get_object_or_404(
            Organization, slug=self.kwargs["org_slug"], members__user=self.request.user
        )
        return org.members.select_related("user").all()


class InviteMemberView(generics.CreateAPIView):
    """Invite a team member by email (manager+)."""
    serializer_class = InviteMemberSerializer

    def create(self, request, *args, **kwargs):
        org = get_object_or_404(Organization, slug=self.kwargs["org_slug"])
        # Check requester is manager or owner
        requester_member = org.members.filter(user=request.user).first()
        if not requester_member or requester_member.role not in [
            OrganizationMember.Role.OWNER,
            OrganizationMember.Role.MANAGER,
        ]:
            return Response(
                {"detail": "You do not have permission to invite members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        role = serializer.validated_data["role"]

        # Prevent volunteers from inviting managers/owners
        if requester_member.role == OrganizationMember.Role.MANAGER and role == OrganizationMember.Role.OWNER:
            return Response(
                {"detail": "Managers cannot assign the Owner role."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if user exists
        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {"detail": "No account found with that email. They must register first."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if already a member
        if org.members.filter(user=user).exists():
            return Response(
                {"detail": "This user is already a member of the organization."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member = OrganizationMember.objects.create(
            organization=org, user=user, role=role, accepted_at=timezone.now()
        )
        return Response(MemberSerializer(member).data, status=status.HTTP_201_CREATED)


class RemoveMemberView(generics.DestroyAPIView):
    """Remove a team member (owner only)."""

    def get_object(self):
        org = get_object_or_404(Organization, slug=self.kwargs["org_slug"])
        return get_object_or_404(org.members, id=self.kwargs["member_id"])

    def destroy(self, request, *args, **kwargs):
        org = get_object_or_404(Organization, slug=self.kwargs["org_slug"])
        # Only owners can remove members
        if not org.members.filter(
            user=request.user, role=OrganizationMember.Role.OWNER
        ).exists():
            return Response(
                {"detail": "Only owners can remove members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = self.get_object()
        # Prevent removing yourself if you're the only owner
        if member.user == request.user and member.role == OrganizationMember.Role.OWNER:
            owner_count = org.members.filter(role=OrganizationMember.Role.OWNER).count()
            if owner_count <= 1:
                return Response(
                    {"detail": "Cannot remove the only owner."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
