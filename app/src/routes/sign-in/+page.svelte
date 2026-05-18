<script lang="ts">
	import { resolve } from '$app/paths';
	import AuthButtons from '$lib/components/auth/auth-buttons.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
</script>

<div class="flex h-screen w-screen flex-col items-center justify-center">
	<Field.Set class="w-full max-w-sm">
		<Field.Legend>Welcome back</Field.Legend>
		<Field.Description>Sign in to your account</Field.Description>
		<AuthButtons />
		<Field.Group>
			<Field.Field>
				<Field.Label for="name">Full name</Field.Label>
				<Input id="name" autocomplete="off" placeholder="Evil Rabbit" />
				<Field.Description>This appears on invoices and emails.</Field.Description>
			</Field.Field>
			<Field.Field>
				<Field.Label for="email">Email</Field.Label>
				<Input id="email" />
			</Field.Field>
			<Field.Field>
				<Field.Label for="password">Password</Field.Label>
				<InputGroup.Root>
					<InputGroup.Input
						id="password"
						placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
						type="password"
					/>
				</InputGroup.Root>
			</Field.Field>
			<Field.Field></Field.Field>
		</Field.Group>
	</Field.Set>
	<p>
		Don't have an account? <Button href={resolve('/sign-up')} variant="link">Sign up</Button>
	</p>
</div>
