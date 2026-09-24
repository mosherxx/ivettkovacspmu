ALTER TABLE `admin_account` ADD `reset_hash` text;--> statement-breakpoint
ALTER TABLE `admin_account` ADD `reset_expires` integer;--> statement-breakpoint
ALTER TABLE `admin_account` ADD `reset_version` integer;--> statement-breakpoint
ALTER TABLE `admin_account` ADD `reset_requested` integer DEFAULT 0 NOT NULL;