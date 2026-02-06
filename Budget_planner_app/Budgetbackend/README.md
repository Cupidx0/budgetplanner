# Budget Planner Backend API

Flask REST API server for the Budget Planner application.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure database in `database_and_table.py`:
```python
DB_CONFIG = {
    "user": "root",
    "password": "",  # Your MySQL password
    "host": "localhost",
    "raise_on_warnings": True
}
```

3. The database will be automatically initialized when you start the server.

4. Start the server:
```bash
python api_server.py
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Register a new user
- `POST /api/login` - Login user

### User Management
- `GET /api/user/:id/hourly-rate` - Get user's hourly rate
- `PUT /api/user/:id/hourly-rate` - Update user's hourly rate

### Salary
- `POST /api/user/:id/daily-salary` - Calculate daily salary
- `GET /api/user/:id/weekly-earnings` - Get weekly earnings
- `GET /api/user/:id/monthly-salary` - Get monthly salary with tax
- `GET /api/user/:id/salary-after-bills` - Get salary after bills
- `GET /api/user/:id/daily-salary-history` - Get daily salary history

### Bills
- `GET /api/user/:id/bills` - Get all bills
- `POST /api/user/:id/bills` - Add a bill
- `DELETE /api/user/:id/bills/:bill_id` - Delete a bill

## CORS

CORS is enabled for all origins to allow React Native app connections. In production, you should restrict this to specific domains.

## Database Schema

The database includes the following tables:
- `users` - User accounts
- `daily_keep` - Daily salary records
- `bills` - Bill records
- `weekly_earnings` - Weekly earnings summaries
- `monthly_salaries` - Monthly salary records
- `salary_after_bills` - Salary after bills calculations

