from django.urls import path
from .views import (
    CheckoutView,
    CreatePaymentIntentView,
    MyOrdersView,
    OrderDetailView,
    MyTicketsView,
    OrderByConfirmationView,
)

urlpatterns = [
    # Checkout
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("checkout/payment-intent/", CreatePaymentIntentView.as_view(), name="payment-intent"),
    # My orders & tickets
    path("orders/", MyOrdersView.as_view(), name="my-orders"),
    path("orders/<uuid:order_id>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/lookup/<str:code>/", OrderByConfirmationView.as_view(), name="order-lookup"),
    path("tickets/", MyTicketsView.as_view(), name="my-tickets"),
]
