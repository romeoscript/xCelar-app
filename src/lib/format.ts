/** Format a Naira amount with thousands separators, e.g. 3000 -> "₦3,000.00". */
export function formatNaira(amount: number): string {
  const [whole, decimals] = amount.toFixed(2).split('.');
  const withSeparators = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `₦${withSeparators}.${decimals}`;
}
