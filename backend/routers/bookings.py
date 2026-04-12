from __future__ import annotations

from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Response
from models import Booking, BookingItem, Cabin, Payment, Route, User
from pydantic import BaseModel
from routers.auth import get_current_user
from services.finance import calculate_payment_split
from services.holds import (
    claim_holds_for_booking,
    convert_holds_to_booking,
    get_active_hold_count_for_route,
    get_active_held_cabin_ids_for_route,
    get_reserved_cabin_ids_for_route,
    release_hold_records,
)
from services.invoices import build_invoice_filename, build_invoice_html, build_invoice_number
from services.notifications import send_email
from services.payments import initiate_sslcommerz_payment
from services.trips import is_route_bookable, sync_route_status

router = APIRouter()


class BookingItemCreate(BaseModel):
    cabin_id: int
    cabin_type: str
    cabin_number: str
    quantity: int
    price_per_unit: float


class BookingCreate(BaseModel):
    route_id: int
    items: List[BookingItemCreate]
    passengers: List[dict[str, Any]]
    total_price: float
    payment_method: str = "sslcommerz"


class BookingStatusUpdate(BaseModel):
    status: str


def serialize_booking_item(item: BookingItem):
    return {
        "cabin_id": item.cabin.id,
        "cabin_type": item.cabin_type,
        "cabin_number": item.cabin_number,
        "quantity": item.quantity,
        "price_per_unit": item.price_per_unit,
    }


def get_latest_completed_payment(booking: Booking) -> Payment | None:
    completed_payments = [payment for payment in booking.payments if payment.status == "completed"]
    if not completed_payments:
        return None
    return max(
        completed_payments,
        key=lambda payment: payment.updated_at or payment.created_at or booking.created_at,
    )


def serialize_booking(booking: Booking):
    completed_payment = get_latest_completed_payment(booking)
    return {
        "id": booking.id,
        "user_id": booking.user.id,
        "route_id": booking.route.id,
        "total_price": booking.total_price,
        "status": booking.status,
        "passengers": booking.passengers,
        "items": [serialize_booking_item(item) for item in booking.items],
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "payment_status": completed_payment.status if completed_payment else None,
        "invoice_available": completed_payment is not None,
        "invoice_number": (
            build_invoice_number(booking, completed_payment) if completed_payment else None
        ),
        "user": {
            "id": booking.user.id,
            "email": booking.user.email,
            "first_name": booking.user.first_name,
            "last_name": booking.user.last_name,
            "role": booking.user.role,
        },
        "route": {
            "id": booking.route.id,
            "ship_id": booking.route.ship.id,
            "departure_port": booking.route.departure_port,
            "destination_port": booking.route.destination_port,
            "departure_time": booking.route.departure_time,
            "arrival_time": booking.route.arrival_time,
            "date": booking.route.date.isoformat(),
        },
    }


def build_booking_email_body(booking: Booking, status_label: str) -> str:
    route = booking.route
    ship = route.ship
    passenger_count = len(booking.passengers)
    return (
        f"Booking #{booking.id} is now {status_label}.\n\n"
        f"Ship: {ship.name}\n"
        f"Route: {route.departure_port} to {route.destination_port}\n"
        f"Departure: {route.date.isoformat()} at {route.departure_time}\n"
        f"Passengers: {passenger_count}\n"
        f"Total: BDT {booking.total_price:.2f}\n"
    )


async def notify_booking_status(booking: Booking, status_label: str) -> None:
    await booking.fetch_related("user", "route__ship__owner")
    subject = f"Ship booking #{booking.id} {status_label}"
    body = build_booking_email_body(booking, status_label)
    await send_email(booking.user.email, subject, body)
    owner = booking.route.ship.owner
    await send_email(owner.email, subject, body)


