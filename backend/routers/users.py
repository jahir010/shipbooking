from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from models import User
from routers.auth import get_current_user, get_password_hash, serialize_user

router = APIRouter()


class AdminUserCreate(BaseModel):
    email: str
    password: str = Field(min_length=6)
    first_name: str
    last_name: str = ""
    role: str
    status: str = "active"


class AdminUserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: str | None = None
    status: str | None = None
    password: str | None = Field(default=None, min_length=6)


def require_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")


def normalize_role(role: str) -> str:
    normalized_role = role.strip().lower()
    if normalized_role not in {"customer", "shipowner", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role")
    return normalized_role


def normalize_status(status_value: str) -> str:
    normalized_status = status_value.strip().lower()
    if normalized_status not in {"active", "suspended"}:
        raise HTTPException(status_code=400, detail="Invalid user status")
    return normalized_status


@router.get("/users")
async def get_users(current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    users = await User.all().order_by("-created_at")
    return [serialize_user(user) for user in users]


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(payload: AdminUserCreate, current_user: User = Depends(get_current_user)):
    require_admin(current_user)

    normalized_email = payload.email.strip().lower()
    if await User.get_or_none(email=normalized_email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

    first_name = payload.first_name.strip()
    last_name = payload.last_name.strip()
    if not first_name:
        raise HTTPException(status_code=400, detail="First name is required")

    user = await User.create(
        email=normalized_email,
        password=get_password_hash(payload.password),
        first_name=first_name,
        last_name=last_name,
        role=normalize_role(payload.role),
        status=normalize_status(payload.status),
    )
    return {"message": "User created successfully", "user": serialize_user(user)}


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    current_user: User = Depends(get_current_user),
):
    require_admin(current_user)
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    update_fields: list[str] = []

    if payload.first_name is not None:
        first_name = payload.first_name.strip()
        if not first_name:
            raise HTTPException(status_code=400, detail="First name is required")
        user.first_name = first_name
        update_fields.append("first_name")

    if payload.last_name is not None:
        user.last_name = payload.last_name.strip()
        update_fields.append("last_name")

    if payload.role is not None:
        if user.id == current_user.id and normalize_role(payload.role) != "admin":
            raise HTTPException(status_code=400, detail="You cannot remove your own admin access")
        user.role = normalize_role(payload.role)
        update_fields.append("role")

    if payload.status is not None:
        if user.id == current_user.id and normalize_status(payload.status) != "active":
            raise HTTPException(status_code=400, detail="You cannot suspend your own account")
        user.status = normalize_status(payload.status)
        update_fields.append("status")

    if payload.password is not None:
        user.password = get_password_hash(payload.password)
        update_fields.append("password")

    if update_fields:
        await user.save(update_fields=update_fields)

    return {"message": "User updated successfully", "user": serialize_user(user)}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    require_admin(current_user)
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = await User.get_or_none(id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    await user.delete()
    return {"message": "User deleted successfully"}
