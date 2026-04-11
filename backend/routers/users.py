from fastapi import APIRouter, Depends, HTTPException
from models import User
from routers.auth import get_current_user, serialize_user

router = APIRouter()


@router.get("/users")
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    users = await User.all().order_by("-created_at")
    return [serialize_user(user) for user in users]
