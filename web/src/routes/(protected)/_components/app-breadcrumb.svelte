<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { buildAppBreadcrumbs } from '$lib/breadcrumbs';
	import { getAppContext } from '$lib/context/app-context';

	const app = getAppContext();

	const items = $derived(
		buildAppBreadcrumbs(page.url.pathname, {
			organization: app.activeOrganization,
			minecraftServer: app.activeMinecraftServer,
			minecraftServerSlugs: app.minecraftServers?.map((server) => server.slug)
		})
	);
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each items as item, index (index)}
			{#if index > 0}
				<Breadcrumb.Separator />
			{/if}
			<Breadcrumb.Item>
				{#if item.href}
					<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
				{:else}
					<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
				{/if}
			</Breadcrumb.Item>
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
