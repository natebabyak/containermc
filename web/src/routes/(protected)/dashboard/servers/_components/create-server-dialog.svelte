<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import type { Region } from '@aws-sdk/client-ec2';
	import * as Select from '$lib/components/ui/select/index.js';
	import { onMount } from 'svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import {
		HARDWARE_OPTIONS,
		MINECRAFT_VERSION_GROUPS,
		MINECRAFT_VERSIONS,
		SERVER_TYPES
	} from '$lib/constants';
	import z from 'zod';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { invalidateAll } from '$app/navigation';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';

	interface RegionGroup {
		id: string;
		name: string;
		regions: (Region & {
			ping: number;
		})[];
	}

	interface Props {
		regions: Region[];
	}

	let { regions }: Props = $props();

	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		minecraftVersion: z.enum(MINECRAFT_VERSIONS),
		type: z.enum(SERVER_TYPES.map((serverType) => serverType.value)),
		region: z.string().min(1, 'Region is required'),
		hardware: z.enum(
			HARDWARE_OPTIONS.map((hardwareOption) => hardwareOption.name),
			'Hardware is required'
		)
	});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			minecraftVersion: 'LATEST',
			type: 'VANILLA',
			region: '',
			hardware: ''
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			const formData = new FormData();
			formData.append('name', value.name);
			formData.append('minecraftVersion', value.minecraftVersion);
			formData.append('type', value.type);
			formData.append('region', value.region);
			formData.append('hardware', value.hardware);

			const response = await fetch('?/createServer', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				open = false;
				form.reset();
				invalidateAll();
			}
		}
	}));

	const isMobile = new IsMobile();

	let open = $state(false);
	let regionGroups = $state<RegionGroup[]>([]);

	export async function measurePing(region: Region) {
		const url = `https://${region.Endpoint}`;
		const start = performance.now();
		try {
			await fetch(url, {
				method: 'HEAD',
				mode: 'no-cors'
			});
			return performance.now() - start;
		} catch {
			return -1;
		}
	}

	export async function mapRegions(regions: Region[], regionGroupId: string) {
		return (
			await Promise.all(
				regions
					.filter((r) => r.RegionName?.startsWith(regionGroupId))
					.map(async (r) => ({
						...r,
						ping: await measurePing(r)
					}))
			)
		).toSorted((a, b) => a.ping - b.ping);
	}

	onMount(async () => {
		regionGroups = [
			{
				id: 'ap',
				name: 'Asia Pacific',
				regions: await mapRegions(regions, 'ap')
			},
			{
				id: 'ca',
				name: 'Canada',
				regions: await mapRegions(regions, 'ca')
			},
			{
				id: 'eu',
				name: 'Europe',
				regions: await mapRegions(regions, 'eu')
			},
			{
				id: 'sa',
				name: 'South America',
				regions: await mapRegions(regions, 'sa')
			},
			{
				id: 'us',
				name: 'United States',
				regions: await mapRegions(regions, 'us')
			}
		].toSorted((a, b) => a.regions[0].ping - b.regions[0].ping);
	});
</script>

