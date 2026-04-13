import logging

from tortoise import connections
from config import IS_MYSQL

logger = logging.getLogger(__name__)


async def ensure_ship_image_longtext() -> None:
    if not IS_MYSQL:
        logger.info("Skipping MySQL-specific ships.image sync for non-MySQL database")
        return
    connection = connections.get("default")
    rows = await connection.execute_query_dict(
        """
        SELECT DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'ships'
          AND COLUMN_NAME = 'image'
        """
    )

    if not rows:
        return

    current_type = str(rows[0].get("DATA_TYPE", "")).lower()
    if current_type == "longtext":
        return

    await connection.execute_script(
        "ALTER TABLE `ships` MODIFY COLUMN `image` LONGTEXT NOT NULL;"
    )
    logger.info("Updated ships.image column from %s to LONGTEXT", current_type)


async def ensure_user_status_column() -> None:
    if not IS_MYSQL:
        logger.info("Skipping MySQL-specific users.status sync for non-MySQL database")
        return
    connection = connections.get("default")
    rows = await connection.execute_query_dict(
        """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'status'
        """
    )

    if rows:
        return

    await connection.execute_script(
        """
        ALTER TABLE `users`
        ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active' AFTER `role`;
        """
    )
    logger.info("Added users.status column with default active")


async def ensure_ship_commission_rate_column() -> None:
    if not IS_MYSQL:
        logger.info("Skipping MySQL-specific ships.commission_rate sync for non-MySQL database")
        return
    connection = connections.get("default")
    rows = await connection.execute_query_dict(
        """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'ships'
          AND COLUMN_NAME = 'commission_rate'
        """
    )
    if rows:
        return

    await connection.execute_script(
        """
        ALTER TABLE `ships`
        ADD COLUMN `commission_rate` DOUBLE NOT NULL DEFAULT 0 AFTER `owner_id`;
        """
    )
    logger.info("Added ships.commission_rate column with default 0")


async def ensure_payment_split_columns() -> None:
    if not IS_MYSQL:
        logger.info("Skipping MySQL-specific payments sync for non-MySQL database")
        return
    connection = connections.get("default")
    rows = await connection.execute_query_dict(
        """
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'payments'
          AND COLUMN_NAME IN ('platform_commission_amount', 'shipowner_amount')
        """
    )
    existing_columns = {str(row.get("COLUMN_NAME", "")) for row in rows}

    if "platform_commission_amount" not in existing_columns:
        await connection.execute_script(
            """
            ALTER TABLE `payments`
            ADD COLUMN `platform_commission_amount` DOUBLE NOT NULL DEFAULT 0 AFTER `amount`;
            """
        )
        logger.info("Added payments.platform_commission_amount column with default 0")

    if "shipowner_amount" not in existing_columns:
        await connection.execute_script(
            """
            ALTER TABLE `payments`
            ADD COLUMN `shipowner_amount` DOUBLE NOT NULL DEFAULT 0 AFTER `platform_commission_amount`;
            """
        )
        logger.info("Added payments.shipowner_amount column with default 0")
