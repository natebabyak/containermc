import type { MinecraftServerSelect } from '$lib/types';
import type { Organization } from 'better-auth/plugins';
import { createContext } from 'svelte';

export interface AppContext {
	organizations: Organization[];
	activeOrganization?: Organization;
	minecraftServers?: MinecraftServerSelect[];
	activeMinecraftServer?: MinecraftServerSelect;
}

export const [getAppContext, setAppContext] = createContext<AppContext>();
