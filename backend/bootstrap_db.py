import asyncio
import logging

from tortoise import Tortoise, connections

from config import TORTOISE_ORM
from schema_sync import (
    ensure_payment_split_columns,
    ensure_ship_commission_rate_column,
    ensure_ship_image_longtext,
    ensure_user_status_column,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def bootstrap_database() -> None:
    logger.info("Initializing database connection")
    await Tortoise.init(config=TORTOISE_ORM)

    logger.info("Creating missing tables")
    await Tortoise.generate_schemas()

    logger.info("Applying schema compatibility updates")
    await ensure_ship_image_longtext()
    await ensure_user_status_column()
    await ensure_ship_commission_rate_column()
    await ensure_payment_split_columns()

    logger.info("Database bootstrap completed successfully")


async def main() -> None:
    try:
        await bootstrap_database()
    finally:
        await connections.close_all()


if __name__ == "__main__":
    asyncio.run(main())
