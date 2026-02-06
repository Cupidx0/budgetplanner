import os
import mysql.connector
from mysql.connector import Error
from datetime import datetime

# config
DATA_DIR = os.path.join(os.path.dirname(__file__), "daily_keep")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "weekly"), exist_ok=True)

DB_NAME = "salary_management"
DB_CONFIG = {
    "user": "root",
    "password": "",
    "host": "localhost",
    "raise_on_warnings": True
}

# --- DB Connection ---
def get_conn():
    """Get database connection."""
    try:
        conn = mysql.connector.connect(database=DB_NAME, **DB_CONFIG)
        return conn
    except Error as e:
        print("Error connecting to database:", e)
        return None

# --- Utility ---
def calendar():
    """Get current month name."""
    month_map = {
        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December"
    }
    now = datetime.now()
    return month_map[now.month]

# --- User Management ---
def add_user(username, password, hourly_rate):
    """Add user to database. Returns user_id if successful, None otherwise."""
    conn = get_conn()
    if not conn:
        print("DB unavailable — cannot add user")
        return None
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT IGNORE INTO users (username, password, hourly_rate) VALUES (%s, %s, %s)",
            (username, password, float(hourly_rate))
        )
        conn.commit()
        
        # Fetch the user_id
        cur.execute("SELECT user_id FROM users WHERE username=%s LIMIT 1", (username,))
        row = cur.fetchone()
        user_id = int(row[0]) if row else None
        return user_id
    except Exception as e:
        print("Error adding user:", e)
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

def save_daily_to_db(amount, hours_worked, user_id):
    """Save daily salary to database."""
    if not user_id:
        print("No user_id provided — skipping daily salary save")
        return False
    
    conn = get_conn()
    if not conn:
        print("DB unavailable — cannot save daily salary")
        return False
    
    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO daily_keep (daily_keep_date, daily_keep_amount, daily_hours_worked, user_id) VALUES (%s, %s, %s, %s)",
            (datetime.now().date(), float(amount), float(hours_worked), user_id)
        )
        conn.commit()
        return True
    except Exception as e:
        print("Error saving daily salary:", e)
        return False
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

# --- Legacy CLI Functions (deprecated - use api_server.py instead) ---
# Removed: salary_calc(), weekly_earnings(), add_bills(), view_bills(), 
#          monthly_sal(), monthly_bill_sal(), estimate_monthly_salary(),
#          get_user_hourly_rate(), get_sal_percent_after_bills(), user_signup(), main()
# These are now handled via REST API endpoints in api_server.py