CREATE TABLE `consideration_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
