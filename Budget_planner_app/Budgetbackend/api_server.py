"""Budget Planner REST API.

Money data (accounts, balances, transactions) comes from the bank API via
bank_client.py. MySQL stores app users and their planned bills.
"""
import os
from datetime import date, datetime, timedelta

from dotenv import load_dotenv

load_dotenv()  # must run before importing modules that read env vars

from flask import Flask, jsonify, request  # noqa: E402
from flask_cors import CORS  # noqa: E402
from openai import OpenAI  # noqa: E402

import bank_client  # noqa: E402
from bank_client import BankError  # noqa: E402
from database_and_table import get_conn, init_db  # noqa: E402

app = Flask(__name__)
CORS(app)

init_db()

OPEN_AI_API_KEY = os.getenv("OPEN_AI_KEY")
openai_client = OpenAI(api_key=OPEN_AI_API_KEY) if OPEN_AI_API_KEY else None

CHAT_LOG_PATH = os.path.join(os.path.dirname(__file__), "budget_assistant.txt")
SAVINGS_TARGET_RATE = 0.20  # share of monthly income suggested as a savings target


# --- DB helpers --------------------------------------------------------------

def db_query(sql, params=(), *, fetch="all", commit=False):
    """Run one statement. Returns rows (fetch="all"), a row ("one"),
    lastrowid ("lastrowid") or rowcount ("rowcount"). Raises RuntimeError if
    the DB is unavailable."""
    conn = get_conn()
    if not conn:
        raise RuntimeError("Database unavailable")
    cur = conn.cursor()
    try:
        cur.execute(sql, params)
        if commit:
            conn.commit()
        if fetch == "all":
            return cur.fetchall()
        if fetch == "one":
            return cur.fetchone()
        if fetch == "lastrowid":
            return cur.lastrowid
        return cur.rowcount
    finally:
        cur.close()
        conn.close()


def fetch_bills(user_id):
    rows = db_query("SELECT bill_id, bill_name, bill_amount FROM bills WHERE user_id=%s ORDER BY bill_id", (user_id,))
    return [{"bill_id": r[0], "name": r[1], "amount": float(r[2])} for r in rows]


# --- Budget calculations -----------------------------------------------------

def month_bounds(month_str=None):
    """(first_day, last_day) for 'YYYY-MM', defaulting to the current month."""
    if month_str:
        first = datetime.strptime(month_str, "%Y-%m").date().replace(day=1)
    else:
        first = date.today().replace(day=1)
    next_month = (first.replace(day=28) + timedelta(days=4)).replace(day=1)
    return first, next_month - timedelta(days=1)


def _totals(transactions):
    """(income, spending, spending_by_category), ignoring transfers between own accounts."""
    income = 0.0
    spending = 0.0
    by_category = {}
    for t in transactions:
        if t["category"] in bank_client.TRANSFER_CATEGORIES:
            continue
        if t["amount"] >= 0:
            income += t["amount"]
        else:
            spending += -t["amount"]
            by_category[t["category"]] = by_category.get(t["category"], 0.0) + -t["amount"]
    return income, spending, by_category


def build_summary(user_id, month_str=None):
    """Monthly budget summary built from bank data plus planned bills."""
    start, end = month_bounds(month_str)
    prev_start, prev_end = month_bounds((start - timedelta(days=1)).strftime("%Y-%m"))
    accounts = bank_client.get_accounts(user_id)
    transactions = bank_client.get_transactions(user_id, start, end)
    prev_income, _, _ = _totals(bank_client.get_transactions(user_id, prev_start, prev_end))
    bills = fetch_bills(user_id)

    income, spending, by_category = _totals(transactions)
    net = income - spending
    # Pay may not have landed yet this month, so plan around last month's if higher.
    expected_income = max(income, prev_income)
    savings_target = round(expected_income * SAVINGS_TARGET_RATE, 2)
    bills_total = sum(b["amount"] for b in bills)

    return {
        "month": start.strftime("%Y-%m"),
        "total_balance": round(sum(a["balance"] for a in accounts), 2),
        "income": round(income, 2),
        "expected_income": round(expected_income, 2),
        "spending": round(spending, 2),
        "net": round(net, 2),
        "spending_by_category": [
            {"category": c, "amount": round(a, 2)}
            for c, a in sorted(by_category.items(), key=lambda kv: kv[1], reverse=True)
        ],
        "bills_total": round(bills_total, 2),
        "savings_target": savings_target,
        # Share of the savings target covered by what's left of expected income after spending so far.
        "savings_progress": (
            round(min(max(expected_income - spending, 0) / savings_target, 1) * 100, 1) if savings_target else 0.0
        ),
        "transaction_count": len(transactions),
    }


