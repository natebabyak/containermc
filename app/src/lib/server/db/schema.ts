import { pgTable, text, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const server = pgTable('server', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	properties: jsonb('properties').default({}).notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.$onUpdate(() => new Date())
		.notNull()
});

export * from './auth.schema';
