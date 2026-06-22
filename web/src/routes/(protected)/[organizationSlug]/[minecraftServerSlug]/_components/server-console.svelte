<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';
	import { Spinner } from '$lib/components/ui/spinner/index.js';

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

	async function submitCommand() {
		const trimmed = command.trim();
		if (!trimmed || submitting || disabled) return;

		submitting = true;
		command = '';

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
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			submitCommand();
		}
	}
</script>

<Item.Root variant="outline">
	<Item.Header>
		<Item.Title>Console</Item.Title>
		<Item.Description>Send RCON commands to the running server</Item.Description>
	</Item.Header>
	<Item.Content class="space-y-4">
		<form
			onsubmit={(event) => {
				event.preventDefault();
				submitCommand();
			}}
		>
			<InputGroup.Root>
				<InputGroup.Input
					bind:value={command}
					placeholder={disabled ? 'Start the server to use the console' : 'Enter command...'}
					disabled={disabled || submitting}
					onkeydown={handleKeyDown}
				/>
				<InputGroup.Addon>
					{#if submitting}
						<Spinner />
					{:else}
						<SquareTerminal />
					{/if}
				</InputGroup.Addon>
			</InputGroup.Root>
		</form>

		{#if history.length > 0}
			<div class="max-h-64 space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3 font-mono text-sm">
				{#each history as entry, index (index)}
					<div class="space-y-1">
						<p class="text-muted-foreground">&gt; {entry.command}</p>
						{#if entry.output}
							<pre class="whitespace-pre-wrap {entry.error ? 'text-destructive' : ''}">{entry.output}</pre>
						{/if}
					</div>
				{/each}
			</div>
		{:else if !disabled}
			<p class="text-muted-foreground text-sm">Try commands like <code>list</code> or <code>say Hello</code>.</p>
		{/if}
	</Item.Content>
</Item.Root>
