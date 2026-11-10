export const budgetCategories = [
  { name: 'Housing', amount: 1450, color: '#5b7cff' },
  { name: 'Utilities', amount: 340, color: '#2cc6a0' },
  { name: 'Food', amount: 520, color: '#f4b740' },
  { name: 'Transport', amount: 280, color: '#ef7d4d' },
  { name: 'Lifestyle', amount: 410, color: '#a779ff' },
];

export const transactions = [
  { title: 'Salary deposit', amount: 6200, type: 'income', time: 'Today, 9:15 AM' },
  { title: 'Rent payment', amount: -1450, type: 'expense', time: 'Today, 7:40 AM' },
  { title: 'Grocery delivery', amount: -118, type: 'expense', time: 'Yesterday' },
  { title: 'Freelance invoice', amount: 420, type: 'income', time: 'Mon 2:10 PM' },
];

export const assistantTips = [
  'Keep a $600 emergency buffer before increasing discretionary spending.',
  'Move 10% of your salary to savings automatically each payday.',
  'Review subscriptions this week to protect your monthly cash runway.',
];

export const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatMoney(value) {
  return formatter.format(value);
}
