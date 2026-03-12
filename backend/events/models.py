import uuid
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Event(models.Model):
    class Format(models.TextChoices):
        IN_PERSON = "IN_PERSON", "In-Person"
        VIRTUAL = "VIRTUAL", "Virtual"
        HYBRID = "HYBRID", "Hybrid"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PUBLISHED = "PUBLISHED", "Published"
        LIVE = "LIVE", "Live"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    class Category(models.TextChoices):
        FUNDRAISER = "FUNDRAISER", "Fundraiser"
        WORKSHOP = "WORKSHOP", "Workshop"
        MEETUP = "MEETUP", "Meetup"
        VOLUNTEER = "VOLUNTEER", "Volunteer"
        SOCIAL = "SOCIAL", "Social"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="events"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="created_events"
    )
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(max_length=255, db_index=True)
    description = models.TextField(blank=True)
    format = models.CharField(max_length=20, choices=Format.choices, default=Format.IN_PERSON)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    tags = models.JSONField(default=list, blank=True)
    cover_image_url = models.URLField(blank=True)
    is_private = models.BooleanField(default=False)

    start_datetime = models.DateTimeField(null=True, blank=True, db_index=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default="America/Los_Angeles")
    doors_open_time = models.DateTimeField(null=True, blank=True)
    date_tbd = models.BooleanField(default=False)

    venue = models.ForeignKey(
        "venues.Venue", on_delete=models.SET_NULL, null=True, blank=True, related_name="events"
    )
    virtual_link = models.URLField(blank=True)
    virtual_platform = models.CharField(max_length=50, blank=True)

    refund_policy = models.JSONField(default=dict, blank=True)
    email_config = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events"
        unique_together = ["organization", "slug"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            n = 1
            while Event.objects.filter(
                organization=self.organization, slug=slug
            ).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)
