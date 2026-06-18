<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { scale } from 'svelte/transition';

	interface Props {
		address: string;
	}

	let { address }: Props = $props();

	let copied = $state(false);

	function copyAddress() {
		navigator.clipboard.writeText(address);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 3000);
	}
</script>

<Button onclick={copyAddress} size="xs" variant="outline">
	<div class="relative size-3">
		{#if copied}
			<div transition:scale class="absolute">
				<CheckIcon />
			</div>
		{:else}
			<div transition:scale class="absolute">
				<CopyIcon />
			</div>
		{/if}
	</div>
	{copied ? 'Copied!' : 'Copy Address'}
</Button>
