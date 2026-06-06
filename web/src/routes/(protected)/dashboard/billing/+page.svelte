<script lang="ts">
	import type { PageProps } from './$types';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	import { formatCurrency } from '$lib/formatters';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	const AMOUNTS_CENTS = ['500', '1000', '2500', '5000', '10000'] as const;
	let selectedAmountCents = $state<(typeof AMOUNTS_CENTS)[number]>('2500');
</script>

<svelte:head>
	<title>Billing | ContainerMC</title>
</svelte:head>

<div
	class="space-y-8 p-8 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-medium [&>section]:space-y-4"
>
	<section>
		<h1>{formatCurrency(data.balance)} remaining</h1>
	</section>

	<section>
		<Card.Root>
			<Card.Header>
				<Card.Title>Add Funds</Card.Title>
			</Card.Header>
			<Card.Content>
				<RadioGroup.Root bind:value={selectedAmountCents}>
					{#each AMOUNTS_CENTS as amountCents (amountCents)}
						<Item.Root size="xs" variant="outline">
							{#snippet child({ props })}
								<Label {...props} for={amountCents.toString()}>
									<RadioGroup.Item id={amountCents.toString()} value={amountCents.toString()} />
									<Item.Title>{formatCurrency(parseInt(amountCents))}</Item.Title>
								</Label>
							{/snippet}
						</Item.Root>
					{/each}
				</RadioGroup.Root>
			</Card.Content>
			<Card.Footer>
				<form method="POST" action="?/addFunds" use:enhance class="w-full">
					<input type="hidden" name="amountCents" value={selectedAmountCents} />
					<Button type="submit" class="w-full">
						Add {formatCurrency(parseInt(selectedAmountCents))} to balance
					</Button>
				</form>
			</Card.Footer>
		</Card.Root>
	</section>
	<Separator />
	<section>
		<h2>Auto-Recharge</h2>
		<Card.Root>
			<Card.Content></Card.Content>
		</Card.Root>
	</section>
</div>
