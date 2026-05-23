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
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import type { RegionGroup } from './types';
	import { mapRegionGroups } from './utils';
	import { HARDWARE_OPTIONS, MINECRAFT_VERSIONS, SERVER_TYPES } from './constants';
	import z from 'zod';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import Check from '@lucide/svelte/icons/check';
	import { blur } from 'svelte/transition';
	import { sineOut } from 'svelte/easing';
	import * as Empty from '$lib/components/ui/empty/index.js';

	interface CreateServerDialogProps {
		paymentMethods: Stripe.PaymentMethod[];
		regions: Region[];
	}

	let { paymentMethods, regions }: CreateServerDialogProps = $props();

	const schema = z.object({
		step1: z.object({
			name: z.string().min(1, 'Name is required'),
			version: z.enum(MINECRAFT_VERSIONS),
			type: z.enum(SERVER_TYPES)
		}),
		step2: z.object({
			region: z.string().min(1, 'Region is required'),
			hardware: z.enum(HARDWARE_OPTIONS.map((h) => h.name))
		}),
		step3: z.object({
			paymentMethodId: z.string().min(1, 'Payment method is required')
		})
	});

	const form = createForm(() => ({
		defaultValues: {
			step1: {
				name: '',
				version: 'LATEST',
				type: 'VANILLA'
			},
			step2: {
				region: '',
				hardware: 'Medium'
			},
			step3: {
				paymentMethodId: ''
			}
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			console.log(value);
		}
	}));

	let activeStep = $state<'step-1' | 'step-2' | 'step-3'>('step-1');
	const isMobile = new IsMobile();
	let open = $state(true);
	let regionGroups = $state<RegionGroup[]>([]);

	onMount(async () => {
		regionGroups = await mapRegionGroups(regions);
	});
</script>

{#snippet accordionTrigger(stepNumber: 1 | 2 | 3, stepName: string)}
	<form.Subscribe selector={(state) => state.values}>
		{#snippet children(values)}
			{@const isComplete = schema.shape[`step${stepNumber}`].safeParse(
				values[`step${stepNumber}`]
			).success}
			<Accordion.Trigger class="flex items-center gap-2 hover:no-underline">
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
			<Accordion.Item value="step-1">
				{@render accordionTrigger(1, 'Server Configuration')}
				<Accordion.Content>
					<Field.Group>
						<form.Field name="step1.name">
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
							<form.Field name="step1.version">
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
							<form.Field name="step1.type">
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
							<Button onclick={() => (activeStep = 'step-2')}>Continue to Deployment</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="step-2">
				{@render accordionTrigger(2, 'Deployment Configuration')}
				<Accordion.Content>
					<Field.Group>
						<form.Field name="step2.region">
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
						<form.Field name="step2.hardware">
							{#snippet children(field)}
								<Field.Field>
									<Field.Label>Hardware</Field.Label>
									<Select.Root
										type="single"
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value)}
									>
										<Select.Trigger id={field.name}>
											{field.state.value || 'Select Hardware'}
										</Select.Trigger>
										<Select.Content class="max-h-75">
											<Select.Group>
												{#each HARDWARE_OPTIONS as o, i (i)}
													<Item.Root>
														{#snippet child({ props })}
															<Select.Item {...props} value={o.name}>
																<Item.Content>
																	<Item.Title>{o.name}</Item.Title>
																	<Item.Description>
																		{o.cpu} vCPU &bull; {o.memory} GB
																	</Item.Description>
																</Item.Content>
																<Item.Actions class="mr-4">
																	${o.rate}/hr
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
						<Field.Field>
							<Button onclick={() => (activeStep = 'step-3')}>Continue to Payment</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="step-3">
				{@render accordionTrigger(3, 'Checkout & Review')}
				<Accordion.Content>
					<Field.Group>
						<form.Field name="step3.paymentMethodId">
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
										{:else}
											<Empty.Root>
												<Empty.Content>No Payment Methods</Empty.Content>
											</Empty.Root>
										{/each}
									</RadioGroup.Root>
								</Field.Field>
							{/snippet}
						</form.Field>
						<Field.Field>
							<Button type="submit">Create Server</Button>
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
