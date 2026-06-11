<script lang="ts">
	import { getSidebarContext } from '$lib/context/sidebar-context';
	import type { LayoutProps } from './$types';
	import { onDestroy, onMount } from 'svelte';

	let { children, data }: LayoutProps = $props();

	const sidebar = getSidebarContext();

	onMount(() => {
		sidebar.activeOrganization = data.activeOrganization;
		sidebar.minecraftServers = data.minecraftServers;
	});

	onDestroy(() => {
		sidebar.activeOrganization = undefined;
		sidebar.minecraftServers = undefined;
	});
</script>

{@render children()}
