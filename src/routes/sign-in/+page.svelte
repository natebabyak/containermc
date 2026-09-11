<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import SiDiscord from "@icons-pack/svelte-simple-icons/icons/SiDiscord";
  import SiGithub from "@icons-pack/svelte-simple-icons/icons/SiGithub";
  import { createForm } from "@tanstack/svelte-form";
  import { z } from "zod";

  import { authClient } from "#lib/auth-client.ts";
  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as Separator from "#lib/components/ui/separator/index.ts";

  const signInSchema = z.object({
    email: z.email("Enter a valid email address"),
    password: z.string().min(1, "Enter your password"),
  });

  let errorMessage = $state("");

  const form = createForm(() => ({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      errorMessage = "";
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });

      if (error) {
        errorMessage = error.message ?? "Unable to sign in";
        return;
      }

      await goto("/");
    },
  }));
</script>

<svelte:head>
  <title>ContainerMC - Sign in</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center p-4">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title>Sign in</Card.Title>
      <Card.Description>Enter your email and password to continue.</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-col gap-2">
        <Button
          onclick={async () =>
            await authClient.signIn.social({
              provider: "discord",
              callbackURL: resolve("/dashboard"),
            })}
          type="button"
          variant="outline"
          class="w-full"
        >
          <SiDiscord />
          Continue with Discord
        </Button>
        <Button
          onclick={async () =>
            await authClient.signIn.social({
              provider: "github",
              callbackURL: resolve("/dashboard"),
            })}
          type="button"
          variant="outline"
          class="w-full"
        >
          <SiGithub />
          Continue with GitHub</Button
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
        <form.Field name="email">
          {#snippet children(field)}
            <Field.Field data-invalid={field.state.meta.errors.length > 0}>
              <Field.Label for="sign-in-email">Email</Field.Label>
              <Input
                id="sign-in-email"
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
              <Field.Label for="sign-in-password">Password</Field.Label>
              <Input
                id="sign-in-password"
                type="password"
                autocomplete="current-password"
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
          class="w-full">{form.state.isSubmitting ? "Signing in…" : "Sign in"}</Button
        >
      </form>
    </Card.Content>
    <Card.Footer class="text-muted-foreground justify-center gap-1">
      <span>Don’t have an account?</span>
      <Button variant="link" href="/sign-up">Sign up</Button>
    </Card.Footer>
  </Card.Root>
</main>