# --- Error handling ----------------------------------------------------------

@app.errorhandler(BankError)
def handle_bank_error(e):
    return jsonify({"error": str(e)}), 502


@app.errorhandler(RuntimeError)
def handle_runtime_error(e):
    return jsonify({"error": str(e)}), 500


# --- Health & auth -----------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "bank_mode": bank_client.mode()}), 200


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    if db_query("SELECT 1 FROM users WHERE username=%s", (username,), fetch="one"):
        return jsonify({'success': False, 'message': 'That username is already taken'}), 409

    user_id = db_query(
        "INSERT INTO users (username, password) VALUES (%s, %s)",
        (username, password), fetch="lastrowid", commit=True,
    )
    return jsonify({'success': True, 'user_id': user_id, 'username': username}), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required'}), 400

    row = db_query(
        "SELECT user_id, username FROM users WHERE username=%s AND password=%s",
        (username, password), fetch="one",
    )
    if not row:
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401
    return jsonify({'success': True, 'user_id': row[0], 'username': row[1]}), 200


# --- Bank data ---------------------------------------------------------------

@app.route('/api/user/<int:user_id>/accounts', methods=['GET'])
def get_accounts(user_id):
    return jsonify({"accounts": bank_client.get_accounts(user_id)}), 200


@app.route('/api/user/<int:user_id>/transactions', methods=['GET'])
def get_transactions(user_id):
    """Query params: from, to (YYYY-MM-DD). Defaults to the last 30 days."""
    try:
        end = datetime.strptime(request.args['to'], "%Y-%m-%d").date() if 'to' in request.args else date.today()
        start = (datetime.strptime(request.args['from'], "%Y-%m-%d").date()
                 if 'from' in request.args else end - timedelta(days=30))
    except ValueError:
        return jsonify({"error": "Dates must be YYYY-MM-DD"}), 400
    if start > end:
        return jsonify({"error": "'from' must not be after 'to'"}), 400
    return jsonify({"transactions": bank_client.get_transactions(user_id, start, end)}), 200


@app.route('/api/user/<int:user_id>/summary', methods=['GET'])
def get_summary(user_id):
    """Query param: month (YYYY-MM). Defaults to the current month."""
    try:
        return jsonify(build_summary(user_id, request.args.get('month'))), 200
    except ValueError:
        return jsonify({"error": "month must be YYYY-MM"}), 400


# --- Planned bills -----------------------------------------------------------

@app.route('/api/user/<int:user_id>/bills', methods=['GET'])
def get_bills(user_id):
    return jsonify({"bills": fetch_bills(user_id)}), 200


@app.route('/api/user/<int:user_id>/bills', methods=['POST'])
def add_bill(user_id):
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    try:
        amount = float(data.get('amount'))
    except (TypeError, ValueError):
        return jsonify({"error": "Bill name and a numeric amount are required"}), 400
    if not name or amount <= 0:
        return jsonify({"error": "Bill name and a positive amount are required"}), 400

    bill_id = db_query(
        "INSERT INTO bills (bill_name, bill_amount, user_id) VALUES (%s, %s, %s)",
        (name, amount, user_id), fetch="lastrowid", commit=True,
    )
    return jsonify({"bill_id": bill_id, "name": name, "amount": amount}), 201


