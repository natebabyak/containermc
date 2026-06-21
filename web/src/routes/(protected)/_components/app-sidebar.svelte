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
	import Building2 from '@lucide/svelte/icons/building-2';
	import Plus from '@lucide/svelte/icons/plus';
	import { getAppContext } from '$lib/context/app-context';
	import OrganizationMenu from './organization-menu.svelte';
	import UserMenu from './user-menu.svelte';

	const app = getAppContext();

	function formatStatus(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b">
		<OrganizationMenu />
	</Sidebar.Header>
	<Sidebar.Content>
		{#if !app.activeOrganization}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Organizations</Sidebar.GroupLabel>
				<Sidebar.GroupAction>
					{#snippet child({ props })}
						<a {...props} href={resolve('/(protected)/orgs/new')}>
							<Plus />
							<span class="sr-only">Create organization</span>
						</a>
					{/snippet}
				</Sidebar.GroupAction>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#if app.organizations.length === 0}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a
											{...props}
											href={resolve('/(protected)/orgs/new')}
											class="text-muted-foreground"
										>
											<Plus />
											Create your first organization
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{:else}
							{#each app.organizations as organization (organization.id)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton tooltipContent={organization.name}>
										{#snippet child({ props })}
											<a
												{...props}
												href={resolve('/(protected)/[organizationSlug]', {
													organizationSlug: organization.slug
												})}
											>
												<Building2 />
												<span>{organization.name}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
									{#if organization.isPersonal}
										<Sidebar.MenuBadge>Personal</Sidebar.MenuBadge>
									{/if}
								</Sidebar.MenuItem>
							{/each}
						{/if}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{:else if app.minecraftServers}
			{@const { activeOrganization, minecraftServers } = app}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Servers</Sidebar.GroupLabel>
				<Sidebar.GroupAction>
					{#snippet child({ props })}
						<a
							{...props}
							href={resolve('/(protected)/[organizationSlug]/servers/new', {
								organizationSlug: activeOrganization.slug
							})}
						>
							<Plus />
							<span class="sr-only">Create server</span>
						</a>
					{/snippet}
				</Sidebar.GroupAction>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#if minecraftServers.length === 0}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton>
									{#snippet child({ props })}
										<a
											{...props}
											href={resolve('/(protected)/[organizationSlug]/servers/new', {
												organizationSlug: activeOrganization.slug
											})}
											class="text-muted-foreground"
										>
											<Plus />
											No servers yet
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{:else}
							{#each minecraftServers as server (server.id)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton
										isActive={app.activeMinecraftServer?.slug === server.slug}
										tooltipContent={server.name}
									>
										{#snippet child({ props })}
											<a
												{...props}
												href={resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]', {
													organizationSlug: activeOrganization.slug,
													minecraftServerSlug: server.slug
												})}
											>
												<Server />
												<span>{server.name}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
									<Sidebar.MenuBadge>{formatStatus(server.status)}</Sidebar.MenuBadge>
								</Sidebar.MenuItem>
							{/each}
						{/if}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}

		{#if app.activeOrganization}
			<Sidebar.Separator />

			{#if app.activeMinecraftServer}
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
	</Sidebar.Content>
	<Sidebar.Footer class="border-t">
		<UserMenu />
	</Sidebar.Footer>
</Sidebar.Root>
