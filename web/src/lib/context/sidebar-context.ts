import type { MinecraftServerSelect } from '$lib/types';
import type { Organization } from 'better-auth/plugins';
import { createContext } from 'svelte';

export interface SidebarContext {
	organizations: Organization[];
	activeOrganization?: Organization;
	minecraftServers?: MinecraftServerSelect[];
	activeMinecraftServer?: MinecraftServerSelect;
}

export const [getSidebarContext, setSidebarContext] = createContext<SidebarContext>();
