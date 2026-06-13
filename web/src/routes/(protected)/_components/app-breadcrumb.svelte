<script lang="ts">
	import { page } from '$app/state';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { getAppContext } from '$lib/context/app-context';

	const app = getAppContext();
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href="/">Home</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item>
			{#if page.route.id === '/(protected)/orgs'}
				<Breadcrumb.Page>Orgs</Breadcrumb.Page>
			{:else}
				<Breadcrumb.Link href="/orgs">Orgs</Breadcrumb.Link>
			{/if}
		</Breadcrumb.Item>
		{#if app.activeOrganization}
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				{#if app.activeMinecraftServer}
					<Breadcrumb.Link href={`/org/${app.activeOrganization.slug}/servers`}>
						{app.activeOrganization.name}
					</Breadcrumb.Link>
				{:else}
					<Breadcrumb.Page>{app.activeOrganization.name}</Breadcrumb.Page>
				{/if}
			</Breadcrumb.Item>
		{/if}
		{#if app.activeMinecraftServer && app.activeOrganization}
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href={`/org/${app.activeOrganization.slug}/servers`}>
					Servers
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>
					{app.activeMinecraftServer.name}
				</Breadcrumb.Page>
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</Breadcrumb.Root>
