import uuid
from django.conf import settings
from django.db import models


class EventEmailLog(models.Model):
    class TriggerType(models.TextChoices):
        CONFIRMATION = "CONFIRMATION", "RSVP / Purchase Confirmation"
        REMINDER_48H = "REMINDER_48H", "48-Hour Reminder"
        REMINDER_DAY_OF = "REMINDER_DAY_OF", "Day-Of Reminder"
        EVENT_UPDATE = "EVENT_UPDATE", "Event Update"
        CANCELLATION = "CANCELLATION", "Event Cancellation"
        POST_EVENT_THANKS = "POST_EVENT_THANKS", "Post-Event Thank You"
        NEW_REGISTRATION = "NEW_REGISTRATION", "New Registration Alert"
        DAILY_SUMMARY = "DAILY_SUMMARY", "Daily Summary"
        LOW_INVENTORY = "LOW_INVENTORY", "Low Inventory Alert"
        REFUND_PROCESSED = "REFUND_PROCESSED", "Refund Processed"
        CUSTOM_BULK = "CUSTOM_BULK", "Custom Bulk Email"

    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        BOUNCED = "BOUNCED", "Bounced"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="email_logs"
    )
    trigger_type = models.CharField(max_length=30, choices=TriggerType.choices)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="email_logs"
    )
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "event_email_logs"
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.trigger_type} -> {self.recipient_email}"
