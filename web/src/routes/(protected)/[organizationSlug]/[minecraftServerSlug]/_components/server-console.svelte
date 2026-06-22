<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { onMount } from 'svelte';
	import {
		getCommandFilter,
		normalizeRconCommand,
		RCON_COMMANDS
	} from '$lib/rcon-commands';

	interface ConsoleEntry {
		command: string;
		output: string;
		error?: boolean;
	}

	interface Props {
		serverId: string;
		disabled?: boolean;
	}

	let { serverId, disabled = false }: Props = $props();

	let command = $state('');
	let history = $state<ConsoleEntry[]>([]);
	let submitting = $state(false);
	let inputFocused = $state(false);
	let inputRef = $state<HTMLInputElement | null>(null);
	let historyViewport = $state<HTMLElement | null>(null);

	const commandFilter = $derived(getCommandFilter(command));
	const showSuggestions = $derived(
		inputFocused && !disabled && command.startsWith('/') && !command.slice(1).includes(' ')
	);

	function selectCommand(name: string) {
		command = `/${name} `;
		queueMicrotask(() => inputRef?.focus());
	}

	function focusConsoleWithSlash() {
		command = '/';
		inputFocused = true;
		queueMicrotask(() => inputRef?.focus());
	}

	function handleWindowKeyDown(event: KeyboardEvent) {
		if (disabled || submitting) return;
		if (event.key !== '/') return;
		if (event.metaKey || event.ctrlKey || event.altKey) return;

		const target = event.target;
		if (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLElement && target.isContentEditable
		) {
			return;
		}

		event.preventDefault();
		focusConsoleWithSlash();
	}

	onMount(() => {
		window.addEventListener('keydown', handleWindowKeyDown);
		return () => window.removeEventListener('keydown', handleWindowKeyDown);
	});

	async function submitCommand() {
		const trimmed = normalizeRconCommand(command);
		if (!trimmed || submitting || disabled) return;

		submitting = true;
		command = '';
		inputFocused = false;

		try {
			const response = await fetch(`/api/minecraft-server/${serverId}/console`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ command: trimmed })
			});

			const payload = await response.json().catch(() => ({}));

			if (!response.ok) {
				history = [
					...history,
					{
						command: trimmed,
						output: payload.message ?? 'Command failed',
						error: true
					}
				];
				return;
			}

			history = [
				...history,
				{
					command: trimmed,
					output: payload.output ?? ''
				}
			];
		} catch {
			history = [
				...history,
				{
					command: trimmed,
					output: 'Failed to send command',
					error: true
				}
			];
		} finally {
			submitting = false;
			queueMicrotask(() => {
				if (historyViewport) {
					historyViewport.scrollTop = historyViewport.scrollHeight;
				}
			});
		}
	}

	function handleInputKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			submitCommand();
			return;
		}

		if (event.key === 'Escape') {
			inputFocused = false;
			inputRef?.blur();
		}
	}

	function handleInputBlur() {
		setTimeout(() => {
			inputFocused = false;
		}, 150);
	}
</script>

<Item.Root variant="outline" class="min-w-0 w-full max-w-full">
	<Item.Header>
		<Item.Title>Console</Item.Title>
		<Item.Description>
			Press <kbd class="bg-muted rounded px-1 py-0.5 font-mono text-xs">/</kbd> to open commands
		</Item.Description>
	</Item.Header>
	<Item.Content class="min-w-0 space-y-4">
		<form
			class="relative min-w-0"
			onsubmit={(event) => {
				event.preventDefault();
				submitCommand();
			}}
		>
			<InputGroup.Root>
				<InputGroup.Input
					bind:ref={inputRef}
					bind:value={command}
					placeholder={disabled ? 'Start the server to use the console' : 'Press / for commands...'}
					disabled={disabled || submitting}
					onkeydown={handleInputKeyDown}
					onfocus={() => (inputFocused = true)}
					onblur={handleInputBlur}
				/>
				<InputGroup.Addon>
					{#if submitting}
						<Spinner />
					{:else}
						<SquareTerminal />
					{/if}
				</InputGroup.Addon>
			</InputGroup.Root>

			{#if showSuggestions}
				<Command.Root
					value={commandFilter}
					class="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-4xl border bg-popover p-0 shadow-lg"
				>
					<Command.List class="max-h-56">
						<Command.Empty>No matching commands.</Command.Empty>
						<Command.Group heading="Commands">
							{#each RCON_COMMANDS as cmd (cmd.name)}
								<Command.Item value={cmd.name} onSelect={() => selectCommand(cmd.name)}>
									<span class="font-mono">/{cmd.name}</span>
									<span class="text-muted-foreground ml-auto truncate text-xs">{cmd.description}</span>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			{/if}
		</form>

		{#if history.length > 0}
			<ScrollArea
				class="h-64 w-full rounded-md border bg-muted/30"
				viewportRef={historyViewport}
			>
				<div class="space-y-3 p-3 font-mono text-sm">
					{#each history as entry, index (index)}
						<div class="space-y-1">
							<p class="text-muted-foreground">&gt; {entry.command}</p>
							{#if entry.output}
								<pre class="whitespace-pre-wrap {entry.error ? 'text-destructive' : ''}">{entry.output}</pre>
							{/if}
						</div>
					{/each}
				</div>
			</ScrollArea>
		{:else if !disabled}
			<p class="text-muted-foreground text-sm">
				Try <kbd class="bg-muted rounded px-1 py-0.5 font-mono text-xs">/</kbd> then pick a command like
				<code>list</code> or <code>say</code>.
			</p>
		{/if}
	</Item.Content>
</Item.Root>
