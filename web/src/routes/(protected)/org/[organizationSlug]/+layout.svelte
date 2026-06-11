<script lang="ts">
	import { getSidebarContext } from '$lib/context/sidebar-context';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const sidebar = getSidebarContext();

	onMount(() => {
		sidebar.activeOrganization = data.activeOrganization;
		sidebar.minecraftServers = data.minecraftServers;
	});
</script>

{@render children()}
