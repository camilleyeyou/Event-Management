from django.urls import path
from .views import (
    TicketTierListCreateView,
    TicketTierDetailView,
    PromoCodeListCreateView,
    PromoCodeDetailView,
    PromoCodeValidateView,
)

urlpatterns = [
    # Ticket tiers
    path("ticket-tiers/", TicketTierListCreateView.as_view(), name="tier-list-create"),
    path("ticket-tiers/<uuid:tier_id>/", TicketTierDetailView.as_view(), name="tier-detail"),
    # Promo codes
    path("promo-codes/", PromoCodeListCreateView.as_view(), name="promo-list-create"),
    path("promo-codes/<uuid:code_id>/", PromoCodeDetailView.as_view(), name="promo-detail"),
    path("promo-codes/validate/", PromoCodeValidateView.as_view(), name="promo-validate"),
]
