<script lang="ts">
	import AutodepositForm from './autodeposit-form.svelte';
	import type { PageProps } from './$types';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Billing | ContainerMC</title>
	<meta name="description" content="" />
</svelte:head>
<div
	class="space-y-4 p-8 [&_h1]:text-4xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-medium [&>section]:space-y-4"
>
	<section>
		<h1>
			{new Intl.NumberFormat('en-US', {
				style: 'currency',
				currency: 'USD'
			}).format(Number(data.balance))} remaining
		</h1>
		<p>1,234 estimated hours</p>
	</section>
	<section>
		<h2>Add Funds</h2>
		<Item.ItemGroup>
			{#each [5, 10, 25, 50, 100] as amount (amount)}
				<Item.Root variant="outline">
					<Item.Content>
						<Item.Title>${amount}</Item.Title>
					</Item.Content>
					<Item.Actions>
						<Button size="sm">Add funds</Button>
					</Item.Actions>
				</Item.Root>
			{/each}
		</Item.ItemGroup>
	</section>
	<Separator />
	<section>
		<h2>Autodeposit</h2>
		<AutodepositForm paymentMethods={data.paymentMethods} />
	</section>
</div>
