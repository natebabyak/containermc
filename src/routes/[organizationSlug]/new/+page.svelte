<script lang="ts">
  import slugify from "@sindresorhus/slugify";
  import { createForm } from "@tanstack/svelte-form";
  import ArrowLeftIcon from "phosphor-svelte/lib/ArrowLeftIcon";
  import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
  import CheckIcon from "phosphor-svelte/lib/CheckIcon";
  import z from "zod";

  import { Button } from "#lib/components/ui/button/index.ts";
  import * as Card from "#lib/components/ui/card/index.ts";
  import { Checkbox } from "#lib/components/ui/checkbox/index.ts";
  import * as Field from "#lib/components/ui/field/index.ts";
  import { Input } from "#lib/components/ui/input/index.ts";
  import * as NativeSelect from "#lib/components/ui/native-select/index.ts";
  import { Progress } from "#lib/components/ui/progress/index.ts";
  import { Textarea } from "#lib/components/ui/textarea/index.ts";
  import { MINECRAFT_SERVER_TYPES, MINECRAFT_VERSION_GROUPS } from "#lib/constants.ts";

  import type { PageProps } from "./$types";

  const basicSchema = z.object({
    name: z.string().trim().min(3, "Use at least 3 characters").max(64),
    type: z
      .string()
      .refine(
        (value) => MINECRAFT_SERVER_TYPES.some((type) => type.value === value),
        "Choose a server type",
      ),
    version: z
      .string()
      .refine(
        (value) =>
          MINECRAFT_VERSION_GROUPS.some((group) => group.versions.includes(value as never)),
        "Choose a Minecraft version",
      ),
  });

  const addonsSchema = z.object({
    modrinthProjects: z.string(),
    plugins: z.string(),
    onlineMode: z.boolean(),
    whiteList: z.boolean(),
  });

  type BasicValues = z.infer<typeof basicSchema>;
  type AddonsValues = z.infer<typeof addonsSchema>;
  type ServerPreview = BasicValues & AddonsValues & { slug: string };

  let { data }: PageProps = $props();
  let step = $state(0);
  let createdServer = $state<ServerPreview | null>(null);

  const basicForm = createForm(() => ({
    defaultValues: {
      name: "",
      type: "PAPER",
      version: "LATEST",
    },
    validators: { onSubmit: basicSchema },
    onSubmit: () => {
      step = 1;
    },
  }));

  const addonsForm = createForm(() => ({
    defaultValues: {
      modrinthProjects: "",
      plugins: "",
      onlineMode: true,
      whiteList: false,
    },
    validators: { onSubmit: addonsSchema },
    onSubmit: () => {
      step = 2;
    },
  }));

  const reviewForm = createForm(() => ({
    defaultValues: {},
    onSubmit: () => {
      createdServer = {
        ...basicForm.state.values,
        ...addonsForm.state.values,
        slug: slugify(basicForm.state.values.name),
      };
    },
  }));

  function joinableUrl(name: string) {
    return `${slugify(name) || "server-slug"}.${data.organization.slug}.mc.containermc.com`;
  }
</script>

