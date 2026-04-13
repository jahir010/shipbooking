import asyncio
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from tortoise import Tortoise, connections

from config import (
    BACKEND_CORS_ORIGINS,
    DB_GENERATE_SCHEMAS,
    RUN_STARTUP_SCHEMA_SYNC,
    TORTOISE_ORM,
)
from routers import auth, bookings, cabins, finance, payments, routes, ships, users
from schema_sync import (
    ensure_payment_split_columns,
    ensure_ship_commission_rate_column,
    ensure_ship_image_longtext,
    ensure_user_status_column,
)
from services.trips import sync_all_route_statuses

logger = logging.getLogger(__name__)

app = FastAPI(title="Ship Booking API", version="1.0.0")
app.state.db_ready = False
app.state.db_init_error = None
app.state.db_init_task = None
app.state.db_init_lock = asyncio.Lock()

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


async def initialize_database() -> None:
    if app.state.db_ready:
        return

    logger.info("Starting database initialization")

    try:
        await Tortoise.init(config=TORTOISE_ORM)

        if DB_GENERATE_SCHEMAS:
            await Tortoise.generate_schemas()
            logger.info("Database schemas generated")

        if RUN_STARTUP_SCHEMA_SYNC:
            await ensure_ship_image_longtext()
            await ensure_user_status_column()
            await ensure_ship_commission_rate_column()
            await ensure_payment_split_columns()
            await sync_all_route_statuses()
            logger.info("Startup schema sync completed")

        app.state.db_ready = True
        app.state.db_init_error = None
        logger.info("Database initialization finished")
    except Exception as exc:
        app.state.db_init_error = exc
        logger.exception("Database initialization failed")
        raise


async def ensure_database_initialized() -> None:
    if app.state.db_ready:
        return

    async with app.state.db_init_lock:
        task = app.state.db_init_task
        if task is None:
            task = asyncio.create_task(initialize_database())
            app.state.db_init_task = task

    try:
        await task
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database is not ready: {exc}",
        ) from exc


@app.middleware("http")
async def require_database_for_api_requests(request: Request, call_next):
    if request.url.path.startswith("/api"):
        await ensure_database_initialized()
    return await call_next(request)


@app.on_event("startup")
async def start_database_init_in_background():
    if app.state.db_init_task is None:
        app.state.db_init_task = asyncio.create_task(initialize_database())


@app.on_event("shutdown")
async def shutdown_database_connections():
    await connections.close_all()


@app.get("/")
async def root():
    return {"message": "Ship Booking API"}


@app.get("/health")
async def health():
    if app.state.db_ready:
        return {"status": "ok", "database": "ready"}
    if app.state.db_init_error:
        return {
            "status": "degraded",
            "database": "error",
            "detail": str(app.state.db_init_error),
        }
    return {"status": "starting", "database": "initializing"}
