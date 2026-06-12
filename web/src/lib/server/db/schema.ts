import {
	pgTable,
	text,
	uuid,
	timestamp,
	pgEnum,
	integer,
	numeric,
	index,
	bigint,
	jsonb,
	boolean
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organization, user } from './auth.schema';
import { MINECRAFT_SERVER_STATUSES } from '$lib/constants';

export const minecraftServerStatusEnum = pgEnum('server_status', MINECRAFT_SERVER_STATUSES);

export const userSettings = pgTable('user_settings', {
	userId: text('user_id')
		.primaryKey()
		.references(() => user.id, { onDelete: 'cascade' }),
	currency: text('currency').notNull().default('usd'),
	mode: text('mode').notNull().default('system'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const organizationBalance = pgTable('organization_balance', {
	organizationId: text('organization_id')
		.primaryKey()
		.references(() => organization.id, { onDelete: 'cascade' }),
	amountDollars: numeric('amount_dollars', { precision: 12, scale: 6 }).notNull().default('0'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const organizationSettings = pgTable('organization_settings', {
	organizationId: text('organization_id')
		.primaryKey()
		.references(() => organization.id, { onDelete: 'cascade' }),
	autoRechargeEnabled: boolean('auto_recharge_enabled').notNull().default(false),
	autoRechargeAmount: numeric('auto_recharge_amount', { precision: 12, scale: 6 })
		.notNull()
		.default('5'),
	autoRechargeThreshold: numeric('auto_recharge_threshold', { precision: 12, scale: 6 })
		.notNull()
		.default('0'),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});

export const minecraftServer = pgTable(
	'minecraft_server',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		name: text('name').notNull(),
		slug: text('slug').notNull().unique(),
		status: minecraftServerStatusEnum('status').notNull().default('stopped'),
		regionCode: text('region_code').notNull(),
		hardwareName: text('hardware_name').notNull(),
		type: text('type').notNull(),
		minecraftVersion: text('minecraft_version').notNull(),
		iconUrl: text('icon_url'),
		motd: text('motd'),
		instanceId: text('instance_id'),
		ipAddress: text('ip_address'),
		dashboardConfig: jsonb('dashboard_config').notNull().default({}),
		autoStartConfig: jsonb('auto_start_config').notNull().default({}),
		autoStopConfig: jsonb('auto_stop_config').notNull().default({}),
		organizationId: text('organization_id')
			.notNull()
			.references(() => organization.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow(),
		updatedAt: timestamp('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
		deletedAt: timestamp('deleted_at')
	},
	(table) => [index('minecraft_server_organization_id_idx').on(table.organizationId)]
);

export const minecraftServerMod = pgTable(
	'minecraft_server_mod',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		modrinthProjectId: text('modrinth_project_id').notNull(),
		modrinthVersionId: text('modrinth_version_id').notNull(),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('minecraft_server_mod_minecraft_server_id_idx').on(table.minecraftServerId)]
);

export const minecraftServerSession = pgTable(
	'minecraft_server_session',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		regionCode: text('region_code').notNull(),
		instanceType: text('instance_type').notNull(),
		startedAt: timestamp('started_at').notNull().defaultNow(),
		endedAt: timestamp('ended_at'),
		costDollars: numeric('cost_dollars', { precision: 12, scale: 6 }),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' })
	},
	(table) => [index('minecraft_server_session_minecraft_server_id_idx').on(table.minecraftServerId)]
);

export const minecraftServerBackup = pgTable(
	'minecraft_server_backup',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		s3ObjectKey: text('s3_object_key').notNull(),
		sizeBytes: bigint('size_bytes', { mode: 'bigint' }).notNull(),
		minecraftServerId: uuid('minecraft_server_id')
			.notNull()
			.references(() => minecraftServer.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(table) => [index('minecraft_server_backup_minecraft_server_id_idx').on(table.minecraftServerId)]
);

export const minecraftServerSnapshot = pgTable(
	'minecraft_server_snapshot',
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
	(table) => [
		index('minecraft_server_snapshot_minecraft_server_id_idx').on(table.minecraftServerId)
	]
);

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	user: one(user, {
		fields: [userSettings.userId],
		references: [user.id]
	})
}));

export const organizationBalanceRelations = relations(organizationBalance, ({ one }) => ({
	user: one(user, {
		fields: [organizationBalance.organizationId],
		references: [user.id]
	})
}));

export const organizationSettingsRelations = relations(organizationSettings, ({ one }) => ({
	organization: one(organization, {
		fields: [organizationSettings.organizationId],
		references: [organization.id]
	})
}));

export const minecraftServerRelations = relations(minecraftServer, ({ one, many }) => ({
	organization: one(organization, {
		fields: [minecraftServer.organizationId],
		references: [organization.id]
	}),
	mods: many(minecraftServerMod),
	sessions: many(minecraftServerSession),
	backups: many(minecraftServerBackup),
	snapshots: many(minecraftServerSnapshot)
}));

export const minecraftServerModRelations = relations(minecraftServerMod, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [minecraftServerMod.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export const minecraftServerSessionRelations = relations(minecraftServerSession, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [minecraftServerSession.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export const minecraftServerBackupRelations = relations(minecraftServerBackup, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [minecraftServerBackup.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export const minecraftServerSnapshotRelations = relations(minecraftServerSnapshot, ({ one }) => ({
	server: one(minecraftServer, {
		fields: [minecraftServerSnapshot.minecraftServerId],
		references: [minecraftServer.id]
	})
}));

export * from './auth.schema';
