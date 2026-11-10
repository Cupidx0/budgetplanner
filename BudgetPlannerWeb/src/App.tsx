import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AssistantPage } from './pages/AssistantPage';
import { InsightsPage } from './pages/InsightsPage';
import { OverviewPage } from './pages/OverviewPage';
import { TransactionsPage } from './pages/TransactionsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
