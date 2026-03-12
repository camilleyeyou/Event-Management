"""
Email notification service for GatherGood.
Uses Django's email backend (console in dev, SendGrid/SES in production).
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import EventEmailLog


DEFAULT_FROM = "GatherGood <noreply@gathergood.com>"


def send_event_email(event, trigger_type, recipient_email, subject, html_content, recipient_user=None):
    """Send an email and log it."""
    try:
        plain_content = strip_tags(html_content)
        send_mail(
            subject=subject,
            message=plain_content,
            from_email=DEFAULT_FROM,
            recipient_list=[recipient_email],
            html_message=html_content,
            fail_silently=False,
        )
        email_status = EventEmailLog.Status.SENT
    except Exception:
        email_status = EventEmailLog.Status.FAILED

    EventEmailLog.objects.create(
        event=event,
        trigger_type=trigger_type,
        recipient=recipient_user,
        recipient_email=recipient_email,
        subject=subject,
        status=email_status,
    )
    return email_status == EventEmailLog.Status.SENT


def send_confirmation_email(order):
    """Send order confirmation email with ticket details."""
    event = order.event
    tickets = order.tickets.select_related("ticket_tier").all()

    subject = f"Your registration for {event.title} is confirmed!"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d5b;">You're registered!</h2>
        <p>Hi {order.billing_name},</p>
        <p>Thank you for registering for <strong>{event.title}</strong>.</p>

        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Confirmation Code:</strong> {order.confirmation_code}</p>
            <p style="margin: 8px 0 0;"><strong>Event:</strong> {event.title}</p>
            {"<p style='margin: 8px 0 0;'><strong>Date:</strong> " + event.start_datetime.strftime('%B %d, %Y at %I:%M %p') + "</p>" if event.start_datetime else ""}
            <p style="margin: 8px 0 0;"><strong>Total:</strong> {'Free' if order.total == 0 else f'${order.total}'}</p>
        </div>

        <h3>Your Tickets ({tickets.count()})</h3>
        {"".join(f'<div style="border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; margin: 8px 0;"><strong>{t.ticket_tier.name}</strong><br>{t.attendee_name}<br><small style="color: #999;">QR: {t.qr_code_data[:40]}...</small></div>' for t in tickets)}

        <p style="color: #666; font-size: 14px; margin-top: 24px;">
            Present your confirmation code or QR code at the door for check-in.
        </p>
        <p style="color: #999; font-size: 12px;">— The GatherGood Team</p>
    </div>
    """

    # Check email_config toggle
    config = event.email_config or {}
    if config.get("confirmation", True) is False:
        return False

    return send_event_email(
        event=event,
        trigger_type=EventEmailLog.TriggerType.CONFIRMATION,
        recipient_email=order.billing_email,
        subject=subject,
        html_content=html,
        recipient_user=order.user,
    )


def send_event_reminder(ticket, reminder_type="48h"):
    """Send event reminder to ticket holder."""
    event = ticket.event
    trigger = EventEmailLog.TriggerType.REMINDER_48H if reminder_type == "48h" else EventEmailLog.TriggerType.REMINDER_DAY_OF

    config = event.email_config or {}
    config_key = "reminder_48h" if reminder_type == "48h" else "reminder_day_of"
    if config.get(config_key, True) is False:
        return False

    time_label = "in 2 days" if reminder_type == "48h" else "today"
    subject = f"Reminder: {event.title} is {time_label}!"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d5b;">Event Reminder</h2>
        <p>Hi {ticket.attendee_name},</p>
        <p><strong>{event.title}</strong> is coming up {time_label}!</p>
        {"<p><strong>Date:</strong> " + event.start_datetime.strftime('%B %d, %Y at %I:%M %p') + "</p>" if event.start_datetime else ""}
        <p>Don't forget to bring your confirmation code or QR code for check-in.</p>
        <p style="color: #999; font-size: 12px;">— The GatherGood Team</p>
    </div>
    """
    return send_event_email(event, trigger, ticket.attendee_email, subject, html, ticket.user)


def send_cancellation_email(ticket):
    """Notify attendee that the event has been cancelled."""
    event = ticket.event

    config = event.email_config or {}
    if config.get("cancellation", True) is False:
        return False

    subject = f"{event.title} has been cancelled"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Event Cancelled</h2>
        <p>Hi {ticket.attendee_name},</p>
        <p>We're sorry to inform you that <strong>{event.title}</strong> has been cancelled.</p>
        <p>If you made a payment, a refund will be processed automatically.</p>
        <p style="color: #999; font-size: 12px;">— The GatherGood Team</p>
    </div>
    """
    return send_event_email(
        event, EventEmailLog.TriggerType.CANCELLATION,
        ticket.attendee_email, subject, html, ticket.user,
    )


def send_post_event_thanks(ticket):
    """Send thank you email after event."""
    event = ticket.event

    config = event.email_config or {}
    if config.get("post_event_thanks", True) is False:
        return False

    subject = f"Thank you for attending {event.title}!"
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d5b;">Thank You!</h2>
        <p>Hi {ticket.attendee_name},</p>
        <p>Thank you for attending <strong>{event.title}</strong>. We hope you had a great time!</p>
        <p>We'd love to see you at our next event.</p>
        <p style="color: #999; font-size: 12px;">— The GatherGood Team</p>
    </div>
    """
    return send_event_email(
        event, EventEmailLog.TriggerType.POST_EVENT_THANKS,
        ticket.attendee_email, subject, html, ticket.user,
    )


def send_custom_bulk_email(event, subject, body_html, recipients):
    """Send a custom email to all attendees of an event."""
    results = []
    for email, user in recipients:
        success = send_event_email(
            event, EventEmailLog.TriggerType.CUSTOM_BULK,
            email, subject, body_html, user,
        )
        results.append({"email": email, "sent": success})
    return results
