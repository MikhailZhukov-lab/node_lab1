import { decimal, int, mysqlTable, varchar } from 'drizzle-orm/mysql-core';

const inventoryItems = mysqlTable('inventory_items', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().default(''),
  quantity: int('quantity').notNull().default(0),
  price: decimal('price', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  category: varchar('category', { length: 100 }).notNull().default(''),
  image: varchar('image', { length: 255 }).default(null),
  discount: int('discount').notNull().default(0),
});

const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
});

export { inventoryItems, users };
