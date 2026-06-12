import { getCurrency } from './state/currency.svelte';

export function formatCurrency(valueUsd: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: getCurrency().toUpperCase()
	}).format(valueUsd);
}

export function formatTime(date: Date): string {
	return new Intl.DateTimeFormat('en-US').format(date);
}
