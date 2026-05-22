export const HARDWARE_MAP = {
	'0.25': { min: 1, max: 2, step: 1 },
	'0.5': { min: 1, max: 4, step: 1 },
	'1': { min: 2, max: 8, step: 1 },
	'2': { min: 4, max: 16, step: 1 },
	'4': { min: 8, max: 30, step: 1 },
	'8': { min: 16, max: 60, step: 4 },
	'16': { min: 32, max: 120, step: 8 }
} as const;

export const HARDWARE_PRESETS = [
	{
		name: 'XS',
		cpu: '2',
		memory: 1,
		rate: 0.01
	},
	{
		name: 'Small',
		cpu: '2',
		memory: 2,
		rate: 0.02
	},
	{
		name: 'Medium',
		cpu: '2',
		memory: 4,
		rate: 0.04
	},
	{
		name: 'Large',
		cpu: '2',
		memory: 8,
		rate: 0.08
	},
	{
		name: 'XL',
		cpu: '4',
		memory: 16,
		rate: 0.16
	},
	{
		name: '2XL',
		cpu: '8',
		memory: 32,
		rate: 0.32
	}
] as const;

export const SERVER_TYPES = [
	'AUTO_CURSEFORGE',
	'BUKKIT',
	'CRUCIBLE',
	'FABRIC',
	'FORGE',
	'FTBA',
	'GTNH',
	'LIMBO',
	'MODRINTH',
	'NANOLIMBO',
	'PAPER',
	'QUILT',
	'SPIGOT',
	'SPONGEVANILLA',
	'VANILLA'
] as const;

export const MINECRAFT_VERSIONS = [
	'LATEST',
	'SNAPSHOT',
	'26.1',
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
	'1.21',
	'1.20.6',
	'1.20.5',
	'1.20.4',
	'1.20.3',
	'1.20.2',
	'1.20.1',
	'1.20',
	'1.19.4',
	'1.19.3',
	'1.19.2',
	'1.19.1',
	'1.19'
] as const;
