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

	interface CreateServerDialogProps {
		paymentMethods: Stripe.PaymentMethod[];
		regions: Region[];
	}

	let { paymentMethods, regions }: CreateServerDialogProps = $props();

	let regionGroups = $derived([
		{
			code: 'ap',
			name: 'Asia Pacific',
			regions: regions.filter((r) => r.RegionName?.startsWith('ap')).toSorted()
		},
		{
			code: 'ca',
			name: 'Canada',
			regions: regions.filter((r) => r.RegionName?.startsWith('ca')).toSorted()
		},
		{
			code: 'eu',
			name: 'Europe',
			regions: regions.filter((r) => r.RegionName?.startsWith('eu')).toSorted()
		},
		{
			code: 'sa',
			name: 'South America',
			regions: regions.filter((r) => r.RegionName?.startsWith('sa')).toSorted()
		},
		{
			code: 'us',
			name: 'United States',
			regions: regions.filter((r) => r.RegionName?.startsWith('us')).toSorted()
		}
	]);

	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		ipAddress: z.string(),
		region: z.string()
	});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			ipAddress: '',
			region: ''
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			console.log(value);
		}
	}));

	let activeStep = $state('server');
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
											<Select.Trigger>Select Region</Select.Trigger>
											<Select.Content class="max-h-75">
												{#each regionGroups as regionGroup, i (i)}
													<Select.Group>
														<Select.Label>{regionGroup.name}</Select.Label>
														{#each regionGroup.regions as region, i (i)}
															<Select.Item value={region.RegionName}>
																{region.RegionName}
																{console.log(region.Geography)}
															</Select.Item>
														{/each}
													</Select.Group>
												{/each}
											</Select.Content>
										</Select.Root>
										<Button>Choose For Me</Button>
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
								<Field.Label></Field.Label>
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
