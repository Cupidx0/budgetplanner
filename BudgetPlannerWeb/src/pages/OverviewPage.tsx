import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { ProgressBar } from '../components/ProgressBar';
import { StatCard } from '../components/StatCard';
import { TransactionList } from '../components/TransactionList';
import { categoryColor, formatMoney, formatMonth, formatWholeMoney } from '../lib/format';
import { useBudget } from '../lib/useBudget';

export function OverviewPage() {
  const { data } = useBudget();
  const { summary, accounts, transactions } = data;
  const { total_balance, income, expected_income, spending, net, spending_by_category, savings_target, savings_progress } =
    summary;
  const leftToSpend = expected_income - spending;
  const maxCategory = spending_by_category[0]?.amount ?? 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow={formatMonth(summary.month)}
        title="Financial health"
        action={
          <Link to="/insights" className="btn-primary">
            View report
          </Link>
        }
      />

      <div className="card-grid">
        <StatCard
          label="Total balance"
          value={formatWholeMoney(total_balance)}
          note={`Across ${accounts.length} account${accounts.length === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Money in"
          value={formatWholeMoney(income)}
          note={income < expected_income ? `Expecting ${formatWholeMoney(expected_income)}` : 'This month'}
          tone="positive"
        />
        <StatCard
          label="Money out"
          value={formatWholeMoney(spending)}
          note={`Net ${net >= 0 ? '+' : ''}${formatWholeMoney(net)} this month`}
          tone="negative"
        />
        <StatCard
          label="Left to spend"
          value={formatWholeMoney(leftToSpend)}
          note={leftToSpend >= 0 ? 'Of expected income' : 'Over expected income'}
          tone={leftToSpend >= 0 ? 'positive' : 'negative'}
        />
      </div>

      <Panel title="Spending by category" chip="This month">
        {spending_by_category.length === 0 ? (
          <p className="muted">No spending yet this month.</p>
        ) : (
          <ul className="budget-list">
            {spending_by_category.map(({ category, amount }) => (
              <li key={category} className="category-row">
                <div className="budget-row">
                  <span className="budget-name">
                    <span className="color-dot" style={{ backgroundColor: categoryColor(category) }} />
                    {category}
                  </span>
                  <span className="budget-amount">{formatMoney(amount)}</span>
                </div>
                <div className="category-track" aria-hidden="true">
                  <div
                    className="category-bar"
                    style={{ width: `${(amount / maxCategory) * 100}%`, backgroundColor: categoryColor(category) }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Accounts">
        <ul className="transaction-list">
          {accounts.map((a) => (
            <li key={a.account_id} className="transaction-row">
              <div>
                <p className="transaction-title">{a.name}</p>
                <p className="transaction-meta account-type">{a.type}</p>
              </div>
              <span className={`transaction-amount ${a.balance < 0 ? 'negative' : ''}`}>{formatMoney(a.balance)}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Recent transactions">
        {transactions.length === 0 ? (
          <p className="muted">No recent transactions.</p>
        ) : (
          <>
            <TransactionList items={transactions.slice(0, 6)} />
            <Link to="/transactions" className="btn-link">
              See all transactions
            </Link>
          </>
        )}
      </Panel>

      <section className="highlight-card">
        <p className="eyebrow">Savings target</p>
        <p className="highlight-value">{formatMoney(savings_target)}</p>
        <p className="muted">20% of expected income · {Math.round(savings_progress)}% still achievable this month</p>
        <ProgressBar value={savings_progress} label="Savings target achievable" />
      </section>
    </div>
  );
}
