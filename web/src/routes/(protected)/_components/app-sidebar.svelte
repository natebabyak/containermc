<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import { resolve } from '$app/paths';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Settings from '@lucide/svelte/icons/settings';
	import Server from '@lucide/svelte/icons/server';
	import History from '@lucide/svelte/icons/history';
	import Earth from '@lucide/svelte/icons/earth';
	import { page } from '$app/state';
	import Gauge from '@lucide/svelte/icons/gauge';
	import { getAppContext } from '$lib/context/app-context';
	import OrganizationMenu from './organization-menu.svelte';
	import UserMenu from './user-menu.svelte';

	const app = getAppContext();
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b">
		<OrganizationMenu />
	</Sidebar.Header>
	<Sidebar.Content>
		{#if app.activeMinecraftServer && app.activeOrganization}
			{@const { activeMinecraftServer, activeOrganization } = app}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Server</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id === '/(protected)/[organizationSlug]/[minecraftServerSlug]'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]', {
											organizationSlug: activeOrganization.slug,
											minecraftServerSlug: activeMinecraftServer.slug
										})}
									>
										<Gauge />
										Dashboard
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id ===
									'/(protected)/[organizationSlug]/[minecraftServerSlug]/backups'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]/backups', {
											organizationSlug: activeOrganization.slug,
											minecraftServerSlug: activeMinecraftServer.slug
										})}
									>
										<Earth />
										Backups
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id ===
									'/(protected)/[organizationSlug]/[minecraftServerSlug]/sessions'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve(
											'/(protected)/[organizationSlug]/[minecraftServerSlug]/sessions',
											{
												organizationSlug: activeOrganization.slug,
												minecraftServerSlug: activeMinecraftServer.slug
											}
										)}
									>
										<History />
										Sessions
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id ===
									'/(protected)/[organizationSlug]/[minecraftServerSlug]/settings'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve(
											'/(protected)/[organizationSlug]/[minecraftServerSlug]/settings',
											{
												organizationSlug: activeOrganization.slug,
												minecraftServerSlug: activeMinecraftServer.slug
											}
										)}
									>
										<Settings />
										Settings
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
		{#if app.activeOrganization}
			{@const { activeOrganization } = app}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{activeOrganization.name}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={page.route.id === '/(protected)/[organizationSlug]'}>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]', {
											organizationSlug: activeOrganization.slug
										})}
									>
										<Gauge />
										Dashboard
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id === '/(protected)/[organizationSlug]/billing'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]/billing', {
											organizationSlug: activeOrganization.slug
										})}
									>
										<CreditCard />
										Billing
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id === '/(protected)/[organizationSlug]/members'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]/members', {
											organizationSlug: activeOrganization.slug
										})}
									>
										<UsersRound />
										Members
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id === '/(protected)/[organizationSlug]/servers'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]/servers', {
											organizationSlug: activeOrganization.slug
										})}
									>
										<Server />
										Servers
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={page.route.id === '/(protected)/[organizationSlug]/settings'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/[organizationSlug]/settings', {
											organizationSlug: activeOrganization.slug
										})}
									>
										<Settings />
										Settings
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
		<Sidebar.Group>
			<Sidebar.GroupLabel>Resources</Sidebar.GroupLabel>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="border-t">
		<UserMenu />
	</Sidebar.Footer>
</Sidebar.Root>
