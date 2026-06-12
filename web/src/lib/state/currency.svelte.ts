import type { CURRENCIES } from '$lib/constants';

export type Currency = (typeof CURRENCIES)[number];

let currency = $state<Currency>('usd');

export function getCurrency() {
	return currency;
}

export function setCurrency(newCurrency: Currency) {
	currency = newCurrency;
}
