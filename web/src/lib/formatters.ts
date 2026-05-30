import { getCurrency } from './state/currency.svelte';

export function formatCurrency(amountCents: number) {
	const currency = getCurrency();

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency
	}).format(amountCents / 100);
}
