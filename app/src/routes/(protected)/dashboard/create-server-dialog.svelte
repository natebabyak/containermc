<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import z from 'zod';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import Stripe from 'stripe';
	import type { Region } from '@aws-sdk/client-ec2';
	import * as Select from '$lib/components/ui/select/index.js';
	import Server from '@lucide/svelte/icons/server';
	import { onMount } from 'svelte';
	import * as Item from '$lib/components/ui/item/index.js';

	interface CreateServerDialogProps {
		paymentMethods: Stripe.PaymentMethod[];
		regions: Region[];
	}

	let { paymentMethods, regions }: CreateServerDialogProps = $props();

	function range(start: number, stop: number, step: number) {
		return Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step);
	}

	const schema = z
		.object({
			name: z.string().min(1, 'Name is required'),
			ipAddress: z.string(),
			region: z.string(),
			cpu: z.number(),
			memory: z.number()
		})
		.refine((val) => {
			switch (val.cpu) {
				case 0.25:
					return val.memory in [0.5, 1, 2];
				case 0.5:
					return val.memory in range(1, 4, 1);
				case 1:
					return val.memory in range(2, 8, 1);
				case 2:
					return val.memory in range(4, 16, 1);
				case 4:
					return val.memory in range(8, 30, 1);
				case 8:
					return val.memory in range(16, 60, 4);
				case 16:
					return val.memory in range(32, 120, 8);
				default:
					return false;
			}
		});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			ipAddress: '',
			region: '',
			cpu: 0.25,
			memory: 0.5
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			console.log(value);
		}
	}));

	interface RegionGroup {
		id: string;
		name: string;
		regions: (Region & {
			ping: number;
		})[];
	}

	let activeStep = $state('server');
	let regionGroups = $state<RegionGroup[] | null>(null);

	async function measurePing(region: Region) {
		const url = `https://${region.Endpoint}`;
		const start = performance.now();
		try {
			await fetch(url, { method: 'HEAD', mode: 'no-cors' });
			return performance.now() - start;
		} catch {
			return -1;
		}
	}

	async function mapRegions(regionGroupId: string) {
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
				regions: await mapRegions('ap')
			},
			{
				id: 'ca',
				name: 'Canada',
				regions: await mapRegions('ca')
			},
			{
				id: 'eu',
				name: 'Europe',
				regions: await mapRegions('eu')
			},
			{
				id: 'sa',
				name: 'South America',
				regions: await mapRegions('sa')
			},
			{
				id: 'us',
				name: 'United States',
				regions: await mapRegions('us')
			}
		].toSorted((a, b) => a.regions[0].ping - b.regions[0].ping);
	});
</script>

<Dialog.Root open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button {...props}>Create Server</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Create Server</Dialog.Title>
			<Dialog.Description></Dialog.Description>
		</Dialog.Header>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Accordion.Root type="single" bind:value={activeStep}>
				<Accordion.Item value="server">
					<Accordion.Trigger>Server</Accordion.Trigger>
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
											type="single"
											value={field.state.value}
											onValueChange={(value) => field.handleChange(value)}
										>
											<Select.Trigger>{field.state.value || 'Select Region'}</Select.Trigger>
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
																		<Item.Actions>
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
							<Field.Field>
								<Field.Label>Payment Method</Field.Label>
							</Field.Field>
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
	</Dialog.Content>
</Dialog.Root>
