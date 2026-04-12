from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from config import BACKEND_CORS_ORIGINS, TORTOISE_ORM
from routers import auth, bookings, cabins, finance, payments, routes, ships, users
from schema_sync import (
    ensure_payment_split_columns,
    ensure_ship_commission_rate_column,
    ensure_ship_image_longtext,
    ensure_user_status_column,
)
from services.trips import sync_all_route_statuses

app = FastAPI(title="Ship Booking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(ships.router, prefix="/api", tags=["ships"])
app.include_router(routes.router, prefix="/api", tags=["routes"])
app.include_router(cabins.router, prefix="/api", tags=["cabins"])
app.include_router(bookings.router, prefix="/api", tags=["bookings"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(payments.router, prefix="/api", tags=["payments"])
app.include_router(finance.router, prefix="/api", tags=["finance"])

register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=True,
    add_exception_handlers=True,
)


@app.on_event("startup")
async def sync_existing_schema():
    await ensure_ship_image_longtext()
    await ensure_user_status_column()
    await ensure_ship_commission_rate_column()
    await ensure_payment_split_columns()
    await sync_all_route_statuses()

@app.get("/")
async def root():
    return {"message": "Ship Booking API"}
