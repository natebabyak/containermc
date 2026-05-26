<script lang="ts">
	import { resolve } from '$app/paths';
	import AuthButtons from '$lib/components/auth/auth-buttons.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { authClient } from '$lib/auth-client';
	import { createForm } from '@tanstack/svelte-form';
	import z from 'zod';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import { scale } from 'svelte/transition';

	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		email: z.email(),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(/[A-Z]/, 'Password must have at least one uppercase letter')
			.regex(/[a-z]/, 'Password must have at least one lowercase letter')
			.regex(/[0-9]/, 'Password must have at least one number')
			.regex(
				/[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/,
				'Password must have at least one special character'
			)
	});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			email: '',
			password: ''
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			authClient.signUp.email({
				name: value.name,
				email: value.email,
				password: value.password,
				callbackURL: '/dashboard'
			});
		}
	}));

	let showPassword = $state(false);
</script>

<div class="flex h-screen w-screen flex-col items-center justify-center gap-8">
	<Field.Set class="w-full max-w-sm">
		<Field.Legend>Get started</Field.Legend>
		<Field.Description>Create a new account</Field.Description>
		<AuthButtons />
		<form
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Field.Group>
				<form.Field name="name" validators={{ onBlur: schema.shape.name }}>
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Name</Field.Label>
							<Input
								aria-invalid={!!field.state.meta.errors[0]}
								autocomplete="name"
								id={field.name}
								name={field.name}
								onblur={field.handleBlur}
								oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
								placeholder="First Last"
								type="text"
								value={field.state.value}
							/>
							{#if field.state.meta.errors[0]}
								<Field.Error>
									{field.state.meta.errors[0].message}
								</Field.Error>
							{/if}
						</Field.Field>
					{/snippet}
				</form.Field>
				<form.Field name="email" validators={{ onBlur: schema.shape.email }}>
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Email</Field.Label>
							<Input
								aria-invalid={!!field.state.meta.errors[0]}
								autocomplete="email"
								id={field.name}
								name={field.name}
								onblur={field.handleBlur}
								oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
								placeholder="username@domain.com"
								type="email"
								value={field.state.value}
							/>
							{#if field.state.meta.errors[0]}
								<Field.Error>
									{field.state.meta.errors[0].message}
								</Field.Error>
							{/if}
						</Field.Field>
					{/snippet}
				</form.Field>
				<form.Field name="password" validators={{ onChange: schema.shape.password }}>
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Password</Field.Label>
							<InputGroup.Root>
								<InputGroup.Input
									autocomplete="new-password"
									id={field.name}
									name={field.name}
									onblur={field.handleBlur}
									oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
									placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
									type={showPassword ? 'text' : 'password'}
									value={field.state.value}
								/>
								<InputGroup.Addon align="inline-end">
									<Tooltip.Root>
										<Tooltip.Trigger>
											{#snippet child({ props })}
												<InputGroup.Button
													{...props}
													onclick={() => (showPassword = !showPassword)}
													size="icon-xs"
													variant="outline"
												>
													{#if showPassword}
														<div transition:scale>
															<EyeOff />
														</div>
													{:else}
														<div transition:scale class="absolute">
															<Eye />
														</div>
													{/if}
												</InputGroup.Button>
											{/snippet}
										</Tooltip.Trigger>
										<Tooltip.Content>
											<p>{showPassword ? 'Hide password' : 'Show password'}</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</InputGroup.Addon>
							</InputGroup.Root>
							{#if field.state.meta.errors[0]}
								<Field.Error>
									{field.state.meta.errors[0].message}
								</Field.Error>
							{/if}
						</Field.Field>
					{/snippet}
				</form.Field>
				<Button type="submit">Sign up</Button>
			</Field.Group>
		</form>
	</Field.Set>
	<p class="text-sm text-muted-foreground">
		Have an account?
		<a
			href={resolve('/sign-in')}
			class="font-medium underline underline-offset-4 transition-colors hover:text-primary"
		>
			Sign in
		</a>
	</p>
</div>
