# Budget Planner Backend Documentation

## Overview
Flask REST API for the Budget Planner web app. A user's money data (accounts, balances and transactions) comes from a **bank API**. MySQL stores only app users and the bills they plan for.

| Module | Purpose |
| --- | --- |
| `api_server.py` | Flask app: auth, bank data, monthly summary, planned bills, AI assistant |
| `bank_client.py` | The only code that talks to the bank. Remote mock API, or built-in placeholder data |
| `database_and_table.py` | MySQL config and schema (`users`, `bills`) |
| `budget_assistant.txt` | Assistant chat log (one entry per exchange) |
| `stocks_investment.py`, `ml_ai_budgeting.py` | Standalone experiments, not used by the API |

## Setup
```bash
pip install -r requirements.txt
cp example.env .env      # then fill in values
python3 api_server.py    # http://localhost:5001
```

### Environment variables
| Variable | Default | Purpose |
| --- | --- | --- |
| `BANK_API_URL` | *(unset)* | Base URL of the mock bank API. Unset means built-in placeholder data |
| `BANK_API_KEY` | *(unset)* | Sent as `Authorization: Bearer …` if set |
| `BANK_API_TIMEOUT` | `10` | Seconds |
| `OPEN_AI_KEY` | *(unset)* | Enables the AI assistant. Without it, replies are built from the summary |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `root` / `""` / `salary_management` | MySQL |
| `PORT` | `5001` | API port |

## Connecting the bank API
`bank_client.py` exposes two functions to the rest of the backend:

- `get_accounts(user_id)` returns a list of `{account_id, name, type, balance, currency}`
- `get_transactions(user_id, start, end)` returns a list of `{transaction_id, account_id, date, description, amount, category}`, newest first. `amount` is signed: **positive is money in, negative is money out**.

When `BANK_API_URL` is set, the client calls:

```
GET {BANK_API_URL}/users/{customer_id}/accounts
GET {BANK_API_URL}/users/{customer_id}/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Responses may be a bare list or wrapped as `{"accounts": [...]}`, `{"transactions": [...]}` or `{"data": [...]}`. Common field-name variants are mapped automatically, for example `accountId`/`id`, `bookingDate`, `merchant`, and unsigned amounts with `direction: "debit"`. If your mock differs, edit these in `bank_client.py`:

- `ACCOUNTS_PATH` / `TRANSACTIONS_PATH`: the endpoint paths
- `_customer_id(user_id)`: maps an app user to a bank customer id (default: the same id)
- `_normalize_account()` / `_normalize_transaction()`: field mapping

Transactions in the `Transfer` or `Savings` categories are treated as moves between the user's own accounts and excluded from income and spending totals (`TRANSFER_CATEGORIES`).

If the bank can't be reached or returns an error, the API responds with **502** and `{"error": "..."}`.

## Database
Database `salary_management` (configurable). `init_db()` creates any missing tables at startup and never drops existing ones. It also seeds a dev user, `admin` / `password123`.

- `users`: `user_id`, `username` (unique), `password`, `created_at`
- `bills`: `bill_id`, `bill_name`, `bill_amount`, `user_id`

Passwords are stored in plain text, so this is only suitable for local development.

## Endpoints
All responses are JSON. User-scoped routes take the numeric `user_id` returned by login.

### Health & auth
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | | `{status, bank_mode: "remote" \| "placeholder"}` |
| POST | `/api/register` | `{username, password}` | `201 {success, user_id, username}`, or `409` if the name is taken |
| POST | `/api/login` | `{username, password}` | `200 {success, user_id, username}`, or `401` |

### Bank data
| Method | Path | Query | Response |
| --- | --- | --- | --- |
| GET | `/api/user/:id/accounts` | | `{accounts: Account[]}` |
| GET | `/api/user/:id/transactions` | `from`, `to` (YYYY-MM-DD; default last 30 days) | `{transactions: Transaction[]}` |
| GET | `/api/user/:id/summary` | `month` (YYYY-MM; default current) | see below |

Summary fields:
- `month`
- `total_balance`: sum of all account balances
- `income`, `spending`, `net`: this month so far, transfers excluded
- `expected_income`: the higher of this month's and last month's income, used for planning before payday
- `spending_by_category`: `[{category, amount}]`, largest first
- `bills_total`: sum of planned bills
- `savings_target`: 20% of expected income
- `savings_progress`: 0–100, the share of the target still achievable
- `transaction_count`

### Planned bills
| Method | Path | Body |
| --- | --- | --- |
| GET | `/api/user/:id/bills` | |
| POST | `/api/user/:id/bills` | `{name, amount}` (amount > 0) |
| DELETE | `/api/user/:id/bills/:bill_id` | |

### Assistant
| Method | Path | Body | Response |
| --- | --- | --- | --- |
| POST | `/api/assistant/user/:id/chat` | `{message}` | `{response}`, using the summary, bills, last 14 days of transactions and the user's last 5 exchanges |
| GET | `/api/assistant/user/:id/history` | | `{chat_history: [{user_message, assistant_response, timestamp}]}` |

## Removed
The shift, salary, hourly-rate, employer/employee and notification endpoints were removed, along with `budgetset.py`. Their MySQL tables (`shifts`, `daily_keep`, `salary_after_bills`, `notifications`) are no longer created or read, but existing data is left in place. The `daily_keep/` folder of old salary text files is also unused.
