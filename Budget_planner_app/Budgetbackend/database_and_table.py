import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime
# no import from budgetset here to avoid dependency, DB init is self contained
DB_NAME = "salary_management"
DB_CONFIG = {
    "user": "root",
    "password": "",
    "host": "localhost",
    "raise_on_warnings": True
}

# DB helpers
def init_db():
    """Create database and tables if missing."""
    conn = None
    cur = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`")
        cur.execute(f"USE `{DB_NAME}`")
        tables = {
            "users": (
                "CREATE TABLE IF NOT EXISTS users ("
                "  user_id INT AUTO_INCREMENT PRIMARY KEY,"
                "  username VARCHAR(50) NOT NULL UNIQUE,"
                "  password VARCHAR(255) NOT NULL,"
                "  hourly_rate DECIMAL(10,2) DEFAULT 0.00,"
                "  date_of_birth DATE DEFAULT NULL,"
                "  role VARCHAR(20) DEFAULT 'employee',"
                "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                ") ENGINE=InnoDB"
            ),
            "daily_keep": (
                "CREATE TABLE IF NOT EXISTS daily_keep ("
                "  daily_keep_id INT AUTO_INCREMENT PRIMARY KEY,"
                "  daily_keep_date DATE NOT NULL,"
                "  daily_hours_worked DECIMAL(5,2) NOT NULL,"
                "  daily_keep_amount DECIMAL(10,2) NOT NULL,"
                "  user_id INT,"
                "  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL"
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
            "salary_after_bills": (
                "CREATE TABLE IF NOT EXISTS salary_after_bills ("
                "  salary_after_bills_id INT AUTO_INCREMENT PRIMARY KEY,"
                "  month INT NOT NULL,"
                "  year_num INT NOT NULL,"
                "  net_after_bills DECIMAL(12,2) NOT NULL,"
                "  percentage_after_bills DECIMAL(5,2) NOT NULL,"
                "  user_id INT,"
                "  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,"
                "  UNIQUE (month, year_num, user_id)"
                ") ENGINE=InnoDB"
            ),
            "shifts": (
                "CREATE TABLE IF NOT EXISTS shifts ("
                "  shift_id INT AUTO_INCREMENT PRIMARY KEY,"
                "  shift_name VARCHAR(100) NOT NULL,"
                "  shift_date DATE NOT NULL,"
                "  start_time TIME NOT NULL,"
                "  end_time TIME NOT NULL,"
                "  description TEXT,"
                "  weekly_earnings DECIMAL(10,2) DEFAULT 0.00,"
                "  monthly_salaries DECIMAL(10,2) DEFAULT 0.00,"
                "  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',"
                "  employee_id INT,"
                "  created_by INT,"
                "  shift_type ENUM('employer_created', 'employee_submitted') DEFAULT 'employer_created',"
                "  hours_worked DECIMAL(5,2),"
                "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                "  approved_at TIMESTAMP NULL,"
                "  FOREIGN KEY (employee_id) REFERENCES users(user_id) ON DELETE CASCADE,"
                "  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL"
                ") ENGINE=InnoDB"
            ),
            "notifications": (
                "CREATE TABLE IF NOT EXISTS notifications ("
                "  notification_id INT AUTO_INCREMENT PRIMARY KEY,"
                "  user_id INT NOT NULL,"
                "  shift_id INT,"
                "  notification_type VARCHAR(50) NOT NULL,"
                "  message VARCHAR(255) NOT NULL,"
                "  is_read BOOLEAN DEFAULT FALSE,"
                "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                "  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,"
                "  FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE"
                ") ENGINE=InnoDB"
            )
        }
        for name, ddl in tables.items():
            cur.execute(ddl)
        # ensure default admin user exists
        cur.execute("INSERT IGNORE INTO users (username, password) VALUES (%s, %s)", ("admin", "password123"))
        conn.commit()
    except Error as e:
        print("DB init error:", e)
    finally:
        try:
            if cur:
                cur.close()
            if conn:
                conn.close()
        except Exception:
            pass


def get_conn():
    cfg = DB_CONFIG.copy()
    cfg["database"] = DB_NAME
    try:
        return mysql.connector.connect(**cfg)
    except Exception as e:
        # DB unavailable — log and return None so callers can fallback
        print("DB connection failed:", e)
        return None
# initialize DB at import
init_db()