{#snippet hardwareOptionItem(hardwareOption: (typeof HARDWARE_OPTIONS)[number])}
	<Item.Content>
		<Item.Title>
			{hardwareOption.name}
			{#if hardwareOption.tag}
				<Badge>
					<BadgeCheckIcon />
					{hardwareOption.tag}
				</Badge>
			{/if}
		</Item.Title>
		<Item.Description>
			{hardwareOption.cpu} vCPU &bull; {hardwareOption.memoryGb} GB
		</Item.Description>
	</Item.Content>
	<Item.Content class="mr-4 *:ml-auto">
		<Item.Title>
			${hardwareOption.hourlyRateUsd}/hr
		</Item.Title>
		<Item.Description>
			{#if hardwareOption.players.max}
				{hardwareOption.players.min}&ndash;{hardwareOption.players.max} players
			{:else}
				{hardwareOption.players.min}+ players
			{/if}
		</Item.Description>
	</Item.Content>
{/snippet}

{#snippet createServerForm()}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		}}
	>
		<Field.Group>
			<form.Field name="name">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Name</Field.Label>
						<Input
							aria-invalid={!!field.state.meta.errors[0]}
							id={field.name}
							name={field.name}
							oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
							placeholder="Server name"
							type="text"
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
			<div class="grid grid-cols-2 gap-4">
				<form.Field name="minecraftVersion">
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Minecraft Version</Field.Label>
							<Select.Root
								name={field.name}
								type="single"
								value={field.state.value}
								onValueChange={(value) => field.handleChange(value)}
							>
								<Select.Trigger id={field.name} class="capitalize">
									{field.state.value.toLowerCase()}
								</Select.Trigger>
								<Select.Content class="max-h-100">
									{#each MINECRAFT_VERSION_GROUPS as minecraftVersionGroup, i (i)}
										<Select.Group>
											<Select.Label>{minecraftVersionGroup.name}</Select.Label>
											{#each minecraftVersionGroup.versions as version, j (j)}
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
				<form.Field name="type">
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Server Type</Field.Label>
							<Select.Root
								name={field.name}
								type="single"
								value={field.state.value}
								onValueChange={(value) => field.handleChange(value)}
							>
								<Select.Trigger id={field.name}>
									{SERVER_TYPES.find((serverType) => serverType.value === field.state.value)?.label}
								</Select.Trigger>
								<Select.Content class="max-h-100">
									<Select.Group>
										{#each SERVER_TYPES as serverType, i (i)}
											<Select.Item value={serverType.value}>
												{serverType.label}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</Field.Field>
					{/snippet}
				</form.Field>
			</div>
			<Separator />
			<form.Field name="region">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Region</Field.Label>
						<Select.Root
							name={field.name}
							type="single"
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<Select.Trigger id={field.name}>
								{field.state.value || 'Select region'}
							</Select.Trigger>
							<Select.Content class="max-h-100">
								{#each regionGroups as regionGroup, i (i)}
									<Select.Group>
										<Select.Label>{regionGroup.name}</Select.Label>
										{#each regionGroup.regions as region, j (j)}
											<Item.Root>
												{#snippet child({ props })}
													<Select.Item {...props} value={region.RegionName!}>
														<Item.Content>
															<Item.Title>
																{region.RegionName}
																{#if i === 0 && j === 0}
																	<Badge>
																		<BadgeCheckIcon />
																		Recommended
																	</Badge>
																{/if}
															</Item.Title>
															<Item.Description>
																{region.Geography?.[0].Name}
															</Item.Description>
														</Item.Content>
														<p class="mr-4">{region.ping} ms</p>
													</Select.Item>
												{/snippet}
											</Item.Root>
										{/each}
									</Select.Group>
								{/each}
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors[0]}
							<Field.Error>
								{field.state.meta.errors[0].message}
							</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
			<form.Field name="hardware">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Hardware</Field.Label>
						<Select.Root
							name={field.name}
							type="single"
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<Select.Trigger id={field.name}>
								{field.state.value || 'Select hardware'}
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#each HARDWARE_OPTIONS as hardwareOption (hardwareOption.name)}
										<Item.Root>
											{#snippet child({ props })}
												<Select.Item {...props} value={hardwareOption.name}>
													{@render hardwareOptionItem(hardwareOption)}
												</Select.Item>
											{/snippet}
										</Item.Root>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors[0]}
							<Field.Error>
								{field.state.meta.errors[0].message}
							</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
			<Field.Field>
				<Button type="submit">Create Server</Button>
			</Field.Field>
		</Field.Group>
	</form>
{/snippet}

{#if isMobile.current}
	<Drawer.Root bind:open>
		<Drawer.Trigger>
			{#snippet child({ props })}
				<Button {...props}>Create Server</Button>
			{/snippet}
		</Drawer.Trigger>
		<Drawer.Content>
			{@render createServerForm()}
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<Dialog.Root bind:open>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button {...props}>Create Server</Button>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create Server</Dialog.Title>
			</Dialog.Header>
			{@render createServerForm()}
		</Dialog.Content>
	</Dialog.Root>
{/if}
