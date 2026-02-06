# Quick Reference Guide - Commands & Setup

## 🚀 Quick Start Commands

### Backend Setup
```bash
# Navigate to backend
cd /Users/user/budgetplanner/Budget_planner_app/Budgetbackend

# Start backend server (new tables auto-created)
python api_server.py
# Server runs on http://localhost:5000

# Test API health
curl http://localhost:5000/api/health
```

### Frontend Setup
```bash
# Navigate to frontend
cd /Users/user/budgetplanner/BudgetPlannerApp

# Install dependencies
npm install

# Start development server
npm start
# or
expo start

# Run on iOS simulator
expo start -i

# Run on Android emulator
expo start -a
```

---

## 🗄️ Database Setup Commands

### Connect to MySQL
```bash
# Connect to MySQL
mysql -u root -p

# Use the database
USE salary_management;

# View all tables
SHOW TABLES;

# Check shifts table
DESC shifts;

# Check notifications table
DESC notifications;
```

### Verify Data
```sql
-- Check if tables exist
SELECT TABLE_NAME FROM information_schema.TABLES 
WHERE TABLE_SCHEMA='salary_management';

-- Set up test users with roles
UPDATE users SET role='employer' WHERE user_id=1;
UPDATE users SET role='employee' WHERE user_id=2;
UPDATE users SET role='employee' WHERE user_id=3;

-- Verify roles
SELECT user_id, username, role FROM users;

-- Check pending shifts
SELECT * FROM shifts WHERE status='pending';

-- Check notifications
SELECT * FROM notifications ORDER BY created_at DESC;

-- Check daily_keep (updated on shift approval)
SELECT * FROM daily_keep WHERE user_id=2;

-- View all shifts with employee names
SELECT s.shift_id, s.shift_name, s.shift_date, 
       u.username, s.status, s.hours_worked
FROM shifts s
JOIN users u ON s.employee_id = u.user_id;
```

---

## 🧪 API Testing with cURL

### Test Shift Creation
```bash
curl -X POST http://localhost:5000/api/employer/shifts \
  -H "Content-Type: application/json" \
  -d '{
    "shift_name": "Morning Shift",
    "shift_date": "2026-01-25",
    "start_time": "09:00",
    "end_time": "17:00",
    "description": "Test shift",
    "employee_id": 2,
    "created_by": 1
  }'
```

### Test Get Pending Shifts
```bash
curl http://localhost:5000/api/employer/pending-shifts?employer_id=1
```

### Test Approve Shift (replace 1 with actual shift_id)
```bash
curl -X PUT http://localhost:5000/api/employer/shifts/1/approve
```

### Test Reject Shift
```bash
curl -X PUT http://localhost:5000/api/employer/shifts/1/reject
```

### Test Get Employees
```bash
curl http://localhost:5000/api/employer/employees?employer_id=1
```

### Test Get Notifications
```bash
curl http://localhost:5000/api/employee/notifications?employee_id=2
```

### Test Mark Notification as Read
```bash
curl -X PUT http://localhost:5000/api/employee/notifications/1/read
```

---

## 🔧 Debugging Commands

### Check Backend Logs
```bash
# Backend console shows:
# - DB connections
# - Query errors
# - API request logs
# - Transaction commits

# Watch for errors like:
# "Missing required fields"
# "Shift not found"
# "Database unavailable"
```

### Check Frontend Logs
```bash
# In React Native/Expo:
# - Open Developer Tools (Cmd+D on iOS)
# - Check Network tab for API calls
# - Check Console for JavaScript errors
# - Use AsyncStorage.getItem('userData') to debug
```

### Network Inspection
```bash
# Check if backend is running
lsof -i :5000

# Kill process on port 5000 if needed
kill -9 $(lsof -t -i:5000)

# Check MySQL is running
lsof -i :3306

# Restart MySQL (macOS)
brew services restart mysql
```

---

## 📱 Mobile App Testing

### Test Employer Flow
```
1. Login as employer (user_id=1, role='employer')
2. Navigate to "Create Shift" tab
3. Fill form:
   - Shift Name: "Test Shift"
   - Date: 2026-01-25
   - Start: 09:00
   - End: 17:00
4. Submit (should see success toast)
5. Navigate to "Approve Shifts" tab
6. Should see the newly created shift
7. Tap "Approve" (shift added to employee's notifications)
```

### Test Employee Flow
```
1. Logout from employer
2. Login as employee (user_id=2, role='employee')
3. Navigate to "Notifications" tab
4. Should see approval notification
5. Tap to mark as read
6. Pull down to refresh and verify
```

---

## 🐛 Troubleshooting Commands

### Check if Database Tables Exist
```sql
-- In MySQL
USE salary_management;
SHOW TABLES;
-- Should include: shifts, notifications, users, daily_keep, etc.

-- If missing, run:
python database_and_table.py
```

### Reset Test Data
```sql
-- Delete all test shifts
DELETE FROM notifications WHERE shift_id IN (SELECT shift_id FROM shifts WHERE created_by=1);
DELETE FROM shifts WHERE created_by=1;

-- Reset to fresh state
TRUNCATE TABLE shifts;
TRUNCATE TABLE notifications;

-- Add back demo data
INSERT INTO shifts (shift_name, shift_date, start_time, end_time, status, employee_id, created_by, hours_worked)
VALUES ('Demo Shift', '2026-01-25', '09:00', '17:00', 'pending', 2, 1, 8);
```

