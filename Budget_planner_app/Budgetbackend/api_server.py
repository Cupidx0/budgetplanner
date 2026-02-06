from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from budgetset import get_conn, add_user, save_daily_to_db
import openai
app = Flask(__name__)
CORS(app)  # Enable CORS for React Native
load_dotenv()
OPEN_AI_API_KEY = os.getenv("OPEN_AI_KEY")
openai.api_key = OPEN_AI_API_KEY
# --- Helper: Tax Calculation ---
def calculate_tax(gross_salary):
    """Calculate UK income tax on monthly salary."""
    low_tax_per = 0.20
    mid_tax_per = 0.40
    high_tax_per = 0.45
    untaxed_limit = 12570
    low_tax_limit = 37700
    mid_tax_limit = 125140
    
    if gross_salary <= untaxed_limit / 12:
        tax = 0
    elif gross_salary <= (untaxed_limit + low_tax_limit) / 12:
        tax = (gross_salary - (untaxed_limit / 12)) * low_tax_per
    elif gross_salary <= (untaxed_limit + low_tax_limit + mid_tax_limit) / 12:
        tax = ((low_tax_limit / 12) * low_tax_per) + ((gross_salary - ((untaxed_limit + low_tax_limit) / 12)) * mid_tax_per)
    else:
        tax = ((low_tax_limit / 12) * low_tax_per) + ((mid_tax_limit / 12) * mid_tax_per) + ((gross_salary - ((untaxed_limit + low_tax_limit + mid_tax_limit) / 12)) * high_tax_per)
    
    return round(tax, 2)

# --- Auto-Update Helpers ---
def auto_update_weekly_earnings(user_id):
    """Automatically calculate and update weekly earnings in the database."""
    now = datetime.now()
    week_num = now.isocalendar()[1]
    year_num = now.year
    
    conn = get_conn()
    if not conn:
        return
    
    cur = None
    try:
        cur = conn.cursor()
        # Calculate total weekly earnings
        cur.execute(
            "SELECT IFNULL(SUM(daily_keep_amount),0) FROM daily_keep "
            "WHERE WEEK(daily_keep_date,1) = %s AND YEAR(daily_keep_date) = %s AND user_id = %s",
            (week_num, year_num, user_id)
        )
        row = cur.fetchone()
        total_weekly = float(row[0]) if row and row[0] is not None else 0.0
        
        # Check if record exists
        cur.execute(
            "SELECT weekly_earnings_id FROM weekly_earnings "
            "WHERE week_number=%s AND year_num=%s AND user_id=%s",
            (week_num, year_num, user_id)
        )
        existing = cur.fetchone()
        
        if existing:
            # Update existing record
            cur.execute(
                "UPDATE weekly_earnings SET earnings_amount=%s "
                "WHERE week_number=%s AND year_num=%s AND user_id=%s",
                (total_weekly, week_num, year_num, user_id)
            )
        else:
            # Insert new record
            cur.execute(
                "INSERT INTO weekly_earnings (week_number, year_num, earnings_amount, user_id) "
                "VALUES (%s, %s, %s, %s)",
                (week_num, year_num, total_weekly, user_id)
            )
        conn.commit()
    except Exception as e:
        print(f"Error auto-updating weekly earnings: {e}")
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass


# --- Raw DB fetch helpers (return raw python data, not Flask responses) ---
def _fetch_bills_raw(user_id):
    conn = get_conn()
    if not conn:
        return []
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("SELECT bill_id, bill_name, bill_amount FROM bills WHERE user_id=%s", (user_id,))
        rows = cur.fetchall()
        return [{"bill_id": r[0], "name": r[1], "amount": float(r[2])} for r in rows]
    except Exception as e:
        print(f"Error fetching bills: {e}")
        return []
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass


def _fetch_monthly_net_salary_raw(user_id):
    now = datetime.now()
    month = now.month
    year = now.year
    conn = get_conn()
    if not conn:
        return 0.0
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT IFNULL(salary_amount,0) FROM monthly_salaries WHERE month=%s AND year_num=%s AND user_id=%s",
            (month, year, user_id)
        )
        row = cur.fetchone()
        return float(row[0]) if row and row[0] is not None else 0.0
    except Exception as e:
        print(f"Error fetching monthly salary: {e}")
        return 0.0
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

