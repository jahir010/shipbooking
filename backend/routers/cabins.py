from fastapi import APIRouter, Depends, HTTPException, Query
from models import BookingItem, Cabin, Route, Ship, User
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import List
from services.holds import (
    HOLD_DURATION_MINUTES,
    create_or_refresh_cabin_hold,
    get_active_held_cabin_ids_for_route,
    get_reserved_cabin_ids_for_route,
    release_hold_for_user,
)

router = APIRouter()

class CabinCreate(BaseModel):
    ship_id: int
    type: str
    number: str
    capacity: int
    base_price: float
    amenities: List[str]


class CabinHoldCreate(BaseModel):
    route_id: int
    cabin_id: int


def serialize_cabin(cabin: Cabin):
    return {
        "id": cabin.id,
        "ship_id": cabin.ship.id,
        "type": cabin.type,
        "number": cabin.number,
        "capacity": cabin.capacity,
        "base_price": cabin.base_price,
        "amenities": cabin.amenities,
    }


async def get_authorized_cabin(cabin_id: int, current_user: User):
    cabin = await Cabin.get(id=cabin_id).prefetch_related("ship__owner")
    if current_user.role != "admin" and cabin.ship.owner.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this cabin")
    return cabin

@router.get("/cabins")
async def get_cabins(
    route_id: int | None = Query(default=None),
    available_only: bool = Query(default=False),
):
    if route_id is not None:
        route = await Route.get(id=route_id)
        queryset = Cabin.filter(ship_id=route.ship_id)
        if available_only:
            unavailable_cabin_ids = await get_reserved_cabin_ids_for_route(route_id)
            unavailable_cabin_ids |= await get_active_held_cabin_ids_for_route(route_id)
            if unavailable_cabin_ids:
                queryset = queryset.exclude(id__in=list(unavailable_cabin_ids))
        cabins = await queryset.prefetch_related("ship")
    else:
        cabins = await Cabin.all().prefetch_related("ship")
    return [serialize_cabin(cabin) for cabin in cabins]

@router.post("/cabins")
async def create_cabin(cabin: CabinCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["shipowner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    ship = await Ship.get(id=cabin.ship_id)
    if ship.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized for this ship")
    cabin_obj = await Cabin.create(
        ship=ship,
        type=cabin.type,
        number=cabin.number,
        capacity=cabin.capacity,
        base_price=cabin.base_price,
        amenities=cabin.amenities
    )
    await cabin_obj.fetch_related("ship")
    return serialize_cabin(cabin_obj)

@router.get("/cabins/{cabin_id}")
async def get_cabin(cabin_id: int):
    cabin = await Cabin.get(id=cabin_id).prefetch_related("ship")
    return serialize_cabin(cabin)


@router.delete("/cabins/{cabin_id}")
async def delete_cabin(cabin_id: int, current_user: User = Depends(get_current_user)):
    cabin = await get_authorized_cabin(cabin_id, current_user)
    booking_item_count = await BookingItem.filter(cabin=cabin).count()
    if booking_item_count:
        raise HTTPException(
            status_code=400,
            detail="This cabin has bookings and cannot be deleted",
        )
    await cabin.delete()
    return {"message": "Cabin deleted successfully"}


@router.post("/cabin-holds")
async def create_cabin_hold(payload: CabinHoldCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can place cabin holds")

    route = await Route.get(id=payload.route_id)
    cabin = await Cabin.get(id=payload.cabin_id)
    hold = await create_or_refresh_cabin_hold(route, cabin, current_user)
    return {
        "id": hold.id,
        "route_id": hold.route_id,
        "cabin_id": hold.cabin_id,
        "status": hold.status,
        "expires_at": hold.expires_at.isoformat(),
        "hold_duration_minutes": HOLD_DURATION_MINUTES,
    }


@router.delete("/cabin-holds")
async def release_cabin_hold(
    route_id: int = Query(...),
    cabin_id: int = Query(...),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can release cabin holds")
    await release_hold_for_user(route_id, cabin_id, current_user.id)
    return {"message": "Cabin hold released"}
