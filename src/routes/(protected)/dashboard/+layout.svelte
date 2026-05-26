<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardSidebar from './dashboard-sidebar.svelte';

	let { children, data } = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar balance={data.balance} />
	<main class="size-full">
		{@render children()}
	</main>
</Sidebar.Provider>
