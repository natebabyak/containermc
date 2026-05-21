<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { resetMode, setMode, userPrefersMode } from 'mode-watcher';

	const session = authClient.useSession();
</script>

<svelte:head>
	<title>Dashboard | ContainerMC</title>
	<meta name="description" content="" />
</svelte:head>
<Sidebar.Root>
	<Sidebar.Header>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child(props)}
					<Sidebar.MenuButton {...props}></Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					<DropdownMenu.Label>My Account</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item>Profile</DropdownMenu.Item>
					<DropdownMenu.Item>Billing</DropdownMenu.Item>
					<DropdownMenu.Item>Team</DropdownMenu.Item>
					<DropdownMenu.Item>Subscription</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Overview</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>Billing</Sidebar.MenuButton>
						<Sidebar.MenuButton>Usage</Sidebar.MenuButton>
						<Sidebar.MenuButton>Analytics</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Group />
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
							{$session.data.user.name}
							<EllipsisVertical class="ml-auto" />
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
								onValueChange={(value) =>
									value === 'system' ? resetMode() : setMode(value as 'light' | 'dark')}
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
					<DropdownMenu.Item>
						<LogOut />
						Sign Out
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.Footer>
</Sidebar.Root>
