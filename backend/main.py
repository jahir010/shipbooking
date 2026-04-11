from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise
from config import TORTOISE_ORM
from routers import auth, ships, routes, cabins, bookings, users

app = FastAPI(title="Ship Booking API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
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

register_tortoise(
    app,
    config=TORTOISE_ORM,
    generate_schemas=True,
    add_exception_handlers=True,
)

@app.get("/")
async def root():
    return {"message": "Ship Booking API"}
