<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import Stripe from 'stripe';
	import type { Region } from '@aws-sdk/client-ec2';
	import * as Select from '$lib/components/ui/select/index.js';
	import { onMount } from 'svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import type { RegionGroup } from './types';
	import { mapRegionGroups } from './utils';
	import { HARDWARE_MAP, HARDWARE_PRESETS, MINECRAFT_VERSIONS, SERVER_TYPES } from './constants';
	import z from 'zod';
	import Circle from '@lucide/svelte/icons/circle';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import Check from '@lucide/svelte/icons/check';
	import { blur } from 'svelte/transition';
	import { sineOut } from 'svelte/easing';

	interface CreateServerDialogProps {
		paymentMethods: Stripe.PaymentMethod[];
		regions: Region[];
	}

	let { paymentMethods, regions }: CreateServerDialogProps = $props();

	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		version: z.enum(MINECRAFT_VERSIONS),
		type: z.enum(SERVER_TYPES),
		region: z.string(),
		hardware: z.object({
			cpu: z.string(),
			memory: z.number()
		}),
		paymentMethodId: z.string().min(1, 'Payment method is required')
	});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			version: 'LATEST',
			type: 'VANILLA',
			region: '',
			hardware: {
				cpu: '2',
				memory: 4
			},
			paymentMethodId: ''
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			console.log(value);
		}
	}));

	let activeStep = $state<'server' | 'deployment' | 'payment' | 'review'>('server');
	const isMobile = new IsMobile();
	let open = $state(true);
	let regionGroups = $state<RegionGroup[]>([]);

	onMount(async () => {
		regionGroups = await mapRegionGroups(regions);
	});
</script>

