from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from config import DEFAULT_FROM_EMAIL, EMAIL_HOST, EMAIL_HOST_PASSWORD, EMAIL_HOST_USER, EMAIL_PORT

logger = logging.getLogger(__name__)


def email_notifications_enabled() -> bool:
    return all([EMAIL_HOST, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, DEFAULT_FROM_EMAIL])


def _send_email_sync(recipient: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = DEFAULT_FROM_EMAIL
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
        smtp.send_message(message)


async def send_email(recipient: str, subject: str, body: str) -> None:
    if not recipient or not email_notifications_enabled():
        return

    try:
        await asyncio.to_thread(_send_email_sync, recipient, subject, body)
    except Exception:
        logger.exception("Failed to send email to %s", recipient)
