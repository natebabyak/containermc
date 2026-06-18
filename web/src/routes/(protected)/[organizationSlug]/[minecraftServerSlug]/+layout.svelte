<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { LayoutProps } from './$types';
	import { getAppContext } from '$lib/context/app-context';

	let { children, data }: LayoutProps = $props();

	const app = getAppContext();

	onMount(() => {
		app.activeMinecraftServer = data.activeMinecraftServer;
	});

	onDestroy(() => {
		app.activeMinecraftServer = undefined;
	});
</script>

{@render children()}
