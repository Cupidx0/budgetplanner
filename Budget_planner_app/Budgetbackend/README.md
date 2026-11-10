# Budget Planner Backend API

Flask REST API for the Budget Planner web app (`../../BudgetPlannerWeb`). Account, balance and transaction data comes from a bank API through `bank_client.py`. MySQL stores users and planned bills.

## Setup

```bash
pip install -r requirements.txt
cp example.env .env
python3 api_server.py        # http://localhost:5001
```

MySQL must be running. The database and tables are created on startup, and a dev login `admin` / `password123` is seeded.

## Bank data

Until `BANK_API_URL` is set in `.env`, the API serves built-in placeholder accounts and transactions, so the app works out of the box. To connect your mock bank, set `BANK_API_URL`. If its paths or field names differ from the defaults, adjust the marked section at the top of `bank_client.py`. `GET /api/health` reports which mode is active.

## Endpoints

- `POST /api/register`, `POST /api/login`
- `GET /api/user/:id/accounts`
- `GET /api/user/:id/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/user/:id/summary?month=YYYY-MM`
- `GET|POST /api/user/:id/bills`, `DELETE /api/user/:id/bills/:bill_id`
- `POST /api/assistant/user/:id/chat`, `GET /api/assistant/user/:id/history`

Full details, including the bank adapter contract: [BACKEND_DOCUMENTATION.md](BACKEND_DOCUMENTATION.md).
