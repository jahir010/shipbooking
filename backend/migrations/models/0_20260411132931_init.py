from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `users` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(6) NOT NULL  DEFAULT CURRENT_TIMESTAMP(6)
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `ships` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `operator` VARCHAR(255) NOT NULL,
    `image` LONGTEXT NOT NULL,
    `description` LONGTEXT NOT NULL,
    `rating` DOUBLE NOT NULL,
    `review_count` INT NOT NULL,
    `created_at` DATETIME(6) NOT NULL  DEFAULT CURRENT_TIMESTAMP(6),
    `owner_id` INT NOT NULL,
    CONSTRAINT `fk_ships_users_4fdba42c` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `cabins` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `number` VARCHAR(10) NOT NULL,
    `capacity` INT NOT NULL,
    `base_price` DOUBLE NOT NULL,
    `amenities` JSON NOT NULL,
    `ship_id` INT NOT NULL,
    CONSTRAINT `fk_cabins_ships_045a2ee9` FOREIGN KEY (`ship_id`) REFERENCES `ships` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `rating` INT NOT NULL,
    `comment` LONGTEXT NOT NULL,
    `created_at` DATETIME(6) NOT NULL  DEFAULT CURRENT_TIMESTAMP(6),
    `ship_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    CONSTRAINT `fk_reviews_ships_4eb3a51e` FOREIGN KEY (`ship_id`) REFERENCES `ships` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reviews_users_8aed0759` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `routes` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `departure_port` VARCHAR(255) NOT NULL,
    `destination_port` VARCHAR(255) NOT NULL,
    `departure_time` VARCHAR(10) NOT NULL,
    `arrival_time` VARCHAR(10) NOT NULL,
    `duration` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `seats_available` INT NOT NULL,
    `total_seats` INT NOT NULL,
    `base_price` DOUBLE NOT NULL,
    `status` VARCHAR(20) NOT NULL  DEFAULT 'active',
    `created_at` DATETIME(6) NOT NULL  DEFAULT CURRENT_TIMESTAMP(6),
    `ship_id` INT NOT NULL,
    CONSTRAINT `fk_routes_ships_9c58cd23` FOREIGN KEY (`ship_id`) REFERENCES `ships` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `total_price` DOUBLE NOT NULL,
    `status` VARCHAR(20) NOT NULL  DEFAULT 'pending',
    `passengers` JSON NOT NULL,
    `created_at` DATETIME(6) NOT NULL  DEFAULT CURRENT_TIMESTAMP(6),
    `route_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    CONSTRAINT `fk_bookings_routes_e6a4bacc` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_bookings_users_4e9f0922` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `payments` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL,
    `method` VARCHAR(50) NOT NULL DEFAULT 'sslcommerz',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
    `session_key` VARCHAR(255),
    `gateway_reference` VARCHAR(255),
    `gateway_payload` JSON,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `booking_id` INT NOT NULL,
    CONSTRAINT `fk_payments_bookings_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `booking_items` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `cabin_type` VARCHAR(50) NOT NULL,
    `cabin_number` VARCHAR(10) NOT NULL,
    `quantity` INT NOT NULL,
    `price_per_unit` DOUBLE NOT NULL,
    `booking_id` INT NOT NULL,
    `cabin_id` INT NOT NULL,
    CONSTRAINT `fk_booking__bookings_7e8ef995` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_booking__cabins_25ef458f` FOREIGN KEY (`cabin_id`) REFERENCES `cabins` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
CREATE TABLE IF NOT EXISTS `aerich` (
    `id` INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `version` VARCHAR(255) NOT NULL,
    `app` VARCHAR(100) NOT NULL,
    `content` JSON NOT NULL
) CHARACTER SET utf8mb4;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
