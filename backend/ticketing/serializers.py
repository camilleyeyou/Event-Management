from rest_framework import serializers
from django.utils import timezone
from .models import TicketTier, PromoCode


class TicketTierSerializer(serializers.ModelSerializer):
    quantity_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = TicketTier
        fields = [
            "id", "name", "description", "price",
            "quantity_total", "quantity_sold", "quantity_remaining",
            "sales_start", "sales_end",
            "min_per_order", "max_per_order",
            "visibility", "attendance_mode",
            "sort_order", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "quantity_sold", "quantity_remaining", "created_at", "updated_at"]


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            "id", "code", "discount_type", "discount_value",
            "applicable_tier_ids", "usage_limit", "usage_count",
            "per_customer_limit", "valid_from", "valid_until",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "usage_count", "created_at", "updated_at"]


class PromoCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    tier_id = serializers.UUIDField(required=False)

    def validate_code(self, value):
        return value.upper().strip()
