from decouple import config


def _build_database_url() -> str:
    database_url = config("DATABASE_URL", default="")
    if database_url:
        return database_url

    return (
        f"mysql://{config('DB_USER', 'root')}:{config('DB_PASSWORD', 'root')}"
        f"@{config('DB_HOST', 'localhost')}:{config('DB_PORT', '3306')}"
        f"/{config('DB_NAME', 'shipbooking')}"
    )


def _split_csv(raw_value: str) -> list[str]:
    return [item.strip() for item in raw_value.split(",") if item.strip()]


DATABASE_URL = _build_database_url()
APP_URL = config("APP_URL", "http://localhost:3000")
API_PUBLIC_BASE_URL = config("API_PUBLIC_BASE_URL", "http://localhost:8000/api")
BACKEND_CORS_ORIGINS = _split_csv(
    config(
        "BACKEND_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
)

SSLCOMMERZ_STORE_ID = config("SSLCOMMERZ_STORE_ID", "")
SSLCOMMERZ_STORE_PASSWORD = config("SSLCOMMERZ_STORE_PASSWORD", "")
SSLCOMMERZ_SANDBOX_MODE = config("SSLCOMMERZ_SANDBOX_MODE", True, cast=bool)

EMAIL_HOST = config("EMAIL_HOST", "")
EMAIL_PORT = config("EMAIL_PORT", 587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

TORTOISE_ORM = {
    "connections": {"default": DATABASE_URL},
    "apps": {
        "models": {
            "models": ["models", "aerich.models"],
            "default_connection": "default",
        },
    },
}
