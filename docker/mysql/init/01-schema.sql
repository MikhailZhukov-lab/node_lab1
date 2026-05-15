CREATE DATABASE IF NOT EXISTS `lab_10_inventory`;
CREATE DATABASE IF NOT EXISTS `lab_10_inventory_test`;

USE `lab_10_inventory`;

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `quantity` int NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `category` varchar(100) NOT NULL DEFAULT '',
  `image` varchar(255) DEFAULT NULL,
  `discount` int NOT NULL DEFAULT 0,
  CONSTRAINT `inventory_items_id` PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  CONSTRAINT `users_id` PRIMARY KEY (`id`),
  CONSTRAINT `users_email_unique` UNIQUE (`email`)
);

USE `lab_10_inventory_test`;

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `quantity` int NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `category` varchar(100) NOT NULL DEFAULT '',
  `image` varchar(255) DEFAULT NULL,
  `discount` int NOT NULL DEFAULT 0,
  CONSTRAINT `inventory_items_id` PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  CONSTRAINT `users_id` PRIMARY KEY (`id`),
  CONSTRAINT `users_email_unique` UNIQUE (`email`)
);
