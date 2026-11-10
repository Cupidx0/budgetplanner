import { useMemo, useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { TransactionList } from '../components/TransactionList';
import { ApiError } from '../lib/api';
import { formatMoney } from '../lib/format';
import { useBudget } from '../lib/useBudget';

const ALL = 'all';

export function TransactionsPage() {
  const { data, addBill, deleteBill } = useBudget();
  const { transactions, accounts, bills } = data;

  const [accountFilter, setAccountFilter] = useState(ALL);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [search, setSearch] = useState('');

  const categories = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter(
      (t) =>
        (accountFilter === ALL || t.account_id === accountFilter) &&
        (categoryFilter === ALL || t.category === categoryFilter) &&
        (!q || t.description.toLowerCase().includes(q)),
    );
  }, [transactions, accountFilter, categoryFilter, search]);

  const totalIn = visible.reduce((s, t) => (t.amount > 0 ? s + t.amount : s), 0);
  const totalOut = visible.reduce((s, t) => (t.amount < 0 ? s - t.amount : s), 0);

  // --- Planned bills form ---
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter a bill name and a positive amount.');
      return;
    }
    void run(async () => {
      await addBill(name.trim(), value);
      setName('');
      setAmount('');
    });
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Transactions" title="Bank activity" />

      <Panel title="Last 90 days" chip={`${visible.length} shown`}>
        <div className="filters">
          <input
            className="input"
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search transactions"
          />
          <select
            className="input"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            aria-label="Filter by account"
          >
            <option value={ALL}>All accounts</option>
            {accounts.map((a) => (
              <option key={a.account_id} value={a.account_id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          >
            <option value={ALL}>All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <p className="muted filter-totals">
          In <span className="positive">{formatMoney(totalIn)}</span> · Out{' '}
          <span className="negative">{formatMoney(totalOut)}</span>
        </p>

        {visible.length === 0 ? (
          <p className="muted">No transactions match.</p>
        ) : (
          <TransactionList items={visible} />
        )}
      </Panel>

      <Panel title="Planned bills">
        <p className="muted bills-hint">Bills you expect each month. They're compared against your income on Insights.</p>
        <form className="inline-form" onSubmit={handleAdd}>
          <input
            className="input"
            placeholder="Bill name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Bill name"
          />
          <input
            className="input input--amount"
            placeholder="Amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Bill amount"
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            Add bill
          </button>
        </form>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {bills.length > 0 && (
          <ul className="transaction-list">
            {bills.map((bill) => (
              <li key={bill.bill_id} className="transaction-row">
                <p className="transaction-title">{bill.name}</p>
                <span className="row-actions">
                  <span className="transaction-amount negative">{formatMoney(bill.amount)}</span>
                  <button
                    type="button"
                    className="btn-link"
                    disabled={busy}
                    onClick={() => void run(() => deleteBill(bill.bill_id))}
                    aria-label={`Delete ${bill.name}`}
                  >
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
