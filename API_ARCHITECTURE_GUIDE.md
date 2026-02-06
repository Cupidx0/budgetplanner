# Visual Architecture & API Reference Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACT NATIVE APP                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐          ┌──────────────────────────┐   │
│  │ EMPLOYER FLOW    │          │  EMPLOYEE FLOW           │   │
│  ├──────────────────┤          ├──────────────────────────┤   │
│  │ • HomeScreen     │          │ • HomeScreen             │   │
│  │ • CreateShift ◄──┼──┐       │ • DailySalary            │   │
│  │ • ApproveShift ◄─┼──┼──┐    │ • Bills                  │   │
│  │ • Employees ◄────┼──┼──┼─┐  │ • Earnings               │   │
│  │ • Profile        │  │  │ │  │ • Chat                   │   │
│  └──────────────────┘  │  │ │  │ • Notifications ◄────┐   │   │
│                        │  │ │  │ • Profile              │   │   │
│  ┌──────────────────┐  │  │ │  └──────────────────────┼───┘   │
│  │ API Service      │  │  │ │                         │       │
│  ├──────────────────┤  │  │ │  ┌──────────────────┐   │       │
│  │ • employerShift  ├──┘  │ │  │ employeeNotif.   ├───┘       │
│  │ • employeeNotif. ├─────┘ │  └──────────────────┘           │
│  │ • authAPI        ├───────┘                                  │
│  │ • salaryAPI      │                                          │
│  │ • billsAPI       │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           │ HTTP/JSON          │                    │
           ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FLASK BACKEND API                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────┐    ┌──────────────────────────┐   │
│  │  EMPLOYER ENDPOINTS    │    │ EMPLOYEE ENDPOINTS       │   │
│  ├────────────────────────┤    ├──────────────────────────┤   │
│  │ POST   /shifts         │    │ GET /notifications      │   │
│  │ GET    /pending-shifts │    │ PUT /notifications/:id  │   │
│  │ PUT    /shifts/:id/    │    │     /read               │   │
│  │        approve         │    │                          │   │
│  │ PUT    /shifts/:id/    │    └──────────────────────────┘   │
│  │        reject          │                                    │
│  │ GET    /employees      │    ┌──────────────────────────┐   │
│  │                        │    │ EXISTING ENDPOINTS       │   │
│  └────────────────────────┘    │ /login, /register, etc   │   │
│                                 └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
           │
           │ SQL Queries
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MYSQL DATABASE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users        │  │ shifts       │  │ notifications│         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ user_id (PK) │  │ shift_id(PK) │  │ notif_id(PK) │         │
│  │ username     │  │ shift_name   │  │ user_id (FK) │         │
│  │ password     │  │ shift_date   │  │ shift_id(FK) │         │
│  │ role    ◄────┼──┼─ employee_id │  │ type         │         │
│  │ hourly_rate  │  │ created_by   │  │ message      │         │
│  │ created_at   │  │ start_time   │  │ is_read      │         │
│  └──────────────┘  │ end_time     │  │ created_at   │         │
│                    │ status       │  └──────────────┘         │
│  ┌──────────────┐  │ hours_worked │  ┌──────────────┐         │
│  │ daily_keep   │  │ created_at   │  │ other tables │         │
│  ├──────────────┤  │ approved_at  │  │ • bills      │         │
│  │ daily_keep_id│  └──────────────┘  │ • weekly_... │         │
│  │ date         │                    │ • monthly_..│         │
│  │ hours_worked │  (FK relationships) └──────────────┘         │
│  │ amount       │  shifts ─┬─> users                           │
│  │ user_id (FK) │          └─> notifications ─> users          │
│  └──────────────┘                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoint Reference

### Employer Shift Management

#### 1. Create Shift
```
POST /api/employer/shifts
Content-Type: application/json

REQUEST:
{
  "shift_name": "Morning Shift",
  "shift_date": "2026-01-25",
  "start_time": "09:00",
  "end_time": "17:00",
  "description": "Regular morning shift",
  "employee_id": 2,
  "created_by": 1
}

RESPONSE (201):
{
  "success": true,
  "shift_id": 1,
  "message": "Shift created successfully"
}

RESPONSE (400):
{
  "success": false,
  "message": "Missing required fields"
}
```

#### 2. Get Pending Shifts
```
GET /api/employer/pending-shifts?employer_id=1

RESPONSE (200):
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

RESPONSE (400):
{
  "success": false,
  "message": "Missing employer_id"
}
```

#### 3. Approve Shift
```
PUT /api/employer/shifts/1/approve

RESPONSE (200):
{
  "success": true,
  "message": "Shift approved and notification sent"
}

BACKEND OPERATIONS:
  1. UPDATE shifts SET status='approved', approved_at=NOW()
  2. INSERT INTO notifications (user_id, message...)
  3. INSERT INTO daily_keep (for salary tracking)
  4. COMMIT transaction

RESPONSE (404):
{
  "success": false,
  "message": "Shift not found"
}
```

#### 4. Reject Shift
```
PUT /api/employer/shifts/1/reject

RESPONSE (200):
{
  "success": true,
  "message": "Shift rejected and notification sent"
}

BACKEND OPERATIONS:
  1. UPDATE shifts SET status='rejected'
  2. INSERT INTO notifications (user_id, message...)
  3. COMMIT transaction

RESPONSE (404):
{
  "success": false,
  "message": "Shift not found"
}
```

