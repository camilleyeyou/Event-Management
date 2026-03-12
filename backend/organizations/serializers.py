from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMember

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id", "name", "slug", "description", "website_url",
            "logo_url", "banner_url", "primary_color",
            "contact_email", "contact_phone", "created_at", "updated_at", "role",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at", "role"]

    def get_role(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            member = obj.members.filter(user=request.user).first()
            if member:
                return member.role
        return None


class OrganizationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "name", "description", "website_url", "logo_url",
            "banner_url", "primary_color", "contact_email", "contact_phone",
        ]


class MemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = OrganizationMember
        fields = ["id", "email", "first_name", "last_name", "role", "invited_at", "accepted_at"]
        read_only_fields = ["id", "email", "first_name", "last_name", "invited_at", "accepted_at"]


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=OrganizationMember.Role.choices, default=OrganizationMember.Role.VOLUNTEER)
