from decouple import config

DATABASE_URL = f"mysql://{config('DB_USER', 'root')}:{config('DB_PASSWORD', 'root')}@{config('DB_HOST', 'localhost')}:{config('DB_PORT', '3306')}/{config('DB_NAME', 'shipbooking')}"
APP_URL = config("APP_URL", "http://localhost:3000")
API_PUBLIC_BASE_URL = config("API_PUBLIC_BASE_URL", "http://localhost:8000/api")

SSLCOMMERZ_STORE_ID = config("SSLCOMMERZ_STORE_ID", "")
SSLCOMMERZ_STORE_PASSWORD = config("SSLCOMMERZ_STORE_PASSWORD", "")
SSLCOMMERZ_SANDBOX_MODE = config("SSLCOMMERZ_SANDBOX_MODE", True, cast=bool)

EMAIL_HOST = config("EMAIL_HOST", "")
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