### Verify API Response Format
```javascript
// Expected format for all API responses:
{
  "success": true/false,
  "message": "string (optional)",
  "data": {...} // varies by endpoint
}

// Error response:
{
  "success": false,
  "message": "Error description"
}
```

---

## 📊 Useful SQL Queries

### Total Shifts by Employee
```sql
SELECT u.username, COUNT(s.shift_id) as total_shifts, 
       SUM(s.hours_worked) as total_hours
FROM users u
LEFT JOIN shifts s ON u.user_id = s.employee_id
WHERE u.role = 'employee'
GROUP BY u.user_id, u.username;
```

### Pending Shifts
```sql
SELECT s.*, u.username FROM shifts s
JOIN users u ON s.employee_id = u.user_id
WHERE s.status = 'pending'
ORDER BY s.shift_date;
```

### Recent Notifications
```sql
SELECT n.*, u.username FROM notifications n
JOIN users u ON n.user_id = u.user_id
ORDER BY n.created_at DESC LIMIT 10;
```

### Approved Shifts Today
```sql
SELECT * FROM shifts 
WHERE status = 'approved' 
AND shift_date = CURDATE();
```

### Employee Total Hours This Month
```sql
SELECT u.username, SUM(s.hours_worked) as total_hours_this_month
FROM users u
JOIN shifts s ON u.user_id = s.employee_id
WHERE s.status = 'approved'
AND MONTH(s.shift_date) = MONTH(CURDATE())
AND YEAR(s.shift_date) = YEAR(CURDATE())
GROUP BY u.user_id, u.username;
```

---

## 🔑 Environment Configuration

### API Base URL Configuration
```javascript
// File: src/services/api.js

// Development (localhost)
const getBaseURL = () => {
  return 'http://localhost:5000';
};

// Physical device (replace XXX.XXX.XXX.XXX with your computer IP)
const getBaseURL = () => {
  return 'http://192.168.1.100:5000';
};
```

### Database Configuration
```python
# File: Budgetbackend/database_and_table.py

DB_CONFIG = {
    "user": "root",           # MySQL username
    "password": "",           # MySQL password (empty if none)
    "host": "localhost",      # MySQL host
    "raise_on_warnings": True
}

DB_NAME = "salary_management"  # Database name
```

---

## 📋 File Structure Reference

```
/Users/user/budgetplanner/
├── Budget_planner_app/
│   └── Budgetbackend/
│       ├── api_server.py              (UPDATED - 7 new endpoints)
│       └── database_and_table.py       (UPDATED - new tables)
│
├── BudgetPlannerApp/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── NotificationsScreen.js  (NEW)
│   │   │   ├── ApproveShiftScreen.js   (UPDATED)
│   │   │   ├── EmployeeScreen.js       (UPDATED)
│   │   │   └── ... (other screens)
│   │   ├── navigation/
│   │   │   └── EmployeeNavigator.js    (UPDATED)
│   │   └── services/
│   │       └── api.js                  (UPDATED)
│   └── App.js                          (No changes needed)
│
└── Documentation/
    ├── COMPLETION_REPORT.md            (NEW)
    ├── IMPLEMENTATION_SUMMARY.md       (NEW)
    ├── SHIFT_MANAGEMENT_DOCS.md        (NEW)
    ├── SHIFT_SETUP_GUIDE.md            (NEW)
    ├── API_ARCHITECTURE_GUIDE.md       (NEW)
    └── QUICK_REFERENCE.md              (THIS FILE)
```

---

## ⚡ Performance Tips

### Optimize Database Queries
```sql
-- Add indexes for frequently queried columns:
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_users_role ON users(role);
```

### Improve API Response Time
- Limit notifications to 20 most recent (already implemented)
- Use pagination for large datasets
- Add database query caching if needed

### Reduce Frontend Load
- Load notifications on tab focus only (not on every keystroke)
- Use pull-to-refresh instead of auto-refresh
- Cache user data in AsyncStorage

---

## 🔐 Security Reminders

```bash
# BEFORE PRODUCTION:

# 1. Change default MySQL password
# 2. Use HTTPS for API calls
# 3. Implement JWT authentication tokens
# 4. Hash passwords with bcrypt
# 5. Add rate limiting to API
# 6. Use environment variables for secrets
# 7. Validate all user inputs
# 8. Test SQL injection prevention
# 9. Add CORS protection
# 10. Implement request logging
```

---

## 📞 Support Resources

- **API Issues**: Check API_ARCHITECTURE_GUIDE.md
- **Setup Issues**: Check SHIFT_SETUP_GUIDE.md
- **Technical Details**: Check SHIFT_MANAGEMENT_DOCS.md
- **System Overview**: Check IMPLEMENTATION_SUMMARY.md
- **All Issues**: Check COMPLETION_REPORT.md

---

This guide provides quick access to all necessary commands and configurations for the shift management system.
