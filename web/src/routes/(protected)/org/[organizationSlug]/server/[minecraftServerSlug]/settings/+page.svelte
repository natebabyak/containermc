<script lang="ts">
	import * as Field from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { PageProps } from './$types';
	import * as Select from '$lib/components/ui/select/index.js';
	import { MINECRAFT_SERVER_TYPES, MINECRAFT_VERSION_GROUPS } from '$lib/constants';
	import { createForm } from '@tanstack/svelte-form';
	import z from 'zod';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';

	let { data }: PageProps = $props();

	const schema = z.object({
		iconUrl: z.url(),
		motd: z.string(),
		type: z.enum(MINECRAFT_SERVER_TYPES.map((t) => t.value)),
		minecraftVersion: z.enum(MINECRAFT_VERSION_GROUPS.flatMap((g) => g.versions))
	});

	const form = createForm(() => ({
		defaultValues: {
			iconUrl: data.activeMinecraftServer.iconUrl || '',
			motd: data.activeMinecraftServer.motd || '',
			type: data.activeMinecraftServer.type || 'VANILLA',
			minecraftVersion: data.activeMinecraftServer.minecraftVersion || 'LATEST'
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			const formData = new FormData();
			formData.append('iconUrl', value.iconUrl);
			formData.append('motd', value.motd);
			formData.append('type', value.type);
			formData.append('minecraftVersion', value.minecraftVersion);
		}
	}));
</script>

<div class="space-y-4">
	<h1>Settings</h1>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		}}
	>
		<Field.Group>
			<form.Field name="iconUrl">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Icon</Field.Label>
						<Input id={field.name} type="file" />
					</Field.Field>
				{/snippet}
			</form.Field>
			<form.Field name="motd">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>MOTD</Field.Label>
						<InputGroup.Root>
							<InputGroup.Textarea id={field.name} placeholder="Minecraft Server" />
						</InputGroup.Root>
					</Field.Field>
				{/snippet}
			</form.Field>
			<div class="grid grid-cols-2 gap-4">
				<form.Field name="type">
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Type</Field.Label>
							<Select.Root
								value={field.state.value}
								onValueChange={(value) => field.handleChange(value)}
								type="single"
							>
								<Select.Trigger>
									{MINECRAFT_SERVER_TYPES.find((t) => t.value === field.state.value)?.label ||
										'Select type'}
								</Select.Trigger>
								<Select.Content class="max-h-100">
									<Select.Group>
										{#each MINECRAFT_SERVER_TYPES as type (type.value)}
											<Select.Item value={type.value}>{type.label}</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</Field.Field>
					{/snippet}
				</form.Field>
				<form.Field name="minecraftVersion">
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Version</Field.Label>
							<Select.Root
								value={field.state.value}
								onValueChange={(value) => field.handleChange(value)}
								type="single"
							>
								<Select.Trigger class="capitalize">
									{field.state.value.toLowerCase() || 'Select version'}
								</Select.Trigger>
								<Select.Content class="max-h-100">
									{#each MINECRAFT_VERSION_GROUPS as versionGroup (versionGroup.name)}
										<Select.Group>
											<Select.GroupHeading>
												{versionGroup.name}
											</Select.GroupHeading>
											{#each versionGroup.versions as version (version)}
												<Select.Item value={version} class="capitalize">
													{version.toLowerCase()}
												</Select.Item>
											{/each}
										</Select.Group>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Field>
					{/snippet}
				</form.Field>
			</div>
			<Field.Field>
				<Button type="submit">Save Changes</Button>
			</Field.Field>
		</Field.Group>
	</form>
	<Separator />
	<h2>Danger Zone</h2>
</div>
