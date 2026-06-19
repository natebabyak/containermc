<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import { createForm } from '@tanstack/svelte-form';
	import * as Select from '$lib/components/ui/select/index.js';
	import { onMount } from 'svelte';
	import * as Item from '$lib/components/ui/item/index.js';
	import { HARDWARE_OPTIONS, REGIONS } from '$lib/constants';
	import z from 'zod';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { goto, invalidateAll } from '$app/navigation';
	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import { applyAction, deserialize } from '$app/forms';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import { scale } from 'svelte/transition';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import { cn } from '$lib/utils';
	import { formatCurrency } from '$lib/formatters';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	const schema = z.object({
		name: z.string().min(1, 'Name is required'),
		regionCode: z.enum(
			REGIONS.map((region) => region.code),
			'Region is required'
		),
		hardwareName: z.enum(
			HARDWARE_OPTIONS.map((hardware) => hardware.name),
			'Hardware is required'
		)
	});

	const form = createForm(() => ({
		defaultValues: {
			name: '',
			regionCode: '',
			hardwareName: ''
		},
		validators: {
			onChange: schema
		},
		onSubmit: async ({ value }) => {
			const formData = new FormData();
			formData.append('name', value.name);
			formData.append('regionCode', value.regionCode);
			formData.append('hardwareName', value.hardwareName);

			const response = await fetch(
				`/${page.params.organizationSlug}/servers?/createMinecraftServer`,
				{
					method: 'POST',
					body: formData
				}
			);

			const result = deserialize(await response.text());

			if (result.type === 'success') {
				form.reset();
				await invalidateAll();
				goto(
					resolve('/(protected)/[organizationSlug]/servers', {
						organizationSlug: page.params.organizationSlug!
					})
				);
			} else {
				applyAction(result);
			}
		}
	}));

	export async function measurePing(region: (typeof REGIONS)[number]) {
		const url = `https://ec2.${region.code}.amazonaws.com/ping`;
		const start = performance.now();

		try {
			await fetch(url, {
				method: 'GET',
				mode: 'no-cors',
				cache: 'no-store',
				credentials: 'omit'
			});

			return Math.round(performance.now() - start);
		} catch {
			return Infinity;
		}
	}

	let measuringPings = $state(false);

	let regions = $state<((typeof REGIONS)[number] & { ping: number })[]>([]);

	async function measurePings() {
		if (measuringPings) return;

		measuringPings = true;

		try {
			const measuredRegions = await Promise.all(
				REGIONS.map(async (region) => ({
					...region,
					ping: await measurePing(region)
				}))
			);

			regions = measuredRegions.toSorted((a, b) => a.ping - b.ping);

			form.setFieldValue('regionCode', regions[0].code);
		} finally {
			measuringPings = false;
		}
	}

	onMount(() => {
		measurePings();
	});
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		e.stopPropagation();
		form.handleSubmit();
	}}
>
	<Field.Group>
		<Field.Set>
			<Field.Legend>Create a new server</Field.Legend>
			<Field.Description>Create a new server to get started</Field.Description>
		</Field.Set>
		<Field.Group>
			<form.Field name="name">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>
							Name
							<span class="text-destructive">*</span>
						</Field.Label>
						<Input
							aria-invalid={!!field.state.meta.errors[0] && field.state.meta.isTouched}
							id={field.name}
							name={field.name}
							oninput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
							placeholder="Server Name"
							type="text"
							value={field.state.value}
						/>
						{#if field.state.meta.errors[0] && field.state.meta.isTouched}
							<Field.Error>
								{field.state.meta.errors[0].message}
							</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
			<form.Field name="regionCode">
				{#snippet children(field)}
					<Field.Field>
						<div class="flex items-center justify-between">
							<Field.Label for={field.name}>
								Region
								<span class="text-destructive">*</span>
							</Field.Label>
							<Button disabled={measuringPings} onclick={measurePings} size="xs" variant="outline">
								<div class="relative size-3">
									{#if measuringPings}
										<div transition:scale={{ start: 0.9 }} class="absolute">
											<LoaderCircle class="animate-spin" />
										</div>
									{:else}
										<div transition:scale={{ start: 0.9 }} class="absolute">
											<RotateCcw />
										</div>
									{/if}
								</div>
								Remeasure Pings
							</Button>
						</div>
						<Select.Root
							name={field.name}
							type="single"
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							<Select.Trigger disabled={measuringPings} id={field.name}>
								{REGIONS.find((r) => r.code === field.state.value)?.name || 'Select Region'}
							</Select.Trigger>
							<Select.Content class="max-h-100">
								<Select.Group>
									{#each regions as region, i (i)}
										<Item.Root>
											{#snippet child({ props })}
												<Select.Item {...props} value={region.code}>
													<Item.Media variant="image" class="text-2xl">
														{region.emoji}
													</Item.Media>
													<Item.Content>
														<Item.Title>
															{region.name}
															{#if i === 0}
																<Badge>
																	<BadgeCheckIcon />
																	Recommended
																</Badge>
															{/if}
														</Item.Title>
														<Item.Description>
															{region.geography}
														</Item.Description>
													</Item.Content>
													<p class="mr-4">{region.ping} ms</p>
												</Select.Item>
											{/snippet}
										</Item.Root>
									{/each}
								</Select.Group>
							</Select.Content>
						</Select.Root>
						{#if field.state.meta.errors[0] && field.state.meta.isTouched}
							<Field.Error>
								{field.state.meta.errors[0].message}
							</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
			<form.Field name="hardwareName">
				{#snippet children(field)}
					<Field.Field>
						<Field.Label for={field.name}>Hardware</Field.Label>
						<RadioGroup.Root
							name={field.name}
							value={field.state.value}
							onValueChange={(value) => field.handleChange(value)}
						>
							{#each HARDWARE_OPTIONS as hardwareOption (hardwareOption.name)}
								<Item.Root
									size="xs"
									variant="outline"
									class={cn(
										field.state.value === hardwareOption.name && 'border-primary bg-primary/5'
									)}
								>
									{#snippet child({ props })}
										<Label {...props} for={hardwareOption.name}>
											<RadioGroup.Item id={hardwareOption.name} value={hardwareOption.name} />
											<Item.Content>
												<Item.Title>
													{hardwareOption.name}
													{#if hardwareOption.tag}
														<Badge>
															<BadgeCheckIcon />
															{hardwareOption.tag}
														</Badge>
													{/if}
												</Item.Title>
												<Item.Description>
													{hardwareOption.vcpu} vCPU &bull; {hardwareOption.memory} GB RAM
												</Item.Description>
											</Item.Content>
											<Item.Content class="*:ml-auto">
												<Item.Title>
													{formatCurrency(hardwareOption.hourlyRate)}/hr
												</Item.Title>
											</Item.Content>
										</Label>
									{/snippet}
								</Item.Root>
							{/each}
						</RadioGroup.Root>
						{#if field.state.meta.errors[0] && field.state.meta.isTouched}
							<Field.Error>
								{field.state.meta.errors[0].message}
							</Field.Error>
						{/if}
					</Field.Field>
				{/snippet}
			</form.Field>
			<Field.Field>
				<form.Subscribe selector={(state) => state.canSubmit}>
					{#snippet children(canSubmit)}
						<Button disabled={!canSubmit} type="submit">Create Server</Button>
					{/snippet}
				</form.Subscribe>
			</Field.Field>
		</Field.Group>
	</Field.Group>
</form>
