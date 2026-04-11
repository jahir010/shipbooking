from fastapi import APIRouter, Depends, HTTPException
from models import Ship, User, Route, Cabin, Review
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ShipCreate(BaseModel):
    name: str
    operator: str
    image: str
    description: str
    rating: float = 0
    review_count: int = 0


def serialize_ship(ship: Ship):
    return {
        "id": ship.id,
        "name": ship.name,
        "operator": ship.operator,
        "owner_id": ship.owner.id,
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
    ship_obj = await Ship.create(
        name=ship.name,
        operator=ship.operator,
        owner=current_user,
        image=ship.image,
        description=ship.description,
        rating=ship.rating,
        review_count=ship.review_count
    )
    await ship_obj.fetch_related("owner")
    return serialize_ship(ship_obj)

@router.get("/ships/{ship_id}")
async def get_ship(ship_id: int):
    ship = await Ship.get(id=ship_id).prefetch_related("owner")
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
