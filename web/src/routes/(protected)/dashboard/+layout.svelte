<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardBreadcrumb from './_components/dashboard-breadcrumb.svelte';
	import DashboardSidebar from './dashboard-sidebar.svelte';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar balance={data.balance} />
	<main class="size-full">
		<DashboardBreadcrumb pathname={page.url.pathname} />
		{@render children()}
	</main>
</Sidebar.Provider>
