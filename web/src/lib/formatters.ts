import { getCurrency } from './state/currency.svelte';

export function formatCurrency(valueUsd: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: getCurrency().toUpperCase()
	}).format(valueUsd);
}

/** Balance, session costs, and ledger amounts — up to 6 decimal places when needed. */
export function formatBalance(valueUsd: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: getCurrency().toUpperCase(),
		minimumFractionDigits: 2,
		maximumFractionDigits: 6
	}).format(valueUsd);
}

export function formatDuration(start: Date, end: Date): string {
	const duration = end.getTime() - start.getTime();
	const seconds = Math.floor(duration / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
	if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

export function formatTime(date: Date): string {
	const today = new Date();

	if (date.toDateString() === today.toDateString()) {
		return new Intl.DateTimeFormat('en-US', {
			timeStyle: 'short'
		}).format(date);
	}

	return new Intl.DateTimeFormat('en-US', {
		dateStyle: 'short',
		timeStyle: 'short'
	}).format(date);
}

export function formatFileSize(bytes: bigint | number): string {
	const value = typeof bytes === 'bigint' ? bytes : BigInt(bytes);
	if (value <= 0n) return '0 B';

	const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
	let size = Number(value);
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	const decimals = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
	return `${size.toFixed(decimals)} ${units[unitIndex]}`;
}
