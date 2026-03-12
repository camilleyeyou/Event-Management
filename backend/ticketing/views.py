from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from organizations.models import Organization, OrganizationMember
from events.models import Event
from .models import TicketTier, PromoCode
from .serializers import TicketTierSerializer, PromoCodeSerializer, PromoCodeValidateSerializer


def get_event_for_manager(org_slug, event_slug, user):
    org = get_object_or_404(Organization, slug=org_slug, members__user=user)
    member = org.members.filter(user=user).first()
    if not member or member.role not in [
        OrganizationMember.Role.OWNER,
        OrganizationMember.Role.MANAGER,
    ]:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Only managers and owners can manage tickets.")
    return get_object_or_404(Event, organization=org, slug=event_slug)


class TicketTierListCreateView(generics.ListCreateAPIView):
    serializer_class = TicketTierSerializer

    def get_queryset(self):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        return TicketTier.objects.filter(event=event)

    def perform_create(self, serializer):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        serializer.save(event=event)


class TicketTierDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TicketTierSerializer
    lookup_field = "id"
    lookup_url_kwarg = "tier_id"

    def get_queryset(self):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        return TicketTier.objects.filter(event=event)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class PromoCodeListCreateView(generics.ListCreateAPIView):
    serializer_class = PromoCodeSerializer

    def get_queryset(self):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        return PromoCode.objects.filter(event=event)

    def perform_create(self, serializer):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        serializer.save(event=event, code=serializer.validated_data["code"].upper().strip())


class PromoCodeDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PromoCodeSerializer
    lookup_field = "id"
    lookup_url_kwarg = "code_id"

    def get_queryset(self):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        return PromoCode.objects.filter(event=event)


class PromoCodeValidateView(APIView):
    """Public endpoint to validate a promo code at checkout."""

    def post(self, request, org_slug, event_slug):
        event = get_object_or_404(
            Event, organization__slug=org_slug, slug=event_slug
        )
        serializer = PromoCodeValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code_str = serializer.validated_data["code"]
        tier_id = serializer.validated_data.get("tier_id")

        promo = PromoCode.objects.filter(
            event=event, code=code_str, is_active=True
        ).first()

        if not promo:
            return Response(
                {"valid": False, "detail": "Invalid promo code."},
                status=status.HTTP_200_OK,
            )

        now = timezone.now()
        if promo.valid_from and now < promo.valid_from:
            return Response(
                {"valid": False, "detail": "This promo code is not yet active."},
                status=status.HTTP_200_OK,
            )
        if promo.valid_until and now > promo.valid_until:
            return Response(
                {"valid": False, "detail": "This promo code has expired."},
                status=status.HTTP_200_OK,
            )
        if promo.usage_limit and promo.usage_count >= promo.usage_limit:
            return Response(
                {"valid": False, "detail": "This promo code has reached its usage limit."},
                status=status.HTTP_200_OK,
            )
        if tier_id and promo.applicable_tier_ids and str(tier_id) not in [str(t) for t in promo.applicable_tier_ids]:
            return Response(
                {"valid": False, "detail": "This promo code does not apply to the selected ticket."},
                status=status.HTTP_200_OK,
            )

        return Response({
            "valid": True,
            "discount_type": promo.discount_type,
            "discount_value": str(promo.discount_value),
            "code": promo.code,
        })
