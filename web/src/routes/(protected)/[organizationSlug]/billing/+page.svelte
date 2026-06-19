<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { page } from '$app/state';

	import { formatBalance, formatCurrency, formatTime } from '$lib/formatters';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const AMOUNTS_CENTS = ['500', '1000', '2500', '5000', '10000'] as const;
	let selectedAmountCents = $state<(typeof AMOUNTS_CENTS)[number]>('2500');

	const balance = $derived(page.data.activeOrganizationBalance ?? 0);
</script>

<svelte:head>
	<title>Billing | ContainerMC</title>
</svelte:head>

<div
	class="space-y-8 p-8 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-medium [&>section]:space-y-4"
>
	<section>
		<h1>{formatBalance(balance)}</h1>
		<p class="text-muted-foreground">Available balance</p>
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
									<Item.Title>{formatCurrency(parseInt(amountCents) / 100)}</Item.Title>
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
						Add {formatCurrency(parseInt(selectedAmountCents) / 100)} to balance
					</Button>
				</form>
			</Card.Footer>
		</Card.Root>
	</section>
	<Separator />
	<section>
		<h2>Transactions</h2>
		{#if data.transactions && data.transactions.length > 0}
			<Item.Group>
				{#each data.transactions as transaction (transaction.id)}
					<Item.Root size="xs" variant="outline">
						<Item.Content>
							<Item.Title>
								{transaction.type === 'deposit' ? 'Deposit' : 'Session charge'}
							</Item.Title>
							<Item.Description>{formatTime(transaction.createdAt)}</Item.Description>
						</Item.Content>
						<Item.Content class="text-right">
							<Item.Title>
								{transaction.type === 'deposit' ? '+' : '-'}
								{formatBalance(Number(transaction.amountDollars))}
							</Item.Title>
						</Item.Content>
					</Item.Root>
				{/each}
			</Item.Group>
		{:else}
			<p class="text-muted-foreground text-sm">No transactions yet.</p>
		{/if}
	</section>
	<Separator />
	<section>
		<h2>Auto-Recharge</h2>
		<Card.Root>
			<Card.Content></Card.Content>
		</Card.Root>
	</section>
</div>
