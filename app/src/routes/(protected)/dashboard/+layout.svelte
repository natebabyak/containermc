<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import DashboardSidebar from './dashboard-sidebar.svelte';

	let { children } = $props();
</script>

<Sidebar.Provider>
	<DashboardSidebar />
	<main>
		{@render children()}
	</main>
</Sidebar.Provider>
