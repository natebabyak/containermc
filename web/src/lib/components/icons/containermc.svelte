<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="var(--color-primary)"
	stroke="var(--color-primary)"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
>
	<path
		d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
	/>
	<path d="m3.3 7 8.7 5 8.7-5" stroke="white" stroke-width="2" />
	<path d="M12 22V12" stroke="white" stroke-width="2" />
</svg>
