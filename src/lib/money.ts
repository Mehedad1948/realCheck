import { CURRENCY } from './constants';

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY });

/** All money is stored as integer cents. */
export function formatMoney(cents: number) {
  return formatter.format(cents / 100);
}

export function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}
