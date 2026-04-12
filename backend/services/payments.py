from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from config import (
    API_PUBLIC_BASE_URL,
    APP_URL,
    SSLCOMMERZ_SANDBOX_MODE,
    SSLCOMMERZ_STORE_ID,
    SSLCOMMERZ_STORE_PASSWORD,
)
from models import Booking, Payment


def payment_gateway_enabled() -> bool:
    return bool(SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD)


def build_frontend_payment_redirect(status: str, booking_id: int) -> str:
    return f"{APP_URL}/customer/bookings?payment={status}&booking_id={booking_id}"


def _sslcommerz_base_url() -> str:
    if SSLCOMMERZ_SANDBOX_MODE:
        return "https://sandbox.sslcommerz.com"
    return "https://securepay.sslcommerz.com"


def _init_payment_sync(payload: dict[str, Any]) -> dict[str, Any]:
    request = Request(
        url=f"{_sslcommerz_base_url()}/gwprocess/v4/api.php",
        data=urlencode(payload).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


async def initiate_sslcommerz_payment(booking: Booking, payment: Payment) -> dict[str, Any]:
    if not payment_gateway_enabled():
        raise HTTPException(
            status_code=503,
            detail="SSLCommerz is not configured yet. Add the store credentials to the backend environment and try again.",
        )

    await booking.fetch_related("user", "route__ship")

    payload = {
        "store_id": SSLCOMMERZ_STORE_ID,
        "store_passwd": SSLCOMMERZ_STORE_PASSWORD,
        "total_amount": f"{booking.total_price:.2f}",
        "currency": "BDT",
        "tran_id": payment.transaction_id,
        "success_url": f"{API_PUBLIC_BASE_URL}/payments/sslcommerz/success",
        "fail_url": f"{API_PUBLIC_BASE_URL}/payments/sslcommerz/fail",
        "cancel_url": f"{API_PUBLIC_BASE_URL}/payments/sslcommerz/cancel",
        "cus_name": f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.email,
        "cus_email": booking.user.email,
        "cus_phone": "01700000000",
        "cus_add1": "Bangladesh",
        "cus_city": "Dhaka",
        "cus_country": "Bangladesh",
        "shipping_method": "NO",
        "product_name": f"{booking.route.departure_port} to {booking.route.destination_port}",
        "product_category": "Travel",
        "product_profile": "general",
        "value_a": str(booking.id),
    }

    try:
        gateway_response = await asyncio.to_thread(_init_payment_sync, payload)
    except (HTTPError, URLError, TimeoutError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to start the payment gateway right now. Please try again.",
        ) from exc

    payment_url = (
        gateway_response.get("GatewayPageURL")
        or gateway_response.get("redirectGatewayURL")
        or gateway_response.get("redirect_url")
    )
    if gateway_response.get("status") != "SUCCESS" or not payment_url:
        raise HTTPException(
            status_code=502,
            detail="SSLCommerz did not return a valid payment page URL.",
        )

    payment.session_key = gateway_response.get("sessionkey")
    payment.gateway_payload = gateway_response
    await payment.save(update_fields=["session_key", "gateway_payload"])

    return {"payment_url": payment_url, "gateway_response": gateway_response}
