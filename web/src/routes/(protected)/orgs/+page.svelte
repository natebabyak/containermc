<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>My Orgs | ContainerMC</title>
</svelte:head>

<Item.Group>
	{#each data.organizations as organization (organization.id)}
		<Item.Root variant="outline">
			{#snippet child({ props })}
				<a
					{...props}
					href={resolve('/(protected)/org/[organizationSlug]', {
						organizationSlug: organization.slug
					})}
				>
					<Item.Header>
						<Item.Title>
							{organization.name}
						</Item.Title>
					</Item.Header>
				</a>
			{/snippet}
		</Item.Root>
	{/each}
</Item.Group>
