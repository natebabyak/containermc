<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PageProps } from './$types';
	import Search from '@lucide/svelte/icons/search';
	import AddMemberButton from './_components/add-member-button.svelte';

	let { data }: PageProps = $props();
</script>

<div class="space-y-4">
	<h1>Members</h1>
	<div class="flex items-center justify-between">
		<InputGroup.Root class="w-full max-w-xs">
			<InputGroup.Input placeholder="Search members..." />
			<InputGroup.Addon>
				<Search />
			</InputGroup.Addon>
		</InputGroup.Root>
		<AddMemberButton />
	</div>
	<Item.Group>
		{#each data.activeOrganization.members as member (member.id)}
			<Item.Root variant="outline">
				<Item.Media variant="image">
					<Avatar.Root>
						<Avatar.Image src={member.user.image ?? undefined} />
						<Avatar.Fallback>{member.user.name.charAt(0).toUpperCase()}</Avatar.Fallback>
					</Avatar.Root>
				</Item.Media>
				<Item.Content>
					<Item.Title>
						{member.user.name}
						<Badge
							variant={member.role === 'owner'
								? 'default'
								: member.role === 'admin'
									? 'secondary'
									: 'outline'}
							class="capitalize"
						>
							{member.role}
						</Badge>
					</Item.Title>
					<Item.Description>{member.user.email}</Item.Description>
				</Item.Content>
				<Item.Actions>
					<Button size="sm" variant="outline">Edit</Button>
				</Item.Actions>
			</Item.Root>
		{/each}
	</Item.Group>
</div>
