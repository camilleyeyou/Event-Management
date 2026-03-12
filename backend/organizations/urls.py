from django.urls import path
from .views import (
    OrganizationListCreateView,
    OrganizationDetailView,
    MemberListView,
    InviteMemberView,
    RemoveMemberView,
)

urlpatterns = [
    path("", OrganizationListCreateView.as_view(), name="org-list-create"),
    path("<slug:org_slug>/", OrganizationDetailView.as_view(), name="org-detail"),
    path("<slug:org_slug>/members/", MemberListView.as_view(), name="org-members"),
    path("<slug:org_slug>/members/invite/", InviteMemberView.as_view(), name="org-invite"),
    path("<slug:org_slug>/members/<uuid:member_id>/", RemoveMemberView.as_view(), name="org-remove-member"),
]
