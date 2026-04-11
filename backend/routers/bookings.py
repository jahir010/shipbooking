from fastapi import APIRouter, Depends, HTTPException
from models import Booking, BookingItem, Route, Cabin, User
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import List

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
    passengers: List[dict]
    total_price: float


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


def serialize_booking(booking: Booking):
    return {
        "id": booking.id,
        "user_id": booking.user.id,
        "route_id": booking.route.id,
        "total_price": booking.total_price,
        "status": booking.status,
        "passengers": booking.passengers,
        "items": [serialize_booking_item(item) for item in booking.items],
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
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
        "route__ship",
        "items__cabin",
    )
    return booking

@router.get("/bookings")
async def get_bookings(current_user: User = Depends(get_current_user)):
    queryset = await get_booking_queryset_for_user(current_user)
    bookings = await queryset.prefetch_related("user", "route__ship", "items__cabin")
    return [serialize_booking(booking) for booking in bookings]

@router.post("/bookings")
async def create_booking(booking: BookingCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in {"customer", "admin"}:
        raise HTTPException(status_code=403, detail="Only customers can create bookings")
    route = await Route.get(id=booking.route_id)
    booking_obj = await Booking.create(
        user=current_user,
        route=route,
        total_price=booking.total_price,
        passengers=booking.passengers
    )
    for item in booking.items:
        cabin = await Cabin.get(id=item.cabin_id)
        await BookingItem.create(
            booking=booking_obj,
            cabin=cabin,
            cabin_type=item.cabin_type,
            cabin_number=item.cabin_number,
            quantity=item.quantity,
            price_per_unit=item.price_per_unit
        )
    booking_with_relations = await Booking.get(id=booking_obj.id).prefetch_related("user", "route__ship", "items__cabin")
    return {"message": "Booking created successfully", "booking": serialize_booking(booking_with_relations)}

@router.get("/bookings/{booking_id}")
async def get_booking(booking_id: int, current_user: User = Depends(get_current_user)):
    booking = await get_accessible_booking(booking_id, current_user)
    return serialize_booking(booking)


@router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: int, current_user: User = Depends(get_current_user)):
    booking = await get_accessible_booking(booking_id, current_user)
    booking.status = "cancelled"
    await booking.save()
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
    booking.status = payload.status
    await booking.save()
    return serialize_booking(booking)


@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: int, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    booking = await Booking.get(id=booking_id)
    await BookingItem.filter(booking=booking).delete()
    await booking.delete()
    return {"message": "Booking deleted successfully"}
