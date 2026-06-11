<script lang="ts">
	import { getSidebarContext } from '$lib/context/sidebar-context';
	import { onDestroy, onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const sidebar = getSidebarContext();

	onMount(() => {
		sidebar.activeMinecraftServer = data.activeMinecraftServer;
	});

	onDestroy(() => {
		sidebar.activeMinecraftServer = undefined;
	});
</script>

{@render children()}
