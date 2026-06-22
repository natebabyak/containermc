<script lang="ts">
	import type { LayoutProps } from './$types';
	import AppBreadcrumb from './_components/app-breadcrumb.svelte';
	import AppSidebar from './_components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { resolve } from '$app/paths';
	import { setAppContext, type AppContext } from '$lib/context/app-context';

	let { children, data }: LayoutProps = $props();

	const app = $state<AppContext>({
		get organizations() {
			return data.organizations;
		}
	});

	setAppContext(app);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<div class="flex size-full min-h-screen min-w-0 flex-col">
		<header class="sticky top-0 z-50 flex items-center gap-2 border-b bg-background p-4">
			<Sidebar.Trigger />
			<AppBreadcrumb />
		</header>
		<main class="min-w-0 flex-1 overflow-x-hidden p-4">
			{@render children()}
		</main>
		<footer
			class="border-t p-8 text-center text-xs text-muted-foreground [&>a]:underline [&>a]:underline-offset-4"
		>
			&copy; 2026 Nate Babyak &bull; <a href={resolve('/privacy')}>Privacy Policy</a>
			&bull; <a href={resolve('/terms')}>Terms of Service</a>
		</footer>
	</div>
</Sidebar.Provider>