async def restore_route_capacity_for_booking(booking: Booking) -> None:
    await booking.fetch_related("route")
    passenger_count = len(booking.passengers)
    booking.route.seats_available = min(
        booking.route.total_seats,
        booking.route.seats_available + passenger_count,
    )
    await booking.route.save(update_fields=["seats_available"])


async def get_booking_queryset_for_user(current_user: User):
    if current_user.role == "admin":
        return Booking.all()
    if current_user.role == "shipowner":
        return Booking.filter(route__ship__owner_id=current_user.id)
    return Booking.filter(user=current_user)


async def get_accessible_booking(booking_id: int, current_user: User):
    queryset = await get_booking_queryset_for_user(current_user)
    booking = await queryset.get(id=booking_id).prefetch_related(
        "user",
        "route__ship__owner",
        "items__cabin",
        "payments",
    )
    await sync_route_status(booking.route)
    return booking


async def validate_booking_request(booking: BookingCreate, route: Route, current_user: User) -> list[Cabin]:
    if not booking.items:
        raise HTTPException(status_code=400, detail="Select at least one cabin before booking")
    if not booking.passengers:
        raise HTTPException(status_code=400, detail="Passenger details are required")
    if len(booking.passengers) != len(booking.items):
        raise HTTPException(
            status_code=400,
            detail="Each booked cabin must include one passenger form",
        )
    available_seats_for_booking = route.seats_available - await get_active_hold_count_for_route(
        route.id,
        excluding_user_id=current_user.id,
    )
    if available_seats_for_booking < len(booking.passengers):
        raise HTTPException(status_code=400, detail="Not enough seats are available for this trip")

    requested_cabin_ids = [item.cabin_id for item in booking.items]
    if len(requested_cabin_ids) != len(set(requested_cabin_ids)):
        raise HTTPException(status_code=400, detail="A cabin can only be selected once per booking")

    cabins = await Cabin.filter(id__in=requested_cabin_ids, ship_id=route.ship_id)
    if len(cabins) != len(requested_cabin_ids):
        raise HTTPException(status_code=400, detail="One or more selected cabins are invalid for this ship")

    reserved_cabin_ids = await get_reserved_cabin_ids_for_route(route.id)
    held_by_others = await get_active_held_cabin_ids_for_route(route.id, excluding_user_id=current_user.id)
    requested_set = set(requested_cabin_ids)
    if requested_set & (reserved_cabin_ids | held_by_others):
        raise HTTPException(status_code=400, detail="One or more selected cabins are no longer available")

    return cabins


def calculate_booking_total(cabins: list[Cabin]) -> float:
    return round(sum(cabin.base_price for cabin in cabins), 2)


def build_payment_transaction_id(booking_id: int) -> str:
    return f"SHIP-{booking_id}-{int(datetime.now().timestamp())}"


@router.get("/bookings")
async def get_bookings(current_user: User = Depends(get_current_user)):
    queryset = await get_booking_queryset_for_user(current_user)
    bookings = await queryset.prefetch_related("user", "route__ship__owner", "items__cabin", "payments")
    return [serialize_booking(booking) for booking in bookings]


