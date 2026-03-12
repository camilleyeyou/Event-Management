from django.contrib import admin
from django.urls import path, include
from events.views import PublicEventDetailView, PublicOrgPageView, PublicEventBrowseView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("accounts.urls")),
    path("api/v1/organizations/", include("organizations.urls")),
    path("api/v1/organizations/<slug:org_slug>/venues/", include("venues.urls")),
    path("api/v1/organizations/<slug:org_slug>/events/", include("events.urls")),
    path("api/v1/organizations/<slug:org_slug>/events/<slug:event_slug>/", include("ticketing.urls")),
    # Email notifications
    path("api/v1/organizations/<slug:org_slug>/events/<slug:event_slug>/emails/", include("notifications.urls")),
    # Check-in
    path("api/v1/organizations/<slug:org_slug>/events/<slug:event_slug>/check-in/", include("checkin.urls")),
    # Checkout & orders
    path("api/v1/", include("orders.urls")),
    # Public pages
    path("api/v1/public/events/", PublicEventBrowseView.as_view(), name="public-event-browse"),
    path("api/v1/public/<slug:org_slug>/", PublicOrgPageView.as_view(), name="public-org-page"),
    path("api/v1/public/<slug:org_slug>/events/<slug:event_slug>/", PublicEventDetailView.as_view(), name="public-event-detail"),
]
