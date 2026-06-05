<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { Server } from '$lib/types';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import z from 'zod';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		server: Server;
	}

	let { server }: Props = $props();

	const schema = z
		.object({
			serverName: z.string().min(1)
		})
		.refine((data) => data.serverName === server.name, {
			message: 'Text does not match the server name.',
			path: ['serverName']
		});

	const form = createForm(() => ({
		defaultValues: {
			serverName: ''
		},
		validators: {
			onChange: schema,
			onSubmit: schema
		},
		onSubmit: async () => {
			const formData = new FormData();
			formData.append('serverId', server.id);

			const response = await fetch('?/deleteServer', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				form.reset();
				invalidateAll();
			}
		}
	}));
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
			<AlertDialog.Title>Delete server?</AlertDialog.Title>
			<AlertDialog.Description>
				Delete <span class="font-medium">{server.name}</span> permanently? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<form
			id="confirm-delete-server"
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Field.Group>
				<form.Field name="serverName">
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>
								Type "{server.name}" to confirm deletion of the server.
							</Field.Label>
							<Input
								id={field.name}
								name={field.name}
								onblur={field.handleBlur}
								oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
								placeholder={server.name}
								type="text"
								value={field.state.value}
							/>
						</Field.Field>
					{/snippet}
				</form.Field>
			</Field.Group>
		</form>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form.Subscribe selector={(state) => !state.isDefaultValue && state.isValid}>
				{#snippet children(canSubmit)}
					<AlertDialog.Action
						disabled={!canSubmit}
						form="confirm-delete-server"
						type="submit"
						variant="destructive"
					>
						Confirm
					</AlertDialog.Action>
				{/snippet}
			</form.Subscribe>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
