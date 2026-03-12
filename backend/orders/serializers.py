from rest_framework import serializers
from .models import Order, OrderLineItem, Ticket


class OrderLineItemSerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source="ticket_tier.name", read_only=True)

    class Meta:
        model = OrderLineItem
        fields = ["id", "ticket_tier", "tier_name", "quantity", "unit_price", "discount_amount", "line_total"]
        read_only_fields = ["id"]


class TicketSerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source="ticket_tier.name", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id", "ticket_tier", "tier_name", "event", "event_title",
            "attendee_name", "attendee_email",
            "qr_code_data", "qr_code_image_url",
            "checked_in", "checked_in_at", "status", "created_at",
        ]
        read_only_fields = ["id", "qr_code_data", "qr_code_image_url", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    line_items = OrderLineItemSerializer(many=True, read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_slug = serializers.CharField(source="event.slug", read_only=True)
    org_slug = serializers.CharField(source="event.organization.slug", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "event", "event_title", "event_slug", "org_slug",
            "status", "confirmation_code",
            "subtotal", "discount_amount", "fees", "total",
            "billing_name", "billing_email", "billing_phone",
            "stripe_payment_intent_id",
            "line_items", "tickets",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "status", "confirmation_code",
            "subtotal", "discount_amount", "fees", "total",
            "stripe_payment_intent_id", "created_at", "updated_at",
        ]


class CheckoutStartSerializer(serializers.Serializer):
    """Step 1: Select tickets"""
    event_slug = serializers.SlugField()
    org_slug = serializers.SlugField()
    items = serializers.ListField(
        child=serializers.DictField(), min_length=1
    )
    promo_code = serializers.CharField(required=False, allow_blank=True)


class CheckoutDetailsSerializer(serializers.Serializer):
    """Step 2: Attendee details"""
    billing_name = serializers.CharField(max_length=255)
    billing_email = serializers.EmailField()
    billing_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
