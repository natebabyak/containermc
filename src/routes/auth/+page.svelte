<script lang="ts">
  import { CLOUDFLARE_SITE_KEY } from "$app/env/public";
  import { resolve } from "$app/paths";
  import { SiDiscord, SiGithub } from "@icons-pack/svelte-simple-icons";
  import { createForm } from "@tanstack/svelte-form";
  import { REGEXP_ONLY_DIGITS } from "bits-ui";
  import { mode } from "mode-watcher";
  import ArrowLeftIcon from "phosphor-svelte/lib/ArrowLeftIcon";
  import { Turnstile } from "svelte-turnstile";
  import z from "zod";

  import { authClient } from "#lib/auth-client.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import * as InputOTP from "#lib/components/ui/input-otp/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import { Spinner } from "#lib/components/ui/spinner/index.ts";

  let step = $state<"email" | "verification" | "otp">("otp");

  const emailForm = createForm(() => ({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address"),
      }),
    },
    onSubmit: async () => {
      step = "verification";
    },
  }));

  const verificationForm = createForm(() => ({
    defaultValues: {
      cloudflareTurnstileToken: "",
    },
    validators: {
      onSubmit: z.object({
        cloudflareTurnstileToken: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.emailOtp.sendVerificationOtp({
        email: emailForm.state.values.email,
        type: "sign-in",
        fetchOptions: {
          headers: {
            "x-captcha-response": value.cloudflareTurnstileToken,
          },
        },
      });

      step = "otp";
    },
  }));

  const otpForm = createForm(() => ({
    defaultValues: {
      otp: "",
    },
    validators: {
      onSubmit: z.object({
        otp: z.string().regex(/^\d{6}$/),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.emailOtp({
        email: emailForm.state.values.email,
        otp: value.otp,
      });
    },
  }));
</script>

<svelte:head>
  <title>ContainerMC - Sign up</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center">
  <Card.Root class="w-full max-w-sm">
    {#if step === "email"}
      <Card.Header>
        <Card.Title>Get Started</Card.Title>
        <Card.Description class="text-pretty">
          Create a new account or sign in to your existing account
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <Field.Group>
          <Button
            variant="secondary"
            onclick={async () =>
              await authClient.signIn.social({
                provider: "discord",
              })}
          >
            <SiDiscord />
            Continue with Discord
          </Button>
          <Button
            variant="secondary"
            onclick={async () =>
              await authClient.signIn.social({
                provider: "github",
              })}
          >
            <SiGithub />
            Continue with GitHub
          </Button>
          <Field.Separator>or</Field.Separator>
          <form
            onsubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              emailForm.handleSubmit();
            }}
          >
            <Field.Group>
              <emailForm.Field name="email">
                {#snippet children(field)}
                  <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                    <Field.Label for="email">Email</Field.Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      autocapitalize="none"
                      autocomplete="email"
                      autocorrect="off"
                      id="email"
                      onblur={field.handleBlur}
                      oninput={(e) => field.handleChange(e.currentTarget.value)}
                      placeholder="you@example.com"
                      spellcheck="false"
                      type="email"
                      value={field.state.value}
                    />
                    <Field.Error
                      errors={field.state.meta.errors.map((e) => ({
                        message: e?.message,
                      }))}
                    />
                  </Field.Field>
                {/snippet}
              </emailForm.Field>
              <emailForm.Subscribe
                selector={(state) => ({
                  canSubmit: state.canSubmit,
                  isSubmitting: state.isSubmitting,
                })}
              >
                {#snippet children(state)}
                  <Button disabled={!state.canSubmit || state.isSubmitting} type="submit">
                    {#if state.isSubmitting}
                      <Spinner />
                    {:else}
                      Continue with email
                    {/if}
                  </Button>
                {/snippet}
              </emailForm.Subscribe>
            </Field.Group>
          </form>
        </Field.Group>
      </Card.Content>
      <Card.Footer>
        <span
          class="text-muted-foreground *:hover:text-foreground text-center text-xs text-balance underline-offset-2 *:underline"
        >
          By continuing, you agree to our
          <a href={resolve("/privacy")}>Privacy Policy</a>
          and
          <a href={resolve("/terms")}>Terms of Service</a>.
        </span>
      </Card.Footer>
    {:else if step === "verification"}
      <Card.Header>
        <Card.Title>Verify you are a human</Card.Title>
      </Card.Header>
      <Card.Content>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            verificationForm.handleSubmit();
          }}
        >
          <verificationForm.Field name="cloudflareTurnstileToken">
            {#snippet children(field)}
              <Turnstile
                siteKey={CLOUDFLARE_SITE_KEY}
                theme={mode.current ?? "auto"}
                size="flexible"
                on:callback={(e) => {
                  field.handleChange(e.detail.token);
                  verificationForm.handleSubmit();
                }}
              />
            {/snippet}
          </verificationForm.Field>
        </form>
      </Card.Content>
      <Card.Footer>
        <Button onclick={() => (step = "email")} variant="ghost">
          <ArrowLeftIcon />
          Back to email
        </Button>
      </Card.Footer>
    {:else}
      <Card.Header>
        <Card.Title>Check your email</Card.Title>
        <Card.Description>
          We sent a one-time password to {emailForm.state.values.email}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form
          onsubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            otpForm.handleSubmit();
          }}
        >
          <otpForm.Field name="otp">
            {#snippet children(field)}
              <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                <Field.Label for="otp">One-Time Password</Field.Label>
                <InputOTP.Root
                  autocomplete="one-time-code"
                  autocorrect="off"
                  id="otp"
                  maxlength={6}
                  onblur={field.handleBlur}
                  oninput={(e) => {
                    field.handleChange(e.currentTarget.value);
                    if (e.currentTarget.value.length === 6) {
                      otpForm.handleSubmit();
                    }
                  }}
                  pattern={REGEXP_ONLY_DIGITS}
                  spellcheck="false"
                  type="text"
                  value={field.state.value}
                >
                  {#snippet children({ cells })}
                    <InputOTP.Group>
                      {#each cells.slice(0, 3) as cell}
                        <InputOTP.Slot {cell} />
                      {/each}
                    </InputOTP.Group>
                    <InputOTP.Separator />
                    <InputOTP.Group>
                      {#each cells.slice(3, 6) as cell}
                        <InputOTP.Slot {cell} />
                      {/each}
                    </InputOTP.Group>
                  {/snippet}
                </InputOTP.Root>
                <Field.Error
                  errors={field.state.meta.errors.map((error) => ({ message: error?.message }))}
                />
              </Field.Field>
            {/snippet}
          </otpForm.Field>
        </form>
      </Card.Content>
      <Card.Footer>
        <Button onclick={() => (step = "email")} variant="ghost">
          <ArrowLeftIcon />
          Back to email
        </Button>
      </Card.Footer>
    {/if}
  </Card.Root>
</main>
