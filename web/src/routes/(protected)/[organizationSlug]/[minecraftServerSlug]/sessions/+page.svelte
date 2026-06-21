<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import * as Item from '$lib/components/ui/item/index.js';
	import type { PageProps } from './$types';
	import Panda from '@lucide/svelte/icons/panda';
	import SessionItem from './_components/session-item.svelte';

	let { data }: PageProps = $props();

	let numSessions = $derived(data.activeMinecraftServer.sessions.length);
</script>

<div class="space-y-4">
	<h1>Sessions</h1>
	<Item.Group>
		{#each data.activeMinecraftServer.sessions as session, index (session.id)}
			<SessionItem {session} number={numSessions - index} />
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<Panda />
					</Empty.Media>
					<Empty.Title>No sessions</Empty.Title>
					<Empty.Description>Sessions are created when your server is started.</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<form
						method="post"
						action="/org/{page.params.organizationSlug}/servers?/startMinecraftServer"
						use:enhance={() => {
							return async ({ update }) => {
								update();
							};
						}}
					>
						<input type="hidden" name="minecraftServerId" value={page.params.minecraftServerId} />
						<Button type="submit">Start Server</Button>
					</form>
				</Empty.Content>
			</Empty.Root>
		{/each}
	</Item.Group>
</div>
