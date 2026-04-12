from __future__ import annotations

from datetime import date, datetime, time, timedelta

from models import Route


TIME_FORMAT = "%H:%M"


def parse_trip_time(value: str) -> time:
    return datetime.strptime(value, TIME_FORMAT).time()


def get_route_departure_datetime(route_date: date, departure_time: str) -> datetime:
    return datetime.combine(route_date, parse_trip_time(departure_time))


def get_route_arrival_datetime(
    route_date: date,
    departure_time: str,
    arrival_time: str,
) -> datetime:
    departure_dt = get_route_departure_datetime(route_date, departure_time)
    arrival_dt = datetime.combine(route_date, parse_trip_time(arrival_time))
    if arrival_dt <= departure_dt:
        arrival_dt += timedelta(days=1)
    return arrival_dt


def is_route_completed(route: Route, now: datetime | None = None) -> bool:
    current_time = now or datetime.now()
    return get_route_arrival_datetime(
        route.date,
        route.departure_time,
        route.arrival_time,
    ) <= current_time


def is_route_upcoming(route: Route, now: datetime | None = None) -> bool:
    current_time = now or datetime.now()
    return get_route_departure_datetime(route.date, route.departure_time) > current_time


def is_route_bookable(route: Route, now: datetime | None = None) -> bool:
    return route.status == "active" and is_route_upcoming(route, now)


async def sync_route_status(route: Route, now: datetime | None = None) -> Route:
    if route.status == "active" and is_route_completed(route, now):
        route.status = "completed"
        await route.save(update_fields=["status"])
    return route


async def sync_all_route_statuses() -> None:
    active_routes = await Route.filter(status="active")
    current_time = datetime.now()
    for route in active_routes:
        if is_route_completed(route, current_time):
            route.status = "completed"
            await route.save(update_fields=["status"])
