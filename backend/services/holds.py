from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import HTTPException

from models import BookingItem, Cabin, CabinHold, Route, User

HOLD_DURATION_MINUTES = 5


def hold_expiry_time() -> datetime:
    return datetime.utcnow() + timedelta(minutes=HOLD_DURATION_MINUTES)


async def expire_stale_holds() -> None:
    await CabinHold.filter(status="active", expires_at__lt=datetime.utcnow()).update(status="expired")


async def get_active_hold_count_for_route(route_id: int, *, excluding_user_id: int | None = None) -> int:
    await expire_stale_holds()
    queryset = CabinHold.filter(route_id=route_id, status="active", expires_at__gte=datetime.utcnow())
    if excluding_user_id is not None:
        queryset = queryset.exclude(user_id=excluding_user_id)
    return await queryset.count()


async def get_reserved_cabin_ids_for_route(route_id: int) -> set[int]:
    reserved_ids = await (
        BookingItem.filter(booking__route_id=route_id)
        .exclude(booking__status="cancelled")
        .values_list("cabin_id", flat=True)
    )
    return set(reserved_ids)


async def get_active_held_cabin_ids_for_route(route_id: int, *, excluding_user_id: int | None = None) -> set[int]:
    await expire_stale_holds()
    queryset = CabinHold.filter(route_id=route_id, status="active", expires_at__gte=datetime.utcnow())
    if excluding_user_id is not None:
        queryset = queryset.exclude(user_id=excluding_user_id)
    hold_ids = await queryset.values_list("cabin_id", flat=True)
    return set(hold_ids)


async def create_or_refresh_cabin_hold(route: Route, cabin: Cabin, user: User) -> CabinHold:
    await expire_stale_holds()

    if cabin.ship_id != route.ship_id:
        raise HTTPException(status_code=400, detail="This cabin does not belong to the selected route")

    reserved_cabin_ids = await get_reserved_cabin_ids_for_route(route.id)
    if cabin.id in reserved_cabin_ids:
        raise HTTPException(status_code=409, detail="This cabin has already been booked")

    existing_other_hold = await CabinHold.exclude(user=user).get_or_none(
        route=route,
        cabin=cabin,
        status="active",
        expires_at__gte=datetime.utcnow(),
    )
    if existing_other_hold is not None:
        raise HTTPException(status_code=409, detail="This cabin is temporarily held by another customer")

    route_hold_count = await get_active_hold_count_for_route(route.id, excluding_user_id=user.id)
    if route_hold_count >= route.seats_available:
        raise HTTPException(status_code=409, detail="No seats are currently available for a new hold")

    hold = await CabinHold.get_or_none(route=route, cabin=cabin, user=user, status="active")
    expiry = hold_expiry_time()
    if hold is not None:
        hold.expires_at = expiry
        await hold.save(update_fields=["expires_at", "updated_at"])
        return hold

    return await CabinHold.create(
        route=route,
        cabin=cabin,
        user=user,
        status="active",
        expires_at=expiry,
    )


async def release_hold_for_user(route_id: int, cabin_id: int, user_id: int) -> None:
    await expire_stale_holds()
    hold = await CabinHold.get_or_none(
        route_id=route_id,
        cabin_id=cabin_id,
        user_id=user_id,
        status="active",
    )
    if hold is None:
        return
    hold.status = "released"
    await hold.save(update_fields=["status", "updated_at"])


async def claim_holds_for_booking(route: Route, user: User, cabin_ids: list[int]) -> list[CabinHold]:
    await expire_stale_holds()
    holds = await CabinHold.filter(
        route=route,
        user=user,
        cabin_id__in=cabin_ids,
        status="active",
        expires_at__gte=datetime.utcnow(),
    )
    if len(holds) != len(cabin_ids):
        raise HTTPException(
            status_code=409,
            detail="One or more selected cabins are no longer reserved for you. Please select them again.",
        )
    return holds


async def convert_holds_to_booking(holds: list[CabinHold]) -> None:
    if not holds:
        return
    hold_ids = [hold.id for hold in holds]
    await CabinHold.filter(id__in=hold_ids).update(status="converted")


async def release_hold_records(holds: list[CabinHold]) -> None:
    if not holds:
        return
    hold_ids = [hold.id for hold in holds]
    await CabinHold.filter(id__in=hold_ids).update(status="released")
