from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from events.models import Event
from orders.models import Ticket
from organizations.models import Organization, OrganizationMember
from .models import EventEmailLog
from .serializers import EventEmailLogSerializer, BulkEmailSerializer, EmailConfigSerializer
from .email_service import send_custom_bulk_email


def get_event_for_manager(org_slug, event_slug, user):
    org = get_object_or_404(Organization, slug=org_slug, members__user=user)
    member = org.members.filter(user=user).first()
    if not member or member.role not in [
        OrganizationMember.Role.OWNER,
        OrganizationMember.Role.MANAGER,
    ]:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Only managers and owners can manage email settings.")
    return get_object_or_404(Event, organization=org, slug=event_slug)


class EmailConfigView(APIView):
    """GET/PUT email notification toggles for an event."""

    def get(self, request, org_slug, event_slug):
        event = get_event_for_manager(org_slug, event_slug, request.user)
        defaults = {
            "confirmation": True,
            "reminder_48h": True,
            "reminder_day_of": True,
            "cancellation": True,
            "post_event_thanks": True,
            "new_registration": True,
        }
        config = {**defaults, **(event.email_config or {})}
        return Response(config)

    def put(self, request, org_slug, event_slug):
        event = get_event_for_manager(org_slug, event_slug, request.user)
        serializer = EmailConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event.email_config = serializer.validated_data
        event.save(update_fields=["email_config"])
        return Response(serializer.validated_data)


class EmailLogView(generics.ListAPIView):
    """View sent email history for an event."""
    serializer_class = EventEmailLogSerializer

    def get_queryset(self):
        event = get_event_for_manager(
            self.kwargs["org_slug"], self.kwargs["event_slug"], self.request.user
        )
        return EventEmailLog.objects.filter(event=event).order_by("-sent_at")[:100]


class BulkEmailView(APIView):
    """Send a custom email to all attendees of an event."""

    def post(self, request, org_slug, event_slug):
        event = get_event_for_manager(org_slug, event_slug, request.user)
        serializer = BulkEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get all unique attendee emails
        tickets = Ticket.objects.filter(
            event=event, status=Ticket.Status.ACTIVE
        ).select_related("user").values_list("attendee_email", "user").distinct()

        recipients = [(email, user_id) for email, user_id in tickets]
        if not recipients:
            return Response({"detail": "No attendees to email."}, status=status.HTTP_400_BAD_REQUEST)

        # Build HTML
        subject = serializer.validated_data["subject"]
        body = serializer.validated_data["body"]
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2e7d5b;">{event.title}</h2>
            <div>{body}</div>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">— The GatherGood Team</p>
        </div>
        """

        # Convert user IDs to user objects for logging
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user_map = {u.id: u for u in User.objects.filter(id__in=[uid for _, uid in recipients if uid])}
        email_recipients = [(email, user_map.get(uid)) for email, uid in recipients]

        results = send_custom_bulk_email(event, subject, html, email_recipients)
        sent_count = sum(1 for r in results if r["sent"])

        return Response({
            "total": len(results),
            "sent": sent_count,
            "failed": len(results) - sent_count,
        })