def auto_update_monthly_salary(user_id):
    """Automatically calculate and update monthly salary with tax in the database."""
    now = datetime.now()
    month = now.month
    year = now.year
    
    conn = get_conn()
    if not conn:
        return
    
    cur = None
    try:
        cur = conn.cursor()
        # Calculate total monthly earnings
        cur.execute(
            "SELECT IFNULL(SUM(daily_keep_amount),0) FROM daily_keep "
            "WHERE MONTH(daily_keep_date) = %s AND YEAR(daily_keep_date) = %s AND user_id = %s",
            (month, year, user_id)
        )
        gross_total = float(cur.fetchone()[0] or 0.0)
        
        # Calculate tax
        tax = calculate_tax(gross_total)
        total_after_tax = gross_total - tax
        
        # Insert or update monthly salary
        cur.execute(
            "INSERT INTO monthly_salaries (month, year_num, salary_amount, user_id) "
            "VALUES (%s, %s, %s, %s) "
            "ON DUPLICATE KEY UPDATE salary_amount = VALUES(salary_amount)",
            (month, year, round(total_after_tax, 2), user_id)
        )
        conn.commit()
    except Exception as e:
        print(f"Error auto-updating monthly salary: {e}")
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

# --- Helper function to verify user credentials ---
def verify_user(username, password):
    conn = get_conn()
    if not conn:
        return None
    try:
        cur = conn.cursor()
        cur.execute("SELECT user_id, password FROM users WHERE username=%s LIMIT 1", (username,))
        row = cur.fetchone()
        if row and row[1] == password:  # Simple password check (in production, use hashing)
            return row[0]
        return None
    except Exception as e:
        print(f"Error verifying user: {e}")
        return None
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

# --- Routes ---
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"}), 200