#### 5. Get Employees
```
GET /api/employer/employees?employer_id=1

RESPONSE (200):
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "John Doe",
      "email": "john@company.com",
      "status": "active",
      "department": "Operations",
      "hoursWorked": 40.5,
      "joinDate": "2025-06-15",
      "totalShifts": 5
    },
    {
      "id": 3,
      "name": "Jane Smith",
      "email": "jane@company.com",
      "status": "active",
      "department": "Operations",
      "hoursWorked": 38.0,
      "joinDate": "2025-07-20",
      "totalShifts": 4
    }
  ]
}
```

### Employee Notifications

#### 6. Get Notifications
```
GET /api/employee/notifications?employee_id=2

RESPONSE (200):
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
    },
    {
      "id": 2,
      "shiftId": 2,
      "type": "shift_rejected",
      "message": "Your shift on 2026-01-26 has been rejected.",
      "isRead": true,
      "createdAt": "2026-01-22T15:45:20"
    }
  ]
}

RESPONSE (400):
{
  "success": false,
  "message": "Missing employee_id"
}
```

#### 7. Mark Notification as Read
```
PUT /api/employee/notifications/1/read

RESPONSE (200):
{
  "success": true,
  "message": "Notification marked as read"
}

BACKEND OPERATION:
  1. UPDATE notifications SET is_read=TRUE
  2. COMMIT

RESPONSE (500):
{
  "success": false,
  "message": "Database error"
}
```

## Frontend Component Integration

### ApproveShiftScreen Component Flow
```
┌─ Component Mount
│
├─ useEffect(loadUserId)
│ └─ AsyncStorage.getItem('userData')
│    └─ setUserId(user.user_id)
│
├─ useEffect([userId], fetchPendingShifts)
│ └─ employerShiftAPI.getPendingShifts(userId)
│    ├─ GET /api/employer/pending-shifts?employer_id=userId
│    ├─ setShifts(response.data)
│    └─ Toast on error
│
├─ handleApproveShift(shiftId)
│ └─ employerShiftAPI.approveShift(shiftId)
│    ├─ PUT /api/employer/shifts/shiftId/approve
│    ├─ Remove from list
│    ├─ Show success toast
│    └─ Employee gets notification
│
└─ handleRejectShift(shiftId)
   └─ employerShiftAPI.rejectShift(shiftId)
      ├─ PUT /api/employer/shifts/shiftId/reject
      ├─ Remove from list
      ├─ Show info toast
      └─ Employee gets notification
```

### NotificationsScreen Component Flow
```
┌─ Component Mount
│
├─ useEffect(loadUserId)
│ └─ AsyncStorage.getItem('userData')
│    └─ setUserId(user.user_id)
│
├─ useEffect([userId], fetchNotifications)
│ └─ employeeNotificationAPI.getNotifications(userId)
│    ├─ GET /api/employee/notifications?employee_id=userId
│    ├─ setNotifications(response.data)
│    └─ Toast on error
│
├─ onRefresh (pull-to-refresh)
│ └─ fetchNotifications()
│
└─ handleMarkAsRead(notificationId)
   └─ employeeNotificationAPI.markAsRead(notificationId)
      ├─ PUT /api/employee/notifications/notificationId/read
      ├─ Update local state
      └─ Toast on error
```

## State Management Flow

```
APPROVAL WORKFLOW STATE CHANGES:

EMPLOYER              DATABASE             EMPLOYEE
─────────────────────────────────────────────────────
                                           
Start: shift exists   shifts table
       (pending)      status='pending'
          │                                
          │                                
Approve   ├─────────────────────────────> UPDATE status='approved'
Button    │                                INSERT notification
          │           
          │ GET /pending-shifts (refreshes)
          │ <─────────────────────────────
          │ Shift removed from list       
          │                                
          │                                
          │                                PULL-TO-REFRESH
          │                                │
          │                        GET /notifications
          │                                │
          │ <─────────────────────────────
          │                    [
          │                      {type: 'shift_approved'}
          │                    ]
          │                                │
          │                           Display
          │                           Notification
```

## Database State Diagram

```
SHIFT CREATION:
┌─────────────────┐
│ shifts table    │
├─────────────────┤
│ shift_id: 1     │
│ status: pending │ ◄─── Created state
│ employee_id: 2  │
│ created_by: 1   │
└─────────────────┘

AFTER APPROVAL:
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ shifts table    │    │ notifications    │    │ daily_keep       │
├─────────────────┤    ├──────────────────┤    ├──────────────────┤
│ shift_id: 1     │    │ user_id: 2       │    │ user_id: 2       │
│ status: approved│    │ message: approved│    │ hours_worked: 8  │
│ approved_at: ts │    │ type: approved   │    │ date: 2026-01-25 │
│ employee_id: 2  │    │ is_read: false   │    │ amount: 0        │
└─────────────────┘    └──────────────────┘    └──────────────────┘
     Updated              New Entry          New Salary Entry
```

## Error Handling Flow

```
API Call
    │
    ├─ Try block
    │  │
    │  ├─ Success
    │  │  └─ return response.data
    │  │
    │  └─ Network Error
    │     └─ Catch block
    │
    └─ Catch block
       ├─ axios error?
       │  └─ Extract error.message
       │
       ├─ API response has error?
       │  └─ Show error toast
       │
       ├─ Generic error?
       │  └─ Show generic error toast
       │
       └─ Log error details

TOAST NOTIFICATIONS:
  ✓ Success: green, checkmark icon
  ✗ Error: red, X icon
  ℹ Info: blue, info icon
  ⚠ Warning: yellow, warning icon
```

## Database Indexes (Recommended)

```sql
-- For performance optimization:
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_shifts_created_by ON shifts(created_by);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_users_role ON users(role);
```

This provides a complete visual reference of the system architecture and API structure.
