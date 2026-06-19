<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';

	interface Props {
		title: string;
		value: string;
		description?: string;
		href?: string;
	}

	let { title, value, description, href }: Props = $props();
</script>

<Card.Root>
	<Card.Header class="pb-2">
		<Card.Description>{title}</Card.Description>
		<Card.Title class="text-2xl">
			{#if href}
				<a {href} class="hover:underline">{value}</a>
			{:else}
				{value}
			{/if}
		</Card.Title>
	</Card.Header>
	{#if description}
		<Card.Content>
			<p class="text-muted-foreground text-xs">{description}</p>
		</Card.Content>
	{/if}
</Card.Root>