{#snippet accordionTrigger(
	stepNumber: number,
	stepName: string,
	fieldIds: (keyof typeof form.state.values)[]
)}
	<form.Subscribe selector={(state) => state.values}>
		{#snippet children(values)}
			{@const isComplete = fieldIds.every((id) => schema.shape[id].safeParse(values[id]).success)}
			<Accordion.Trigger class="flex items-center gap-2">
				<div class="relative size-8 rounded-full border">
					{#if isComplete}
						<div
							transition:blur={{ easing: sineOut }}
							class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
						>
							<Check class="size-4" />
						</div>
					{:else}
						<span
							transition:blur={{ easing: sineOut }}
							class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono"
						>
							{stepNumber}
						</span>
					{/if}
				</div>
				<Item.Content>
					<Item.Title>{stepName}</Item.Title>
				</Item.Content>
			</Accordion.Trigger>
		{/snippet}
	</form.Subscribe>
{/snippet}

{#snippet content()}
	<form
		onsubmit={(e) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		}}
	>
		<Accordion.Root type="single" bind:value={activeStep}>
			<Accordion.Item value="server">
				{@render accordionTrigger(1, 'Server', ['name', 'version', 'type'])}
				<Accordion.Content>
					<Field.Group>
						<form.Field name="name" validators={{ onBlur: schema.shape.name }}>
							{#snippet children(field)}
								<Field.Field>
									<Field.Label for={field.name}>Name</Field.Label>
									<Input
										aria-invalid={!!field.state.meta.errors[0]}
										id={field.name}
										name={field.name}
										onblur={field.handleBlur}
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
						<div class="grid grid-cols-2 gap-4">
							<form.Field name="version">
								{#snippet children(field)}
									<Field.Field>
										<Field.Label for={field.name}>Version</Field.Label>
										<Select.Root
											name={field.name}
											onValueChange={(value) => field.handleChange(value)}
											type="single"
											value={field.state.value}
										>
											<Select.Trigger>
												{field.state.value}
											</Select.Trigger>
											<Select.Content class="max-h-75">
												<Select.Group>
													{#each MINECRAFT_VERSIONS as minecraftVersion, i (i)}
														<Select.Item value={minecraftVersion}>
															{minecraftVersion}
														</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</Field.Field>
								{/snippet}
							</form.Field>
							<form.Field name="type">
								{#snippet children(field)}
									<Field.Field>
										<Field.Label for={field.name}>Type</Field.Label>
										<Select.Root
											name={field.name}
											onValueChange={(value) => field.handleChange(value)}
											type="single"
											value={field.state.value}
										>
											<Select.Trigger id={field.name}>
												{field.state.value}
											</Select.Trigger>
											<Select.Content class="max-h-75">
												<Select.Group>
													{#each SERVER_TYPES as serverType, i (i)}
														<Select.Item value={serverType}>{serverType}</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
									</Field.Field>
								{/snippet}
							</form.Field>
						</div>
						<Field.Field>
							<Button onclick={() => (activeStep = 'deployment')}>Continue to Deployment</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="deployment">
				<Accordion.Trigger>Deployment</Accordion.Trigger>
				<Accordion.Content>
					<Field.Group>
						<form.Field name="region">
							{#snippet children(field)}
								<Field.Field>
									<Field.Label for={field.name}>Region</Field.Label>
									<Select.Root
										onValueChange={(value) => field.handleChange(value)}
										type="single"
										value={field.state.value}
									>
										<Select.Trigger id={field.name}>
											{field.state.value || 'Select Region'}
										</Select.Trigger>
										<Select.Content class="max-h-75">
											{#each regionGroups as regionGroup, i (i)}
												<Select.Group>
													<Select.Label>{regionGroup.name}</Select.Label>
													{#each regionGroup.regions as region, i (i)}
														<Item.Root>
															{#snippet child({ props })}
																<Select.Item {...props} value={region.RegionName!}>
																	<Item.Content>
																		<Item.Title>
																			{region.RegionName}
																		</Item.Title>
																		<Item.Description>
																			{region.Geography?.[0].Name}
																		</Item.Description>
																	</Item.Content>
																	<Item.Actions class="mr-4">
																		{region.ping} ms
																	</Item.Actions>
																</Select.Item>
															{/snippet}
														</Item.Root>
													{/each}
												</Select.Group>
											{/each}
										</Select.Content>
									</Select.Root>
								</Field.Field>
							{/snippet}
						</form.Field>
						<form.Field name="hardware">
							{#snippet children(field)}
								{@const { cpu, memory } = field.state.value}
								<Field.Field>
									<Field.Label>Hardware</Field.Label>
									<Select.Root
										type="single"
										value={HARDWARE_PRESETS.find((p) => p.cpu === cpu && p.memory === memory)
											?.name ?? 'Custom'}
										onValueChange={(value) => {
											const preset = HARDWARE_PRESETS.find((p) => p.name === value);
											if (!preset) return;
											field.handleChange({
												cpu: preset.cpu,
												memory: preset.memory
											});
										}}
									>
										<Select.Trigger id={field.name}>
											{HARDWARE_PRESETS.find((p) => p.cpu === cpu && p.memory === memory)?.name ??
												'Custom'}
										</Select.Trigger>
										<Select.Content class="max-h-75">
											<Select.Group>
												{#each HARDWARE_PRESETS as hardwarePreset, i (i)}
													<Item.Root>
														{#snippet child({ props })}
															<Select.Item {...props} value={hardwarePreset.name}>
																<Item.Content>
																	<Item.Title>{hardwarePreset.name}</Item.Title>
																	<Item.Description>
																		{hardwarePreset.cpu} vCPU, {hardwarePreset.memory} GB
																	</Item.Description>
																</Item.Content>
																<Item.Actions class="mr-4">
																	${hardwarePreset.rate * 180}/mo
																</Item.Actions>
															</Select.Item>
														{/snippet}
													</Item.Root>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
								</Field.Field>
							{/snippet}
						</form.Field>
						<form.Field name="hardware.cpu">
							{#snippet children(field)}
								<Field.Field orientation="horizontal">
									<Field.Label>CPU</Field.Label>
									<Slider
										onValueChange={(value) => field.handleChange(value.toString())}
										step={Object.keys(HARDWARE_MAP).map((k) => Number(k))}
										type="single"
										value={Number(field.state.value)}
									/>
									<Field.Label class="text-nowrap">
										{field.state.value} vCPU
									</Field.Label>
								</Field.Field>
							{/snippet}
						</form.Field>
						<form.Field name="hardware">
							{#snippet children(field)}
								{@const hardware = HARDWARE_MAP[field.state.value.cpu as keyof typeof HARDWARE_MAP]}
								<Field.Field orientation="horizontal">
									<Field.Label>Memory</Field.Label>
									<Slider
										max={hardware.max}
										min={hardware.min}
										onValueChange={(value) =>
											field.handleChange({ ...field.state.value, memory: value })}
										type="single"
										step={hardware.step}
										value={field.state.value.memory}
									/>
									<Field.Label class="text-nowrap">
										{field.state.value.memory} GB
									</Field.Label>
								</Field.Field>
							{/snippet}
						</form.Field>
						<Field.Field>
							<Button onclick={() => (activeStep = 'payment-method')}>Continue to Payment</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="payment-method">
				<Accordion.Trigger>Payment Method</Accordion.Trigger>
				<Accordion.Content>
					<Field.Group>
						<form.Field name="paymentMethodId">
							{#snippet children(field)}
								<Field.Field>
									<RadioGroup.Root
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value)}
									>
										{#each paymentMethods as paymentMethod (paymentMethod.id)}
											<Item.Root>
												{#snippet child({ props })}
													<RadioGroup.Item {...props} value={paymentMethod.id}></RadioGroup.Item>
												{/snippet}
											</Item.Root>
										{/each}
									</RadioGroup.Root>
								</Field.Field>
							{/snippet}
						</form.Field>
						<Field.Field>
							<Button onclick={() => (activeStep = 'review')}>Continue to Review</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="review">
				<Accordion.Trigger>Review</Accordion.Trigger>
				<Accordion.Content>
					<Field.Group>
						<Field.Field>
							<Button>Create Server</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</form>
{/snippet}

{#if isMobile.current}
	<Drawer.Root bind:open>
		<Drawer.Trigger></Drawer.Trigger>
		<Drawer.Content>
			{@render content()}
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
			{@render content()}
		</Dialog.Content>
	</Dialog.Root>
{/if}
