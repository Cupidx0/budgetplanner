import os
from datetime import datetime

import mysql.connector
from mysql.connector import Error

from database_and_table import get_conn as get_db_conn
from database_and_table import init_db as initialize_database

DATA_DIR = os.path.join(os.path.dirname(__file__), "daily_keep")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(DATA_DIR, "weekly"), exist_ok=True)

DB_NAME = "salary_management"
DB_CONFIG = {
    "user": "root",
    "password": "",
    "host": "localhost",
    "raise_on_warnings": True,
}

# Ensure the database and required tables exist when this module is imported.
initialize_database()


def get_conn():
    """Return a database connection for the app."""
    try:
        conn = get_db_conn()
        if conn is not None:
            return conn
        return mysql.connector.connect(database=DB_NAME, **DB_CONFIG)
    except Error as e:
        print("Error connecting to database:", e)
        return None


def calendar():
    """Return the current month name."""
    month_map = {
        1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June",
        7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December",
    }
    now = datetime.now()
    return month_map.get(now.month, "Unknown")


def add_user(username, password, hourly_rate, date_of_birth=None):
    """Add a user to the database and return the user_id."""
    conn = get_conn()
    if not conn:
        print("DB unavailable — cannot add user")
        return None

    cur = None
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT IGNORE INTO users (username, password, hourly_rate, date_of_birth) VALUES (%s, %s, %s, %s)",
            (username, password, float(hourly_rate), date_of_birth),
        )
        conn.commit()

        cur.execute("SELECT user_id FROM users WHERE username=%s LIMIT 1", (username,))
        row = cur.fetchone()
        return int(row[0]) if row and row[0] is not None else None
    except Exception as e:
        print("Error adding user:", e)
        return None
    finally:
        if cur:
            try:
                cur.close()
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass


def save_daily_to_db(amount, hours_worked, user_id):
    """Save a daily salary entry to the database."""
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
            (datetime.now().date(), float(amount), float(hours_worked), user_id),
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
            except Exception:
                pass
        if conn:
            try:
                conn.close()
            except Exception:
                pass
