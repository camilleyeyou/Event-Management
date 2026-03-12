from rest_framework import permissions
from .models import OrganizationMember


class IsOrgMember(permissions.BasePermission):
    """Allow access to any member of the organization."""

    def has_object_permission(self, request, view, obj):
        return obj.members.filter(user=request.user).exists()


class IsOrgOwner(permissions.BasePermission):
    """Allow access only to organization owners."""

    def has_object_permission(self, request, view, obj):
        return obj.members.filter(
            user=request.user, role=OrganizationMember.Role.OWNER
        ).exists()


class IsOrgManagerOrAbove(permissions.BasePermission):
    """Allow access to owners and managers."""

    def has_object_permission(self, request, view, obj):
        return obj.members.filter(
            user=request.user,
            role__in=[OrganizationMember.Role.OWNER, OrganizationMember.Role.MANAGER],
        ).exists()
