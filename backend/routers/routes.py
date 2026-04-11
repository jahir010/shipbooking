from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from models import Route, Ship, User, Booking, BookingItem
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class RouteCreate(BaseModel):
    ship_id: int
    departure_port: str
    destination_port: str
    departure_time: str
    arrival_time: str
    duration: float
    date: date
    seats_available: int
    total_seats: int
    base_price: float
    status: str = "active"


def serialize_route(route: Route):
    return {
        "id": route.id,
        "ship_id": route.ship.id,
        "departure_port": route.departure_port,
        "destination_port": route.destination_port,
        "departure_time": route.departure_time,
        "arrival_time": route.arrival_time,
        "duration": route.duration,
        "date": route.date.isoformat(),
        "seats_available": route.seats_available,
        "total_seats": route.total_seats,
        "base_price": route.base_price,
        "status": route.status,
        "created_at": route.created_at.isoformat() if route.created_at else None,
    }


async def get_authorized_route(route_id: int, current_user: User):
    route = await Route.get(id=route_id).prefetch_related("ship__owner")
    if current_user.role != "admin" and route.ship.owner.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this route")
    return route

@router.get("/routes")
async def get_routes():
    routes = await Route.all().prefetch_related("ship")
    return [serialize_route(route) for route in routes]

@router.post("/routes")
async def create_route(route: RouteCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["shipowner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    ship = await Ship.get(id=route.ship_id)
    if ship.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized for this ship")
    route_obj = await Route.create(
        ship=ship,
        departure_port=route.departure_port,
        destination_port=route.destination_port,
        departure_time=route.departure_time,
        arrival_time=route.arrival_time,
        duration=route.duration,
        date=route.date,
        seats_available=route.seats_available,
        total_seats=route.total_seats,
        base_price=route.base_price,
        status=route.status
    )
    await route_obj.fetch_related("ship")
    return serialize_route(route_obj)

@router.get("/routes/{route_id}")
async def get_route(route_id: int):
    route = await Route.get(id=route_id).prefetch_related("ship")
    return serialize_route(route)


@router.delete("/routes/{route_id}")
async def delete_route(route_id: int, current_user: User = Depends(get_current_user)):
    route = await get_authorized_route(route_id, current_user)
    booking_count = await Booking.filter(route=route).count()
    if booking_count:
        raise HTTPException(
            status_code=400,
            detail="This route has bookings and cannot be deleted",
        )
    await BookingItem.filter(booking__route=route).delete()
    await route.delete()
    return {"message": "Route deleted successfully"}
