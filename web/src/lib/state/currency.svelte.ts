import { CURRENCIES } from '$lib/constants';

type CurrencyCode = (typeof CURRENCIES)[number]['code'];

let currency = $state<CurrencyCode>('USD');

export function getCurrency() {
	return currency;
}

export function setCurrency(newCurrency: CurrencyCode) {
	currency = newCurrency;
}
