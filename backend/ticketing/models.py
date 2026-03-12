import uuid
from django.db import models


class TicketTier(models.Model):
    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "Public"
        HIDDEN = "HIDDEN", "Hidden"
        INVITE_ONLY = "INVITE_ONLY", "Invite Only"

    class AttendanceMode(models.TextChoices):
        IN_PERSON = "IN_PERSON", "In-Person"
        VIRTUAL = "VIRTUAL", "Virtual"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="ticket_tiers"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantity_total = models.PositiveIntegerField()
    quantity_sold = models.PositiveIntegerField(default=0)
    sales_start = models.DateTimeField(null=True, blank=True)
    sales_end = models.DateTimeField(null=True, blank=True)
    min_per_order = models.PositiveIntegerField(default=1)
    max_per_order = models.PositiveIntegerField(default=10)
    visibility = models.CharField(
        max_length=20, choices=Visibility.choices, default=Visibility.PUBLIC
    )
    attendance_mode = models.CharField(
        max_length=20, choices=AttendanceMode.choices, default=AttendanceMode.IN_PERSON
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ticket_tiers"
        ordering = ["sort_order", "price"]

    def __str__(self):
        return f"{self.name} - ${self.price}"

    @property
    def quantity_remaining(self):
        return self.quantity_total - self.quantity_sold


class PromoCode(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Percentage"
        FIXED = "FIXED", "Fixed Amount"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="promo_codes"
    )
    code = models.CharField(max_length=50, db_index=True)
    discount_type = models.CharField(
        max_length=20, choices=DiscountType.choices
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    applicable_tier_ids = models.JSONField(default=list, blank=True)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    per_customer_limit = models.PositiveIntegerField(default=1)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_until = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "promo_codes"
        unique_together = ["event", "code"]

    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.discount_type == 'PERCENTAGE' else '$'}"
