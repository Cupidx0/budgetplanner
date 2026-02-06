# Quick Setup Guide - Shift Management System

## Backend Setup

### 1. Update Database Tables
The database schema has been automatically updated in `database_and_table.py`. Simply restart your backend:

```bash
cd Budget_planner_app/Budgetbackend
python api_server.py
```

The new tables (`shifts` and `notifications`) will be created automatically.

### 2. Test Backend Endpoints

Use curl or Postman to test:

```bash
# Create a shift
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

# Get pending shifts
curl http://localhost:5000/api/employer/pending-shifts?employer_id=1

# Get employees
curl http://localhost:5000/api/employer/employees?employer_id=1

# Get notifications
curl http://localhost:5000/api/employee/notifications?employee_id=2

# Approve shift (replace 1 with actual shift_id)
curl -X PUT http://localhost:5000/api/employer/shifts/1/approve
```

## Frontend Setup

### 1. Update User Roles in Database
Set up test users with roles:

```sql
UPDATE users SET role='employer' WHERE user_id=1;
UPDATE users SET role='employee' WHERE user_id=2;
UPDATE users SET role='employee' WHERE user_id=3;
```

### 2. Run the App

```bash
cd BudgetPlannerApp
npm start
# or
expo start
```

### 3. Login Flow

**As Employer (user_id=1, role='employer'):**
1. Login with employer credentials
2. Redirected to EmployerNavigator
3. Navigate to "Create Shift" tab to create shifts
4. Navigate to "Approve Shifts" tab to manage pending shifts
5. Navigate to "Employees" tab to view employee list

**As Employee (user_id=2, role='employee'):**
1. Login with employee credentials
2. Redirected to EmployeeNavigator
3. Navigate to "Notifications" tab to view shift approvals/rejections
4. Pull down to refresh notifications

## Testing Scenario

### Step 1: Employer Creates Shift
1. Login as employer
2. Go to "Create Shift" tab
3. Fill in:
   - Shift Name: "Morning Shift"
   - Date: 2026-01-25
   - Start: 09:00
   - End: 17:00
4. Submit

### Step 2: Employer Approves Shift
1. Go to "Approve Shifts" tab
2. See the pending shift
3. Tap "Approve" button
4. Confirm action

### Step 3: Employee Sees Notification
1. Logout and login as employee
2. Navigate to "Notifications" tab
3. Should see approval notification
4. Pull down to refresh if needed

## API Response Examples

### Create Shift Response (Success)
```json
{
  "success": true,
  "shift_id": 1,
  "message": "Shift created successfully"
}
```

### Get Pending Shifts Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shiftName": "Morning Shift",
      "date": "2026-01-25",
      "startTime": "09:00",
      "endTime": "17:00",
      "hoursWorked": 8.0,
      "status": "pending",
      "employeeName": "John Doe",
      "employeeId": 2
    }
  ]
}
```

### Get Notifications Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "shiftId": 1,
      "type": "shift_approved",
      "message": "Your shift on 2026-01-25 has been approved!",
      "isRead": false,
      "createdAt": "2026-01-23T10:30:45"
    }
  ]
}
```

## Troubleshooting

### Issue: "No pending shifts" but shifts exist
- **Solution**: Check that shifts have `status='pending'` in database
- SQL: `SELECT * FROM shifts WHERE status='pending';`

### Issue: Notifications not appearing
- **Solution**: Verify notification was created when shift was approved
- SQL: `SELECT * FROM notifications WHERE user_id=?;`

### Issue: Hours not calculated
- **Solution**: Ensure start_time and end_time are in HH:MM format
- Backend automatically calculates: `(end - start) / 60`

### Issue: Employee list empty
- **Solution**: Check that employees exist with `role='employee'`
- SQL: `SELECT * FROM users WHERE role='employee';`

### Issue: API connection timeout
- **Solution**: Ensure backend is running on correct IP/port
- Update API_BASE_URL in `src/services/api.js` if using physical device

## File Changes Summary

### Backend (Python)
- ✅ `database_and_table.py` - Added shifts and notifications tables
- ✅ `api_server.py` - Added 7 new API endpoints

### Frontend (React Native)
- ✅ `src/services/api.js` - Added employerShiftAPI and employeeNotificationAPI
- ✅ `src/screens/ApproveShiftScreen.js` - Connected to API
- ✅ `src/screens/EmployeeScreen.js` - Connected to API
- ✅ `src/screens/NotificationsScreen.js` - NEW - Employee notifications
- ✅ `src/navigation/EmployeeNavigator.js` - Added Notifications tab
- ✅ `App.js` - Already has role-based routing

## Next Steps

1. Test the complete workflow end-to-end
2. Verify database entries are created correctly
3. Test notification refresh on app restart
4. Implement additional features as needed

For detailed documentation, see `SHIFT_MANAGEMENT_DOCS.md`
