<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { resetMode, setMode, userPrefersMode } from 'mode-watcher';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import ChevronsDownUpIcon from '@lucide/svelte/icons/chevrons-down-up';
	import { resolve } from '$app/paths';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import ServerIcon from '@lucide/svelte/icons/server';
	import * as Item from '$lib/components/ui/item/index.js';
	import type { Server } from '$lib/types';
	import { blur } from 'svelte/transition';
	import { CURRENCIES } from '$lib/constants';
	import { getCurrency, setCurrency } from '$lib/state/currency.svelte';

	interface Props {
		balance: string;
		servers: Server[];
	}

	let { balance, servers }: Props = $props();

	const session = authClient.useSession();

	let serversOpen = $state(false);
	let accountOpen = $state(false);
</script>

<Sidebar.Root>
	<Sidebar.Header class="border-b">
		<DropdownMenu.Root bind:open={serversOpen}>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton {...props} size="lg">
						<ServerIcon />
						Servers
						<div class="relative ml-auto size-4">
							{#if serversOpen}
								<div transition:blur={{ duration: 150 }} class="absolute">
									<ChevronsDownUpIcon />
								</div>
							{:else}
								<div transition:blur={{ duration: 150 }} class="absolute">
									<ChevronsUpDownIcon />
								</div>
							{/if}
						</div>
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Label>My Servers</DropdownMenu.Label>
				{#each servers as server (server.id)}
					<DropdownMenu.Item>
						<Item.Root>
							{#snippet child({ props })}
								<a {...props} href={resolve(`/dashboard/servers/${server.slug}`)}>
									<Item.Content>
										<Item.Title>{server.name}</Item.Title>
										<Item.Description>{server.slug}</Item.Description>
									</Item.Content>
								</a>
							{/snippet}
						</Item.Root>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a {...props} href={resolve('/dashboard/analytics')}>Analytics</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a {...props} href={resolve('/dashboard/billing')}>
									<CreditCardIcon />
									Billing
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a {...props} href={resolve('/dashboard/servers')}>
									<ServerIcon />
									Servers
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a {...props} href={resolve('/dashboard/settings')}> Settings </a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Resources</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>What is a Container?</Sidebar.MenuButton>
						<Sidebar.MenuButton>Self-Hosting Guide</Sidebar.MenuButton>
						<Sidebar.MenuButton>Pricing Calculator</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="border-t">
		<DropdownMenu.Root bind:open={accountOpen}>
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
									{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
										Number(balance)
									)}
									remaining
								</span>
							</div>
							<div class="relative ml-auto size-4">
								{#if accountOpen}
									<div transition:blur={{ duration: 150 }} class="absolute">
										<ChevronsDownUpIcon />
									</div>
								{:else}
									<div transition:blur={{ duration: 150 }} class="absolute">
										<ChevronsUpDownIcon />
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
						<DropdownMenu.SubTrigger>Currency</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.Label>Currency</DropdownMenu.Label>
							<DropdownMenu.RadioGroup bind:value={getCurrency, setCurrency}>
								{#each CURRENCIES as currency (currency.code)}
									<DropdownMenu.RadioItem value={currency.code}>
										<span>
											{currency.code}
											<span>{currency.symbol}</span>
										</span>
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
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
									<MonitorIcon />
									System
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="light">
									<SunIcon />
									Light
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="dark">
									<MoonIcon />
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
						<LogOutIcon />
						Sign Out
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.Footer>
</Sidebar.Root>
