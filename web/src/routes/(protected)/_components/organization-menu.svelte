<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { resolve } from '$app/paths';
	import { getAppContext } from '$lib/context/app-context';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	const app = getAppContext();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Sidebar.MenuButton {...props} size="lg">
				{app.activeOrganization?.name ?? 'Select org'}
				<ChevronsUpDown class="ml-auto" />
			</Sidebar.MenuButton>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Label>My Orgs</DropdownMenu.Label>
		<DropdownMenu.Group>
			{#each app.organizations as organization (organization.id)}
				<DropdownMenu.Item>
					<Item.Root size="xs">
						{#snippet child({ props })}
							<a
								{...props}
								href={resolve('/(protected)/[organizationSlug]', {
									organizationSlug: organization.slug
								})}
							>
								<Item.Content>
									<Item.Title>{organization.name}</Item.Title>
								</Item.Content>
							</a>
						{/snippet}
					</Item.Root>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
