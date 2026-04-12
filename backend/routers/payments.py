from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from models import Booking, Payment
from services.notifications import send_email
from services.payments import build_frontend_payment_redirect
from services.trips import sync_route_status

router = APIRouter()


async def get_payment_payload(request: Request) -> dict[str, Any]:
    if request.method == "POST":
        form = await request.form()
        return dict(form)
    return dict(request.query_params)


async def cancel_booking_from_gateway(booking: Booking) -> None:
    if booking.status == "cancelled":
        return
    await booking.fetch_related("route")
    booking.status = "cancelled"
    await booking.save(update_fields=["status"])
    booking.route.seats_available = min(
        booking.route.total_seats,
        booking.route.seats_available + len(booking.passengers),
    )
    await booking.route.save(update_fields=["seats_available"])


async def notify_payment_update(booking: Booking, payment_status: str) -> None:
    await booking.fetch_related("user", "route__ship__owner")
    route = booking.route
    message = (
        f"Payment for booking #{booking.id} is now {payment_status}.\n\n"
        f"Ship: {route.ship.name}\n"
        f"Route: {route.departure_port} to {route.destination_port}\n"
        f"Departure: {route.date.isoformat()} at {route.departure_time}\n"
        f"Total: BDT {booking.total_price:.2f}\n"
    )
    await send_email(booking.user.email, f"Payment {payment_status} for booking #{booking.id}", message)
    await send_email(
        booking.route.ship.owner.email,
        f"Payment {payment_status} for booking #{booking.id}",
        message,
    )


async def update_payment_state(transaction_id: str, payment_status: str, gateway_payload: dict[str, Any]) -> Payment:
    payment = await Payment.get(transaction_id=transaction_id).prefetch_related(
        "booking__user",
        "booking__route__ship__owner",
    )
    payment.status = payment_status
    payment.gateway_reference = str(gateway_payload.get("val_id", "")) or payment.gateway_reference
    payment.gateway_payload = gateway_payload
    await payment.save(update_fields=["status", "gateway_reference", "gateway_payload"])
    booking = payment.booking
    await sync_route_status(booking.route)

    if payment_status == "completed":
        booking.status = "confirmed"
        await booking.save(update_fields=["status"])
    else:
        await cancel_booking_from_gateway(booking)

    await notify_payment_update(booking, payment_status)
    return payment


@router.api_route("/payments/sslcommerz/success", methods=["GET", "POST"])
async def sslcommerz_success(request: Request):
    payload = await get_payment_payload(request)
    tran_id = str(payload.get("tran_id", ""))
    payment = await update_payment_state(tran_id, "completed", payload)
    return RedirectResponse(build_frontend_payment_redirect("success", payment.booking.id), status_code=303)


@router.api_route("/payments/sslcommerz/fail", methods=["GET", "POST"])
async def sslcommerz_fail(request: Request):
    payload = await get_payment_payload(request)
    tran_id = str(payload.get("tran_id", ""))
    payment = await update_payment_state(tran_id, "failed", payload)
    return RedirectResponse(build_frontend_payment_redirect("failed", payment.booking.id), status_code=303)


@router.api_route("/payments/sslcommerz/cancel", methods=["GET", "POST"])
async def sslcommerz_cancel(request: Request):
    payload = await get_payment_payload(request)
    tran_id = str(payload.get("tran_id", ""))
    payment = await update_payment_state(tran_id, "cancelled", payload)
    return RedirectResponse(build_frontend_payment_redirect("cancelled", payment.booking.id), status_code=303)
