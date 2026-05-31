<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import type { Server } from '$lib/types';
	import { Label } from '$lib/components/ui/label/index.js';

	interface Props {
		server: Server;
	}

	let { server }: Props = $props();
</script>

<AlertDialog.Root>
	<AlertDialog.Trigger>
		{#snippet child({ props })}
			<Button {...props} size="xs" variant="outline">
				<TrashIcon />
				Delete
			</Button>
		{/snippet}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Server</AlertDialog.Title>
			<AlertDialog.Description>
				Your server will be deleted permanently. Your sessions and backups will be retained for 30
				and 14 days respectively.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<Label for="server-name">Server Name</Label>
		<Input id="server-name" placeholder={server.name} />
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive">Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
