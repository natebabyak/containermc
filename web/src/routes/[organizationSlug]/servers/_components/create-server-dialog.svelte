<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import * as Select from '$lib/components/ui/select/index.js';
	import { onMount } from 'svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { HARDWARE_OPTIONS, REGIONS } from '$lib/constants';
	import z from 'zod';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { invalidateAll } from '$app/navigation';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import { applyAction, deserialize } from '$app/forms';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { scale } from 'svelte/transition';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import { cn } from '$lib/utils';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { formatCurrency } from '$lib/formatters';

	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		regionCode: z.enum(
			REGIONS.map((r) => r.code),
			'Region is required'
		),
		hardwareName: z.enum(
			HARDWARE_OPTIONS.map((o) => o.name),
			'Hardware is required'
		)
	});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			regionCode: '',
			hardwareName: ''
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			const formData = new FormData();
			formData.append('name', value.name);
			formData.append('regionCode', value.regionCode);
			formData.append('hardwareName', value.hardwareName);

			const response = await fetch('?/createMinecraftServer', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());

			if (result.type === 'success') {
				open = false;
				form.reset();
				await invalidateAll();
			}

			applyAction(result);
		}
	}));

	const isMobile = new IsMobile();

	let open = $state(false);

	export async function measurePing(region: (typeof REGIONS)[number]) {
		const url = `https://ec2.${region.code}.amazonaws.com/ping`;
		const start = performance.now();

		try {
			await fetch(url, {
				method: 'GET',
				mode: 'no-cors',
				cache: 'no-store',
				credentials: 'omit'
			});

			return Math.round(performance.now() - start);
		} catch {
			return Infinity;
		}
	}

	let measuringPings = $state(false);

	let regions = $state<((typeof REGIONS)[number] & { ping: number })[]>([]);

	async function measurePings() {
		if (measuringPings) return;

		measuringPings = true;

		try {
			const measuredRegions = await Promise.all(
				REGIONS.map(async (region) => ({
					...region,
					ping: await measurePing(region)
				}))
			);

			regions = measuredRegions.toSorted((a, b) => a.ping - b.ping);

			form.setFieldValue('regionCode', regions[0].code);
		} finally {
			measuringPings = false;
		}
	}

	onMount(() => {
		measurePings();
	});
</script>

{#snippet formSnippet()}
	<form
		id="create-server-form"
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
							placeholder="Server Name"
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
			<form.Field name="regionCode">
				{#snippet children(field)}
					<Field.Field>
						<div class="flex items-center justify-between">
							<Field.Label for={field.name}>Region</Field.Label>
							<Button disabled={measuringPings} onclick={measurePings} size="xs" variant="outline">
								<div class="relative size-3">
									{#if measuringPings}
										<div transition:scale={{ start: 0.9 }} class="absolute">
											<LoaderCircle class="animate-spin" />
										</div>
									{:else}
										<div transition:scale={{ start: 0.9 }} class="absolute">
											<RotateCcw />
										</div>
									{/if}
								</div>
								Remeasure Pings
							</Button>
						</div>
						<Select.Root
							name={field.name}
							type="single"
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<Select.Trigger disabled={measuringPings} id={field.name}>
								{REGIONS.find((r) => r.code === field.state.value)?.name || 'Select Region'}
							</Select.Trigger>
							<Select.Content class="max-h-100">
								<Select.Group>
									{#each regions as region, i (i)}
										<Item.Root>
											{#snippet child({ props })}
												<Select.Item {...props} value={region.code!}>
													<Item.Content>
														<Item.Title>
															{region.name}
															{#if i === 0}
																<Badge>
																	<BadgeCheckIcon />
																	Recommended
																</Badge>
															{/if}
														</Item.Title>
														<Item.Description>
															{region.geography}
														</Item.Description>
													</Item.Content>
													<p class="mr-4">{region.ping} ms</p>
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
			<form.Field name="hardwareName">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Hardware</Field.Label>
						<RadioGroup.Root
							name={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							{#each HARDWARE_OPTIONS as hardwareOption (hardwareOption.name)}
								<Item.Root
									size="xs"
									variant="outline"
									class={cn(
										field.state.value === hardwareOption.name && 'border-primary bg-primary/5'
									)}
								>
									{#snippet child({ props })}
										<Label {...props} for={hardwareOption.name}>
											<RadioGroup.Item id={hardwareOption.name} value={hardwareOption.name} />
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
													{hardwareOption.vcpu} vCPU &bull; {hardwareOption.memory} GB
												</Item.Description>
											</Item.Content>
											<Item.Content class="*:ml-auto">
												<Item.Title>
													{formatCurrency(hardwareOption.hourlyRate)}/hr
												</Item.Title>
											</Item.Content>
										</Label>
									{/snippet}
								</Item.Root>
							{/each}
						</RadioGroup.Root>
						{#if field.state.meta.errors[0]}
							<Field.Error>
								{field.state.meta.errors[0].message}
							</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
		</Field.Group>
	</form>
{/snippet}

{#snippet submitButton()}
	<Field.Field>
		<Button form="create-server-form" type="submit">Create Server</Button>
	</Field.Field>
{/snippet}

{#if isMobile.current}
	<Drawer.Root bind:open>
		<Drawer.Trigger>
			{#snippet child({ props })}
				<Button {...props}>Create Server</Button>
			{/snippet}
		</Drawer.Trigger>
		<Drawer.Content class="flex h-full flex-col">
			<Drawer.Header class="border-b">
				<Drawer.Title>Create Server</Drawer.Title>
			</Drawer.Header>
			<ScrollArea class="flex-1 overflow-y-auto">
				<div class="p-4">
					{@render formSnippet()}
				</div>
			</ScrollArea>
			<Drawer.Footer class="border-t">
				{@render submitButton()}
			</Drawer.Footer>
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
			{@render formSnippet()}
			{@render submitButton()}
		</Dialog.Content>
	</Dialog.Root>
{/if}
