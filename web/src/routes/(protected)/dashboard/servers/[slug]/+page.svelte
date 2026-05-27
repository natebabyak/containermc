<script lang="ts">
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import type { LayoutProps } from './$types';
	import SquareTerminal from '@lucide/svelte/icons/square-terminal';

	let { data }: LayoutProps = $props();
</script>

<svelte:head>
	<title>{data.server.name} - ContainerMC</title>
</svelte:head>
<div>
	<InputGroup.Root>
		<InputGroup.Input placeholder="Enter command..." />
		<InputGroup.Addon>
			<SquareTerminal />
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
