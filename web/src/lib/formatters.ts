import { getCurrency } from './state/currency.svelte';

export function formatCurrency(amount: number | string) {
	const currency = getCurrency();

	if (typeof amount === 'string') {
		amount = parseFloat(amount);
	}

	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: currency
	}).format(amount);
}
