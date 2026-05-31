<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardBreadcrumb from './_components/dashboard-breadcrumb.svelte';
	import DashboardSidebar from './_components/dashboard-sidebar.svelte';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar balance={data.balance} servers={data.servers} />
	<div class="flex size-full flex-col">
		<header class="p-4">
			<DashboardBreadcrumb servers={data.servers} />
		</header>
		<main class="size-full flex-1">
			{@render children()}
		</main>
	</div>
</Sidebar.Provider>
