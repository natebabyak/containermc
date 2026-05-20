<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { blur } from 'svelte/transition';
	import Container from '@lucide/svelte/icons/container';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { sineOut } from 'svelte/easing';
	import { cn } from '$lib/utils';
	import * as Item from '$lib/components/ui/item/index.js';

	let scrollY = $state(0);

	function handleScroll() {
		scrollY = window.scrollY;
	}

	let isGetStartedButtonHovered = $state(false);
</script>

<svelte:window onscroll={handleScroll} />

<header class="sticky top-0 bg-background">
	<div class="flex items-center justify-between p-8">
		<NavigationMenu.Root>
			<NavigationMenu.List>
				<NavigationMenu.Item>
					<NavigationMenu.Link>
						{#snippet child()}
							<a href={resolve('/')} class={navigationMenuTriggerStyle()}>
								<Container />
							</a>
						{/snippet}
					</NavigationMenu.Link>
				</NavigationMenu.Item>
			</NavigationMenu.List>
		</NavigationMenu.Root>
		<div class="flex gap-2">
			<Button href={resolve('/sign-in')} variant="ghost">Sign in</Button>
			<Button href={resolve('/sign-up')} variant="outline">Sign up</Button>
		</div>
	</div>
	<div
		class={cn(
			'h-px w-full bg-border transition-opacity duration-500',
			scrollY > 0 ? 'opacity-100' : 'opacity-0'
		)}
	></div>
</header>
<main>
	<article class="flex flex-col items-center">
		<section class="flex min-h-[50vh] w-full max-w-xl flex-col justify-center gap-4">
			<h1 class="text-4xl leading-tight font-medium text-balance md:text-6xl">
				Deploy in Minutes. Scale in Seconds.
			</h1>
			<p class="text-balance">
				ContainerMC is the easiest way to deploy and manage Minecraft servers of any size. Whether
				it's just you and your friends or tens of thousands of players, ContainerMC has you covered.
			</p>
			<div class="flex gap-2">
				<Button
					href={resolve('/sign-up')}
					onmouseenter={() => (isGetStartedButtonHovered = true)}
					onmouseleave={() => (isGetStartedButtonHovered = false)}
					size="lg"
				>
					Get Started
					<div class="relative size-4">
						{#if isGetStartedButtonHovered}
							<div transition:blur={{ easing: sineOut }} class="absolute">
								<ArrowRight />
							</div>
						{:else}
							<div transition:blur={{ easing: sineOut }} class="absolute">
								<ChevronRight />
							</div>
						{/if}
					</div>
				</Button>
				<Button href={resolve('/pricing')} size="lg" variant="outline">See Pricing</Button>
			</div>
		</section>
		<section class="grid w-full grid-cols-3 gap-px bg-border"></section>
	</article>
</main>
<footer class="min-h-[50svh] border-t p-8">
	<p>&copy; 2026 Nate Babyak</p>
</footer>
