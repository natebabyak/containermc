<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import type Stripe from 'stripe';
	import z from 'zod';
	import { invalidateAll } from '$app/navigation';
	import Label from '$lib/components/ui/label/label.svelte';

	const AMOUNTS = [5, 10, 25, 50, 100] as const;

	interface Props {
		paymentMethods: Stripe.PaymentMethod[];
	}

	let { paymentMethods }: Props = $props();

	const schema = z.object({
		enabled: z.boolean(),
		amount: z.string().refine((v) => AMOUNTS.map(String).includes(v), {
			message: 'Amount is required'
		}),
		threshold: z.string().refine((v) => AMOUNTS.map(String).includes(v), {
			message: 'Threshold is required'
		}),
		paymentMethodId: z.string().min(1, 'Payment method is required')
	});

	let enabled = $state(false);

	const form = createForm(() => ({
		defaultValues: {
			enabled: false,
			amount: '10',
			threshold: '5',
			paymentMethodId: paymentMethods[0]?.id ?? ''
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			const formData = new FormData();
			formData.append('enabled', String(value.enabled));
			formData.append('amount', value.amount);
			formData.append('threshold', value.threshold);
			formData.append('paymentMethodId', value.paymentMethodId);

			const response = await fetch('?/updateAutodeposit', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				invalidateAll();
			}
		}
	}));
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		e.stopPropagation();
		form.handleSubmit();
	}}
>
	<Field.Group>
		<form.Field name="enabled">
			{#snippet children(field)}
				<Field.Field orientation="horizontal">
					<Checkbox
						id={field.name}
						name={field.name}
						checked={field.state.value}
						onCheckedChange={(checked) => {
							enabled = !!checked;
							field.handleChange(!!checked);
						}}
					/>
					<Field.Label for={field.name}>Enable Autodeposit</Field.Label>
				</Field.Field>
			{/snippet}
		</form.Field>
		<Field.Set disabled={!enabled}>
			<form.Field name="amount">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Autodeposit Amount</Field.Label>
						<RadioGroup.Root
							name={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<ul class="grid grid-cols-5 gap-2">
								{#each AMOUNTS as amount (amount)}
									<li>
										<Item.Root size="xs" variant="outline">
											{#snippet child({ props })}
												<Label {...props}>
													<Item.Content>
														<Item.Title>${amount}</Item.Title>
													</Item.Content>
													<Item.Actions>
														<RadioGroup.Item value={String(amount)} />
													</Item.Actions>
												</Label>
											{/snippet}
										</Item.Root>
									</li>
								{/each}
							</ul>
						</RadioGroup.Root>
						{#if field.state.meta.errors[0]}
							<Field.Error>{field.state.meta.errors[0].message}</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
			<form.Field name="threshold">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Autodeposit Threshold</Field.Label>
						<RadioGroup.Root
							id={field.name}
							name={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<ul class="grid grid-cols-5 gap-2">
								{#each AMOUNTS as amount (amount)}
									<li>
										<Item.Root size="xs" variant="outline">
											{#snippet child({ props })}
												<Label {...props}>
													<Item.Content>
														<Item.Title>${amount}</Item.Title>
													</Item.Content>
													<Item.Actions>
														<RadioGroup.Item value={String(amount)} />
													</Item.Actions>
												</Label>
											{/snippet}
										</Item.Root>
									</li>
								{/each}
							</ul>
						</RadioGroup.Root>
						{#if field.state.meta.errors[0]}
							<Field.Error>{field.state.meta.errors[0].message}</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>

			<form.Field name="paymentMethodId">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Payment Method</Field.Label>
						<RadioGroup.Root
							name={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							{#each paymentMethods as paymentMethod (paymentMethod.id)}
								<Item.Root>
									{#snippet child({ props })}
										<Field.Field orientation="horizontal" {...props}>
											<RadioGroup.Item id={paymentMethod.id} value={paymentMethod.id} />
											<Field.Label for={paymentMethod.id}>
												<Item.Content>
													<Item.Title>
														{paymentMethod.card?.brand.toUpperCase()} &bull;&bull;&bull;&bull; {paymentMethod
															.card?.last4}
													</Item.Title>
													<Item.Description>
														Expires {paymentMethod.card?.exp_month}/{paymentMethod.card?.exp_year}
													</Item.Description>
												</Item.Content>
											</Field.Label>
										</Field.Field>
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
		</Field.Set>

		<Field.Field>
			<Button type="submit">Save</Button>
		</Field.Field>
	</Field.Group>
</form>
