/** Package item categories, shared across the local / export / import flows. */
export const ITEM_CATEGORIES: string[] = [
  'Automotive Parts',
  'Documents and Parcels',
  'Electronics and Gadgets',
  'Flowers and Gifts',
  'Food and Groceries',
  'Furniture and Household Items',
  'Industrial and Commercial Supplies',
  'Pharmaceuticals and Healthcare',
  'Retail Products',
  'Specialty Items',
];

export const ITEM_CATEGORY_OPTIONS: { value: string; label: string }[] = ITEM_CATEGORIES.map(
  (value) => ({ value, label: value }),
);
