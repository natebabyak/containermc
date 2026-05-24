import {
	pgTable,
	text,
	uuid,
	timestamp,
	pgEnum,
	integer,
	numeric,
	boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { SERVER_STATUSES } from '$lib/constants';
import { user } from './auth.schema';

export const serverStatusEnum = pgEnum('server_status', SERVER_STATUSES);

export const userBalance = pgTable('user_balance', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	balanceDollars: numeric('balance_dollars').notNull().default('0'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const userSettings = pgTable('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	autoDeposit: boolean('auto_deposit').notNull().default(false),
	autoDepositThreshold: numeric('auto_deposit_threshold'),
	autoDepositAmountDollars: numeric('auto_deposit_amount_dollars'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const server = pgTable('server', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	status: serverStatusEnum('status').notNull().default('stopped'),
	minecraftVersion: text('minecraft_version').notNull(),
	type: text('type').notNull(),
	region: text('region').notNull(),
	cpu: integer('cpu').notNull(),
	memoryGb: integer('memory_gb').notNull(),
	arn: text('arn'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

export const serverMod = pgTable('server_mod', {
	id: uuid('id').primaryKey().defaultRandom(),
	modrinthProjectId: text('modrinth_project_id').notNull(),
	modrinthVersionId: text('modrinth_version_id').notNull(),
	serverId: uuid('server_id')
		.notNull()
		.references(() => server.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const serverSession = pgTable('server_session', {
	id: uuid('id').primaryKey().defaultRandom(),
	region: text('region').notNull(),
	cpu: integer('cpu').notNull(),
	memoryGb: integer('memory_gb').notNull(),
	startedAt: timestamp('started_at').notNull().defaultNow(),
	stoppedAt: timestamp('stopped_at'),
	serverId: uuid('server_id')
		.notNull()
		.references(() => server.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const backup = pgTable('backup', {
	id: uuid('id').primaryKey().defaultRandom(),
	s3ObjectKey: text('s3_object_key').notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	serverId: uuid('server_id')
		.notNull()
		.references(() => server.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const userBalanceRelations = relations(user, ({ one }) => ({
	user: one(user, {
		fields: [user.id],
		references: [user.id]
	})
}));

export const userSettingsRelations = relations(user, ({ one }) => ({
	user: one(user, {
		fields: [user.id],
		references: [user.id]
	})
}));

export const serverRelations = relations(server, ({ one, many }) => ({
	user: one(user, {
		fields: [server.userId],
		references: [user.id]
	}),
	mods: many(serverMod),
	session: many(serverSession),
	backups: many(backup)
}));

export const serverModRelations = relations(serverMod, ({ one }) => ({
	server: one(server, {
		fields: [serverMod.serverId],
		references: [server.id]
	})
}));

export const serverSessionRelations = relations(serverSession, ({ one }) => ({
	server: one(server, {
		fields: [serverSession.serverId],
		references: [server.id]
	}),
	user: one(user, {
		fields: [serverSession.userId],
		references: [user.id]
	})
}));

export const backupRelations = relations(backup, ({ one }) => ({
	server: one(server, {
		fields: [backup.serverId],
		references: [server.id]
	})
}));

export * from './auth.schema';
