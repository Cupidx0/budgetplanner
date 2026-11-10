# Budget Planner (Web)

React + TypeScript + Vite front end for Budget Planner, backed by the Flask API in
`../Budget_planner_app/Budgetbackend`.

```bash
# 1. start the backend (port 5001, needs MySQL; uses placeholder bank data until BANK_API_URL is set)
cd ../Budget_planner_app/Budgetbackend && python3 api_server.py

# 2. start the web app — Vite proxies /api to http://localhost:5001
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle in dist/
npm run typecheck
```

Override the proxy target with `API_PROXY_TARGET=http://host:port npm run dev`, or set
`VITE_API_URL` at build time to call a backend on another origin directly.

## Layout

```
src/
├── main.tsx              # entry, BrowserRouter
├── App.tsx               # routes: /, /insights, /assistant, /transactions
├── types.ts              # API shapes: Account, Transaction, BudgetSummary, Bill
├── styles.css            # design tokens (CSS variables) + component styles
├── data/tips.ts          # static assistant tips
├── lib/
│   ├── api.ts            # typed client for the Flask endpoints
│   ├── auth.tsx          # login/register, persists the signed-in user
│   ├── useBudget.tsx     # BudgetProvider: loads summary, accounts, transactions, bills once
│   ├── assistant.ts      # offline fallback replies when the AI endpoint is unreachable
│   └── format.ts         # £ / date formatting, category colours
├── components/           # Layout, PageHeader, Panel, StatCard, TransactionList, ProgressBar
└── pages/                # Login, Overview, Insights, Assistant, Transactions
```
