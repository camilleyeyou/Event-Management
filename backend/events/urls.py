from django.urls import path
from .views import (
    EventListCreateView,
    EventDetailView,
    EventPublishView,
    EventCancelView,
    PublicEventDetailView,
    GuestListView,
    GuestListCSVView,
    EventAnalyticsView,
)

urlpatterns = [
    # Organizer endpoints (under /api/v1/organizations/{org_slug}/events/)
    path("", EventListCreateView.as_view(), name="event-list-create"),
    path("<slug:event_slug>/", EventDetailView.as_view(), name="event-detail"),
    path("<slug:event_slug>/publish/", EventPublishView.as_view(), name="event-publish"),
    path("<slug:event_slug>/cancel/", EventCancelView.as_view(), name="event-cancel"),
    path("<slug:event_slug>/guests/", GuestListView.as_view(), name="guest-list"),
    path("<slug:event_slug>/guests/csv/", GuestListCSVView.as_view(), name="guest-list-csv"),
    path("<slug:event_slug>/analytics/", EventAnalyticsView.as_view(), name="event-analytics"),
]

# Public event URL is registered in config/urls.py
public_urlpatterns = [
    path("<slug:org_slug>/events/<slug:event_slug>/", PublicEventDetailView.as_view(), name="public-event-detail"),
]
