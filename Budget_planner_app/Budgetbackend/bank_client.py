"""Bank data provider.

Everything the app knows about a user's money (accounts, balances,
transactions) comes through the two public functions here:

    get_accounts(user_id)                    -> list[Account]
    get_transactions(user_id, start, end)    -> list[Transaction]

Normalised shapes returned to the rest of the backend:

    Account     {"account_id", "name", "type", "balance", "currency"}
                type: "current" | "savings" | "credit"
    Transaction {"transaction_id", "account_id", "date" (YYYY-MM-DD),
                 "description", "amount", "category"}
                amount is signed: positive = money in, negative = money out.

Connecting your mock bank API
-----------------------------
Set BANK_API_URL (and BANK_API_KEY if it needs one) in .env. The client then
calls:

    GET {BANK_API_URL}/users/{customer_id}/accounts
    GET {BANK_API_URL}/users/{customer_id}/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD

If your mock uses different paths, field names or customer ids, adapt
ACCOUNTS_PATH / TRANSACTIONS_PATH, _customer_id(), _normalize_account() and
_normalize_transaction() below. Nothing else in the app needs to change.

With BANK_API_URL unset, built-in placeholder data is served instead so the
app is usable before the bank is connected.
"""
import json
import os
import random
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, timedelta

BANK_API_URL = os.getenv("BANK_API_URL", "").rstrip("/")
BANK_API_KEY = os.getenv("BANK_API_KEY")
BANK_TIMEOUT_SECONDS = float(os.getenv("BANK_API_TIMEOUT", "10"))

ACCOUNTS_PATH = "/users/{customer_id}/accounts"
TRANSACTIONS_PATH = "/users/{customer_id}/transactions"

# Categories that move money between the user's own accounts. They are
# excluded from income/spending totals.
TRANSFER_CATEGORIES = {"Transfer", "Savings"}


class BankError(Exception):
    """The bank API could not be reached or returned something unusable."""


def mode():
    return "remote" if BANK_API_URL else "placeholder"


def get_accounts(user_id):
    if not BANK_API_URL:
        return _placeholder_accounts(user_id)
    data = _get(ACCOUNTS_PATH.format(customer_id=_customer_id(user_id)))
    return [_normalize_account(a) for a in _unwrap(data, "accounts")]


def get_transactions(user_id, start, end):
    """Transactions dated start..end inclusive, newest first."""
    if BANK_API_URL:
        data = _get(
            TRANSACTIONS_PATH.format(customer_id=_customer_id(user_id)),
            {"from": start.isoformat(), "to": end.isoformat()},
        )
        txns = [_normalize_transaction(t) for t in _unwrap(data, "transactions")]
    else:
        txns = _placeholder_transactions(user_id)
    # Filter locally too, in case the API ignores the date params.
    txns = [t for t in txns if start.isoformat() <= t["date"] <= end.isoformat()]
    return sorted(txns, key=lambda t: t["date"], reverse=True)


# --- Remote API -------------------------------------------------------------

def _customer_id(user_id):
    """Map an app user to the bank's customer id. Change if your mock uses its own ids."""
    return str(user_id)


def _get(path, params=None):
    url = f"{BANK_API_URL}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    headers = {"Accept": "application/json"}
    if BANK_API_KEY:
        headers["Authorization"] = f"Bearer {BANK_API_KEY}"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=BANK_TIMEOUT_SECONDS) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise BankError(f"Bank API returned {e.code} for {path}") from e
    except (urllib.error.URLError, TimeoutError) as e:
        raise BankError(f"Bank API unreachable at {BANK_API_URL}: {e}") from e
    except json.JSONDecodeError as e:
        raise BankError(f"Bank API returned invalid JSON for {path}") from e


