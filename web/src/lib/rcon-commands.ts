export type RconCommand = {
	name: string;
	description: string;
	usage: string;
};

/** Commands verified to work via RCON on itzg/minecraft-server (vanilla/Paper). */
export const RCON_COMMANDS: RconCommand[] = [
	{ name: 'list', description: 'List online players', usage: 'list' },
	{ name: 'say', description: 'Broadcast a message to all players', usage: 'say <message>' },
	{ name: 'help', description: 'Show available commands', usage: 'help [page|command]' },
	{ name: 'tps', description: 'Show server ticks per second', usage: 'tps' },
	{ name: 'kick', description: 'Remove a player from the server', usage: 'kick <player> [reason]' },
	{ name: 'ban', description: 'Ban a player from the server', usage: 'ban <player> [reason]' },
	{ name: 'pardon', description: 'Remove a player ban', usage: 'pardon <player>' },
	{ name: 'banlist', description: 'Show banned players', usage: 'banlist' },
	{ name: 'op', description: 'Grant operator status', usage: 'op <player>' },
	{ name: 'deop', description: 'Revoke operator status', usage: 'deop <player>' },
	{ name: 'whitelist', description: 'Manage the player whitelist', usage: 'whitelist <on|off|list|add|remove|reload>' },
	{ name: 'gamemode', description: 'Set a player game mode', usage: 'gamemode <mode> [player]' },
	{ name: 'tp', description: 'Teleport players', usage: 'tp <target> [<destination>]' },
	{ name: 'time', description: 'Change or query world time', usage: 'time <set|add|query> <value>' },
	{ name: 'weather', description: 'Change the weather', usage: 'weather <clear|rain|thunder> [duration]' },
	{ name: 'difficulty', description: 'Set the world difficulty', usage: 'difficulty <peaceful|easy|normal|hard>' },
	{ name: 'gamerule', description: 'Set or query a game rule', usage: 'gamerule <rule> [value]' },
	{ name: 'seed', description: 'Show the world seed', usage: 'seed' },
	{ name: 'save-all', description: 'Save the world to disk', usage: 'save-all' },
	{ name: 'save-off', description: 'Disable automatic saving', usage: 'save-off' },
	{ name: 'save-on', description: 'Enable automatic saving', usage: 'save-on' },
	{ name: 'stop', description: 'Stop the server gracefully', usage: 'stop' }
];

const ALLOWED_COMMAND_NAMES = new Set(RCON_COMMANDS.map((command) => command.name));

export function getCommandFilter(value: string): string {
	const normalized = value.startsWith('/') ? value.slice(1) : value;
	return normalized.split(' ')[0] ?? '';
}

export function normalizeRconCommand(value: string): string {
	return value.trim().replace(/^\//, '');
}

export function getRconCommandName(command: string): string {
	return normalizeRconCommand(command).split(/\s+/)[0]?.toLowerCase() ?? '';
}

export function isAllowedRconCommand(command: string): boolean {
	const name = getRconCommandName(command);
	return name.length > 0 && ALLOWED_COMMAND_NAMES.has(name);
}
