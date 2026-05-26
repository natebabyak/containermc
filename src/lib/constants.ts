export const HARDWARE_OPTIONS = [
	{
		name: 'X-Small',
		cpu: 2,
		memoryGb: 1,
		rate: 0.015,
		players: '1–2',
		tag: null
	},
	{
		name: 'Small',
		cpu: 2,
		memoryGb: 2,
		rate: 0.03,
		players: '2–5',
		tag: null
	},
	{
		name: 'Medium',
		cpu: 2,
		memoryGb: 4,
		rate: 0.06,
		players: '5–10',
		tag: 'Recommended'
	},
	{
		name: 'Large',
		cpu: 2,
		memoryGb: 8,
		rate: 0.12,
		players: '10–20',
		tag: null
	},
	{
		name: 'X-Large',
		cpu: 4,
		memoryGb: 16,
		rate: 0.24,
		players: '20–50',
		tag: null
	},
	{
		name: 'XX-Large',
		cpu: 8,
		memoryGb: 32,
		rate: 0.48,
		players: '50+',
		tag: null
	}
] as const;

export const MINECRAFT_VERSION_GROUPS = [
	{
		name: 'Latest',
		versions: ['LATEST', 'SNAPSHOT']
	},
	{
		name: '26',
		versions: ['26.1']
	},
	{
		name: '1.21',
		versions: [
			'1.21.11',
			'1.21.10',
			'1.21.9',
			'1.21.8',
			'1.21.7',
			'1.21.6',
			'1.21.5',
			'1.21.4',
			'1.21.3',
			'1.21.2',
			'1.21.1',
			'1.21'
		]
	},
	{
		name: '1.20',
		versions: ['1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20']
	},
	{
		name: '1.19',
		versions: ['1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19']
	},
	{
		name: '1.18',
		versions: ['1.18.2', '1.18.1', '1.18']
	},
	{
		name: '1.17',
		versions: ['1.17.1', '1.17']
	},
	{
		name: '1.16',
		versions: ['1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16']
	},
	{
		name: '1.15',
		versions: ['1.15.2', '1.15.1', '1.15']
	},
	{
		name: '1.14',
		versions: ['1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14']
	},
	{
		name: '1.13',
		versions: ['1.13.2', '1.13.1', '1.13']
	},
	{
		name: '1.12',
		versions: ['1.12.2', '1.12.1', '1.12']
	},
	{
		name: '1.11',
		versions: ['1.11.2', '1.11.1', '1.11']
	},
	{
		name: '1.10',
		versions: ['1.10.2', '1.10.1', '1.10']
	},
	{
		name: '1.9',
		versions: ['1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9']
	},
	{
		name: '1.8',
		versions: [
			'1.8.9',
			'1.8.8',
			'1.8.7',
			'1.8.6',
			'1.8.5',
			'1.8.4',
			'1.8.3',
			'1.8.2',
			'1.8.1',
			'1.8'
		]
	},
	{
		name: '1.7',
		versions: ['1.7.10', '1.7.9', '1.7.8', '1.7.7', '1.7.6', '1.7.5', '1.7.4', '1.7.2']
	},
	{
		name: '1.6',
		versions: ['1.6.4', '1.6.2', '1.6.1']
	},
	{
		name: '1.5',
		versions: ['1.5.2', '1.5.1', '1.5']
	},
	{
		name: '1.4',
		versions: ['1.4.7', '1.4.6', '1.4.5', '1.4.4', '1.4.2']
	},
	{
		name: '1.3',
		versions: ['1.3.2', '1.3.1']
	},
	{
		name: '1.2',
		versions: ['1.2.5', '1.2.4', '1.2.3', '1.2.2', '1.2.1']
	},
	{
		name: '1.1',
		versions: ['1.1']
	},
	{
		name: '1.0',
		versions: ['1.0.1', '1.0']
	}
] as const;

export const MINECRAFT_VERSIONS = [
	...MINECRAFT_VERSION_GROUPS.flatMap((group) => group.versions)
] as const;

export const SERVER_STATUSES = [
	'running',
	'starting',
	'pending',
	'stopping',
	'stopped',
	'error'
] as const;

export const SERVER_TYPES = [
	{
		value: 'AUTO_CURSEFORGE',
		label: 'CurseForge'
	},
	{
		value: 'BUKKIT',
		label: 'Bukkit'
	},
	{
		value: 'CRUCIBLE',
		label: 'Crucible'
	},
	{
		value: 'FABRIC',
		label: 'Fabric'
	},
	{
		value: 'FORGE',
		label: 'Forge'
	},
	{
		value: 'FTBA',
		label: 'Feed The Beast'
	},
	{
		value: 'GTNH',
		label: 'GregTech: New Horizons'
	},
	{
		value: 'LIMBO',
		label: 'Limbo'
	},
	{
		value: 'MODRINTH',
		label: 'Modrinth'
	},
	{
		value: 'NANOLIMBO',
		label: 'NanoLimbo'
	},
	{
		value: 'NEOFORGE',
		label: 'NeoForge'
	},
	{
		value: 'PAPER',
		label: 'PaperMC'
	},
	{
		value: 'QUILT',
		label: 'QuiltMC'
	},
	{
		value: 'SPIGOT',
		label: 'SpigotMC'
	},
	{
		value: 'SPONGEVANILLA',
		label: 'SpongeVanilla'
	},
	{
		value: 'VANILLA',
		label: 'Vanilla'
	}
] as const;
