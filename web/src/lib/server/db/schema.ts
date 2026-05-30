import {
	pgTable,
	text,
	uuid,
	timestamp,
	pgEnum,
	integer,
	numeric,
	boolean,
	index,
	bigint
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { CURRENCIES, MODES, SERVER_STATUSES } from '$lib/constants';
import { user } from './auth.schema';

export const currencyEnum = pgEnum('currency', CURRENCIES);
export const modeEnum = pgEnum('mode', MODES);
export const serverStatusEnum = pgEnum('server_status', SERVER_STATUSES);

export const userBalance = pgTable('user_balance', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	amountDollars: numeric('amount_dollars', { precision: 10, scale: 4 }).notNull().default('0'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const userSettings = pgTable('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	currency: currencyEnum('currency').notNull().default('usd'),
	mode: modeEnum('mode').notNull().default('system'),
	autoRechargeEnabled: boolean('auto_recharge_enabled').notNull().default(false),
	autoRechargeAmountDollars: numeric('auto_recharge_amount_dollars', { precision: 10, scale: 4 }),
	autoRechargeThresholdDollars: numeric('auto_recharge_threshold_dollars', {
		precision: 10,
		scale: 4
	}),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const minecraftServer = pgTable('minecraft_server', {
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
		.$onUpdate(() => new Date()),
	deletedAt: timestamp('deleted_at')
});

export const serverMod = pgTable(
	'server_mod',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		modrinthProjectId: text('modrinth_project_id').notNull(),
		modrinthVersionId: text('modrinth_version_id').notNull(),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('server_mod_minecraft_server_id_idx').on(table.minecraftServerId)]
);

export const serverSession = pgTable(
	'server_session',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		region: text('region').notNull(),
		cpu: integer('cpu').notNull(),
		memoryGb: integer('memory_gb').notNull(),
		startedAt: timestamp('started_at').notNull().defaultNow(),
		stoppedAt: timestamp('stopped_at'),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' })
	},
	(table) => [index('server_session_minecraft_server_id_idx').on(table.minecraftServerId)]
);

export const serverBackup = pgTable(
	'server_backup',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		s3ObjectKey: text('s3_object_key').notNull(),
		sizeBytes: bigint('size_bytes', { mode: 'bigint' }).notNull(),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('server_backup_minecraft_server_id_idx').on(table.minecraftServerId)]
);

export const serverSnapshot = pgTable(
	'server_snapshot',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		cpuUsagePct: numeric('cpu_usage_pct', { precision: 5, scale: 2 }).notNull(),
		memoryUsagePct: numeric('memory_usage_pct', { precision: 5, scale: 2 }).notNull(),
		numPlayers: integer('num_players').notNull(),
		tps: numeric('tps', { precision: 4, scale: 2 }).notNull(),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('server_snapshot_minecraft_server_id_idx').on(table.minecraftServerId)]
);

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

export const minecraftServerRelations = relations(minecraftServer, ({ one, many }) => ({
	user: one(user, {
		fields: [minecraftServer.userId],
		references: [user.id]
	}),
	mods: many(serverMod),
	sessions: many(serverSession),
	backups: many(serverBackup),
	snapshots: many(serverSnapshot)
}));

export const serverModRelations = relations(serverMod, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [serverMod.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export const serverSessionRelations = relations(serverSession, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [serverSession.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export const serverBackupRelations = relations(serverBackup, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [serverBackup.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export const serverSnapshotRelations = relations(serverSnapshot, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [serverSnapshot.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export * from './auth.schema';
