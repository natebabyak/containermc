<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';

	interface Props {
		pathname: string;
	}

	let { pathname }: Props = $props();

	let crumbs = $derived(pathname.split('/').filter(Boolean));
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each crumbs as crumb, i (i)}
			<Breadcrumb.Item>
				{@const path = crumbs.slice(1, i + 1).join('/')}
				<Breadcrumb.Link href={path} class="capitalize">
					{crumb}
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			{#if i < crumbs.length - 1}
				<Breadcrumb.Separator />
			{/if}
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
