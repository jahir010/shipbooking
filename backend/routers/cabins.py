from fastapi import APIRouter, Depends, HTTPException
from models import Cabin, Ship, User, BookingItem
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter()

class CabinCreate(BaseModel):
    ship_id: int
    type: str
    number: str
    capacity: int
    base_price: float
    amenities: List[str]


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
async def get_cabins():
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
