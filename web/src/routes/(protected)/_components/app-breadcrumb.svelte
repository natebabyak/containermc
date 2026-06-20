<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { getAppContext } from '$lib/context/app-context';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	const ORG_PAGES = new Set(['billing', 'members', 'servers', 'settings']);

	const LABELS: Record<string, string> = {
		billing: 'Billing',
		members: 'Members',
		servers: 'Servers',
		settings: 'Settings',
		backups: 'Backups',
		sessions: 'Sessions'
	};

	const app = getAppContext();

	function orgRootHref(organizationSlug: string) {
		return resolve('/(protected)/[organizationSlug]', { organizationSlug });
	}

	function orgPageHref(organizationSlug: string, segments: string[]) {
		const path = segments.join('/');
		switch (path) {
			case 'billing':
				return resolve('/(protected)/[organizationSlug]/billing', { organizationSlug });
			case 'members':
				return resolve('/(protected)/[organizationSlug]/members', { organizationSlug });
			case 'servers':
				return resolve('/(protected)/[organizationSlug]/servers', { organizationSlug });
			case 'servers/new':
				return resolve('/(protected)/[organizationSlug]/servers/new', { organizationSlug });
			case 'settings':
				return resolve('/(protected)/[organizationSlug]/settings', { organizationSlug });
			default:
				return `/${organizationSlug}/${path}`;
		}
	}

	function serverRootHref(organizationSlug: string, minecraftServerSlug: string) {
		return resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]', {
			organizationSlug,
			minecraftServerSlug
		});
	}

	function serverPageHref(
		organizationSlug: string,
		minecraftServerSlug: string,
		segments: string[]
	) {
		const pageSegment = segments[0];
		switch (pageSegment) {
			case 'backups':
				return resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]/backups', {
					organizationSlug,
					minecraftServerSlug
				});
			case 'sessions':
				return resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]/sessions', {
					organizationSlug,
					minecraftServerSlug
				});
			case 'settings':
				return resolve('/(protected)/[organizationSlug]/[minecraftServerSlug]/settings', {
					organizationSlug,
					minecraftServerSlug
				});
			default:
				return `${serverRootHref(organizationSlug, minecraftServerSlug)}/${segments.join('/')}`;
		}
	}

	function segmentLabel(segment: string, previousSegment?: string) {
		if (segment === 'new' && previousSegment === 'servers') {
			return 'New Server';
		}
		return LABELS[segment] ?? segment;
	}

	function appendOrgSegments(items: BreadcrumbItem[], organizationSlug: string, segments: string[]) {
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const isLast = i === segments.length - 1;
			const label = segmentLabel(segment, segments[i - 1]);

			if (isLast) {
				items.push({ label });
			} else {
				items.push({
					label,
					href: orgPageHref(organizationSlug, segments.slice(0, i + 1))
				});
			}
		}
	}

	function appendServerSegments(
		items: BreadcrumbItem[],
		organizationSlug: string,
		minecraftServerSlug: string,
		segments: string[]
	) {
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const isLast = i === segments.length - 1;
			const label = segmentLabel(segment, segments[i - 1]);

			if (isLast) {
				items.push({ label });
			} else {
				items.push({
					label,
					href: serverPageHref(organizationSlug, minecraftServerSlug, segments.slice(0, i + 1))
				});
			}
		}
	}

	function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
		const parts = pathname.split('/').filter(Boolean);
		const orgsHref = resolve('/(protected)/orgs');
		const items: BreadcrumbItem[] = [];

		if (parts[0] === 'orgs') {
			if (parts[1] === 'new') {
				items.push({ label: 'Orgs', href: orgsHref });
				items.push({ label: 'New Organization' });
			} else {
				items.push({ label: 'Orgs' });
			}
			return items;
		}

		items.push({ label: 'Orgs', href: orgsHref });

		const organization = app.activeOrganization;
		if (!organization || parts[0] !== organization.slug) {
			return items;
		}

		const organizationSlug = organization.slug;
		const rest = parts.slice(1);

		if (rest.length === 0) {
			items.push({ label: organization.name });
			return items;
		}

		const first = rest[0];
		const isOrgPage = ORG_PAGES.has(first);
		const isServer =
			!isOrgPage &&
			(app.activeMinecraftServer?.slug === first ||
				app.minecraftServers?.some((server) => server.slug === first) === true);

		if (isOrgPage) {
			items.push({ label: organization.name, href: orgRootHref(organizationSlug) });
			appendOrgSegments(items, organizationSlug, rest);
			return items;
		}

		if (isServer) {
			const minecraftServerSlug = first;
			const serverName =
				app.activeMinecraftServer?.slug === minecraftServerSlug
					? app.activeMinecraftServer.name
					: minecraftServerSlug;

			items.push({ label: organization.name, href: orgRootHref(organizationSlug) });
			items.push({
				label: 'Servers',
				href: resolve('/(protected)/[organizationSlug]/servers', { organizationSlug })
			});

			const serverRest = rest.slice(1);
			if (serverRest.length === 0) {
				items.push({ label: serverName });
				return items;
			}

			items.push({
				label: serverName,
				href: serverRootHref(organizationSlug, minecraftServerSlug)
			});
			appendServerSegments(items, organizationSlug, minecraftServerSlug, serverRest);
			return items;
		}

		items.push({ label: organization.name });
		return items;
	}

	const items = $derived(buildBreadcrumbs(page.url.pathname));
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		{#each items as item, index (index)}
			{#if index > 0}
				<Breadcrumb.Separator />
			{/if}
			<Breadcrumb.Item>
				{#if item.href}
					<Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
				{:else}
					<Breadcrumb.Page>{item.label}</Breadcrumb.Page>
				{/if}
			</Breadcrumb.Item>
		{/each}
	</Breadcrumb.List>
</Breadcrumb.Root>
