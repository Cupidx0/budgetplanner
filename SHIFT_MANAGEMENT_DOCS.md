# Budget Planner - Shift Management System Documentation

## Overview
This document outlines the new shift management and notification system that has been implemented to connect employers and employees through a robust database-driven architecture.

## Backend Changes

### 1. Database Schema Updates

**New Tables Added:**

#### `shifts` Table
Stores all shift information created by employers:
```sql
- shift_id: Primary key
- shift_name: Name of the shift
- shift_date: Date of the shift
- start_time: Shift start time
- end_time: Shift end time
- description: Optional shift description
- status: ENUM('pending', 'approved', 'rejected')
- employee_id: Foreign key to employees
- created_by: Foreign key to employer who created shift
- hours_worked: Calculated hours
- created_at: Timestamp
- approved_at: Timestamp when approved
```

#### `notifications` Table
Stores notifications sent to employees:
```sql
- notification_id: Primary key
- user_id: Foreign key to employee
- shift_id: Foreign key to shift (optional)
- notification_type: Type of notification (shift_approved, shift_rejected)
- message: Notification message
- is_read: Boolean flag
- created_at: Timestamp
```

#### Updated `users` Table
Added new columns:
- `role`: VARCHAR(20) - 'employee' or 'employer'
- `created_at`: Timestamp

### 2. New API Endpoints

#### Employer Endpoints

**POST /api/employer/shifts**
- Create a new shift
- Request body:
  ```json
  {
    "shift_name": "Morning Shift",
    "shift_date": "2026-01-25",
    "start_time": "09:00",
    "end_time": "17:00",
    "description": "Regular morning shift",
    "employee_id": 2,
    "created_by": 1
  }
  ```

**GET /api/employer/pending-shifts**
- Get all pending shifts awaiting approval
- Query params: `employer_id`
- Response includes: shift details, employee name, hours worked

**PUT /api/employer/shifts/<shift_id>/approve**
- Approve a shift
- Automatically creates employee notification
- Adds to employee's daily_keep table for salary calculation

**PUT /api/employer/shifts/<shift_id>/reject**
- Reject a shift
- Automatically creates rejection notification to employee

**GET /api/employer/employees**
- Get all employees with their stats
- Query params: `employer_id`
- Response includes: total shifts, total hours worked

#### Employee Endpoints

**GET /api/employee/notifications**
- Get all notifications for employee
- Query params: `employee_id`
- Returns 20 most recent notifications (newest first)

**PUT /api/employee/notifications/<notification_id>/read**
- Mark notification as read
- Updates `is_read` flag in database

## Frontend Changes

### 1. New Screen Files

#### `NotificationsScreen.js`
- Displays all shift-related notifications for employees
- Shows approval/rejection status with different icons
- One-tap to mark as read
- Displays timestamp and unread count
- Pull-to-refresh functionality
- Real-time notification updates

#### Updated `ApproveShiftScreen.js`
- Connected to backend API for pending shifts
- Fetches real data from database
- Approve/Reject buttons trigger API calls
- Automatic employee notification on action
- Real-time list updates

#### Updated `EmployeeScreen.js`
- Connected to backend API for employee list
- Shows actual employee data from database
- Displays total shifts and hours worked per employee
- Search functionality for finding employees

### 2. API Service Updates (`src/services/api.js`)

Added new API modules:

```javascript
// Employer Shift API
employerShiftAPI = {
  createShift(shiftData),
  getPendingShifts(employerId),
  approveShift(shiftId),
  rejectShift(shiftId),
  getEmployees(employerId)
}

// Employee Notification API
employeeNotificationAPI = {
  getNotifications(employeeId),
  markAsRead(notificationId)
}
```

### 3. Navigation Updates

#### EmployeeNavigator
- Added `NotificationsScreen` tab
- Displays bell icon with notification count
- Positioned before Profile tab
- Full notification management interface

#### EmployerNavigator
- Already includes:
  - Admin Dashboard
  - Create Shift
  - Approve Shifts (now connected to DB)
  - Employees (now connected to DB)
  - Profile

## Data Flow

### Shift Approval Workflow
1. Employer creates shift via CreateShiftScreen
2. Shift saved to database with status='pending'
3. Employer views pending shifts in ApproveShiftScreen
4. On approval:
   - Shift status updated to 'approved'
   - Employee notification created in notifications table
   - Hours added to daily_keep table for salary calculation
   - Employee receives notification in real-time (with pull-to-refresh)

### Shift Rejection Workflow
1. Employer views pending shifts in ApproveShiftScreen
2. On rejection:
   - Shift status updated to 'rejected'
   - Rejection notification created
   - Employee notified immediately

### Employee Notification Workflow
1. Employee opens Notifications tab
2. App fetches notifications from API
3. Notifications displayed with:
   - Type icon (approval/rejection)
   - Message text
   - Timestamp
   - Unread indicator (blue dot)
4. Tap notification to mark as read
5. Pull-to-refresh to get latest notifications

## Database Connection

The system now uses:
- **MySQL Database**: `salary_management`
- **Tables**: shifts, notifications, and updated users table
- **Connection**: Python Flask backend with mysql.connector

## Key Features

### For Employers
✅ Create shifts for employees  
✅ View pending shifts awaiting approval  
✅ Approve shifts with one tap  
✅ Reject shifts with confirmation  
✅ View all employees and their work stats  
✅ Search/filter employees  
✅ Track hours worked per employee  

### For Employees
✅ Receive notifications for shift approvals  
✅ Receive notifications for shift rejections  
✅ View notification history  
✅ Mark notifications as read  
✅ See approval/rejection status with timestamps  
✅ Track shifts in real-time  

## Implementation Notes

1. **User Role Detection**: The app detects user role from database and routes to appropriate navigator (employee or employer)

2. **Real-time Updates**: Notifications are fetched on app startup and can be refreshed with pull-to-refresh

3. **Data Consistency**: When a shift is approved:
   - Shift table updated
   - Notification created
   - Daily keep record added for salary calculation
   - All in a single transaction

4. **Error Handling**: All API calls include proper error handling with user-friendly toast notifications

5. **Time Calculation**: Hours worked automatically calculated from start/end times

## Future Enhancements

- WebSocket integration for real-time push notifications
- Email notifications for shift approvals/rejections
- Shift swapping between employees
- Overtime tracking and alerts
- Monthly shift reports
- Batch shift creation
- Recurring shifts

## Testing

1. Login as employer (role='employer')
2. Create shifts for employees
3. View pending shifts
4. Approve/reject shifts
5. Login as employee (role='employee')
6. View notifications
7. Verify shift status changes

## Troubleshooting

If notifications don't appear:
- Ensure user_id is correct
- Check notifications table in database
- Verify employee_id matches in shifts table
- Try pull-to-refresh on Notifications screen
- Check API response in network logs

If shifts don't load:
- Verify employer_id parameter
- Check database connection
- Ensure shifts exist with status='pending'
- Check user role in users table
