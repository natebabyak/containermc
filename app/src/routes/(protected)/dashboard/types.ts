import type { Region } from '@aws-sdk/client-ec2';

export interface RegionGroup {
	id: string;
	name: string;
	regions: (Region & {
		ping: number;
	})[];
}
