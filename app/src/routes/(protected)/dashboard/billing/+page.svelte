<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { PageProps } from './$types';

	const AMOUNTS = [5, 10, 25, 50, 100];

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Billing | ContainerMC</title>
	<meta name="description" content="" />
</svelte:head>
<h1>Billing</h1>
<h2>Balance</h2>
<p>${data.balance}.00</p>
<h2>Autodeposit</h2>
<form>
	<Field.Group>
		<Field.Field orientation="horizontal">
			<Checkbox />
			<Field.Label>Enabled?</Field.Label>
		</Field.Field>
		<Field.Field>
			<Field.Label>Autodeposit Amount</Field.Label>
			<Select.Root type="single">
				<Select.Trigger>Select amount</Select.Trigger>
				<Select.Content>
					<Select.Group>
						{#each AMOUNTS as amount (amount)}
							<Select.Item value={String(amount)}>{amount}</Select.Item>
						{/each}
					</Select.Group>
				</Select.Content>
			</Select.Root>
		</Field.Field>
	</Field.Group>
</form>
<RadioGroup.Root>
	{#each data.paymentMethods as paymentMethod (paymentMethod.id)}
		<RadioGroup.Item value={paymentMethod.id}>
			{paymentMethod.id}
		</RadioGroup.Item>
	{/each}
</RadioGroup.Root>
