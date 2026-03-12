from django.urls import path
from .views import ScanQRView, ManualCheckInView, CheckInStatsView, CheckInSearchView

urlpatterns = [
    path("scan/", ScanQRView.as_view(), name="checkin-scan"),
    path("<uuid:ticket_id>/manual/", ManualCheckInView.as_view(), name="checkin-manual"),
    path("stats/", CheckInStatsView.as_view(), name="checkin-stats"),
    path("search/", CheckInSearchView.as_view(), name="checkin-search"),
]
