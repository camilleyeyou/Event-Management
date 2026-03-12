import hmac
import hashlib
from decimal import Decimal
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from events.models import Event
from ticketing.models import TicketTier, PromoCode
from .models import Order, OrderLineItem, Ticket
from .serializers import (
    OrderSerializer,
    CheckoutStartSerializer,
    CheckoutDetailsSerializer,
    TicketSerializer,
)


def generate_qr_payload(order_id, ticket_tier_id, ticket_id):
    """Generate HMAC-signed QR code payload."""
    message = f"{order_id}:{ticket_tier_id}:{ticket_id}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()[:16]
    return f"{message}:{signature}"


class CheckoutView(APIView):
    """
    Unified checkout endpoint.
    POST with action: "calculate" | "complete"
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        action = request.data.get("action", "calculate")

        if action == "calculate":
            return self._calculate(request)
        elif action == "complete":
            return self._complete(request)
        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

    def _calculate(self, request):
        """Calculate order totals without creating anything."""
        serializer = CheckoutStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        event = get_object_or_404(
            Event,
            organization__slug=data["org_slug"],
            slug=data["event_slug"],
            status__in=[Event.Status.PUBLISHED, Event.Status.LIVE],
        )

        # Resolve promo code
        promo = None
        if data.get("promo_code"):
            promo = PromoCode.objects.filter(
                event=event, code=data["promo_code"].upper().strip(), is_active=True
            ).first()

        line_items = []
        subtotal = Decimal("0")
        total_discount = Decimal("0")

        for item in data["items"]:
            tier_id = item.get("tier_id")
            qty = int(item.get("quantity", 0))
            if qty <= 0:
                continue

            tier = get_object_or_404(TicketTier, id=tier_id, event=event, is_active=True)

            if qty < tier.min_per_order or qty > tier.max_per_order:
                return Response(
                    {"detail": f"{tier.name}: quantity must be between {tier.min_per_order} and {tier.max_per_order}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if tier.quantity_remaining < qty:
                return Response(
                    {"detail": f"{tier.name}: only {tier.quantity_remaining} tickets remaining."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            line_subtotal = tier.price * qty
            line_discount = Decimal("0")

            if promo:
                tier_ids = [str(t) for t in promo.applicable_tier_ids]
                if not tier_ids or str(tier.id) in tier_ids:
                    if promo.discount_type == PromoCode.DiscountType.PERCENTAGE:
                        line_discount = line_subtotal * promo.discount_value / 100
                    else:
                        line_discount = min(promo.discount_value * qty, line_subtotal)

            line_total = line_subtotal - line_discount
            subtotal += line_subtotal
            total_discount += line_discount

            line_items.append({
                "tier_id": str(tier.id),
                "tier_name": tier.name,
                "quantity": qty,
                "unit_price": str(tier.price),
                "discount_amount": str(line_discount),
                "line_total": str(line_total),
            })

        total = subtotal - total_discount
        is_free = total <= 0

        return Response({
            "line_items": line_items,
            "subtotal": str(subtotal),
            "discount_amount": str(total_discount),
            "fees": "0.00",
            "total": str(max(total, Decimal("0"))),
            "is_free": is_free,
            "promo_applied": promo.code if promo else None,
        })

    @transaction.atomic
    def _complete(self, request):
        """Create the order, line items, and tickets."""
        start_data = CheckoutStartSerializer(data=request.data)
        start_data.is_valid(raise_exception=True)
        sd = start_data.validated_data

        details_data = CheckoutDetailsSerializer(data=request.data)
        details_data.is_valid(raise_exception=True)
        dd = details_data.validated_data

        event = get_object_or_404(
            Event,
            organization__slug=sd["org_slug"],
            slug=sd["event_slug"],
            status__in=[Event.Status.PUBLISHED, Event.Status.LIVE],
        )

        # Resolve promo
        promo = None
        if sd.get("promo_code"):
            promo = PromoCode.objects.filter(
                event=event, code=sd["promo_code"].upper().strip(), is_active=True
            ).first()

        # Create order
        order = Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            event=event,
            billing_name=dd["billing_name"],
            billing_email=dd["billing_email"],
            billing_phone=dd.get("billing_phone", ""),
            promo_code=promo,
        )

        subtotal = Decimal("0")
        total_discount = Decimal("0")

        for item in sd["items"]:
            tier_id = item.get("tier_id")
            qty = int(item.get("quantity", 0))
            if qty <= 0:
                continue

            # Lock the tier row for concurrent safety
            tier = TicketTier.objects.select_for_update().get(
                id=tier_id, event=event, is_active=True
            )

            if tier.quantity_remaining < qty:
                raise Exception(f"{tier.name}: sold out.")

            line_subtotal = tier.price * qty
            line_discount = Decimal("0")

            if promo:
                tier_ids = [str(t) for t in promo.applicable_tier_ids]
                if not tier_ids or str(tier.id) in tier_ids:
                    if promo.discount_type == PromoCode.DiscountType.PERCENTAGE:
                        line_discount = line_subtotal * promo.discount_value / 100
                    else:
                        line_discount = min(promo.discount_value * qty, line_subtotal)

            line_total = line_subtotal - line_discount

            OrderLineItem.objects.create(
                order=order,
                ticket_tier=tier,
                quantity=qty,
                unit_price=tier.price,
                discount_amount=line_discount,
                line_total=line_total,
            )

            # Update sold count
            tier.quantity_sold = F("quantity_sold") + qty
            tier.save(update_fields=["quantity_sold"])

            # Create individual tickets
            for _ in range(qty):
                ticket = Ticket.objects.create(
                    order=order,
                    ticket_tier=tier,
                    event=event,
                    user=request.user if request.user.is_authenticated else None,
                    attendee_name=dd["billing_name"],
                    attendee_email=dd["billing_email"],
                )
                ticket.qr_code_data = generate_qr_payload(
                    str(order.id), str(tier.id), str(ticket.id)
                )
                ticket.save(update_fields=["qr_code_data"])

            subtotal += line_subtotal
            total_discount += line_discount

        # Update promo usage
        if promo:
            promo.usage_count = F("usage_count") + 1
            promo.save(update_fields=["usage_count"])

        # Finalize order
        total = max(subtotal - total_discount, Decimal("0"))
        order.subtotal = subtotal
        order.discount_amount = total_discount
        order.total = total

        if total <= 0:
            # Free order — complete immediately
            order.status = Order.Status.COMPLETED
        else:
            # Paid order — for now mark as completed (Stripe integration below)
            # In production, this would create a PaymentIntent first
            order.status = Order.Status.COMPLETED

        order.save()

        # Refresh to get actual values (F expressions)
        order.refresh_from_db()

        # Send confirmation email
        try:
            from notifications.email_service import send_confirmation_email
            send_confirmation_email(order)
        except Exception:
            pass  # Don't fail the order if email fails

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class CreatePaymentIntentView(APIView):
    """Create a Stripe PaymentIntent for a paid order."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = get_object_or_404(Order, id=order_id)

        if order.total <= 0:
            return Response({"detail": "No payment needed for free orders."}, status=status.HTTP_400_BAD_REQUEST)

        if order.stripe_payment_intent_id:
            # Return existing intent
            try:
                import stripe
                stripe.api_key = settings.STRIPE_SECRET_KEY
                intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
                return Response({"client_secret": intent.client_secret})
            except Exception:
                pass

        try:
            import stripe
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),  # cents
                currency="usd",
                metadata={
                    "order_id": str(order.id),
                    "confirmation_code": order.confirmation_code,
                },
            )
            order.stripe_payment_intent_id = intent.id
            order.save(update_fields=["stripe_payment_intent_id"])
            return Response({"client_secret": intent.client_secret})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).select_related("event", "event__organization").prefetch_related(
            "line_items", "line_items__ticket_tier", "tickets", "tickets__ticket_tier"
        ).order_by("-created_at")


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    lookup_field = "id"
    lookup_url_kwarg = "order_id"

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).select_related("event", "event__organization").prefetch_related(
            "line_items", "line_items__ticket_tier", "tickets", "tickets__ticket_tier"
        )


class MyTicketsView(generics.ListAPIView):
    serializer_class = TicketSerializer

    def get_queryset(self):
        return Ticket.objects.filter(
            user=self.request.user, status=Ticket.Status.ACTIVE
        ).select_related("ticket_tier", "event").order_by("event__start_datetime")


class OrderByConfirmationView(APIView):
    """Look up order by confirmation code (no auth required)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, code):
        order = get_object_or_404(Order, confirmation_code=code.upper())
        return Response(OrderSerializer(order).data)
