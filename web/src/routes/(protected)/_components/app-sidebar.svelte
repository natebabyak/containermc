<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { authClient } from '$lib/auth-client';
	import { resetMode, setMode, userPrefersMode } from 'mode-watcher';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import { resolve } from '$app/paths';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import Settings from '@lucide/svelte/icons/settings';
	import Server from '@lucide/svelte/icons/server';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import History from '@lucide/svelte/icons/history';
	import Earth from '@lucide/svelte/icons/earth';
	import { page } from '$app/state';
	import Gauge from '@lucide/svelte/icons/gauge';
	import { getAppContext } from '$lib/context/app-context';

	let session = authClient.useSession();

	function handleModeValueChange(value: string) {
		if (value === 'system') {
			resetMode();
		} else {
			setMode(value as 'light' | 'dark');
		}
	}

	function signOut() {
		authClient.signOut();
	}

	const app = getAppContext();
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b">
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
										href={resolve('/(protected)/org/[organizationSlug]', {
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
								isActive={page.route.id ===
									'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve(
											'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]',
											{
												organizationSlug: activeOrganization.slug,
												minecraftServerSlug: activeMinecraftServer.slug
											}
										)}
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
									'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]/backups'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve(
											'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]/backups',
											{
												organizationSlug: activeOrganization.slug,
												minecraftServerSlug: activeMinecraftServer.slug
											}
										)}
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
									'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]/sessions'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve(
											'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]/sessions',
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
									'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]/settings'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve(
											'/(protected)/org/[organizationSlug]/server/[minecraftServerSlug]/settings',
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
							<Sidebar.MenuButton
								isActive={page.route.id === '/(protected)/org/[organizationSlug]'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/org/[organizationSlug]', {
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
								isActive={page.route.id === '/(protected)/org/[organizationSlug]/billing'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/org/[organizationSlug]/billing', {
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
								isActive={page.route.id === '/(protected)/org/[organizationSlug]/members'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/org/[organizationSlug]/members', {
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
								isActive={page.route.id === '/(protected)/org/[organizationSlug]/servers'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/org/[organizationSlug]/servers', {
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
								isActive={page.route.id === '/(protected)/org/[organizationSlug]/settings'}
							>
								{#snippet child({ props })}
									<a
										{...props}
										href={resolve('/(protected)/org/[organizationSlug]/settings', {
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
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					{#if $session.data}
						<Sidebar.MenuButton {...props} size="lg">
							<Avatar.Root>
								<Avatar.Image src={$session.data.user.image ?? undefined} />
								<Avatar.Fallback>{$session.data.user.name.charAt(0).toUpperCase()}</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex flex-col">
								<span>{$session.data.user.name}</span>
								<span class="text-xs text-muted-foreground"> 10 remaining </span>
							</div>
						</Sidebar.MenuButton>
					{/if}
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Label>Preferences</DropdownMenu.Label>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>Mode</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Label>Mode</DropdownMenu.Label>
							<DropdownMenu.RadioGroup
								value={userPrefersMode.current}
								onValueChange={handleModeValueChange}
							>
								<DropdownMenu.RadioItem value="system">
									<Monitor />
									System
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="light">
									<Sun />
									Light
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="dark">
									<Moon />
									Dark
								</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Label>Account</DropdownMenu.Label>
					<DropdownMenu.Item onclick={signOut}>
						<LogOut />
						Sign Out
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.Footer>
</Sidebar.Root>
