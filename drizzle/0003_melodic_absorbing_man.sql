CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`provider_id` text,
	`first_attempt` integer,
	`locked_until` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_email_booking` ON `email_outbox` (`booking_id`);--> statement-breakpoint
CREATE TABLE `time_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`date_from` text NOT NULL,
	`date_to` text NOT NULL,
	`start` integer DEFAULT 0 NOT NULL,
	`end` integer DEFAULT 1440 NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_blocks_dates` ON `time_blocks` (`date_from`,`date_to`);--> statement-breakpoint
CREATE TABLE `weekly_hours` (
	`weekday` integer PRIMARY KEY NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `language` text DEFAULT 'hu' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `status_event` text DEFAULT '' NOT NULL;