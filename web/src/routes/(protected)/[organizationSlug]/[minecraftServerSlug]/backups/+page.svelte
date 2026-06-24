<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { formatFileSize, formatTime } from '$lib/formatters';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let restoringBackupId = $state<string | null>(null);

	const serverStatus = $derived(data.activeMinecraftServer.status);
	const isBusy = $derived(serverStatus === 'starting' || serverStatus === 'stopping');
</script>

<h1>Backups</h1>

{#if form?.message}
	<p class="text-destructive mb-4 text-sm">{form.message}</p>
{/if}

{#if data.backups.length === 0}
	<p class="text-muted-foreground text-sm">No backups yet. Stop the server to create one.</p>
{:else}
	<Item.Group>
		{#each data.backups as backup (backup.id)}
			<Item.Root variant="outline">
				<Item.Content>
					<Item.Title>
						{data.activeMinecraftServer.name} at {formatTime(backup.createdAt)}
					</Item.Title>
					<Item.Description>
						{formatFileSize(backup.sizeBytes)}
					</Item.Description>
				</Item.Content>
				<Item.Actions>
					<form
						method="POST"
						action="?/restoreBackup"
						use:enhance={() => {
							restoringBackupId = backup.id;
							return async ({ update }) => {
								await update();
								restoringBackupId = null;
							};
						}}
						onsubmit={(event) => {
							if (
								!confirm(
									'Restore this backup? The current world will be replaced with this snapshot.'
								)
							) {
								event.preventDefault();
							}
						}}
					>
						<input type="hidden" name="backupId" value={backup.id} />
						<Button
							type="submit"
							size="sm"
							disabled={isBusy || restoringBackupId === backup.id}
							class="border-primary bg-linear-to-b from-white/20 via-primary to-black/20"
						>
							{#if restoringBackupId === backup.id}
								<Spinner />
								Restoring...
							{:else}
								Restore
							{/if}
						</Button>
					</form>
				</Item.Actions>
			</Item.Root>
		{/each}
	</Item.Group>
{/if}
