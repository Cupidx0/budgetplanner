const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeCurrency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

/** £1,234.56 */
export const formatMoney = (value: number): string => currency.format(value);

/** £1,235 — for headline figures. */
export const formatWholeMoney = (value: number): string => wholeCurrency.format(value);

export const formatSignedMoney = (value: number): string => `${value > 0 ? '+' : ''}${formatMoney(value)}`;

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

/** 'YYYY-MM-DD' → 'Mon 9 Nov' (parsed as a local date). */
export const formatDay = (isoDate: string): string => dayFormat.format(new Date(`${isoDate}T00:00:00`));

/** 'YYYY-MM' → 'November 2026' */
export const formatMonth = (yearMonth: string): string =>
  yearMonth ? monthFormat.format(new Date(`${yearMonth}-01T00:00:00`)) : '';

const CATEGORY_COLORS = ['#5b7cff', '#2cc6a0', '#f4b740', '#ef7d4d', '#a779ff', '#3fb6e0', '#e86aa6', '#8a96b8'];

/** Stable colour per category name, so a category looks the same on every page. */
export function categoryColor(category: string): string {
  let hash = 0;
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length] ?? '#5b7cff';
}
