import { categoryColor, formatDay, formatSignedMoney } from '../lib/format';
import type { Transaction } from '../types';

export function TransactionList({ items }: { items: Transaction[] }) {
  return (
    <ul className="transaction-list">
      {items.map((t) => (
        <li key={t.transaction_id} className="transaction-row">
          <div>
            <p className="transaction-title">{t.description}</p>
            <p className="transaction-meta">
              {formatDay(t.date)}
              <span className="category-tag">
                <span className="color-dot" style={{ backgroundColor: categoryColor(t.category) }} />
                {t.category}
              </span>
            </p>
          </div>
          <span className={`transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}`}>
            {formatSignedMoney(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
