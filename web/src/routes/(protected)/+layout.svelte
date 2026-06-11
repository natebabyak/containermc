<script lang="ts">
	import AppSidebar from './_components/app-sidebar.svelte';
	import type { LayoutProps } from './$types';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { setSidebarContext, type SidebarContext } from '$lib/context/sidebar-context';

	let { children, data }: LayoutProps = $props();

	const sidebar = $state<SidebarContext>({
		get organizations() {
			return data.organizations;
		}
	});

	setSidebarContext(sidebar);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<div class="flex size-full flex-col">
		<header class="p-4">breadcrumb goes here</header>
		<main class="flex-1 [&_h1]:text-lg">
			{@render children()}
		</main>
	</div>
</Sidebar.Provider>
