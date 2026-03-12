from django.urls import path
from .views import EmailConfigView, EmailLogView, BulkEmailView

urlpatterns = [
    path("config/", EmailConfigView.as_view(), name="email-config"),
    path("log/", EmailLogView.as_view(), name="email-log"),
    path("bulk/", BulkEmailView.as_view(), name="email-bulk"),
]
