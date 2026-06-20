<script lang="ts">
	import type { PageProps } from './$types';
	import * as Item from '$lib/components/ui/item/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Info from '@lucide/svelte/icons/info';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { authClient } from '$lib/auth-client';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import Search from '@lucide/svelte/icons/search';

	let { data }: PageProps = $props();

	const session = authClient.useSession();

	function getFullOrganization(organizationId: string) {
		return authClient.organization.getFullOrganization({
			query: {
				organizationId
			}
		});
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-medium">Your Organizations</h1>
	<InputGroup.Root>
		<InputGroup.Input placeholder="Search organizations..." />
		<InputGroup.Addon>
			<Search />
		</InputGroup.Addon>
	</InputGroup.Root>
	<Item.Group>
		{#each data.organizations as organization (organization.id)}
			{#await getFullOrganization(organization.id) then fullOrganization}
				<Item.Root variant="outline">
					<Item.Content>
						<Item.Title>
							{organization.name}
							{#if organization.isPersonal}
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<Badge {...props} variant="secondary">
												Personal
												<Info />
											</Badge>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content>This is a special organization.</Tooltip.Content>
								</Tooltip.Root>
							{/if}
						</Item.Title>
						<Item.Description>
							{fullOrganization.data?.members.length} member{fullOrganization.data?.members
								.length === 1
								? ''
								: 's'}
						</Item.Description>
					</Item.Content>
					<Item.Content>
						<Badge class="capitalize">
							{fullOrganization.data?.members.find(
								(member) => member.userId === $session.data?.user.id
							)?.role}
						</Badge>
					</Item.Content>
					<Item.Footer></Item.Footer>
				</Item.Root>
			{/await}
		{/each}
	</Item.Group>
</div>
