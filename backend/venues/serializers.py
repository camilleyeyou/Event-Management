from rest_framework import serializers
from .models import Venue


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = [
            "id", "name", "address", "city", "state", "postal_code",
            "latitude", "longitude", "capacity",
            "accessibility_info", "parking_notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
