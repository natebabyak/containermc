<script lang="ts">
  import { goto } from "$app/navigation";
  import { createForm } from "@tanstack/svelte-form";
  import { z } from "zod";

  import { authClient } from "#lib/auth-client.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as Separator from "#lib/components/ui/separator/index.ts";

  const signUpSchema = z.object({
    name: z.string().trim().min(1, "Enter your name"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
  });
  const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

  let verificationEmail = $state("");
  let errorMessage = $state("");
  let isVerifying = $state(false);
  let isSocialSigningIn = $state(false);

  async function signInWithProvider(provider: "discord" | "github") {
    errorMessage = "";
    isSocialSigningIn = true;
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}/`,
    });
    isSocialSigningIn = false;
    if (error) errorMessage = error.message ?? "Unable to sign in";
  }

  const form = createForm(() => ({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value }) => {
      errorMessage = "";
      const { error } = await authClient.signUp.email({
        name: value.name,
        email: value.email,
        password: value.password,
      });

      if (error) {
        errorMessage = error.message ?? "Unable to create your account";
        return;
      }

      verificationEmail = value.email;
    },
  }));

  const otpForm = createForm(() => ({
    defaultValues: { otp: "" },
    validators: { onSubmit: otpSchema },
    onSubmit: async ({ value }) => {
      errorMessage = "";
      isVerifying = true;
      const { error } = await authClient.emailOtp.verifyEmail({
        email: verificationEmail,
        otp: value.otp,
      });
      isVerifying = false;

      if (error) {
        errorMessage = error.message ?? "That code is invalid or expired";
        return;
      }

      await goto("/");
    },
  }));

  async function resendCode() {
    errorMessage = "";
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: verificationEmail,
      type: "email-verification",
    });
    if (error) errorMessage = error.message ?? "Unable to resend the code";
  }
</script>

<svelte:head><title>Sign up</title></svelte:head>

<main class="flex min-h-screen items-center justify-center p-4">
  <Card.Root class="w-full max-w-sm">
    {#if verificationEmail}
      <Card.Header>
        <Card.Title>Check your email</Card.Title>
        <Card.Description>Enter the 6-digit code sent to {verificationEmail}.</Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onsubmit={(event) => {
            event.preventDefault();
            otpForm.handleSubmit();
          }}
          class="flex flex-col gap-4"
        >
          <otpForm.Field name="otp">
            {#snippet children(field)}
              <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                <Field.Label for="verification-code">Verification code</Field.Label>
                <Input
                  id="verification-code"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength={6}
                  value={field.state.value}
                  onblur={field.handleBlur}
                  oninput={(event) =>
                    field.handleChange(event.currentTarget.value.replace(/\D/g, ""))}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <Field.Error
                  errors={field.state.meta.errors.filter(Boolean) as { message?: string }[]}
                />
              </Field.Field>
            {/snippet}
          </otpForm.Field>
          {#if errorMessage}<p class="text-destructive text-xs" role="alert">{errorMessage}</p>{/if}
          <Button type="submit" disabled={!otpForm.state.canSubmit || isVerifying} class="w-full"
            >{isVerifying ? "Verifying…" : "Verify email"}</Button
          >
          <Button type="button" variant="link" onclick={resendCode}>Resend code</Button>
        </form>
      </Card.Content>
    {:else}
      <Card.Header>
        <Card.Title>Create an account</Card.Title>
        <Card.Description>Sign up with your email and password.</Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            class="w-full"
            disabled={isSocialSigningIn}
            onclick={() => signInWithProvider("discord")}>Continue with Discord</Button
          >
          <Button
            type="button"
            variant="outline"
            class="w-full"
            disabled={isSocialSigningIn}
            onclick={() => signInWithProvider("github")}>Continue with GitHub</Button
          >
        </div>
        <div class="text-muted-foreground my-4 flex items-center gap-2 text-xs">
          <Separator.Root class="flex-1" />
          <span>or</span>
          <Separator.Root class="flex-1" />
        </div>
        <form
          onsubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          class="flex flex-col gap-4"
        >
          <form.Field name="name">
            {#snippet children(field)}
              <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                <Field.Label for="sign-up-name">Name</Field.Label>
                <Input
                  id="sign-up-name"
                  autocomplete="name"
                  value={field.state.value}
                  onblur={field.handleBlur}
                  oninput={(event) => field.handleChange(event.currentTarget.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <Field.Error
                  errors={field.state.meta.errors.filter(Boolean) as { message?: string }[]}
                />
              </Field.Field>
            {/snippet}
          </form.Field>
          <form.Field name="email">
            {#snippet children(field)}
              <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                <Field.Label for="sign-up-email">Email</Field.Label>
                <Input
                  id="sign-up-email"
                  type="email"
                  autocomplete="email"
                  value={field.state.value}
                  onblur={field.handleBlur}
                  oninput={(event) => field.handleChange(event.currentTarget.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <Field.Error
                  errors={field.state.meta.errors.filter(Boolean) as { message?: string }[]}
                />
              </Field.Field>
            {/snippet}
          </form.Field>
          <form.Field name="password">
            {#snippet children(field)}
              <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                <Field.Label for="sign-up-password">Password</Field.Label>
                <Input
                  id="sign-up-password"
                  type="password"
                  autocomplete="new-password"
                  value={field.state.value}
                  onblur={field.handleBlur}
                  oninput={(event) => field.handleChange(event.currentTarget.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <Field.Error
                  errors={field.state.meta.errors.filter(Boolean) as { message?: string }[]}
                />
              </Field.Field>
            {/snippet}
          </form.Field>
          {#if errorMessage}<p class="text-destructive text-xs" role="alert">{errorMessage}</p>{/if}
          <Button
            type="submit"
            disabled={!form.state.canSubmit || form.state.isSubmitting}
            class="w-full">{form.state.isSubmitting ? "Creating account…" : "Sign up"}</Button
          >
        </form>
      </Card.Content>
      <Card.Footer class="text-muted-foreground justify-center gap-1">
        <span>Already have an account?</span>
        <Button variant="link" href="/sign-in">Sign in</Button>
      </Card.Footer>
    {/if}
  </Card.Root>
</main>
