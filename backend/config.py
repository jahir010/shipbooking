from decouple import config

DATABASE_URL = f"mysql://{config('DB_USER', 'root')}:{config('DB_PASSWORD', 'root')}@{config('DB_HOST', 'localhost')}:{config('DB_PORT', '3306')}/{config('DB_NAME', 'shipbooking')}"

TORTOISE_ORM = {
    "connections": {"default": DATABASE_URL},
    "apps": {
        "models": {
            "models": ["models", "aerich.models"],
            "default_connection": "default",
        },
    },
}
