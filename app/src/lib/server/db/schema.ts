import { pgTable, text, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { relations } from 'drizzle-orm';

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

export const serverSession = pgTable('server_session', {
  id: uuid('id').primaryKey().defaultRandom(),
	startedAt: timestamp('started_at').defaultNow().notNull(),
	endedAt: timestamp('ended_at'),
	serverId: text('server_id')
		.notNull()
		.references(() => server.id, { onDelete: 'cascade' }),
	
});

export const serverRelations = relations(server, ({ one }) => ({
	user: one(user, {
		fields: [server.userId],
		references: [user.id]
	})
}));

export * from './auth.schema';
