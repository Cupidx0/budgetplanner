import type { BudgetSummary } from '../types';
import { formatMoney } from './format';

/**
 * Offline fallback used when the backend assistant can't be reached.
 * Replies are derived from the user's loaded bank summary.
 */
interface Rule {
  keywords: string[];
  reply: (summary: BudgetSummary) => string;
}

const RULES: Rule[] = [
  {
    keywords: ['save', 'savings'],
    reply: ({ savings_target }) =>
      `Your suggested savings target this month is ${formatMoney(savings_target)} (20% of expected income). Set up a standing order for payday so it leaves before everyday spending.`,
  },
  {
    keywords: ['bill', 'expense', 'spend', 'category'],
    reply: ({ spending, spending_by_category }) => {
      const top = spending_by_category[0];
      return top
        ? `You've spent ${formatMoney(spending)} this month. ${top.category} is your biggest category at ${formatMoney(top.amount)}.`
        : `You've spent ${formatMoney(spending)} this month.`;
    },
  },
  {
    keywords: ['cash', 'left', 'remaining', 'balance'],
    reply: ({ total_balance, expected_income, spending }) =>
      `Your accounts hold ${formatMoney(total_balance)} in total. Against expected income of ${formatMoney(expected_income)}, you have about ${formatMoney(expected_income - spending)} left to spend this month.`,
  },
];

const EMPTY_REPLY = 'Ask the budget assistant about savings, spending, or your balance.';
const DEFAULT_REPLY =
  'Keep essentials below 60% of income and send the remaining surplus to savings and debt reduction.';

export function buildAssistantReply(prompt: string, summary: BudgetSummary): string {
  const text = prompt.trim().toLowerCase();
  if (!text) return EMPTY_REPLY;

  const match = RULES.find(({ keywords }) => keywords.some((k) => text.includes(k)));
  return match ? match.reply(summary) : DEFAULT_REPLY;
}
