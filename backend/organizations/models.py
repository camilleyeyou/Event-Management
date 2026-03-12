import uuid
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    website_url = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    banner_url = models.URLField(blank=True)
    primary_color = models.CharField(max_length=7, default="#2e7d5b")
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    payout_config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organizations"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            n = 1
            while Organization.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class OrganizationMember(models.Model):
    class Role(models.TextChoices):
        OWNER = "OWNER", "Owner"
        MANAGER = "MANAGER", "Manager"
        VOLUNTEER = "VOLUNTEER", "Volunteer"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.VOLUNTEER)
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "organization_members"
        unique_together = ["organization", "user"]

    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"