@router.post("/bookings")
async def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in {"customer", "admin"}:
        raise HTTPException(status_code=403, detail="Only customers can create bookings")

    route = await Route.get(id=booking.route_id).prefetch_related("ship__owner")
    route = await sync_route_status(route)
    if not is_route_bookable(route):
        raise HTTPException(status_code=400, detail="Only upcoming active trips can be booked")

    cabins = await validate_booking_request(booking, route, current_user)
    requested_cabin_ids = [item.cabin_id for item in booking.items]
    claimed_holds = await claim_holds_for_booking(route, current_user, requested_cabin_ids)
    total_price = calculate_booking_total(cabins)
    platform_commission_amount, shipowner_amount = calculate_payment_split(
        total_price,
        route.ship.commission_rate,
    )

    booking_obj = await Booking.create(
        user=current_user,
        route=route,
        total_price=total_price,
        passengers=booking.passengers,
        status="pending",
    )

    cabin_map = {cabin.id: cabin for cabin in cabins}
    for item in booking.items:
        cabin = cabin_map[item.cabin_id]
        await BookingItem.create(
            booking=booking_obj,
            cabin=cabin,
            cabin_type=cabin.type,
            cabin_number=cabin.number,
            quantity=item.quantity,
            price_per_unit=cabin.base_price,
        )

    route.seats_available -= len(booking.passengers)
    await route.save(update_fields=["seats_available"])
    await convert_holds_to_booking(claimed_holds)

    payment = await Payment.create(
        booking=booking_obj,
        amount=total_price,
        platform_commission_amount=platform_commission_amount,
        shipowner_amount=shipowner_amount,
        method=booking.payment_method,
        status="pending",
        transaction_id=build_payment_transaction_id(booking_obj.id),
    )

    booking_with_relations = await Booking.get(id=booking_obj.id).prefetch_related(
        "user",
        "route__ship__owner",
        "items__cabin",
        "payments",
    )
    try:
        payment_result = await initiate_sslcommerz_payment(booking_with_relations, payment)
    except Exception:
        route.seats_available += len(booking.passengers)
        await route.save(update_fields=["seats_available"])
        await release_hold_records(claimed_holds)
        await Payment.filter(id=payment.id).delete()
        await BookingItem.filter(booking=booking_obj).delete()
        await booking_obj.delete()
        raise
    await notify_booking_status(booking_with_relations, "pending payment")

    return {
        "message": "Booking created successfully",
        "booking": serialize_booking(booking_with_relations),
        "payment_url": payment_result.get("payment_url"),
        "payment_status": payment.status,
    }


@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: int, current_user: User = Depends(get_current_user)):
    booking = await get_accessible_booking(booking_id, current_user)
    return serialize_booking(booking)


@router.get("/bookings/{booking_id}/invoice")
async def download_booking_invoice(booking_id: int, current_user: User = Depends(get_current_user)):
    booking = await get_accessible_booking(booking_id, current_user)
    completed_payment = get_latest_completed_payment(booking)
    if completed_payment is None:
        raise HTTPException(status_code=404, detail="Invoice is not available until payment is completed")

    invoice_html = build_invoice_html(booking, completed_payment)
    filename = build_invoice_filename(booking, completed_payment)
    return Response(
        content=invoice_html,
        media_type="text/html; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user)):
    booking = await get_accessible_booking(booking_id, current_user)
    await sync_route_status(booking.route)
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Completed bookings cannot be cancelled")
    if booking.status != "cancelled":
        booking.status = "cancelled"
        await booking.save(update_fields=["status"])
        await restore_route_capacity_for_booking(booking)
        await Payment.filter(booking=booking, status="pending").update(status="cancelled")
        await notify_booking_status(booking, "cancelled")
    return serialize_booking(booking)


@router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {"shipowner", "admin"}:
        raise HTTPException(status_code=403, detail="Not authorized")
    if payload.status not in {"pending", "confirmed", "completed", "cancelled"}:
        raise HTTPException(status_code=400, detail="Invalid booking status")

    booking = await get_accessible_booking(booking_id, current_user)
    previous_status = booking.status
    booking.status = payload.status
    await booking.save(update_fields=["status"])

    if payload.status == "cancelled" and previous_status != "cancelled":
        await restore_route_capacity_for_booking(booking)
        await Payment.filter(booking=booking, status="pending").update(status="cancelled")

    await notify_booking_status(booking, payload.status)
    return serialize_booking(booking)


@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    booking = await Booking.get(id=booking_id).prefetch_related("route")
    if booking.status != "cancelled":
        await restore_route_capacity_for_booking(booking)
    await Payment.filter(booking=booking).delete()
    await BookingItem.filter(booking=booking).delete()
    await booking.delete()
    return {"message": "Booking deleted successfully"}
