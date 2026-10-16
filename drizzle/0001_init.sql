CREATE TABLE IF NOT EXISTS `rescue_offers` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `provider_name` text NOT NULL,
  `provider_type` text NOT NULL,
  `category` text NOT NULL,
  `description` text NOT NULL,
  `city` text NOT NULL,
  `pickup_area` text NOT NULL,
  `offer_type` text NOT NULL,
  `discount_percent` integer,
  `quantity` text NOT NULL DEFAULT '1 bolsa',
  `contact` text NOT NULL DEFAULT '',
  `expires_at` integer NOT NULL,
  `is_reserved` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL
);
