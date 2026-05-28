<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardBreadcrumb from './_components/dashboard-breadcrumb.svelte';
	import DashboardSidebar from './_components/dashboard-sidebar.svelte';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar balance={data.balance} servers={data.servers} />
	<main class="size-full space-y-4 p-4">
		<DashboardBreadcrumb pathname={page.url.pathname} servers={data.servers} />
		{@render children()}
	</main>
</Sidebar.Provider>
