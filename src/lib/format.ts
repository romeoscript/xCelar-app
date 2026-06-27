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

/** Human-readable file size, e.g. 117760 -> "115.0kb". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)}kb` : `${(kb / 1024).toFixed(1)}MB`;
}
