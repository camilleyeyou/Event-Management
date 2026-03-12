from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from organizations.models import Organization, OrganizationMember
from .models import Venue
from .serializers import VenueSerializer


class VenueListCreateView(generics.ListCreateAPIView):
    serializer_class = VenueSerializer

    def get_org(self):
        return get_object_or_404(
            Organization,
            slug=self.kwargs["org_slug"],
            members__user=self.request.user,
        )

    def get_queryset(self):
        org = self.get_org()
        return Venue.objects.filter(organization=org).order_by("-created_at")

    def perform_create(self, serializer):
        org = self.get_org()
        # Only managers+ can create venues
        member = org.members.get(user=self.request.user)
        if member.role not in [
            OrganizationMember.Role.OWNER,
            OrganizationMember.Role.MANAGER,
        ]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only managers and owners can create venues.")
        serializer.save(organization=org)


class VenueDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VenueSerializer
    lookup_field = "id"
    lookup_url_kwarg = "venue_id"

    def get_org(self):
        return get_object_or_404(
            Organization,
            slug=self.kwargs["org_slug"],
            members__user=self.request.user,
        )

    def get_queryset(self):
        org = self.get_org()
        return Venue.objects.filter(organization=org)

    def check_write_permission(self):
        org = self.get_org()
        member = org.members.get(user=self.request.user)
        if member.role not in [
            OrganizationMember.Role.OWNER,
            OrganizationMember.Role.MANAGER,
        ]:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only managers and owners can modify venues.")

    def perform_update(self, serializer):
        self.check_write_permission()
        serializer.save()

    def perform_destroy(self, instance):
        self.check_write_permission()
        instance.delete()
