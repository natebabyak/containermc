<script lang="ts">
	import { getSidebarContext } from '$lib/context/sidebar-context';
	import type { LayoutProps } from './$types';
	import { onMount } from 'svelte';

	let { children, data }: LayoutProps = $props();

	const sidebar = getSidebarContext();

	onMount(() => {
		sidebar.activeMinecraftServer = data.activeMinecraftServer;
	});
</script>

{@render children()}
