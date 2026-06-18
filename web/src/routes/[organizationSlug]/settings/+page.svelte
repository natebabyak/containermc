<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.activeOrganization.name} Settings | ContainerMC</title>
</svelte:head>

<h1>{data.activeOrganization.name} Settings</h1>