<svelte:head>
  <title>Create server | ContainerMC</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 py-8 sm:p-8">
  <Progress value={((step + 1) / 3) * 100} aria-label={`Step ${step + 1} of 3`} />

  {#if createdServer}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2"
          ><CheckIcon />{createdServer.name} is ready to create</Card.Title
        >
        <Card.Description
          >This is a local preview only. No server has been provisioned.</Card.Description
        >
      </Card.Header>
      <Card.Content>
        <Field.Group>
          <Field.Field>
            <Field.Label for="joinable-url">Joinable URL</Field.Label>
            <Input id="joinable-url" readonly value={joinableUrl(createdServer.name)} />
          </Field.Field>
        </Field.Group>
      </Card.Content>
      <Card.Footer>
        <Button onclick={() => (createdServer = null)} variant="outline">Edit configuration</Button>
      </Card.Footer>
    </Card.Root>
  {:else if step === 0}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        basicForm.handleSubmit();
      }}
    >
      <Card.Root>
        <Card.Header>
          <Card.Title>Create a server</Card.Title>
          <Card.Description>Choose the server software and Minecraft version.</Card.Description>
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <basicForm.Field name="name">
              {#snippet children(field)}
                <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                  <Field.Label for="name">Server name</Field.Label>
                  <Input
                    id="name"
                    placeholder="Weekend SMP"
                    value={field.state.value}
                    onblur={field.handleBlur}
                    oninput={(event) => field.handleChange(event.currentTarget.value)}
                    aria-invalid={field.state.meta.errors.length > 0}
                  />
                  <Field.Description>{joinableUrl(field.state.value)}</Field.Description>
                  <Field.Error
                    errors={field.state.meta.errors.map((error) => ({ message: error?.message }))}
                  />
                </Field.Field>
              {/snippet}
            </basicForm.Field>
            <div class="grid gap-4 sm:grid-cols-2">
              <basicForm.Field name="type">
                {#snippet children(field)}
                  <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                    <Field.Label for="type">Server type</Field.Label>
                    <NativeSelect.Root
                      id="type"
                      value={field.state.value}
                      onchange={(event) => field.handleChange(event.currentTarget.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    >
                      {#each MINECRAFT_SERVER_TYPES as type (type.value)}
                        <NativeSelect.Option value={type.value}>{type.label}</NativeSelect.Option>
                      {/each}
                    </NativeSelect.Root>
                    <Field.Error
                      errors={field.state.meta.errors.map((error) => ({ message: error?.message }))}
                    />
                  </Field.Field>
                {/snippet}
              </basicForm.Field>
              <basicForm.Field name="version">
                {#snippet children(field)}
                  <Field.Field data-invalid={field.state.meta.errors.length > 0}>
                    <Field.Label for="version">Minecraft version</Field.Label>
                    <NativeSelect.Root
                      id="version"
                      value={field.state.value}
                      onchange={(event) => field.handleChange(event.currentTarget.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                    >
                      {#each MINECRAFT_VERSION_GROUPS as group (group.name)}
                        <NativeSelect.OptGroup label={group.name}>
                          {#each group.versions as version (version)}
                            <NativeSelect.Option value={version}>{version}</NativeSelect.Option>
                          {/each}
                        </NativeSelect.OptGroup>
                      {/each}
                    </NativeSelect.Root>
                    <Field.Error
                      errors={field.state.meta.errors.map((error) => ({ message: error?.message }))}
                    />
                  </Field.Field>
                {/snippet}
              </basicForm.Field>
            </div>
          </Field.Group>
        </Card.Content>
        <Card.Footer class="justify-end">
          <Button type="submit">Continue<ArrowRightIcon data-icon="inline-end" /></Button>
        </Card.Footer>
      </Card.Root>
    </form>
  {:else if step === 1}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        addonsForm.handleSubmit();
      }}
    >
      <Card.Root>
        <Card.Header>
          <Card.Title>Mods and plugins</Card.Title>
          <Card.Description
            >Optional. You can also add these after creating the server.</Card.Description
          >
        </Card.Header>
        <Card.Content>
          <Field.Group>
            <addonsForm.Field name="modrinthProjects">
              {#snippet children(field)}
                <Field.Field>
                  <Field.Label for="modrinth-projects">Modrinth projects</Field.Label>
                  <Textarea
                    id="modrinth-projects"
                    placeholder="fabric-api, sodium"
                    rows={3}
                    value={field.state.value}
                    oninput={(event) => field.handleChange(event.currentTarget.value)}
                  />
                  <Field.Description
                    >Comma-separated Modrinth project IDs or slugs.</Field.Description
                  >
                </Field.Field>
              {/snippet}
            </addonsForm.Field>
            <addonsForm.Field name="plugins">
              {#snippet children(field)}
                <Field.Field>
                  <Field.Label for="plugins">Plugin downloads</Field.Label>
                  <Textarea
                    id="plugins"
                    placeholder="https://example.com/plugin.jar"
                    rows={3}
                    value={field.state.value}
                    oninput={(event) => field.handleChange(event.currentTarget.value)}
                  />
                  <Field.Description>One plugin URL per line.</Field.Description>
                </Field.Field>
              {/snippet}
            </addonsForm.Field>
            <Field.FieldSet>
              <Field.Legend>Access</Field.Legend>
              <Field.Group>
                <addonsForm.Field name="onlineMode">
                  {#snippet children(field)}
                    <Field.Field orientation="horizontal">
                      <Checkbox
                        id="online-mode"
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Field.Content>
                        <Field.Label for="online-mode">Require online authentication</Field.Label>
                        <Field.Description
                          >Maps to the `online-mode` server property.</Field.Description
                        >
                      </Field.Content>
                    </Field.Field>
                  {/snippet}
                </addonsForm.Field>
                <addonsForm.Field name="whiteList">
                  {#snippet children(field)}
                    <Field.Field orientation="horizontal">
                      <Checkbox
                        id="white-list"
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked)}
                      />
                      <Field.Content>
                        <Field.Label for="white-list">Enable whitelist</Field.Label>
                        <Field.Description
                          >Maps to the `white-list` server property.</Field.Description
                        >
                      </Field.Content>
                    </Field.Field>
                  {/snippet}
                </addonsForm.Field>
              </Field.Group>
            </Field.FieldSet>
          </Field.Group>
        </Card.Content>
        <Card.Footer class="flex justify-between gap-3">
          <Button type="button" variant="outline" onclick={() => (step = 0)}
            ><ArrowLeftIcon data-icon="inline-start" />Back</Button
          >
          <Button type="submit">Continue<ArrowRightIcon data-icon="inline-end" /></Button>
        </Card.Footer>
      </Card.Root>
    </form>
  {:else}
    <form
      onsubmit={(event) => {
        event.preventDefault();
        reviewForm.handleSubmit();
      }}
    >
      <Card.Root>
        <Card.Header>
          <Card.Title>Review server</Card.Title>
          <Card.Description
            >Create the local preview with the selected configuration.</Card.Description
          >
        </Card.Header>
        <Card.Content>
          <dl class="grid gap-3 text-sm">
            <div class="border-border flex items-center justify-between gap-4 border-b pb-3">
              <dt class="text-muted-foreground">Joinable URL</dt>
              <dd class="text-right font-mono break-all">
                {joinableUrl(basicForm.state.values.name)}
              </dd>
            </div>
            <div class="border-border flex items-center justify-between gap-4 border-b pb-3">
              <dt class="text-muted-foreground">Server type</dt>
              <dd>
                {MINECRAFT_SERVER_TYPES.find((type) => type.value === basicForm.state.values.type)
                  ?.label}
              </dd>
            </div>
            <div class="border-border flex items-center justify-between gap-4 border-b pb-3">
              <dt class="text-muted-foreground">Minecraft version</dt>
              <dd>{basicForm.state.values.version}</dd>
            </div>
            <div class="border-border flex items-center justify-between gap-4 border-b pb-3">
              <dt class="text-muted-foreground">Mods</dt>
              <dd>{addonsForm.state.values.modrinthProjects || "None"}</dd>
            </div>
            <div class="flex items-center justify-between gap-4">
              <dt class="text-muted-foreground">Plugins</dt>
              <dd>{addonsForm.state.values.plugins ? "Configured" : "None"}</dd>
            </div>
          </dl>
        </Card.Content>
        <Card.Footer class="flex justify-between gap-3">
          <Button type="button" variant="outline" onclick={() => (step = 1)}
            ><ArrowLeftIcon data-icon="inline-start" />Back</Button
          >
          <Button type="submit">Create local preview<CheckIcon data-icon="inline-end" /></Button>
        </Card.Footer>
      </Card.Root>
    </form>
  {/if}
</main>
