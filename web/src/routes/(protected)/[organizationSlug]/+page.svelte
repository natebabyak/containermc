<script lang="ts">
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Dashboard</h1>
<Item.Root variant="outline">
	<Item.Header>
		<Item.Title>Servers</Item.Title>
	</Item.Header>
</Item.Root>
