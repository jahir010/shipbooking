import os
from urllib.parse import quote_plus

from decouple import config


def _build_database_url() -> str:
    database_url = config("DATABASE_URL", default="")
    if database_url:
        return database_url

    db_scheme = config("DB_SCHEME", default="").strip().lower()
    db_host = config("DB_HOST", "localhost")
    db_port = config("DB_PORT", "3306")
    db_name = config("DB_NAME", "shipbooking")
    db_user = quote_plus(config("DB_USER", "root"))
    db_password = quote_plus(config("DB_PASSWORD", "root"))

    if not db_scheme:
        db_scheme = "postgres" if db_port == "5432" else "mysql"

    query = ""
    if db_scheme.startswith("postgres"):
        ssl_mode = config("DB_SSLMODE", default="require" if os.getenv("RENDER") else "prefer")
        query = f"?sslmode={ssl_mode}"
    elif config("DB_SSL", default=False, cast=bool):
        query = "?ssl=true"

    return f"{db_scheme}://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}{query}"


def _split_csv(raw_value: str) -> list[str]:
    return [item.strip() for item in raw_value.split(",") if item.strip()]


DATABASE_URL = _build_database_url()
IS_POSTGRES = DATABASE_URL.startswith(("postgres://", "postgresql://"))
IS_MYSQL = DATABASE_URL.startswith("mysql://")
ENVIRONMENT = config("ENVIRONMENT", "production" if os.getenv("RENDER") else "development")
IS_PRODUCTION = ENVIRONMENT.lower() == "production"
DB_GENERATE_SCHEMAS = config("DB_GENERATE_SCHEMAS", not IS_PRODUCTION, cast=bool)
RUN_STARTUP_SCHEMA_SYNC = config("RUN_STARTUP_SCHEMA_SYNC", not IS_PRODUCTION, cast=bool)
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
