import hmac
import hashlib
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from events.models import Event
from orders.models import Ticket, Order
from organizations.models import Organization


def verify_qr_payload(qr_data):
    """Verify HMAC signature and extract IDs from QR payload."""
    parts = qr_data.strip().split(":")
    if len(parts) != 4:
        return None
    order_id, tier_id, ticket_id, signature = parts
    message = f"{order_id}:{tier_id}:{ticket_id}"
    expected = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()[:16]
    if not hmac.compare_digest(signature, expected):
        return None
    return {"order_id": order_id, "tier_id": tier_id, "ticket_id": ticket_id}


def get_event_for_checkin(org_slug, event_slug, user):
    """Get event, ensuring user is a member of the org."""
    org = get_object_or_404(Organization, slug=org_slug, members__user=user)
    return get_object_or_404(Event, organization=org, slug=event_slug)


class ScanQRView(APIView):
    """Scan a QR code to check in an attendee."""

    def post(self, request, org_slug, event_slug):
        event = get_event_for_checkin(org_slug, event_slug, request.user)
        qr_data = request.data.get("qr_data", "")

        ids = verify_qr_payload(qr_data)
        if not ids:
            return Response({
                "status": "invalid",
                "message": "Invalid QR code. Signature verification failed.",
            }, status=status.HTTP_200_OK)

        ticket = Ticket.objects.filter(
            id=ids["ticket_id"], event=event
        ).select_related("ticket_tier", "order").first()

        if not ticket:
            return Response({
                "status": "invalid",
                "message": "Ticket not found for this event.",
            }, status=status.HTTP_200_OK)

        if ticket.status != Ticket.Status.ACTIVE:
            return Response({
                "status": "invalid",
                "message": f"Ticket is {ticket.status.lower()}.",
            }, status=status.HTTP_200_OK)

        if ticket.checked_in:
            return Response({
                "status": "already_checked_in",
                "message": f"Already checked in at {ticket.checked_in_at.strftime('%I:%M %p')}.",
                "attendee_name": ticket.attendee_name,
                "tier_name": ticket.ticket_tier.name,
                "checked_in_at": ticket.checked_in_at.isoformat(),
            }, status=status.HTTP_200_OK)

        # Check in!
        ticket.checked_in = True
        ticket.checked_in_at = timezone.now()
        ticket.checked_in_by = request.user
        ticket.save(update_fields=["checked_in", "checked_in_at", "checked_in_by"])

        return Response({
            "status": "success",
            "message": "Checked in successfully!",
            "attendee_name": ticket.attendee_name,
            "attendee_email": ticket.attendee_email,
            "tier_name": ticket.ticket_tier.name,
            "checked_in_at": ticket.checked_in_at.isoformat(),
        })


class ManualCheckInView(APIView):
    """Manually check in a ticket by ID."""

    def post(self, request, org_slug, event_slug, ticket_id):
        event = get_event_for_checkin(org_slug, event_slug, request.user)
        ticket = get_object_or_404(
            Ticket, id=ticket_id, event=event, status=Ticket.Status.ACTIVE
        )

        if ticket.checked_in:
            return Response({
                "status": "already_checked_in",
                "message": f"Already checked in at {ticket.checked_in_at.strftime('%I:%M %p')}.",
            }, status=status.HTTP_200_OK)

        ticket.checked_in = True
        ticket.checked_in_at = timezone.now()
        ticket.checked_in_by = request.user
        ticket.save(update_fields=["checked_in", "checked_in_at", "checked_in_by"])

        return Response({
            "status": "success",
            "message": "Checked in successfully!",
            "attendee_name": ticket.attendee_name,
            "tier_name": ticket.ticket_tier.name,
        })


class CheckInStatsView(APIView):
    """Live check-in counts for an event."""

    def get(self, request, org_slug, event_slug):
        event = get_event_for_checkin(org_slug, event_slug, request.user)
        tickets = Ticket.objects.filter(event=event, status=Ticket.Status.ACTIVE)
        total = tickets.count()
        checked_in = tickets.filter(checked_in=True).count()

        # Per-tier breakdown
        from django.db.models import Count
        tiers = tickets.values(
            "ticket_tier__name"
        ).annotate(
            total=Count("id"),
            checked_in_count=Count("id", filter=Q(checked_in=True)),
        ).order_by("ticket_tier__name")

        return Response({
            "total_registered": total,
            "checked_in": checked_in,
            "not_checked_in": total - checked_in,
            "percentage": round((checked_in / total * 100) if total > 0 else 0, 1),
            "by_tier": [
                {
                    "tier_name": t["ticket_tier__name"],
                    "total": t["total"],
                    "checked_in": t["checked_in_count"],
                }
                for t in tiers
            ],
        })


class CheckInSearchView(APIView):
    """Search attendees by name or confirmation code."""

    def get(self, request, org_slug, event_slug):
        event = get_event_for_checkin(org_slug, event_slug, request.user)
        q = request.query_params.get("q", "").strip()
        if not q:
            return Response([])

        tickets = Ticket.objects.filter(
            event=event,
            status=Ticket.Status.ACTIVE,
        ).filter(
            Q(attendee_name__icontains=q) |
            Q(attendee_email__icontains=q) |
            Q(order__confirmation_code__icontains=q)
        ).select_related("ticket_tier", "order")[:20]

        return Response([
            {
                "ticket_id": str(t.id),
                "attendee_name": t.attendee_name,
                "attendee_email": t.attendee_email,
                "tier_name": t.ticket_tier.name,
                "confirmation_code": t.order.confirmation_code,
                "checked_in": t.checked_in,
                "checked_in_at": t.checked_in_at.isoformat() if t.checked_in_at else None,
            }
            for t in tickets
        ])
