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
	import { getSidebarContext } from '$lib/context/sidebar-context';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import { resolve } from '$app/paths';

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

	const ctx = getSidebarContext();
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton {...props} size="lg">active org</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				{#each ctx.organizations as organization (organization.id)}
					<DropdownMenu.Item>
						<Item.Root>
							<Item.Media></Item.Media>
							<Item.Content>
								<Item.Title>{organization.name}</Item.Title>
							</Item.Content>
						</Item.Root>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.Header>
	<Sidebar.Content>
		{#if ctx.activeMinecraftServer}
			{@const { activeMinecraftServer } = ctx}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{activeMinecraftServer.name}</Sidebar.GroupLabel>
				<Sidebar.GroupContent></Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
		{#if ctx.activeOrganization}
			{@const { activeOrganization } = ctx}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{activeOrganization.name}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
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
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
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
