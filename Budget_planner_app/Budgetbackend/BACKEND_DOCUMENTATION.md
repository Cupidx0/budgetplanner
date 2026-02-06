# Budget Planner Backend Documentation

## Overview
The backend is a Flask REST API that powers authentication, salary calculations, bills, and employer/employee shift management. It uses a MySQL database and auto-initializes the schema on import.

Key modules:
- `api_server.py`: Flask app, REST endpoints, business logic.
- `database_and_table.py`: Database config and schema initialization.
- `budgetset.py`: DB helper utilities used by the API (user creation, daily salary inserts).
- `budget_assistant.txt`: Chat log file for the budgeting assistant.
- `stocks_investment.py`: Standalone websocket demo for price streaming (not called by the API).
- `ml_ai_budgeting.py`: Placeholder (currently empty).

## Runtime and Setup
- Python dependencies: `Budget_planner_app/Budgetbackend/requirements.txt`
- Start server: `python api_server.py`
- Default base URL: `http://localhost:5000`
- CORS: enabled for all origins (see `api_server.py`).

### Environment Variables
- `OPEN_AI_KEY`: Optional. Enables the AI budget assistant endpoint.

## Database
### Database Name
- `salary_management`

### Connection Config
Defined in `Budget_planner_app/Budgetbackend/database_and_table.py` and `Budget_planner_app/Budgetbackend/budgetset.py`:
- user: `root`
- password: `""`
- host: `localhost`

### Schema Initialization
`database_and_table.py` creates the DB and tables at import time via `init_db()`. It also inserts a default user:
- `admin` / `password123`

### Tables
All tables are created in `database_and_table.py`.

#### `users`
- `user_id` INT PK, auto increment
- `username` VARCHAR(50), unique
- `password` VARCHAR(255)
- `hourly_rate` DECIMAL(10,2)
- `role` VARCHAR(20) default `employee`
- `created_at` TIMESTAMP

#### `daily_keep`
- `daily_keep_id` INT PK
- `daily_keep_date` DATE
- `daily_hours_worked` DECIMAL(5,2)
- `daily_keep_amount` DECIMAL(10,2)
- `user_id` INT FK -> `users.user_id` (ON DELETE SET NULL)

#### `bills`
- `bill_id` INT PK
- `bill_name` VARCHAR(100)
- `bill_amount` DECIMAL(10,2)
- `user_id` INT FK -> `users.user_id` (ON DELETE SET NULL)

#### `weekly_earnings`
- `weekly_earnings_id` INT PK
- `week_number` INT
- `year_num` INT
- `earnings_amount` DECIMAL(10,2)
- `user_id` INT FK -> `users.user_id` (ON DELETE SET NULL)
- Unique: `(week_number, year_num, user_id)`

#### `monthly_salaries`
- `monthly_salary_id` INT PK
- `month` INT
- `year_num` INT
- `salary_amount` DECIMAL(12,2)
- `user_id` INT FK -> `users.user_id` (ON DELETE SET NULL)
- Unique: `(month, year_num, user_id)`

#### `salary_after_bills`
- `salary_after_bills_id` INT PK
- `month` INT
- `year_num` INT
- `net_after_bills` DECIMAL(12,2)
- `percentage_after_bills` DECIMAL(5,2)
- `user_id` INT FK -> `users.user_id` (ON DELETE SET NULL)
- Unique: `(month, year_num, user_id)`

#### `shifts`
- `shift_id` INT PK
- `shift_name` VARCHAR(100)
- `shift_date` DATE
- `start_time` TIME
- `end_time` TIME
- `description` TEXT
- `status` ENUM('pending','approved','rejected') default `pending`
- `employee_id` INT FK -> `users.user_id` (ON DELETE CASCADE)
- `created_by` INT FK -> `users.user_id` (ON DELETE SET NULL)
- `shift_type` ENUM('employer_created','employee_submitted') default `employer_created`
- `hours_worked` DECIMAL(5,2)
- `created_at` TIMESTAMP
- `approved_at` TIMESTAMP NULL

