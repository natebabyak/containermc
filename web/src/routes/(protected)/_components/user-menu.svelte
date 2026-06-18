<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { authClient } from '$lib/auth-client';
	import { resetMode, setMode, userPrefersMode } from 'mode-watcher';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Moon from '@lucide/svelte/icons/moon';
	import Sun from '@lucide/svelte/icons/sun';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import { blur } from 'svelte/transition';
	import X from '@lucide/svelte/icons/x';

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

	let open = $state(false);
</script>

<DropdownMenu.Root bind:open>
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
						<span class="text-xs text-muted-foreground">
							{$session.data.user.email}
						</span>
					</div>
					<div class="ml-auto size-4">
						{#if open}
							<div transition:blur class="absolute">
								<X />
							</div>
						{:else}
							<div transition:blur class="absolute">
								<ChevronsUpDown />
							</div>
						{/if}
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
