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
	amountUsd: numeric('amount_usd', { precision: 10, scale: 2 }).notNull().default('0'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const userSettings = pgTable('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	currency: text('currency').notNull().default('USD'),
	mode: text('mode').notNull().default('system'),
	autoRechargeEnabled: boolean('auto_recharge_enabled').notNull().default(false),
	autoRechargeAmountUsd: numeric('auto_recharge_amount_usd', { precision: 10, scale: 2 }),
	autoRechargeThresholdUsd: numeric('auto_recharge_threshold_usd', { precision: 10, scale: 2 }),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const server = pgTable('server', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	slug: text('slug').notNull().unique(),
	iconUrl: text('icon_url'),
	status: serverStatusEnum('status').notNull().default('stopped'),
	minecraftVersion: text('minecraft_version').notNull(),
	type: text('type').notNull(),
	region: text('region').notNull(),
	cpu: integer('cpu').notNull(),
	memoryGb: integer('memory_gb').notNull(),
	arn: text('arn'),
	autoStopEnabled: boolean('auto_stop_enabled').notNull().default(true),
	autoStopTimeoutMinutes: integer('auto_stop_timeout_minutes').notNull().default(15),
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
	hardware: text('hardware').notNull(),
	cpu: integer('cpu').notNull(),
	memoryGb: integer('memory_gb').notNull(),
	hourlyRateUsd: numeric('hourly_rate_usd', { precision: 10, scale: 4 }).notNull(),
	startedAt: timestamp('started_at').notNull().defaultNow(),
	stoppedAt: timestamp('stopped_at'),
	costUsd: numeric('cost_usd', { precision: 10, scale: 4 }),
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

export const userBalanceRelations = relations(userBalance, ({ one }) => ({
	user: one(user, {
		fields: [userBalance.userId],
		references: [user.id]
	})
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(user, {
		fields: [userSettings.userId],
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
