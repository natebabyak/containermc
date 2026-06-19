import { HARDWARE_OPTIONS } from './constants';

function getHourlyRate(hardwareName: string): number {
	const hourlyRate = HARDWARE_OPTIONS.find((o) => o.name === hardwareName)?.hourlyRate;
	if (!hourlyRate) {
		throw new Error('Hourly rate not found');
	}
	return hourlyRate;
}

/** Proportional cost for a time interval (no minimum duration floor). */
export function computeIntervalCost(hardwareName: string, start: Date, end: Date): number {
	if (end.getTime() <= start.getTime()) {
		return 0;
	}
	const durationSeconds = (end.getTime() - start.getTime()) / 1000;
	return (getHourlyRate(hardwareName) / 3600) * durationSeconds;
}

export function computeSessionCost(hardwareName: string, startedAt: Date, endedAt: Date) {
	const durationSeconds = Math.max(60, Math.ceil((endedAt.getTime() - startedAt.getTime()) / 1000));

	return (getHourlyRate(hardwareName) / 3600) * durationSeconds;
}