#### `notifications`
- `notification_id` INT PK
- `user_id` INT FK -> `users.user_id` (ON DELETE CASCADE)
- `shift_id` INT FK -> `shifts.shift_id` (ON DELETE CASCADE)
- `notification_type` VARCHAR(50)
- `message` VARCHAR(255)
- `is_read` BOOLEAN
- `created_at` TIMESTAMP

## Core Flows
### Daily Salary
1. `POST /api/user/<id>/daily-salary` calculates hours and salary.
2. `save_daily_to_db()` inserts into `daily_keep`.
3. `auto_update_weekly_earnings()` updates `weekly_earnings`.
4. `auto_update_monthly_salary()` updates `monthly_salaries` and applies tax.

### Bills and Salary After Bills
- Bills are stored in `bills`.
- `GET /api/user/<id>/salary-after-bills` calculates net salary after deducting bills and stores results in `salary_after_bills`.

### Shift Management
- Employers create shifts (`POST /api/employer/shifts`).
- Employees can submit shifts (`POST /api/employee/shifts`).
- Approve/reject flows update `shifts.status` and create `notifications`.
- Approvals insert into `daily_keep` to feed salary totals and weekly/monthly rollups.

### Budget Assistant
- `POST /api/assistant/user/<id>/chat` uses OpenAI if `OPEN_AI_KEY` is set.
- Chat history is appended to `budget_assistant.txt`.
- `GET /api/assistantchat/user/<id>/message` returns the parsed chat history for a user.

## API Endpoints
All endpoints are defined in `Budget_planner_app/Budgetbackend/api_server.py`.

### Health
- `GET /api/health` - Basic health check.

### Authentication
- `POST /api/register`
- `POST /api/login`

### User and Salary
- `GET /api/user/<user_id>/hourly-rate`
- `PUT /api/user/<user_id>/hourly-rate`
- `POST /api/user/<user_id>/daily-salary`
- `GET /api/user/<user_id>/daily-salary`
- `GET /api/user/<user_id>/daily-salary-history`
- `GET /api/user/<user_id>/weekly-earnings`
- `GET /api/user/<user_id>/monthly-salary`
- `GET /api/user/<user_id>/salary-after-bills`

### Bills
- `GET /api/user/<user_id>/bills`
- `POST /api/user/<user_id>/bills`
- `DELETE /api/user/<user_id>/bills/<bill_id>`

### Employer Shift Management
- `POST /api/employer/shifts`
- `GET /api/employer/pending-shifts`
- `PUT /api/employer/shifts/<shift_id>/approve`
- `PUT /api/employer/shifts/<shift_id>/reject`
- `GET /api/employer/employees`
- `GET /api/employer/employees/<employee_id>/salary`
- `GET /api/employer/pending-employee-shifts`

### Employee Shift Management
- `GET /api/employee/shifts`
- `POST /api/employee/shifts`
- `GET /api/employee/submitted-shifts`

### Notifications
- `GET /api/employee/notifications`
- `PUT /api/employee/notifications/<notification_id>/read`

### Assistant
- `POST /api/assistant/user/<user_id>/chat`
- `GET /api/assistantchat/user/<user_id>/message`

## File-Level Responsibilities
- `api_server.py`: request parsing, validation, SQL operations, and response formatting.
- `database_and_table.py`: database bootstrap and schema creation.
- `budgetset.py`: shared DB helpers used by `api_server.py` (user creation and daily salary persistence).
- `budget_assistant.txt`: persisted assistant chat history.
- `stocks_investment.py`: websocket demo for stock price streaming (standalone).

## Notes and Constraints
- Time fields for shifts are expected in `HH:MM` 24-hour format.
- Money columns are stored as DECIMAL with 2 digits of precision.
- Several endpoints auto-update aggregate tables to keep summaries in sync.
- The admin login shortcut stores `user_id` as a string (`"admin"`), which is not a numeric user_id from the DB.
