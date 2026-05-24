<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { createForm } from '@tanstack/svelte-form';
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
	import { Label } from '$lib/components/ui/label/index.js';

	interface CreateServerDialogProps {
		regions: Region[];
	}

	let { regions }: CreateServerDialogProps = $props();

	const schema = z.object({
		step1: z.object({
			serverName: z.string().min(1, 'Name is required'),
			minecraftVersion: z.enum(MINECRAFT_VERSIONS),
			serverType: z.enum(SERVER_TYPES)
		}),
		step2: z.object({
			region: z.string().min(1, 'Region is required'),
			hardware: z.enum(HARDWARE_OPTIONS.map((h) => h.name))
		})
	});

	const form = createForm(() => ({
		defaultValues: {
			step1: {
				serverName: '',
				minecraftVersion: 'LATEST',
				serverType: 'VANILLA'
			},
			step2: {
				region: '',
				hardware: ''
			}
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			console.log(value);
		}
	}));

	const formValues = form.useStore((state) => state.values);
	const isMobile = new IsMobile();

	let activeStep = $state<'step-1' | 'step-2' | 'step-3'>('step-1');
	const isStep1Complete = $derived(schema.shape.step1.safeParse(formValues.current.step1).success);
	const isStep2Complete = $derived(schema.shape.step2.safeParse(formValues.current.step2).success);
	const isComplete = $derived(isStep1Complete && isStep2Complete);
	let open = $state(false);
	let regionGroups = $state<RegionGroup[]>([]);

	onMount(async () => {
		regionGroups = await mapRegionGroups(regions);
		form.setFieldValue('step2.region', regionGroups[0].regions[0].RegionName ?? '');
	});
</script>

{#snippet accordionTrigger(stepNumber: 1 | 2 | 3, stepName: string)}
	{@const isStepComplete =
		stepNumber === 1 ? isStep1Complete : stepNumber === 2 ? isStep2Complete : false}
	{@const arePrevStepsComplete =
		stepNumber === 1
			? true
			: stepNumber === 2
				? isStep1Complete
				: isStep1Complete && isStep2Complete}
	<Accordion.Trigger
		disabled={!arePrevStepsComplete}
		onclick={(e) => {
			if (!arePrevStepsComplete) {
				e.preventDefault();
			}
		}}
		class="flex items-center gap-2 hover:no-underline"
	>
		<div class="relative size-8 rounded-full border">
			{#if isStepComplete}
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
				{@render accordionTrigger(1, 'Server')}
				<Accordion.Content>
					<Field.Group>
						<form.Field name="step1.serverName">
							{#snippet children(field)}
								<Field.Field>
									<Field.Label for={field.name}>Server Name</Field.Label>
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
							<form.Field name="step1.minecraftVersion">
								{#snippet children(field)}
									<Field.Field>
										<Field.Label for={field.name}>Minecraft Version</Field.Label>
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
							<form.Field name="step1.serverType">
								{#snippet children(field)}
									<Field.Field>
										<Field.Label for={field.name}>Server Type</Field.Label>
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
							<Button disabled={!isStep1Complete} onclick={() => (activeStep = 'step-2')}>
								Continue to Deployment
							</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="step-2">
				{@render accordionTrigger(2, 'Deployment')}
				<Accordion.Content>
					<Field.Group>
						<form.Field name="step2.region">
							{#snippet children(field)}
								<Field.Field>
									<Field.Label for={field.name}>Region</Field.Label>
									<Select.Root
										type="single"
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value)}
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
																	<p class="mr-4">{region.ping} ms</p>
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
									<Field.Label for={field.name}>Hardware</Field.Label>
									<RadioGroup.Root
										id={field.name}
										value={field.state.value}
										onValueChange={(value) => field.handleChange(value)}
										class="grid grid-cols-2 gap-2"
									>
										{#each HARDWARE_OPTIONS as hardwareOption (hardwareOption.name)}
											<Item.Root
												variant="outline"
												class="has-data-checked:border-primary/50 has-data-checked:bg-primary/10"
											>
												{#snippet child({ props })}
													<Label {...props} for={hardwareOption.name}>
														<Item.Content>
															<Item.Title>
																{hardwareOption.name} &bull; ${hardwareOption.rate}/hr
															</Item.Title>
															<Item.Description>
																{hardwareOption.cpu} vCPU &bull; {hardwareOption.memory} GB
															</Item.Description>
														</Item.Content>
														<RadioGroup.Item
															id={hardwareOption.name}
															value={hardwareOption.name}
															class="mb-auto"
														/>
													</Label>
												{/snippet}
											</Item.Root>
										{/each}
									</RadioGroup.Root>
								</Field.Field>
							{/snippet}
						</form.Field>
						<Field.Field>
							<Button disabled={!isStep2Complete} onclick={() => (activeStep = 'step-3')}>
								Continue to Review
							</Button>
						</Field.Field>
					</Field.Group>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="step-3">
				{@render accordionTrigger(3, 'Review')}
				<Accordion.Content class="space-y-4">
					<Item.ItemGroup>
						<Item.Root variant="outline">
							<Item.Header>
								<Item.Title>Server</Item.Title>
								<Item.Actions>
									<Button onclick={() => (activeStep = 'step-1')} size="sm" variant="outline">
										Edit
									</Button>
								</Item.Actions>
							</Item.Header>
							<Item.Content class="grid grid-cols-2 gap-2">
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground">Server Name</span>
									<span>{formValues.current.step1.serverName}</span>
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground">Minecraft Version</span>
									<span>{formValues.current.step1.minecraftVersion}</span>
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground">Server Type</span>
									<span>{formValues.current.step1.serverType}</span>
								</div>
							</Item.Content>
						</Item.Root>
						<Item.Root variant="outline">
							<Item.Header>
								<Item.Title>Deployment</Item.Title>
								<Item.Actions>
									<Button onclick={() => (activeStep = 'step-2')} size="sm" variant="outline">
										Edit
									</Button>
								</Item.Actions>
							</Item.Header>
							<Item.Content class="grid grid-cols-2 gap-2">
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground">Region</span>
									<span>{formValues.current.step2.region}</span>
								</div>
								<div class="flex flex-col gap-1">
									<span class="text-xs text-muted-foreground">Hardware</span>
									<span>{formValues.current.step2.hardware}</span>
								</div>
							</Item.Content>
						</Item.Root>
					</Item.ItemGroup>
					<Field.Group>
						<Field.Field>
							<Button disabled={!isComplete} type="submit">Create Server</Button>
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
		<Dialog.Content class="md:max-w-lg">
			<Dialog.Header>
				<Dialog.Title>Create Server</Dialog.Title>
			</Dialog.Header>
			{@render content()}
		</Dialog.Content>
	</Dialog.Root>
{/if}
