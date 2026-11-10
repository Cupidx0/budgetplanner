"""MySQL connection and schema for the Budget Planner backend.

Bank data (accounts, balances, transactions) is NOT stored here; it comes from
the bank API via bank_client.py. The database only holds app users and the
bills they plan for.
"""
import os

import mysql.connector
from mysql.connector import Error

DB_NAME = os.getenv("DB_NAME", "salary_management")
DB_CONFIG = {
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "host": os.getenv("DB_HOST", "localhost"),
    "raise_on_warnings": True,
}

TABLES = {
    "users": (
        "CREATE TABLE IF NOT EXISTS users ("
        "  user_id INT AUTO_INCREMENT PRIMARY KEY,"
        "  username VARCHAR(50) NOT NULL UNIQUE,"
        "  password VARCHAR(255) NOT NULL,"
        "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        ") ENGINE=InnoDB"
    ),
    "bills": (
        "CREATE TABLE IF NOT EXISTS bills ("
        "  bill_id INT AUTO_INCREMENT PRIMARY KEY,"
        "  bill_name VARCHAR(100) NOT NULL,"
        "  bill_amount DECIMAL(10,2) NOT NULL,"
        "  user_id INT,"
        "  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL"
        ") ENGINE=InnoDB"
    ),
}


def init_db():
    """Create the database and tables if missing. Existing tables are left untouched."""
    conn = None
    cur = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        cur.execute(f"USE `{DB_NAME}`")
        for ddl in TABLES.values():
            cur.execute(ddl)
        # Default account for local development.
        cur.execute("INSERT IGNORE INTO users (username, password) VALUES (%s, %s)", ("admin", "password123"))
        conn.commit()
    except Error as e:
        print("DB init error:", e)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


def get_conn():
    """Return a connection to the app database, or None if MySQL is unavailable."""
    try:
        return mysql.connector.connect(database=DB_NAME, **DB_CONFIG)
    except Error as e:
        print("DB connection failed:", e)
        return None
