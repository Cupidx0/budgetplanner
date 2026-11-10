import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { BudgetProvider, useBudget } from '../lib/useBudget';
import { LoginPage } from '../pages/LoginPage';

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/insights', label: 'Insights' },
  { to: '/assistant', label: 'Assistant' },
  { to: '/transactions', label: 'Transactions' },
] as const;

export function Layout() {
  const { user, logout } = useAuth();
  if (!user) return <LoginPage />;

  return (
    <BudgetProvider key={user.user_id}>
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">BP</div>
            <div>
              <p className="eyebrow eyebrow--light">Finance suite</p>
              <p className="brand-title">Budget Planner</p>
            </div>
          </div>
          <nav className="nav">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-item${isActive ? ' nav-item--active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <p className="sidebar-user">{user.username}</p>
            <button type="button" className="nav-item sidebar-logout" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="main">
          <BudgetGate />
        </main>
      </div>
    </BudgetProvider>
  );
}

/** Shows loading / error states until the backend data is in. */
function BudgetGate() {
  const { status, error, refresh } = useBudget();

  if (status === 'loading') {
    return (
      <div className="page">
        <p className="muted">Loading your budget…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="page">
        <div className="panel">
          <h2 className="panel-title">Couldn't load your budget</h2>
          <p className="body-text">{error}</p>
          <button type="button" className="btn-primary" onClick={() => void refresh()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
