<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import CloudIcon from '@lucide/svelte/icons/cloud';
	import Containermc from '$lib/components/icons/containermc.svelte';
	import { authClient } from '$lib/auth-client';

	let scrollY = $state(0);

	function handleScroll() {
		scrollY = window.scrollY;
	}

	const session = authClient.useSession();

	const activeOrganization = authClient.useActiveOrganization();
</script>

<svelte:head>
	<title>ContainerMC</title>
	<meta
		name="description"
		content="ContainerMC is the easiest and most cost-efficient way to deploy and manage Minecraft servers in the cloud."
	/>
</svelte:head>
<svelte:window onscroll={handleScroll} />
<header class="sticky top-0 bg-background">
	<div class={cn('flex items-center justify-between transition-all', scrollY > 0 ? 'p-4' : 'p-8')}>
		<a href={resolve('/')} class="flex items-center gap-2">
			<Containermc />
			<span class="font-serif text-2xl font-medium">ContainerMC</span>
		</a>
		{#if $session.data}
			<Button
				href={resolve('/(protected)/[organizationSlug]/dashboard', {
					organizationSlug: $activeOrganization.data?.slug ?? ''
				})}
			>
				Dashboard
			</Button>
		{:else}
			<div class="flex gap-2">
				<Button href={resolve('/sign-in')} variant="ghost">Sign in</Button>
				<Button href={resolve('/sign-up')} variant="outline">Sign up</Button>
			</div>
		{/if}
	</div>
	<div
		class={cn(
			'h-px w-full bg-border transition-opacity duration-500',
			scrollY > 0 ? 'opacity-100' : 'opacity-0'
		)}
	></div>
</header>
<main class="flex flex-col items-center [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-medium">
	<section class="flex min-h-[50vh] w-full max-w-xl flex-col justify-center gap-4">
		<h1 class="font-serif text-4xl leading-tight font-medium text-balance md:text-6xl">
			Deploy in Minutes. Scale in Seconds.
		</h1>
		<p class="text-balance">
			ContainerMC is the easiest and most cost-efficient way to deploy and manage Minecraft servers
			in the cloud.
		</p>
		<div class="flex gap-2">
			<Button
				href={resolve('/sign-up')}
				size="lg"
				class="border-primary bg-linear-to-b from-white/20 via-primary to-black/20"
			>
				Get Started
			</Button>
			<Button href={resolve('/pricing')} size="lg" variant="outline">See Pricing</Button>
		</div>
	</section>
	<Separator />
	<section class="p-4 md:p-8">
		<h2>Why ContainerMC?</h2>
		<Item.Root variant="muted">
			<Item.Media variant="icon">
				<SettingsIcon />
			</Item.Media>
			<Item.Content>
				<Item.Title>Cost-Effective</Item.Title>
				<Item.Description>
					Pay only for what you use, with no unexpected costs or hidden fees.
				</Item.Description>
			</Item.Content>
		</Item.Root>
		<Item.Root variant="muted">
			<Item.Media variant="icon">
				<CloudIcon />
			</Item.Media>
			<Item.Content>
				<Item.Title>Reliability</Item.Title>
				<Item.Description>
					Powered by AWS, our cloud deployment ensures 99.9% uptime.
				</Item.Description>
			</Item.Content>
		</Item.Root>
	</section>
</main>
<footer class="min-h-[50svh] border-t p-8">
	<p>&copy; 2026 Nate Babyak</p>
</footer>
