<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import type { Server } from '$lib/types';

	interface Props {
		pathname: string;
		servers: Server[];
	}

	let { pathname, servers }: Props = $props();

	let crumbs = $derived(
		pathname
			.split('/')
			.filter(Boolean)
			.map((segment, i, arr) => {
				const path = '/' + arr.slice(0, i + 1).join('/');
				const isSlug = arr[i - 1] === 'servers';
				const label = isSlug ? (servers.find((s) => s.slug === segment)?.name ?? segment) : segment;
				return { label, path };
			})
	);
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each crumbs as crumb, i (i)}
			<Breadcrumb.Item>
				{#if i === crumbs.length - 1}
					<Breadcrumb.Page class="capitalize">{crumb.label}</Breadcrumb.Page>
				{:else}
					<Breadcrumb.Link href={crumb.path} class="capitalize">{crumb.label}</Breadcrumb.Link>
				{/if}
			</Breadcrumb.Item>
			{#if i < crumbs.length - 1}
				<Breadcrumb.Separator />
			{/if}
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