@app.route('/api/user/<int:user_id>/bills/<int:bill_id>', methods=['DELETE'])
def delete_bill(user_id, bill_id):
    deleted = db_query(
        "DELETE FROM bills WHERE bill_id=%s AND user_id=%s",
        (bill_id, user_id), fetch="rowcount", commit=True,
    )
    if not deleted:
        return jsonify({"error": "Bill not found"}), 404
    return jsonify({"message": "Bill deleted"}), 200


# --- Assistant ---------------------------------------------------------------

def load_chat_history(user_id):
    """This user's entries from the assistant chat log, oldest first."""
    try:
        with open(CHAT_LOG_PATH, "r", encoding="utf-8") as f:
            log_contents = f.read()
    except FileNotFoundError:
        return []

    history = []
    for entry in log_contents.split("==chat entry=="):
        if f"User ID: {user_id}\n" not in entry:
            continue
        if "User Message:\n" not in entry or "Response:\n" not in entry or "Timestamp:\n" not in entry:
            continue
        history.append({
            "user_message": entry.split("User Message:\n", 1)[1].split("\nResponse:\n", 1)[0].strip(),
            "assistant_response": entry.split("Response:\n", 1)[1].split("\nTimestamp:\n", 1)[0].strip(),
            "timestamp": entry.split("Timestamp:\n", 1)[1].split("\n==chat entry end==", 1)[0].strip(),
        })
    return history


def append_chat_log(user_id, message, answer):
    with open(CHAT_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(
            "\n==chat entry==\n"
            f"User ID: {user_id}\n"
            f"User Message:\n{message}\n"
            f"Response:\n{answer}\n"
            f"Timestamp:\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            "==chat entry end==\n"
        )


def fallback_reply(summary):
    top = summary["spending_by_category"][0]["category"] if summary["spending_by_category"] else None
    tip = f" Your biggest spending category is {top}; start there." if top else ""
    return (
        f"This month you've received £{summary['income']:.2f} and spent £{summary['spending']:.2f} "
        f"(net £{summary['net']:.2f}). Your planned bills total £{summary['bills_total']:.2f}.{tip}"
    )


@app.route('/api/assistant/user/<int:user_id>/chat', methods=['POST'])
def chat_with_assistant(user_id):
    """Budget assistant: uses OpenAI when configured, otherwise a data-based reply."""
    data = request.get_json(silent=True) or {}
    message = (data.get('message') or '').strip()
    if not message:
        return jsonify({"error": "Message required"}), 400

    summary = build_summary(user_id)
    bills = fetch_bills(user_id)
    recent = bank_client.get_transactions(user_id, date.today() - timedelta(days=14), date.today())[:25]

    if not openai_client:
        return jsonify({"response": fallback_reply(summary)}), 200

    history_messages = []
    for c in load_chat_history(user_id)[-5:]:
        history_messages.append({"role": "user", "content": c["user_message"]})
        history_messages.append({"role": "assistant", "content": c["assistant_response"]})

    system_prompt = (
        "You are a helpful budgeting assistant for a UK user (amounts in GBP). "
        "Base your advice on the user's real bank data below; avoid generic advice. "
        "Keep answers under 150 words and actionable.\n\n"
        f"This month's summary: {summary}\n"
        f"Planned monthly bills: {bills}\n"
        f"Last 14 days of transactions: {recent}"
    )

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[{"role": "system", "content": system_prompt}, *history_messages,
                      {"role": "user", "content": message}],
            temperature=0.7,
            max_tokens=250,
        )
        answer = (response.choices[0].message.content or "").strip()
    except Exception as e:
        print(f"OpenAI error: {e}")
        return jsonify({"response": fallback_reply(summary), "error": "AI service unavailable"}), 200

    append_chat_log(user_id, message, answer)
    return jsonify({"response": answer}), 200


@app.route('/api/assistant/user/<int:user_id>/history', methods=['GET'])
def get_chat_history(user_id):
    return jsonify({"chat_history": load_chat_history(user_id)}), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", "5001")), debug=True)
