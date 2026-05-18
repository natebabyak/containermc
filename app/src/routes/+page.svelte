<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as NavigationMenu from '$lib/components/ui/navigation-menu/index.js';
	import { navigationMenuTriggerStyle } from '$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte';
</script>

<header class="sticky flex items-center justify-between p-8">
	<NavigationMenu.Root>
		<NavigationMenu.List>
			<NavigationMenu.Item>
				<NavigationMenu.Link>
					{#snippet child()}
						<a href={resolve('/')} class={navigationMenuTriggerStyle()}> ContainerMC </a>
					{/snippet}
				</NavigationMenu.Link>
			</NavigationMenu.Item>
		</NavigationMenu.List>
	</NavigationMenu.Root>
	<div class="flex gap-2">
		<Button href={resolve('/sign-in')} variant="ghost">Sign in</Button>
		<Button href={resolve('/sign-up')} variant="outline">Sign up</Button>
	</div>
</header>
<main>
	<article>
		<h1 class="text-5xl text-balance">Deploy in Minutes. Manage in Seconds.</h1>
		<p class="text-balance">
			ContainerMC makes it easy to deploy and manage Minecraft servers of any size. Whether it's
			just you and your friends or tens of thousands of players, ContainerMC has you covered.
		</p>
		<div class="flex gap-2">
			<Button href={resolve('/sign-up')} size="lg">Get Started</Button>
			<Button href={resolve('/pricing')} size="lg" variant="outline">See pricing</Button>
		</div>
	</article>
</main>
<footer class="min-h-[50svh] border-t p-8">
	<p>&copy; 2026 Nate Babyak</p>
</footer>
