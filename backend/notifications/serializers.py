from rest_framework import serializers
from .models import EventEmailLog


class EventEmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventEmailLog
        fields = ["id", "trigger_type", "recipient_email", "subject", "status", "sent_at"]
        read_only_fields = fields


class BulkEmailSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=500)
    body = serializers.CharField()


class EmailConfigSerializer(serializers.Serializer):
    confirmation = serializers.BooleanField(default=True)
    reminder_48h = serializers.BooleanField(default=True)
    reminder_day_of = serializers.BooleanField(default=True)
    cancellation = serializers.BooleanField(default=True)
    post_event_thanks = serializers.BooleanField(default=True)
    new_registration = serializers.BooleanField(default=True)
