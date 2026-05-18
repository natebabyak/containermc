<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	const PLANS = [
		{
			title: 'Self-hosted',
			description: ''
		},
		{
			title: 'Managed',
			description: ''
		}
	];
</script>

<main>
	<h1>Pricing that just makes sense</h1>
	<div class="grid grid-cols-2 gap-4">
		{#each PLANS as plan, i (i)}
			<Card.Root>
				<Card.Header>
					<Card.Title>{plan.title}</Card.Title>
					<Card.Description>{plan.description}</Card.Description>
				</Card.Header>
				<Card.Content></Card.Content>
				<Card.Footer>Learn more</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</main>
