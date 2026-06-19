import { resolve } from '$app/paths';

export interface BreadcrumbItem {
	label: string;
	href?: string;
}

const ORG_PAGES = new Set(['billing', 'members', 'servers', 'settings']);
const SERVER_PAGES = new Set(['backups', 'sessions', 'settings']);

const LABELS: Record<string, string> = {
	billing: 'Billing',
	members: 'Members',
	servers: 'Servers',
	settings: 'Settings',
	backups: 'Backups',
	sessions: 'Sessions'
};

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
	const page = segments[0];
	switch (page) {
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

export function buildAppBreadcrumbs(
	pathname: string,
	context: {
		organization?: { slug: string; name: string };
		minecraftServer?: { slug: string; name: string };
		minecraftServerSlugs?: string[];
	}
): BreadcrumbItem[] {
	const items: BreadcrumbItem[] = [{ label: 'Home', href: resolve('/') }];
	const parts = pathname.split('/').filter(Boolean);

	if (parts[0] === 'orgs') {
		items.push({ label: parts[1] === 'new' ? 'New Organization' : 'Organizations' });
		return items;
	}

	const organization = context.organization;
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
		(context.minecraftServer?.slug === first ||
			context.minecraftServerSlugs?.includes(first) === true);

	if (isOrgPage) {
		items.push({ label: organization.name, href: orgRootHref(organizationSlug) });
		appendOrgSegments(items, organizationSlug, rest);
		return items;
	}

	if (isServer) {
		const minecraftServerSlug = first;
		const serverName =
			context.minecraftServer?.slug === minecraftServerSlug
				? context.minecraftServer.name
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
