import csv
from decimal import Decimal
from django.http import HttpResponse
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncDate
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from organizations.models import Organization, OrganizationMember
from orders.models import Order, Ticket
from ticketing.models import PromoCode
from .models import Event
from .serializers import EventSerializer, EventCreateSerializer


def get_org_for_user(org_slug, user):
    return get_object_or_404(
        Organization, slug=org_slug, members__user=user
    )


def check_manager_or_above(org, user):
    member = org.members.filter(user=user).first()
    if not member or member.role not in [
        OrganizationMember.Role.OWNER,
        OrganizationMember.Role.MANAGER,
    ]:
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Only managers and owners can perform this action.")
    return member


class EventListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return EventCreateSerializer
        return EventSerializer

    def get_queryset(self):
        org = get_org_for_user(self.kwargs["org_slug"], self.request.user)
        return Event.objects.filter(organization=org).order_by("-created_at")

    def create(self, request, *args, **kwargs):
        org = get_org_for_user(self.kwargs["org_slug"], request.user)
        check_manager_or_above(org, request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(organization=org, created_by=request.user)
        return Response(
            EventSerializer(event).data,
            status=status.HTTP_201_CREATED,
        )


class EventDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EventSerializer
    lookup_field = "slug"
    lookup_url_kwarg = "event_slug"

    def get_queryset(self):
        org = get_org_for_user(self.kwargs["org_slug"], self.request.user)
        return Event.objects.filter(organization=org)

    def perform_update(self, serializer):
        org = get_org_for_user(self.kwargs["org_slug"], self.request.user)
        check_manager_or_above(org, self.request.user)
        serializer.save()


class EventPublishView(APIView):
    def post(self, request, org_slug, event_slug):
        org = get_org_for_user(org_slug, request.user)
        check_manager_or_above(org, request.user)
        event = get_object_or_404(Event, organization=org, slug=event_slug)
        if event.status != Event.Status.DRAFT:
            return Response(
                {"detail": "Only draft events can be published."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.status = Event.Status.PUBLISHED
        event.save()
        return Response(EventSerializer(event).data)


class EventCancelView(APIView):
    def post(self, request, org_slug, event_slug):
        org = get_org_for_user(org_slug, request.user)
        check_manager_or_above(org, request.user)
        event = get_object_or_404(Event, organization=org, slug=event_slug)
        if event.status in [Event.Status.COMPLETED, Event.Status.CANCELLED]:
            return Response(
                {"detail": "Cannot cancel a completed or already cancelled event."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.status = Event.Status.CANCELLED
        event.save()
        return Response(EventSerializer(event).data)


class PublicEventDetailView(APIView):
    """Public event page - no auth required. Returns event + org branding + ticket tiers."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, org_slug, event_slug):
        from ticketing.models import TicketTier

        event = get_object_or_404(
            Event,
            organization__slug=org_slug,
            slug=event_slug,
            status__in=[Event.Status.PUBLISHED, Event.Status.LIVE, Event.Status.COMPLETED],
        )
        if event.is_private:
            from rest_framework.exceptions import NotFound
            raise NotFound()

        org = event.organization
        tiers = TicketTier.objects.filter(
            event=event, is_active=True, visibility="PUBLIC"
        ).order_by("sort_order", "price")

        return Response({
            "event": EventSerializer(event).data,
            "organization": {
                "name": org.name,
                "slug": org.slug,
                "logo_url": org.logo_url,
                "primary_color": org.primary_color,
                "description": org.description,
                "contact_email": org.contact_email,
            },
            "ticket_tiers": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "description": t.description,
                    "price": str(t.price),
                    "quantity_remaining": t.quantity_total - t.quantity_sold,
                    "sales_start": t.sales_start.isoformat() if t.sales_start else None,
                    "sales_end": t.sales_end.isoformat() if t.sales_end else None,
                    "min_per_order": t.min_per_order,
                    "max_per_order": t.max_per_order,
                }
                for t in tiers
            ],
        })


class PublicOrgPageView(APIView):
    """Public organization landing page - shows org info + upcoming/past events."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, org_slug):
        org = get_object_or_404(Organization, slug=org_slug)

        events = Event.objects.filter(
            organization=org,
            is_private=False,
            status__in=[Event.Status.PUBLISHED, Event.Status.LIVE, Event.Status.COMPLETED],
        ).select_related("venue").order_by("-start_datetime")

        return Response({
            "organization": {
                "name": org.name,
                "slug": org.slug,
                "description": org.description,
                "website_url": org.website_url,
                "logo_url": org.logo_url,
                "banner_url": org.banner_url,
                "primary_color": org.primary_color,
                "contact_email": org.contact_email,
                "contact_phone": org.contact_phone,
            },
            "events": [
                {
                    "slug": e.slug,
                    "title": e.title,
                    "subtitle": e.subtitle,
                    "cover_image_url": e.cover_image_url,
                    "category": e.category,
                    "format": e.format,
                    "status": e.status,
                    "start_datetime": e.start_datetime.isoformat() if e.start_datetime else None,
                    "end_datetime": e.end_datetime.isoformat() if e.end_datetime else None,
                    "timezone": e.timezone,
                    "date_tbd": e.date_tbd,
                    "venue_name": e.venue.name if e.venue else None,
                    "venue_city": e.venue.city if e.venue else None,
                }
                for e in events
            ],
        })


class PublicEventBrowseView(APIView):
    """Public event browse/search page. Supports keyword, category, format, date filters."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        events = Event.objects.filter(
            is_private=False,
            status__in=[Event.Status.PUBLISHED, Event.Status.LIVE],
        ).select_related("venue", "organization").order_by("start_datetime")

        # Keyword search
        q = request.query_params.get("q", "").strip()
        if q:
            events = events.filter(
                Q(title__icontains=q) |
                Q(subtitle__icontains=q) |
                Q(description__icontains=q) |
                Q(organization__name__icontains=q)
            )

        # Category filter
        category = request.query_params.get("category", "").strip()
        if category:
            events = events.filter(category__iexact=category)

        # Format filter
        fmt = request.query_params.get("format", "").strip()
        if fmt:
            events = events.filter(format__iexact=fmt)

        # Date range filter
        date_from = request.query_params.get("from", "").strip()
        date_to = request.query_params.get("to", "").strip()
        if date_from:
            events = events.filter(start_datetime__date__gte=date_from)
        if date_to:
            events = events.filter(start_datetime__date__lte=date_to)

        # Location filter (city)
        city = request.query_params.get("city", "").strip()
        if city:
            events = events.filter(venue__city__icontains=city)

        results = [
            {
                "slug": e.slug,
                "title": e.title,
                "subtitle": e.subtitle,
                "cover_image_url": e.cover_image_url,
                "category": e.category,
                "format": e.format,
                "start_datetime": e.start_datetime.isoformat() if e.start_datetime else None,
                "timezone": e.timezone,
                "date_tbd": e.date_tbd,
                "venue_name": e.venue.name if e.venue else None,
                "venue_city": e.venue.city if e.venue else None,
                "org_name": e.organization.name,
                "org_slug": e.organization.slug,
                "org_logo_url": e.organization.logo_url,
            }
            for e in events[:50]
        ]
        return Response(results)


class GuestListView(APIView):
    """Guest list with search and filter."""

    def get(self, request, org_slug, event_slug):
        org = get_org_for_user(org_slug, request.user)
        event = get_object_or_404(Event, organization=org, slug=event_slug)

        tickets = Ticket.objects.filter(
            event=event, status=Ticket.Status.ACTIVE
        ).select_related("ticket_tier", "order")

        # Filters
        q = request.query_params.get("q", "").strip()
        tier = request.query_params.get("tier", "").strip()
        checkin_status = request.query_params.get("status", "").strip()

        if q:
            tickets = tickets.filter(
                Q(attendee_name__icontains=q) |
                Q(attendee_email__icontains=q) |
                Q(order__confirmation_code__icontains=q)
            )
        if tier:
            tickets = tickets.filter(ticket_tier__name__iexact=tier)
        if checkin_status == "checked_in":
            tickets = tickets.filter(checked_in=True)
        elif checkin_status == "not_checked_in":
            tickets = tickets.filter(checked_in=False)

        guests = [
            {
                "id": str(t.id),
                "attendee_name": t.attendee_name,
                "attendee_email": t.attendee_email,
                "tier_name": t.ticket_tier.name,
                "confirmation_code": t.order.confirmation_code,
                "checked_in": t.checked_in,
                "checked_in_at": t.checked_in_at.isoformat() if t.checked_in_at else None,
                "order_total": str(t.order.total),
                "created_at": t.created_at.isoformat(),
            }
            for t in tickets.order_by("-created_at")
        ]
        return Response(guests)


class GuestListCSVView(APIView):
    """Export guest list as CSV."""

    def get(self, request, org_slug, event_slug):
        org = get_org_for_user(org_slug, request.user)
        event = get_object_or_404(Event, organization=org, slug=event_slug)

        tickets = Ticket.objects.filter(
            event=event, status=Ticket.Status.ACTIVE
        ).select_related("ticket_tier", "order").order_by("attendee_name")

        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="guests-{event.slug}.csv"'

        writer = csv.writer(response)
        writer.writerow(["Name", "Email", "Ticket Tier", "Confirmation Code", "Checked In", "Check-In Time", "Order Total", "Registered At"])
        for t in tickets:
            writer.writerow([
                t.attendee_name,
                t.attendee_email,
                t.ticket_tier.name,
                t.order.confirmation_code,
                "Yes" if t.checked_in else "No",
                t.checked_in_at.strftime("%Y-%m-%d %H:%M") if t.checked_in_at else "",
                f"${t.order.total}",
                t.created_at.strftime("%Y-%m-%d %H:%M"),
            ])
        return response


class EventAnalyticsView(APIView):
    """Event analytics dashboard data."""

    def get(self, request, org_slug, event_slug):
        org = get_org_for_user(org_slug, request.user)
        event = get_object_or_404(Event, organization=org, slug=event_slug)

        orders = Order.objects.filter(event=event, status=Order.Status.COMPLETED)
        tickets = Ticket.objects.filter(event=event, status=Ticket.Status.ACTIVE)

        # Basic counts
        total_registrations = tickets.count()
        total_orders = orders.count()
        checked_in = tickets.filter(checked_in=True).count()

        # Revenue
        revenue = orders.aggregate(
            gross=Sum("subtotal"),
            discounts=Sum("discount_amount"),
            fees=Sum("fees"),
            net=Sum("total"),
        )
        gross_revenue = revenue["gross"] or Decimal("0")
        total_discounts = revenue["discounts"] or Decimal("0")
        net_revenue = revenue["net"] or Decimal("0")

        # Refunds
        refund_count = orders.filter(status__in=[Order.Status.REFUNDED, Order.Status.PARTIALLY_REFUNDED]).count()
        refund_amount = orders.aggregate(total=Sum("refund_amount"))["total"] or Decimal("0")

        # Per-tier breakdown
        tier_stats = tickets.values("ticket_tier__name", "ticket_tier__price").annotate(
            count=Count("id"),
            checked_in_count=Count("id", filter=Q(checked_in=True)),
        ).order_by("ticket_tier__name")

        # Registration timeline (daily)
        timeline = tickets.annotate(
            date=TruncDate("created_at")
        ).values("date").annotate(
            count=Count("id")
        ).order_by("date")

        # Promo code usage
        promo_stats = orders.filter(
            promo_code__isnull=False
        ).values(
            "promo_code__code"
        ).annotate(
            usage=Count("id"),
            discount_total=Sum("discount_amount"),
        ).order_by("-usage")

        return Response({
            "registrations": {
                "total": total_registrations,
                "by_tier": [
                    {
                        "tier_name": s["ticket_tier__name"],
                        "price": str(s["ticket_tier__price"]),
                        "count": s["count"],
                        "checked_in": s["checked_in_count"],
                    }
                    for s in tier_stats
                ],
            },
            "attendance": {
                "checked_in": checked_in,
                "total": total_registrations,
                "rate": round((checked_in / total_registrations * 100) if total_registrations > 0 else 0, 1),
            },
            "revenue": {
                "gross": str(gross_revenue),
                "discounts": str(total_discounts),
                "fees": str(revenue["fees"] or 0),
                "net": str(net_revenue),
                "orders": total_orders,
            },
            "refunds": {
                "count": refund_count,
                "amount": str(refund_amount),
            },
            "timeline": [
                {"date": str(t["date"]), "count": t["count"]}
                for t in timeline
            ],
            "promo_codes": [
                {
                    "code": p["promo_code__code"],
                    "usage": p["usage"],
                    "discount_total": str(p["discount_total"]),
                }
                for p in promo_stats
            ],
        })
