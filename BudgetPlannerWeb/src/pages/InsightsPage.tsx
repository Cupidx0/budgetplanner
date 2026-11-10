import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { StatCard } from '../components/StatCard';
import { formatMoney, formatWholeMoney } from '../lib/format';
import { useBudget } from '../lib/useBudget';

export function InsightsPage() {
  const { data } = useBudget();
  const { expected_income, spending, spending_by_category, bills_total, savings_target } = data.summary;

  const dayOfMonth = new Date().getDate();
  const dailyAverage = spending / dayOfMonth;
  const top = spending_by_category[0];
  const billShare = expected_income > 0 ? Math.round((bills_total / expected_income) * 100) : null;
  const leftAfterSavings = expected_income - spending - savings_target;

  return (
    <div className="page">
      <PageHeader eyebrow="Insights" title="Smart recommendations" />

      <div className="card-grid">
        <StatCard
          label="Top category"
          value={top ? top.category : '—'}
          note={top ? `${formatMoney(top.amount)} · ${Math.round((top.amount / spending) * 100)}% of spending` : 'No spending yet'}
        />
        <StatCard label="Daily average" value={formatMoney(dailyAverage)} note={`Over ${dayOfMonth} days this month`} />
        <StatCard
          label="Planned bills"
          value={formatWholeMoney(bills_total)}
          note={billShare === null ? 'No income detected yet' : `${billShare}% of expected income`}
          tone={billShare === null ? 'muted' : billShare <= 60 ? 'positive' : 'negative'}
        />
      </div>

      <Panel title="Focus this month">
        <p className="body-text">
          {leftAfterSavings >= 0
            ? `After spending so far and your ${formatMoney(savings_target)} savings target, you have ${formatMoney(leftAfterSavings)} of expected income left. That works out to ${formatMoney(leftAfterSavings / Math.max(daysLeftInMonth(), 1))} a day for the rest of the month.`
            : `You're ${formatMoney(-leftAfterSavings)} short of your ${formatMoney(savings_target)} savings target at the current pace. Cut back on ${top?.category ?? 'discretionary spending'} first.`}
        </p>
        <p className="body-text">
          Keep fixed bills under 60% of income. Any surplus should go to savings and debt reduction before lifestyle
          upgrades.
        </p>
      </Panel>
    </div>
  );
}

function daysLeftInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
}
