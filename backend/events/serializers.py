from rest_framework import serializers
from .models import Event
from venues.serializers import VenueSerializer


class EventSerializer(serializers.ModelSerializer):
    venue_detail = VenueSerializer(source="venue", read_only=True)
    org_slug = serializers.CharField(source="organization.slug", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id", "title", "subtitle", "slug", "description",
            "format", "status", "category", "tags",
            "cover_image_url", "is_private",
            "start_datetime", "end_datetime", "timezone",
            "doors_open_time", "date_tbd",
            "venue", "venue_detail", "virtual_link", "virtual_platform",
            "refund_policy", "email_config",
            "org_slug", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "slug", "status", "org_slug", "created_at", "updated_at"]


class EventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "title", "subtitle", "description",
            "format", "category", "tags",
            "cover_image_url", "is_private",
            "start_datetime", "end_datetime", "timezone",
            "doors_open_time", "date_tbd",
            "venue", "virtual_link", "virtual_platform",
        ]
