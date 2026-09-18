CREATE TABLE `admin_account` (
	`username` text PRIMARY KEY NOT NULL,
	`password_hash` text NOT NULL,
	`must_change` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`failures` integer DEFAULT 0 NOT NULL,
	`locked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`question_hu` text NOT NULL,
	`question_en` text NOT NULL,
	`answer_hu` text NOT NULL,
	`answer_en` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`service` text NOT NULL,
	`caption_hu` text NOT NULL,
	`caption_en` text NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`version` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `previous_treatment` text DEFAULT 'not_recorded' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `previous_details` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookings` ADD `referral` text DEFAULT '' NOT NULL;