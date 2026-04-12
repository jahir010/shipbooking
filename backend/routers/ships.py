from fastapi import APIRouter, Depends, HTTPException
from models import Ship, User, Route, Cabin, Review
from routers.auth import get_current_user
from pydantic import BaseModel
from tortoise.exceptions import OperationalError

router = APIRouter()

class ShipCreate(BaseModel):
    name: str
    operator: str
    image: str
    description: str
    rating: float = 0
    review_count: int = 0
    commission_rate: float = 0


class ShipCommissionUpdate(BaseModel):
    commission_rate: float


def serialize_ship(ship: Ship):
    return {
        "id": ship.id,
        "name": ship.name,
        "operator": ship.operator,
        "owner_id": ship.owner.id,
        "commission_rate": ship.commission_rate,
        "image": ship.image,
        "description": ship.description,
        "rating": ship.rating,
        "review_count": ship.review_count,
        "created_at": ship.created_at.isoformat() if ship.created_at else None,
    }


async def get_authorized_ship(ship_id: int, current_user: User):
    ship = await Ship.get(id=ship_id).prefetch_related("owner")
    if current_user.role != "admin" and ship.owner.id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this ship")
    return ship

@router.get("/ships")
async def get_ships():
    ships = await Ship.all().prefetch_related("owner")
    return [serialize_ship(ship) for ship in ships]

@router.post("/ships")
async def create_ship(ship: ShipCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["shipowner", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        ship_obj = await Ship.create(
            name=ship.name,
            operator=ship.operator,
            owner=current_user,
            commission_rate=ship.commission_rate if current_user.role == "admin" else 0,
            image=ship.image,
            description=ship.description,
            rating=ship.rating,
            review_count=ship.review_count
        )
    except OperationalError as exc:
        error_message = str(exc)
        if "Data too long for column 'image'" in error_message:
            raise HTTPException(
                status_code=500,
                detail="The database schema for ship images is outdated. Restart the backend so it can apply the required column update.",
            ) from exc
        raise
    await ship_obj.fetch_related("owner")
    return serialize_ship(ship_obj)

@router.get("/ships/{ship_id}")
async def get_ship(ship_id: int):
    ship = await Ship.get(id=ship_id).prefetch_related("owner")
    return serialize_ship(ship)


@router.put("/ships/{ship_id}/commission")
async def update_ship_commission(
    ship_id: int,
    payload: ShipCommissionUpdate,
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update commission rates")
    ship = await Ship.get(id=ship_id).prefetch_related("owner")
    if payload.commission_rate < 0 or payload.commission_rate > 100:
        raise HTTPException(status_code=400, detail="Commission rate must be between 0 and 100")
    ship.commission_rate = payload.commission_rate
    await ship.save(update_fields=["commission_rate"])
    return serialize_ship(ship)


@router.delete("/ships/{ship_id}")
async def delete_ship(ship_id: int, current_user: User = Depends(get_current_user)):
    ship = await get_authorized_ship(ship_id, current_user)
    route_count = await Route.filter(ship=ship).count()
    cabin_count = await Cabin.filter(ship=ship).count()
    if route_count or cabin_count:
        raise HTTPException(
            status_code=400,
            detail="Remove this ship's routes and cabins before deleting the ship",
        )
    await Review.filter(ship=ship).delete()
    await ship.delete()
    return {"message": "Ship deleted successfully"}
