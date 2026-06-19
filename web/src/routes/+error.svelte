<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-4">
	<h1 class="font-serif text-4xl">{page.status}: {page.error?.message}</h1>
	<div class="flex gap-2">
		<Button href={resolve('/(protected)/dashboard')}>Dashboard</Button>
		<Button href={resolve('/')} variant="outline">Home</Button>
	</div>
</div>
