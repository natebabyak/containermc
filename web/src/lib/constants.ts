export const AWS_REGIONS = [
	{
		code: 'us-east-1',
		name: 'US East (N. Virginia)',
		geography: 'United States of America'
	},
	{
		code: 'us-east-2',
		name: 'US East (Ohio)',
		geography: 'United States of America'
	},
	{
		code: 'us-west-1',
		name: 'US West (N. California)',
		geography: 'United States of America'
	},
	{
		code: 'us-west-2',
		name: 'US West (Oregon)',
		geography: 'United States of America'
	},
	{
		code: 'ap-southeast-1',
		name: 'Asia Pacific (Mumbai)',
		geography: 'India'
	},
	{
		code: 'ap-southeast-2',
		name: 'Asia Pacific (Osaka)',
		geography: 'Japan'
	},
	{
		code: 'ap-southeast-3',
		name: 'Asia Pacific (Seoul)',
		geography: 'South Korea'
	},
	{
		code: 'ap-southeast-4',
		name: 'Asia Pacific (Singapore)',
		geography: 'Singapore'
	},
	{
		code: 'ap-south-1',
		name: 'Asia Pacific (Sydney)',
		geography: 'Australia'
	},
	{
		code: 'ap-northeast-1',
		name: 'Asia Pacific (Tokyo)',
		geography: 'Japan'
	},
	{
		code: 'ca-central-1',
		name: 'Canada (Central)',
		geography: 'Canada'
	},
	{
		code: 'eu-central-1',
		name: 'Europe (Frankfurt)',
		geography: 'Germany'
	},
	{
		code: 'eu-west-1',
		name: 'Europe (Ireland)',
		geography: 'Ireland'
	},
	{
		code: 'eu-west-2',
		name: 'Europe (London)',
		geography: 'United Kingdom'
	},
	{
		code: 'eu-west-3',
		name: 'Europe (Paris)',
		geography: 'France'
	},
	{
		code: 'eu-north-1',
		name: 'Europe (Stockholm)',
		geography: 'Sweden'
	},
	{
		code: 'sa-east-1',
		name: 'South America (São Paulo)',
		geography: 'Brazil'
	}
];

export const CURRENCIES = [
	'usd',
	'eur',
	'jpy',
	'gbp',
	'aud',
	'cad',
	'sgd',
	'inr',
	'krw',
	'sek',
	'brl'
] as const;

export const HARDWARE_OPTIONS = [
	{
		name: 'Small',
		instanceTypes: ['c8g.medium', 'c7g.medium', 'c6g.medium'],
		hourlyRate: 0.05,
		vcpu: 1,
		memory: 2,
		recommendedNumPlayers: {
			min: 1,
			max: 10
		},
		tag: null
	},
	{
		name: 'Medium',
		instanceTypes: ['c8g.large', 'c7g.large', 'c6g.large'],
		hourlyRate: 0.1,
		vcpu: 2,
		memory: 4,
		recommendedNumPlayers: {
			min: 10,
			max: 20
		},
		tag: 'Recommended'
	},
	{
		name: 'Large',
		instanceTypes: ['c8g.xlarge', 'c7g.xlarge', 'c6g.xlarge'],
		hourlyRate: 0.2,
		vcpu: 4,
		memory: 8,
		recommendedNumPlayers: {
			min: 20,
			max: 50
		},
		tag: null
	},
	{
		name: 'X-Large',
		instanceTypes: ['c8g.2xlarge', 'c7g.2xlarge', 'c6g.2xlarge'],
		hourlyRate: 0.4,
		vcpu: 8,
		memory: 16,
		recommendedNumPlayers: {
			min: 50,
			max: 100
		},
		tag: null
	},
	{
		name: 'XX-Large',
		instanceTypes: ['c8g.4xlarge', 'c7g.4xlarge', 'c6g.4xlarge'],
		hourlyRate: 0.8,
		vcpu: 16,
		memory: 32,
		recommendedNumPlayers: {
			min: 100,
			max: null
		},
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
		versions: ['26.2', '26.1.2', '26.1.1', '26.1']
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

export const MINECRAFT_SERVER_STATUSES = [
	'stopped',
	'starting',
	'running',
	'stopping',
	'error'
] as const;

export const MINECRAFT_SERVER_TYPES = [
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
