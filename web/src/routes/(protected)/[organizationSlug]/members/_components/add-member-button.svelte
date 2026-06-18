<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Send from '@lucide/svelte/icons/send';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import z from 'zod';
	import { getAppContext } from '$lib/context/app-context';

	const schema = z.object({
		email: z.email()
	});

	async function inviteMember(email: string) {
		await authClient.organization.inviteMember({
			email: email,
			role: 'member'
		});
	}

	const form = createForm(() => ({
		defaultValues: {
			email: ''
		},
		validators: {
			onChange: schema
		},
		onSubmit: async ({ value }) => {
			await inviteMember(value.email);
		}
	}));

	const app = getAppContext();
	let open = $state(false);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props}>
				<UserPlus />
				Add Members
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add Member</Dialog.Title>
			<Dialog.Description>Add a new member to {app.activeOrganization?.name}.</Dialog.Description>
		</Dialog.Header>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Field.Group>
				<form.Field name="email">
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Email</Field.Label>
							<Input
								aria-invalid={!!field.state.meta.errors[0]}
								id={field.name}
								oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
								placeholder="name@domain.com"
								type="email"
								value={field.state.value}
							/>
							{#if field.state.meta.errors[0]}
								<Field.Error>
									{field.state.meta.errors[0].message}
								</Field.Error>
							{/if}
						</Field.Field>
					{/snippet}
				</form.Field>
				<Field.Field>
					<Button disabled={!form.state.isFormValid} type="submit">
						<Send />
						Send Invite
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
	</Dialog.Content>
</Dialog.Root>
