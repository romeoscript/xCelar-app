/** Format a Naira amount with thousands separators, e.g. 3000 -> "₦3,000.00". */
export function formatNaira(amount: number): string {
  return formatWithSymbol(amount, '₦');
}

const SYMBOL_BY_CURRENCY: Record<string, string> = { NGN: '₦', USD: '$' };

/** Format an amount in the given currency, e.g. (1234.5, 'USD') -> "$1,234.50". */
export function formatMoney(amount: number, currency: string): string {
  return formatWithSymbol(amount, SYMBOL_BY_CURRENCY[currency] ?? '');
}

function formatWithSymbol(amount: number, symbol: string): string {
  const [whole, decimals] = amount.toFixed(2).split('.');
  const withSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${symbol}${withSeparators}.${decimals}`;
}
