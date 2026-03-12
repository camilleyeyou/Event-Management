from django.urls import path
from .views import VenueListCreateView, VenueDetailView

urlpatterns = [
    path("", VenueListCreateView.as_view(), name="venue-list-create"),
    path("<uuid:venue_id>/", VenueDetailView.as_view(), name="venue-detail"),
]
