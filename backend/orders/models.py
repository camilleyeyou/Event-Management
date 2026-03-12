import uuid
import string
import random
from django.conf import settings
from django.db import models


def generate_confirmation_code():
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=10))


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        COMPLETED = "COMPLETED", "Completed"
        REFUNDED = "REFUNDED", "Refunded"
        PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED", "Partially Refunded"
        FAILED = "FAILED", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders"
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="orders"
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    confirmation_code = models.CharField(max_length=10, unique=True, default=generate_confirmation_code)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fees = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.ForeignKey(
        "ticketing.PromoCode", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="orders"
    )
    billing_name = models.CharField(max_length=255)
    billing_email = models.EmailField()
    billing_phone = models.CharField(max_length=20, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"

    def __str__(self):
        return f"Order {self.confirmation_code} - {self.billing_name}"


class OrderLineItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="line_items")
    ticket_tier = models.ForeignKey(
        "ticketing.TicketTier", on_delete=models.CASCADE, related_name="line_items"
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "order_line_items"


class Ticket(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="tickets")
    ticket_tier = models.ForeignKey(
        "ticketing.TicketTier", on_delete=models.CASCADE, related_name="tickets"
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="tickets"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="tickets"
    )
    attendee_name = models.CharField(max_length=255)
    attendee_email = models.EmailField()
    qr_code_data = models.CharField(max_length=500, blank=True)
    qr_code_image_url = models.URLField(blank=True)
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="checked_in_tickets"
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tickets"

    def __str__(self):
        return f"Ticket {self.id} - {self.attendee_name}"
