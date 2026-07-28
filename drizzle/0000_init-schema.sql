CREATE TABLE `cameras` (
	`device_id` text PRIMARY KEY NOT NULL,
	`recording` integer NOT NULL,
	`motion_detected` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `device_events` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`type` text NOT NULL,
	`before_image` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "device_events_type_check" CHECK(type IN ('registered', 'state_changed', 'details_changed', 'deleted'))
);
--> statement-breakpoint
CREATE INDEX `device_events_device_created_idx` ON `device_events` (`device_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`manufacturer` text NOT NULL,
	`model` text NOT NULL,
	`serial_number` text NOT NULL,
	`firmware_version` text,
	`room` text,
	`registered_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "devices_type_check" CHECK(type IN ('light', 'thermostat', 'camera'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_manufacturer_serial_unique` ON `devices` (`manufacturer`,`serial_number`) WHERE deleted_at IS NULL;--> statement-breakpoint
CREATE TABLE `lights` (
	`device_id` text PRIMARY KEY NOT NULL,
	`is_on` integer NOT NULL,
	`brightness` integer NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lights_brightness_check" CHECK(brightness BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE `thermostats` (
	`device_id` text PRIMARY KEY NOT NULL,
	`target_temp` real NOT NULL,
	`current_temp` real NOT NULL,
	`mode` text NOT NULL,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "thermostats_target_temp_check" CHECK(target_temp BETWEEN 5 AND 30),
	CONSTRAINT "thermostats_mode_check" CHECK(mode IN ('heat', 'cool', 'off'))
);
