CREATE TABLE IF NOT EXISTS `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT '',
	`quantity` int NOT NULL DEFAULT 0,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`category` varchar(100) NOT NULL DEFAULT '',
	`image` varchar(255) DEFAULT null,
	`discount` int NOT NULL DEFAULT 0,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`)
);