@app.route('/api/register', methods=['POST'])
def register():
    """Frontend sends username, password, hourly_rate."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    hourly_rate = data.get('hourly_rate', 10.50)
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    
    try:
        hourly_rate = float(hourly_rate)
    except:
        return jsonify({'success': False, 'message': 'Invalid hourly rate'}), 400
    
    # Use your existing add_user function
    user_id = add_user(username, password, hourly_rate)
    
    if user_id:
        return jsonify({
            'success': True,
            'user_id': user_id,
            'username': username,
            'hourly_rate': hourly_rate,
            'message': 'User registered successfully'
        }), 201
    else:
        return jsonify({'success': False, 'message': 'Registration failed or user exists'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Frontend sends username & password, we check DB."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Check if user exists with matching password
        cur.execute(
            "SELECT user_id, username, hourly_rate FROM users WHERE username=%s AND password=%s",
            (username, password)
        )
        row = cur.fetchone()
        
        if row:
            # Login successful
            return jsonify({
                'success': True,
                'user_id': row[0],
                'username': row[1],
                'hourly_rate': float(row[2]) if row[2] else 0.0
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/user/<int:user_id>/hourly-rate', methods=['GET'])
def get_hourly_rate(user_id):
    """Get user's hourly rate."""
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("SELECT hourly_rate FROM users WHERE user_id=%s LIMIT 1", (user_id,))
        row = cur.fetchone()
        if row and row[0] is not None:
            return jsonify({"hourly_rate": float(row[0])}), 200
        else:
            return jsonify({"hourly_rate": None, "message": "Hourly rate not set"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/user/<int:user_id>/hourly-rate', methods=['PUT'])
def update_hourly_rate(user_id):
    """Update user's hourly rate."""
    data = request.json
    hourly_rate = data.get('hourly_rate')
    
    if hourly_rate is None:
        return jsonify({"error": "Hourly rate required"}), 400
    
    try:
        hourly_rate = float(hourly_rate)
    except:
        return jsonify({"error": "Invalid hourly rate"}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("UPDATE users SET hourly_rate=%s WHERE user_id=%s", (hourly_rate, user_id))
        conn.commit()
        return jsonify({"hourly_rate": hourly_rate, "message": "Hourly rate updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/user/<int:user_id>/daily-salary', methods=['POST'])
def calculate_daily_salary(user_id):
    """Calculate and save daily salary."""
    data = request.json
    hourly_rate = data.get('hourly_rate')
    work_start_time = data.get('work_start_time')  # Format: "HH:MM"
    work_end_time = data.get('work_end_time')  # Format: "HH:MM"
    
    if not hourly_rate or not work_start_time or not work_end_time:
        return jsonify({"error": "Hourly rate, start time, and end time required"}), 400
    
    try:
        hourly_rate = float(hourly_rate)
        start_h, start_m = map(int, work_start_time.split(":"))
        end_h, end_m = map(int, work_end_time.split(":"))
        start_total = start_h * 60 + start_m
        end_total = end_h * 60 + end_m
        
        if end_total < start_total:
            return jsonify({"error": "End time cannot be earlier than start time"}), 400
        
        diff = end_total - start_total
        hours = diff // 60
        minutes_frac = (diff % 60) / 60.0
        daily_hours = hours + minutes_frac
        daily_salary = round(hourly_rate * daily_hours, 2)
        
        # Save to database
        save_daily_to_db(daily_salary, daily_hours, user_id)
        
        # Auto-update weekly earnings and monthly salary
        auto_update_weekly_earnings(user_id)
        auto_update_monthly_salary(user_id)
        #get_salary_after_bills(user_id)
        
        return jsonify({
            "daily_salary": daily_salary,
            "daily_hours": round(daily_hours, 2),
            "message": "Daily salary calculated successfully"
        }), 200
    except ValueError as e:
        return jsonify({"error": "Invalid time format or hourly rate"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route('/api/user/<int:user_id>/daily-salary', methods=['GET'])
def calc_daily_salary(user_id):
    """Get latest daily salary and hours for user."""
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT daily_keep_amount, daily_hours_worked
            FROM daily_keep
            WHERE user_id = %s
            ORDER BY daily_keep_date DESC
            LIMIT 1
            """,
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            return jsonify({
                "daily_salary": 0.0,
                "daily_hours": 0.0
            }), 200
        daily_salary, daily_hours = row
        return jsonify({
            "daily_salary": float(daily_salary) if daily_salary is not None else 0.0,
            "daily_hours": float(daily_hours) if daily_hours is not None else 0.0
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/user/<int:user_id>/daily-salary-history', methods=['GET'])
def get_daily_salaries(user_id):
    """Get all daily salaries for user."""
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT daily_keep_date, daily_keep_amount FROM daily_keep "
            "WHERE user_id=%s ORDER BY daily_keep_date DESC",
            (user_id,)
        )
        rows = cur.fetchall()
        daily_salaries = [
            {"date": r[0].strftime("%Y-%m-%d"), "amount": float(r[1])} for r in rows
        ]
        return jsonify({"history": daily_salaries}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass
@app.route('/api/user/<int:user_id>/weekly-earnings', methods=['GET'])
def get_weekly_earnings(user_id):
    """Get weekly earnings for current week."""
    now = datetime.now()
    week_num = now.isocalendar()[1]
    year_num = now.year
    
    # Ensure weekly earnings are up to date
    auto_update_weekly_earnings(user_id)
    
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Get from weekly_earnings table (auto-updated)
        cur.execute(
            "SELECT IFNULL(earnings_amount,0) FROM weekly_earnings "
            "WHERE week_number=%s AND year_num=%s AND user_id=%s",
            (week_num, year_num, user_id)
        )
        row = cur.fetchone()
        total_weekly = float(row[0]) if row and row[0] is not None else 0.0
        
        return jsonify({
            "week_number": week_num,
            "year": year_num,
            "total_earnings": total_weekly
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass
@app.route('/api/assistant/user/<int:user_id>/chat', methods=['POST'])
def chat_with_assistant(user_id):
    """Chat with budget assistant (uses OpenAI if available, falls back to canned reply)."""
    log_path = os.path.join(os.path.dirname(__file__), "budget_assistant.txt")
    data = request.json or {}
    message = data.get('message')
    if not message:
        return jsonify({"error": "Message required"}), 400
    #with open(log_path,"r") as txt:
    #    log_contents = txt.read()
     #   if log_contents.count("User") > 1000:
    #        log_contents = log_contents[-5000:]  # Keep last 5000 chars {log_contents}
    # Fetch raw data to use in prompt
    user_bills = _fetch_bills_raw(user_id)
    user_monthly_salary = _fetch_monthly_net_salary_raw(user_id)
    hour_pay = update_hourly_rate(user_id)
    with open(log_path,"r") as txt:
        old_chats = txt.read()
    assistant_prompt = (
        f"You are a helpful budget assistant. Use the user's available balance and monthly net salary {user_monthly_salary} and hourly pay {hour_pay}"
        f"you can remember previous interactions in this conversation by reviewing the chat history {old_chats}."
        "to provide budgeting advice. Consider their bills ,and help them manage their finances effectively. "
        "avoid giving generic advice; focus on the user's specific financial data, give investment tips, "
        f"and their bills {user_bills} to provide concise, actionable budgeting advice."
        " If you cannot access real-time data, inform the user accordingly."
        "try to keep responses under 150 words,and remove unnesessary information."
    )
    prompt_text = f"User {user_id} says: {message}\nAssistant:\n{assistant_prompt}"

    # If OpenAI key is not configured, return a simple fallback response
    if not OPEN_AI_API_KEY:
        fallback = (
            f"I can't access AI services right now. Based on your monthly net {user_monthly_salary} "
            f"and {len(user_bills)} bills, consider reviewing recurring expenses and prioritising high-value bills."
        )
        return jsonify({"response": fallback}), 200

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": assistant_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=250,
            n=1,
            stop=None,
        )
        answer = response["choices"][0]["message"]["content"].strip()
        with open(log_path, "a") as txt:
            txt.write(
            "\n==chat entry==\n"
            f"User ID: {user_id}\n"
            "User Message:\n"
            f"{message}\n"
            "Response:\n"
            f"{answer}\n"
            "Timestamp:\n"
            f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            "==chat entry end==\n"
        )
        return jsonify({"response": answer}), 200
    except Exception as e:
        print(f"OpenAI error: {e}")
        fallback = (
            f"Sorry, I couldn't reach the AI service. Based on your monthly net {user_monthly_salary} and hourly pay {hour_pay} "
            f"and {len(user_bills)} bills, consider checking subscription services and utilities first."
        )
        return jsonify({"response": fallback, "error": str(e)}), 200
@app.route('/api/assistantchat/user/<int:user_id>/message', methods=['GET'])
def get_replies(user_id):
    log_path = os.path.join(os.path.dirname(__file__), "budget_assistant.txt")

    try:
        with open(log_path, "r", encoding="utf-8") as txt:
            log_contents = txt.read()

        chat_history = []

        for entry in log_contents.split("==chat entry=="):
            if f"User ID: {user_id}" not in entry:
                continue

            if "User Message:\n" not in entry or "Response:\n" not in entry or "Timestamp:\n" not in entry:
                continue

            user_msg = entry.split("User Message:\n", 1)[1] \
                            .split("\nResponse:\n", 1)[0].strip()

            assistant_msg = entry.split("Response:\n", 1)[1] \
                                 .split("\nTimestamp:\n", 1)[0].strip()
            timer_stp = entry.split("Timestamp:\n", 1)[1] \
                                 .split("\n==chat entry end==", 1)[0].strip()
            chat_history.append({
                "user_message": user_msg,
                "assistant_response": assistant_msg,
                "timestamp": timer_stp
            })

        return jsonify({"chat_history": chat_history}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/<int:user_id>/bills', methods=['GET'])
def get_bills(user_id):
    """Get all bills for user."""
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("SELECT bill_id, bill_name, bill_amount FROM bills WHERE user_id=%s", (user_id,))
        rows = cur.fetchall()
        bills = [{"bill_id": r[0], "name": r[1], "amount": float(r[2])} for r in rows]
        return jsonify({"bills": bills}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/user/<int:user_id>/bills', methods=['POST'])
def add_bill(user_id):
    """Add a new bill for user."""
    data = request.json
    name = data.get('name')
    amount = data.get('amount')
    
    if not name or amount is None:
        return jsonify({"error": "Bill name and amount required"}), 400
    
    try:
        amount = float(amount)
    except:
        return jsonify({"error": "Invalid amount"}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO bills (bill_name, bill_amount, user_id) VALUES (%s,%s,%s)", (name, amount, user_id))
        conn.commit()
        bill_id = cur.lastrowid
        
        # Auto-update salary after bills when a bill is added
        get_salary_after_bills(user_id)
        
        return jsonify({
            "bill_id": bill_id,
            "name": name,
            "amount": amount,
            "message": "Bill added successfully"
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/user/<int:user_id>/bills/<int:bill_id>', methods=['DELETE'])
def delete_bill(user_id, bill_id):
    """Delete a bill."""
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM bills WHERE bill_id=%s AND user_id=%s", (bill_id, user_id))
        conn.commit()
        if cur.rowcount > 0:
            # Auto-update salary after bills when a bill is deleted
            get_salary_after_bills(user_id)
            return jsonify({"message": "Bill deleted successfully"}), 200
        else:
            return jsonify({"error": "Bill not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/user/<int:user_id>/monthly-salary', methods=['GET'])
def get_monthly_salary(user_id):
    """Get monthly salary with tax breakdown."""
    now = datetime.now()
    month = now.month
    year = now.year
    
    # Ensure monthly salary is up to date
    auto_update_monthly_salary(user_id)
    
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Get monthly salary from table
        cur.execute(
            "SELECT IFNULL(salary_amount,0) FROM monthly_salaries "
            "WHERE month=%s AND year_num=%s AND user_id=%s",
            (month, year, user_id)
        )
        row = cur.fetchone()
        net_salary = float(row[0]) if row and row[0] is not None else 0.0
        
        # Calculate gross from daily_keep
        cur.execute(
            "SELECT IFNULL(SUM(daily_keep_amount),0) FROM daily_keep "
            "WHERE MONTH(daily_keep_date) = %s AND YEAR(daily_keep_date) = %s AND user_id = %s",
            (month, year, user_id)
        )
        gross_salary = float(cur.fetchone()[0] or 0.0)
        tax = gross_salary - net_salary
        
        return jsonify({
            "month": month,
            "year": year,
            "gross_salary": round(gross_salary, 2),
            "tax": round(tax, 2),
            "net_salary": round(net_salary, 2)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass
@app.route('/api/user/<int:user_id>/salary-after-bills', methods=['GET'])
def get_salary_after_bills(user_id):
    """Get salary after bills percentage for current month."""
    now = datetime.now()
    month = now.month
    year = now.year
    
    
    conn = get_conn()
    if not conn:
        return jsonify({"error": "Database unavailable"}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Get monthly salary
        cur.execute(
            "SELECT IFNULL(salary_amount,0) FROM monthly_salaries "
            "WHERE month=%s AND year_num=%s AND user_id=%s",
            (month, year, user_id)
        )
        row = cur.fetchone()
        monthly_salary = float(row[0]) if row and row[0] is not None else 0.0
        
        # Get total bills
        cur.execute("SELECT IFNULL(SUM(bill_amount),0) FROM bills WHERE user_id=%s", (user_id,))
        total_bills = float(cur.fetchone()[0] or 0.0)
        
        # Calculate net and percentage
        net_after_bills = monthly_salary - total_bills
        net_after_bills = round(net_after_bills, 0)
        if monthly_salary and monthly_salary != 0:
            percent_after_bills = round((net_after_bills / monthly_salary) * 100, 2)
        else:
            percent_after_bills = 0.0
        
        return jsonify({
            "month": month,
            "year": year,
            "monthly_salary": round(monthly_salary, 2),
            "total_bills": round(total_bills, 2),
            "net_after_bills": round(net_after_bills, 2),
            "percentage_after_bills": round(percent_after_bills, 2)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

# --- SHIFT MANAGEMENT ENDPOINTS (EMPLOYER) ---
@app.route('/api/employer/shifts', methods=['POST'])
def create_shift():
    """Create a new shift for an employee."""
    data = request.json
    shift_name = data.get('shift_name')
    shift_date = data.get('shift_date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    description = data.get('description')
    employee_id = data.get('employee_id')
    created_by = data.get('created_by')  # employer ID
    
    if not all([shift_name, shift_date, start_time, end_time, employee_id, created_by]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Calculate hours worked
        start = datetime.strptime(start_time, '%H:%M')
        end = datetime.strptime(end_time, '%H:%M')
        hours = (end - start).total_seconds() / 3600.0
        
        cur.execute(
            "INSERT INTO shifts (shift_name, shift_date, start_time, end_time, description,"
            "employee_id, created_by, shift_type, hours_worked)"#, status) 
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (shift_name, shift_date, start_time, end_time, description, employee_id, created_by, 'employer_created', hours)#, 'pending'
        )
        conn.commit()
        shift_id = cur.lastrowid
        
        return jsonify({
            'success': True,
            'shift_id': shift_id,
            'message': 'Shift created successfully for employee'
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employer/pending-shifts', methods=['GET'])
def get_pending_shifts():
    """Get all pending shifts for approval."""
    employer_id = request.args.get('employer_id')
    
    if not employer_id:
        return jsonify({'success': False, 'message': 'Missing employer_id'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT s.shift_id, s.shift_name, s.shift_date, s.start_time, s.end_time, "
            "s.hours_worked, s.status, u.username, u.user_id "
            "FROM shifts s "
            "JOIN users u ON s.employee_id = u.user_id "
            "WHERE s.created_by = %s AND s.status = 'pending' "
            "ORDER BY s.shift_date DESC",
            (employer_id,)
        )
        shifts = cur.fetchall()
        
        result = []
        for shift in shifts:
            result.append({
                'id': shift[0],
                'shiftName': shift[1],
                'date': str(shift[2]),
                'startTime': shift[3].strftime('%H:%M') if hasattr(shift[3], 'strftime') else str(shift[3]),
                'endTime': shift[4].strftime('%H:%M') if hasattr(shift[4], 'strftime') else str(shift[4]),
                'hoursWorked': float(shift[5]) if shift[5] else 0,
                'status': shift[6],
                'employeeName': shift[7],
                'employeeId': shift[8]
            })
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employer/shifts/<int:shift_id>/approve', methods=['PUT'])
def approve_shift(shift_id):
    """Approve a shift and update employee salary."""
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        
        # Get shift and employee details
        cur.execute(
            "SELECT s.employee_id, s.shift_date, s.hours_worked, u.hourly_rate "
            "FROM shifts s "
            "JOIN users u ON s.employee_id = u.user_id "
            "WHERE s.shift_id = %s",
            (shift_id,)
        )
        shift = cur.fetchone()
        
        if not shift:
            return jsonify({'success': False, 'message': 'Shift not found'}), 404
        
        employee_id, shift_date, hours_worked, hourly_rate = shift
        
        # Calculate earnings for this shift
        shift_earnings = round(float(hours_worked) * float(hourly_rate), 2) if hourly_rate else 0.0
        
        # Update shift status
        cur.execute(
            "UPDATE shifts SET status = 'approved', approved_at = NOW() WHERE shift_id = %s",
            (shift_id,)
        )
        
        # Create notification for employee
        cur.execute(
            "INSERT INTO notifications (user_id, shift_id, notification_type, message) "
            "VALUES (%s, %s, %s, %s)",
            (employee_id, shift_id, 'shift_approved', f'Your shift on {shift_date} has been approved! Earned: £{shift_earnings:.2f}')
        )
        
        # Add to daily_keep for salary tracking with calculated amount
        cur.execute(
            
            "INSERT INTO daily_keep (daily_keep_date, daily_hours_worked, daily_keep_amount, user_id) "
            "VALUES (%s, %s, %s, %s)",
            (shift_date, hours_worked, shift_earnings, employee_id)
        )
        now = shift_date.day if hasattr(shift_date, 'day') else int(str(shift_date).split('-')[2])
        week_num = now.isocalendar()[1] if hasattr(now, 'isocalendar') else datetime.strptime(str(shift_date), '%Y-%m-%d').isocalendar()[1]
        year_num = shift_date.year if hasattr(shift_date, 'year') else int(str(shift_date).split('-')[0])
        # Ensure weekly earnings are up to date
        auto_update_weekly_earnings(employee_id)
        # Get from weekly_earnings table (auto-updated)
        cur.execute(
                "SELECT IFNULL(earnings_amount,0) FROM weekly_earnings "
                "WHERE week_number=%s AND year_num=%s AND user_id=%s",
                (week_num, year_num, employee_id)
        )
        row = cur.fetchone()
        total_weekly = float(row[0]) if row and row[0] is not None else 0.0
        cur.execute(
            "UPDATE weekly_earnings SET earnings_amount = %s "
            "WHERE week_number = %s AND year_num = %s AND user_id = %s",
            (total_weekly, week_num, year_num, employee_id)
        )
        # Update monthly salary summary
        # shift_date is a datetime.date object, so use .year and .month attributes
        month_num = shift_date.month if hasattr(shift_date, 'month') else int(str(shift_date).split('-')[1])
        
        cur.execute(
            "SELECT IFNULL(SUM(daily_keep_amount), 0) FROM daily_keep "
            "WHERE YEAR(daily_keep_date) = %s AND MONTH(daily_keep_date) = %s AND user_id = %s",
            (year_num, month_num, employee_id)
        )
        result = cur.fetchone()
        monthly_total = float(result[0]) if result and result[0] else 0.0
        # Update weekly earnings by recalculating from daily_keep
        # Check if monthly record exists
        cur.execute(
            "SELECT monthly_salary_id FROM monthly_salaries WHERE user_id = %s AND month = %s AND year_num = %s",
            (employee_id, month_num, year_num)
        )
        existing_monthly = cur.fetchone()
        
        if existing_monthly:
            cur.execute(
                "UPDATE monthly_salaries SET salary_amount = %s WHERE user_id = %s AND month = %s AND year_num = %s",
                (monthly_total, employee_id, month_num, year_num)
            )
        else:
            # Create monthly record if it doesn't exist
            cur.execute(
                "INSERT INTO monthly_salaries (user_id, month, year_num, salary_amount) "
                "VALUES (%s, %s, %s, %s)",
                (employee_id, month_num, year_num, monthly_total)
            )
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Shift approved, salary updated, and notification sent',
            'earnings': shift_earnings
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employer/shifts/<int:shift_id>/reject', methods=['PUT'])
def reject_shift(shift_id):
    """Reject a shift."""
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        
        # Get shift and employee details
        cur.execute(
            "SELECT employee_id, shift_date FROM shifts WHERE shift_id = %s",
            (shift_id,)
        )
        shift = cur.fetchone()
        
        if not shift:
            return jsonify({'success': False, 'message': 'Shift not found'}), 404
        
        employee_id, shift_date = shift
        
        # Update shift status
        cur.execute(
            "UPDATE shifts SET status = 'rejected' WHERE shift_id = %s",
            (shift_id,)
        )
        
        # Create notification for employee
        cur.execute(
            "INSERT INTO notifications (user_id, shift_id, notification_type, message) "
            "VALUES (%s, %s, %s, %s)",
            (employee_id, shift_id, 'shift_rejected', f'Your shift on {shift_date} has been rejected.')
        )
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Shift rejected and notification sent'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass
@app.route('/api/employee/shifts', methods=['GET'])
def get_shifts():
    employee_id = request.args.get('employee_id')
    if not employee_id:
        return jsonify({'success': False, 'message': 'Missing employee_id'}), 400
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    cur = None
    try:
        cur = conn.cursor()
        cur.execute("SELECT shift_id, shift_name, shift_type, shift_date, start_time, end_time, "
                    "hours_worked, status, created_at "
                    "FROM shifts WHERE employee_id = %s ORDER BY shift_date DESC", (employee_id,)
        )
        shifts = cur.fetchall()
        result = []
        for shift in shifts:
            result.append({
                'id': shift[0],
                'shiftName': shift[1],
                'date': str(shift[3]),
                'startTime': shift[4].strftime('%H:%M') if hasattr(shift[4], 'strftime') else str(shift[4]),
                'endTime': shift[5].strftime('%H:%M') if hasattr(shift[5], 'strftime') else str(shift[5]),
                'hoursWorked': float(shift[6]) if shift[6] else 0,
                'status': shift[7],
                'createdAt': str(shift[8]),
                'shiftType': shift[2]
            })
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employer/employees', methods=['GET'])
def get_employees():
    """Get all employees with salary information for an employer."""
    employer_id = request.args.get('employer_id')
    
    if not employer_id:
        return jsonify({'success': False, 'message': 'Missing employer_id'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Get current month and year
        from datetime import datetime
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        # Get all employees with current month salary data
        cur.execute(
            "SELECT u.user_id, u.username, u.hourly_rate, COUNT(DISTINCT s.shift_id) as total_shifts, "
            "IFNULL(SUM(s.hours_worked), 0) as total_hours, "
            "IFNULL(ms.salary_amount, 0) as monthly_salary "
            "FROM users u "
            "LEFT JOIN shifts s ON u.user_id = s.employee_id AND s.status = 'approved' "
            "LEFT JOIN monthly_salaries ms ON u.user_id = ms.user_id AND ms.month = %s AND ms.year_num = %s "
            "WHERE u.role = 'employee' "
            "GROUP BY u.user_id, u.username, u.hourly_rate, ms.salary_amount "
            "ORDER BY u.username",
            (current_month, current_year)
        )
        employees = cur.fetchall()
        
        result = []
        for emp in employees:
            total_hours = float(emp[4]) if emp[4] else 0
            hourly_rate = float(emp[2]) if emp[2] else 0
            gross_salary = float(emp[5]) if emp[5] else (total_hours * hourly_rate)
            
            result.append({
                'id': emp[0],
                'name': emp[1],
                'email': f"{emp[1]}@company.com",
                'status': 'active',
                'department': 'Operations',
                'hoursWorked': total_hours,
                'joinDate': '2025-06-15',
                'totalShifts': emp[3],
                'hourlyRate': hourly_rate,
                'monthlySalary': gross_salary,
                'calculatedSalary': total_hours * hourly_rate
            })
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employer/employees/<int:employee_id>/salary', methods=['GET'])
def get_employee_salary_details(employee_id):
    """Get detailed salary information for a specific employee."""
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        
        # Get employee basic info
        cur.execute(
            "SELECT user_id, username, hourly_rate FROM users WHERE user_id = %s AND role = 'employee'",
            (employee_id,)
        )
        emp = cur.fetchone()
        if not emp:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
        
        # Get current month salary
        from datetime import datetime
        now = datetime.now()
        current_month = now.month
        current_year = now.year
        
        cur.execute(
            "SELECT IFNULL(SUM(daily_keep_amount), 0) FROM daily_keep WHERE user_id = %s AND MONTH(daily_keep_date) = %s AND YEAR(daily_keep_date) = %s",
            (employee_id, current_month, current_year)
        )
        result = cur.fetchone()
        monthly_total = float(result[0]) if result else 0
        
        # Get this week salary
        cur.execute(
            "SELECT IFNULL(earnings_amount, 0) FROM weekly_earnings WHERE user_id = %s AND week_number = WEEK(NOW(), 1) AND year_num = %s ORDER BY weekly_earnings_id DESC LIMIT 1",
            (employee_id, current_year)
        )
        weekly_result = cur.fetchone()
        weekly_total = float(weekly_result[0]) if weekly_result else 0
        
        # Get total hours this month
        cur.execute(
            "SELECT IFNULL(SUM(hours_worked), 0) FROM shifts WHERE employee_id = %s AND status = 'approved' AND MONTH(shift_date) = %s AND YEAR(shift_date) = %s",
            (employee_id, current_month, current_year)
        )
        result = cur.fetchone()
        monthly_hours = float(result[0]) if result else 0
        
        # Get recent shifts (last 10)
        cur.execute(
            "SELECT shift_id, shift_date, hours_worked, status, created_at FROM shifts WHERE employee_id = %s ORDER BY shift_date DESC LIMIT 10",
            (employee_id,)
        )
        shifts = cur.fetchall()
        
        shift_list = []
        for shift in shifts:
            shift_list.append({
                'id': shift[0],
                'date': str(shift[1]),
                'hours': float(shift[2]),
                'status': shift[3],
                'createdAt': str(shift[4]),
                'earnings': float(shift[2]) * float(emp[2])
            })
        
        return jsonify({
            'success': True,
            'data': {
                'employeeId': emp[0],
                'employeeName': emp[1],
                'hourlyRate': float(emp[2]),
                'monthlyTotal': float(monthly_total),
                'weeklyTotal': float(weekly_total),
                'monthlyHours': float(monthly_hours),
                'recentShifts': shift_list
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

# --- EMPLOYEE NOTIFICATION ENDPOINTS ---
@app.route('/api/employee/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications for an employee."""
    employee_id = request.args.get('employee_id')
    
    if not employee_id:
        return jsonify({'success': False, 'message': 'Missing employee_id'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT notification_id, shift_id, notification_type, message, is_read, created_at "
            "FROM notifications "
            "WHERE user_id = %s "
            "ORDER BY created_at DESC "
            "LIMIT 20",
            (employee_id,)
        )
        notifications = cur.fetchall()
        
        result = []
        for notif in notifications:
            result.append({
                'id': notif[0],
                'shiftId': notif[1],
                'type': notif[2],
                'message': notif[3],
                'isRead': notif[4],
                'createdAt': str(notif[5])
            })
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

# --- EMPLOYEE SHIFT SUBMISSION ENDPOINTS ---
@app.route('/api/employee/shifts', methods=['POST'])
def submit_shift():
    """Employee submits a shift request."""
    data = request.json
    shift_name = data.get('shift_name')
    shift_date = data.get('shift_date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    description = data.get('description')
    employee_id = data.get('employee_id')  # Employee submitting the shift
    
    if not all([shift_name, shift_date, start_time, end_time, employee_id]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Calculate hours worked
        start = datetime.strptime(start_time, '%H:%M')
        end = datetime.strptime(end_time, '%H:%M')
        hours = (end - start).total_seconds() / 3600.0
        
        cur.execute(
            "INSERT INTO shifts (shift_name, shift_date, start_time, end_time, description, "
            "employee_id, created_by, shift_type, hours_worked) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (shift_name, shift_date, start_time, end_time, description, employee_id, employee_id, 'employee_submitted', hours)
        )
        conn.commit()
        shift_id = cur.lastrowid
        
        return jsonify({
            'success': True,
            'shift_id': shift_id,
            'message': 'Shift submitted successfully'
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employee/submitted-shifts', methods=['GET'])
def get_employee_submitted_shifts():
    """Get all shifts submitted by an employee."""
    employee_id = request.args.get('employee_id')
    
    if not employee_id:
        return jsonify({'success': False, 'message': 'Missing employee_id'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT shift_id, shift_name, shift_date, start_time, end_time, "
            "hours_worked, status, created_at "
            "FROM shifts "
            "WHERE employee_id = %s AND shift_type = 'employee_submitted' "
            "ORDER BY shift_date DESC",
            (employee_id,)
        )
        shifts = cur.fetchall()
        
        result = []
        for shift in shifts:
            result.append({
                'id': shift[0],
                'shiftName': shift[1],
                'date': str(shift[2]),
                'startTime': shift[3].strftime('%H:%M') if hasattr(shift[3], 'strftime') else str(shift[3]),
                'endTime': shift[4].strftime('%H:%M') if hasattr(shift[4], 'strftime') else str(shift[4]),
                'hoursWorked': float(shift[5]) if shift[5] else 0,
                'status': shift[6],
                'createdAt': str(shift[7])
            })
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employer/pending-employee-shifts', methods=['GET'])
def get_pending_employee_shifts():
    """Get all pending shifts submitted by employees (for employer approval)."""
    employer_id = request.args.get('employer_id')
    
    if not employer_id:
        return jsonify({'success': False, 'message': 'Missing employer_id'}), 400
    
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        # Get all pending employee-submitted shifts
        cur.execute(
            "SELECT s.shift_id, s.shift_name, s.shift_date, s.start_time, s.end_time, "
            "s.hours_worked, s.status, u.username, u.user_id "
            "FROM shifts s "
            "JOIN users u ON s.employee_id = u.user_id "
            "WHERE s.shift_type = 'employee_submitted' AND s.status = 'pending' "
            "ORDER BY s.shift_date DESC"
        )
        shifts = cur.fetchall()
        
        result = []
        for shift in shifts:
            result.append({
                'id': shift[0],
                'shiftName': shift[1],
                'date': str(shift[2]),
                'startTime': shift[3].strftime('%H:%M') if hasattr(shift[3], 'strftime') else str(shift[3]),
                'endTime': shift[4].strftime('%H:%M') if hasattr(shift[4], 'strftime') else str(shift[4]),
                'hoursWorked': float(shift[5]) if shift[5] else 0,
                'status': shift[6],
                'employeeName': shift[7],
                'employeeId': shift[8],
                'shiftType': 'employee_submitted'
            })
        
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

@app.route('/api/employee/notifications/<int:notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    """Mark a notification as read."""
    conn = get_conn()
    if not conn:
        return jsonify({'success': False, 'message': 'Database unavailable'}), 500
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE notifications SET is_read = TRUE WHERE notification_id = %s",
            (notification_id,)
        )
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Notification marked as read'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cur:
            try:
                cur.close()
            except:
                pass
        if conn:
            try:
                conn.close()
            except:
                pass

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
