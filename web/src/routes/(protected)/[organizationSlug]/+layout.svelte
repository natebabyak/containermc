<script lang="ts">
	import { getAppContext } from '$lib/context/app-context';
	import type { LayoutProps } from './$types';
	import { onDestroy, onMount } from 'svelte';

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
