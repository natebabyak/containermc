<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ServerItem from '$lib/components/server-item.svelte';
	import Containermc from '$lib/components/icons/containermc.svelte';
	import PlusCircle from '@lucide/svelte/icons/plus-circle';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatBalance, formatTime } from '$lib/formatters';
	import type { PageProps } from './$types';
	import StatCard from './_components/stat-card.svelte';
	import SpendChart from './_components/spend-chart.svelte';
	import TimeRangeSelect from '$lib/components/time-range-select.svelte';

	let { data }: PageProps = $props();

	const organization = $derived(page.data.activeOrganization);
	const balance = $derived(page.data.activeOrganizationBalance ?? 0);
	const organizationSlug = $derived(organization?.slug ?? '');

	const runningStatuses = new Set(['running', 'starting', 'stopping']);

	const runningServers = $derived(
		data.servers.filter((server) => runningStatuses.has(server.status)).slice(0, 5)
	);

	const errorServers = $derived(data.servers.filter((server) => server.status === 'error'));

	const lowBalanceThreshold = $derived(data.lowBalanceThreshold);
	const isLowBalance = $derived(balance < lowBalanceThreshold);

	const billingHref = $derived(
		resolve('/(protected)/[organizationSlug]/billing', { organizationSlug })
	);
	const serversHref = $derived(
		resolve('/(protected)/[organizationSlug]/servers', { organizationSlug })
	);
	const createServerHref = $derived(
		resolve('/(protected)/[organizationSlug]/servers/new', { organizationSlug })
	);
</script>

<svelte:head>
	<title>{organization?.name ?? 'Dashboard'} | ContainerMC</title>
</svelte:head>

<div class="space-y-8">
	<section class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold">{organization?.name}</h1>
			<p class="text-muted-foreground">Organization overview</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button href={createServerHref}>
				<PlusCircle />
				Create Server
			</Button>
			<Button href={billingHref} variant="outline">
				<CreditCard />
				Add Funds
			</Button>
		</div>
	</section>

	{#if isLowBalance}
		<Item.Root variant="outline" class="border-amber-500/50 bg-amber-500/5">
			<Item.Media>
				<TriangleAlert class="text-amber-500" />
			</Item.Media>
			<Item.Content>
				<Item.Title>Low balance</Item.Title>
				<Item.Description>
					Your balance is below {formatBalance(lowBalanceThreshold)}. Add funds to keep servers
					running.
				</Item.Description>
			</Item.Content>
			<Item.Actions>
				<Button href={billingHref} size="sm">Add Funds</Button>
			</Item.Actions>
		</Item.Root>
	{/if}

	{#if errorServers.length > 0}
		<Item.Root variant="outline" class="border-destructive/50 bg-destructive/5">
			<Item.Media>
				<TriangleAlert class="text-destructive" />
			</Item.Media>
			<Item.Content>
				<Item.Title>{errorServers.length} server{errorServers.length === 1 ? '' : 's'} in error</Item.Title>
				<Item.Description>
					{#each errorServers as server (server.id)}
						<a
							href={resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]', {
								organizationSlug,
								minecraftServerSlug: server.slug
							})}
							class="mr-2 underline underline-offset-4"
						>
							{server.name}
						</a>
					{/each}
				</Item.Description>
			</Item.Content>
		</Item.Root>
	{/if}

	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<StatCard title="Balance" value={formatBalance(balance)} href={billingHref} />
		<StatCard
			title="Running servers"
			value={String(data.servers.filter((server) => runningStatuses.has(server.status)).length)}
			href={serversHref}
		/>
		<StatCard title="Total servers" value={String(data.servers.length)} href={serversHref} />
		<StatCard
			title="Live burn rate"
			value="{formatBalance(data.liveBurnRate)}/hr"
			description="Current hourly spend across active sessions"
		/>
	</section>

	<section class="space-y-4">
		<Card.Root>
			<Card.Header>
				<Card.Title>Spend by server</Card.Title>
				<Card.Description>
					{formatBalance(data.rangeTotalSpend)} total in selected period
				</Card.Description>
				<Card.Action>
					<TimeRangeSelect value={data.range} />
				</Card.Action>
			</Card.Header>
			<Card.Content>
				<SpendChart
					data={data.spendChart}
					series={data.spendChartSeries}
					hasSpend={data.rangeTotalSpend > 0}
				/>
			</Card.Content>
		</Card.Root>
	</section>

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-medium">Running servers</h2>
			<Button href={serversHref} variant="link" class="px-0">View all servers</Button>
		</div>

		{#if data.servers.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media>
						<Containermc class="size-8" />
					</Empty.Media>
					<Empty.Title>Welcome to ContainerMC</Empty.Title>
					<Empty.Description>
						You haven't created any servers yet. Get started by creating your first server.
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button href={createServerHref}>
						<PlusCircle />
						Create Server
					</Button>
				</Empty.Content>
			</Empty.Root>
		{:else if runningServers.length > 0}
			<Item.Group>
				{#each runningServers as server (server.id)}
					<ServerItem {server} />
				{/each}
			</Item.Group>
		{:else}
			<p class="text-muted-foreground text-sm">
				No servers are running right now.
				<a href={serversHref} class="underline underline-offset-4">View all servers</a>
			</p>
		{/if}
	</section>

	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-medium">Recent activity</h2>
			<Button href={billingHref} variant="link" class="px-0">View all transactions</Button>
		</div>

		{#if data.recentTransactions.length > 0}
			<Item.Group>
				{#each data.recentTransactions as transaction (transaction.id)}
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
</div>