def _unwrap(data, key):
    """Accept either a bare list or {"<key>": [...]} / {"data": [...]}."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for k in (key, "data", "results"):
            if isinstance(data.get(k), list):
                return data[k]
    raise BankError(f"Unexpected bank API response shape for {key}")


def _pick(obj, *keys, default=None):
    for k in keys:
        if obj.get(k) is not None:
            return obj[k]
    return default


def _normalize_account(a):
    return {
        "account_id": str(_pick(a, "account_id", "accountId", "id")),
        "name": _pick(a, "name", "display_name", "nickname", default="Account"),
        "type": str(_pick(a, "type", "account_type", "accountType", default="current")).lower(),
        "balance": float(_pick(a, "balance", "current_balance", "available", default=0)),
        "currency": _pick(a, "currency", default="GBP"),
    }


def _normalize_transaction(t):
    amount = float(_pick(t, "amount", "value", default=0))
    # Some APIs send unsigned amounts plus a debit/credit flag.
    direction = str(_pick(t, "direction", "credit_debit_indicator", "type", default="")).lower()
    if direction in ("debit", "out", "outgoing") and amount > 0:
        amount = -amount
    return {
        "transaction_id": str(_pick(t, "transaction_id", "transactionId", "id")),
        "account_id": str(_pick(t, "account_id", "accountId", default="")),
        "date": str(_pick(t, "date", "booking_date", "bookingDate", "timestamp", default=""))[:10],
        "description": _pick(t, "description", "merchant", "merchant_name", "reference", default="Transaction"),
        "amount": round(amount, 2),
        "category": _pick(t, "category", "transaction_category", default="Other"),
    }


# --- Placeholder data (used until BANK_API_URL is set) -----------------------

def _placeholder_accounts(user_id):
    rng = random.Random(user_id)
    return [
        {"account_id": f"{user_id}-cur", "name": "Everyday Current", "type": "current",
         "balance": round(rng.uniform(900, 2600), 2), "currency": "GBP"},
        {"account_id": f"{user_id}-sav", "name": "Rainy Day Saver", "type": "savings",
         "balance": round(rng.uniform(2000, 6000), 2), "currency": "GBP"},
    ]


# (description, category, amount range, days of month it lands on)
_RECURRING = [
    ("Salary - ACME Ltd", "Income", (2350, 2350), [25]),
    ("Rent - Oakwood Lettings", "Housing", (-950, -950), [1]),
    ("Octopus Energy", "Utilities", (-85, -85), [3]),
    ("Thames Water", "Utilities", (-38, -38), [5]),
    ("EE Mobile", "Bills", (-22, -22), [8]),
    ("Netflix", "Subscriptions", (-10.99, -10.99), [12]),
    ("Spotify", "Subscriptions", (-11.99, -11.99), [14]),
    ("Gym membership", "Health", (-29, -29), [2]),
    ("Transfer to Rainy Day Saver", "Savings", (-200, -200), [26]),
]
_VARIABLE = [
    ("Tesco", "Groceries", (-18, -72), 0.30),
    ("Sainsbury's", "Groceries", (-12, -55), 0.15),
    ("TfL Travel", "Transport", (-2.8, -9.5), 0.45),
    ("Pret A Manger", "Eating out", (-4, -11), 0.25),
    ("Deliveroo", "Eating out", (-14, -32), 0.08),
    ("Amazon", "Shopping", (-9, -60), 0.07),
    ("Boots", "Health", (-5, -25), 0.05),
]


def _placeholder_transactions(user_id, days=120):
    rng = random.Random(user_id * 7919)
    today = date.today()
    account_id = f"{user_id}-cur"
    txns = []
    for offset in range(days):
        day = today - timedelta(days=offset)
        for desc, cat, (lo, hi), days_of_month in _RECURRING:
            if day.day in days_of_month:
                txns.append((day, desc, cat, rng.uniform(lo, hi)))
        for desc, cat, (lo, hi), chance in _VARIABLE:
            if rng.random() < chance:
                txns.append((day, desc, cat, rng.uniform(lo, hi)))
    return [
        {
            "transaction_id": f"{user_id}-{i}",
            "account_id": account_id,
            "date": d.isoformat(),
            "description": desc,
            "amount": round(amount, 2),
            "category": cat,
        }
        for i, (d, desc, cat, amount) in enumerate(txns)
    ]
