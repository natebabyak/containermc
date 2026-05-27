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
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	const schema = z.object({
		email: z.email(),
		password: z.string(),
		rememberMe: z.boolean()
	});

	const form = createForm(() => ({
		defaultValues: {
			email: '',
			password: '',
			rememberMe: true
		},
		validators: {
			onSubmit: schema
		},
		onSubmit: async ({ value }) => {
			authClient.signIn.email({
				email: value.email,
				password: value.password,
				callbackURL: '/dashboard',
				rememberMe: value.rememberMe
			});
		}
	}));

	let showPassword = $state(false);
</script>

<div class="flex h-screen w-screen flex-col items-center justify-center gap-8">
	<Field.Set class="w-full max-w-sm">
		<Field.Legend>Welcome back</Field.Legend>
		<Field.Description>Sign in to your account</Field.Description>
		<AuthButtons />
		<form
			onsubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Field.Group>
				<form.Field name="email">
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
				<form.Field name="password">
					{#snippet children(field)}
						<Field.Field>
							<div class="flex items-center justify-between">
								<Field.Label for={field.name}>Password</Field.Label>
								<a
									href={resolve('/forgot-password')}
									class="text-xs font-medium text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
								>
									Forgot password?
								</a>
							</div>
							<InputGroup.Root>
								<InputGroup.Input
									autocomplete="current-password"
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
						</Field.Field>
					{/snippet}
				</form.Field>
				<form.Field name="rememberMe">
					{#snippet children(field)}
						<Field.Field orientation="horizontal">
							<Checkbox
								id={field.name}
								name={field.name}
								checked={field.state.value}
								onblur={field.handleBlur}
								onCheckedChange={(v) => field.handleChange(v)}
							/>
							<Field.Label for={field.name} class="font-normal">Remember me?</Field.Label>
						</Field.Field>
					{/snippet}
				</form.Field>
				<Button type="submit">Sign in</Button>
			</Field.Group>
		</form>
	</Field.Set>
	<p class="text-sm text-muted-foreground">
		Don't have an account?
		<a
			href={resolve('/sign-up')}
			class="font-medium underline underline-offset-4 transition-colors hover:text-primary"
		>
			Sign up
		</a>
	</p>
</div>
