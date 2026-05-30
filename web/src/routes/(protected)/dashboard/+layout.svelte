<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardBreadcrumb from './_components/dashboard-breadcrumb.svelte';
	import DashboardSidebar from './_components/dashboard-sidebar.svelte';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar balance={data.balanceCents} servers={data.servers} />
	<main class="size-full space-y-4 p-4">
		<DashboardBreadcrumb servers={data.servers} />
		{@render children()}
	</main>
</Sidebar.Provider>
