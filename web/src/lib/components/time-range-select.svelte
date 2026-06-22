<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getRangeLabel, TIME_RANGES, type TimeRange } from '$lib/time-range';

	const OPTIONS = TIME_RANGES.map((value) => ({
		value,
		label: getRangeLabel(value)
	}));

	interface Props {
		value: TimeRange;
	}

	let { value }: Props = $props();

	const selectedLabel = $derived(getRangeLabel(value));

	function onRangeChange(next: string) {
		const url = new URL(page.url);
		url.searchParams.set('range', next);
		goto(`${url.pathname}?${url.searchParams.toString()}`, { invalidateAll: true });
	}
</script>

<Select.Root type="single" {value} onValueChange={onRangeChange}>
	<Select.Trigger class="w-[180px]">{selectedLabel}</Select.Trigger>
	<Select.Content>
		<Select.Group>
			{#each OPTIONS as option (option.value)}
				<Select.Item value={option.value}>{option.label}</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
