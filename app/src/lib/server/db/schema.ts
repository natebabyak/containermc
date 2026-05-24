import { pgTable, text, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { relations } from 'drizzle-orm';
import { MINECRAFT_VERSION_GROUPS, SERVER_TYPES } from '$lib/constants';

export const serverStatusEnum = pgEnum('server_status', ['']);
export const minecraftVersionEnum = pgEnum('minecraft_version', );
export const serverTypeEnum = pgEnum('server_type', SERVER_TYPES);

export const server = pgTable('server', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	minecraftVersion: minecraftVersionEnum('minecraft_version').notNull(),
	serverType: serverTypeEnum('server_type').notNull(),
	region: text('region').notNull(),
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
		.references(() => server.id, { onDelete: 'cascade' })
});

export const backup = pgTable('backup', {
	id: uuid('id').primaryKey().defaultRandom(),
	serverId: text('server_id')
		.notNull()
		.references(() => server.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const serverRelations = relations(server, ({ one }) => ({
	user: one(user, {
		fields: [server.userId],
		references: [user.id]
	})
}));

export * from './auth.schema';
