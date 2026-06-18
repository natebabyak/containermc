<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { LayoutProps } from './$types';
	import { getAppContext } from '$lib/context/app-context';

	let { children, data }: LayoutProps = $props();

	const app = getAppContext();

	onMount(() => {
		app.activeOrganization = data.activeOrganization;
		app.minecraftServers = data.minecraftServers;
	});

	onDestroy(() => {
		app.activeOrganization = undefined;
		app.minecraftServers = undefined;
	});
</script>

{@render children()}
