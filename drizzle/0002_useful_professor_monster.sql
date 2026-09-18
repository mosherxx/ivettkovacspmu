CREATE TABLE `service_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`hu` text NOT NULL,
	`en` text DEFAULT '' NOT NULL,
	`price` integer NOT NULL,
	`description_hu` text DEFAULT '' NOT NULL,
	`description_en` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `booked_price` integer;--> statement-breakpoint
ALTER TABLE `bookings` ADD `service_name` text DEFAULT '' NOT NULL;