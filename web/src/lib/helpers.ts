import { HARDWARE_OPTIONS } from './constants';

export function computeSessionCost(hardwareName: string, startedAt: Date, endedAt: Date) {
	const hourlyRate = HARDWARE_OPTIONS.find((o) => o.name === hardwareName)?.hourlyRate;

	if (!hourlyRate) {
		throw new Error('Hourly rate not found');
	}

	const durationSeconds = Math.max(60, Math.ceil((endedAt.getTime() - startedAt.getTime()) / 1000));

	return (hourlyRate / 3600) * durationSeconds;
}
