# Bidirectional Shift Workflow Documentation

## Overview

The Budget Planner app now supports a complete bidirectional shift management system where:
1. **Employers** can create shifts for employees
2. **Employees** can submit shift requests for employer approval
3. **Both** shift types are tracked and managed in a unified system
4. **Automatic notifications** are sent when shifts are approved/rejected

## System Architecture

### Database Schema

**Shifts Table:**
```sql
id (Primary Key)
employee_id (Foreign Key → users)
created_by (Foreign Key → users) - Creator's ID
shift_type ENUM('employer_created', 'employee_submitted')
shift_name VARCHAR(255)
date DATE
start_time TIME
end_time TIME
hours_worked DECIMAL(5,2)
status ENUM('pending', 'approved', 'rejected')
description TEXT
created_at TIMESTAMP
approved_at TIMESTAMP (NULL until approved)
```

**Notifications Table:**
```sql
id (Primary Key)
employee_id (Foreign Key → users)
shift_id (Foreign Key → shifts)
message TEXT
status ENUM('unread', 'read')
created_at TIMESTAMP
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      EMPLOYER WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [CreateShiftScreen]                                            │
│       ↓                                                         │
│  POST /api/employer/shifts                                     │
│  (shift_type: 'employer_created', created_by: employer_id)    │
│       ↓                                                         │
│  Shift stored in DB with status='pending'                      │
│       ↓                                                         │
│  [ApproveShiftScreen - Tab: "My Created Shifts"]              │
│       ↓                                                         │
│  PUT /api/employer/shifts/<id>/approve                         │
│       ↓                                                         │
│  status='approved', Notification created for employee          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [SubmitShiftScreen] - NEW                                     │
│       ↓                                                         │
│  POST /api/employee/shifts                                     │
│  (shift_type: 'employee_submitted', created_by: employee_id)  │
│       ↓                                                         │
│  Shift stored in DB with status='pending'                      │
│       ↓                                                         │
│  [MyShiftsScreen] - NEW (View submitted shifts status)         │
│       ↓                                                         │
│  GET /api/employee/submitted-shifts                            │
│       ↓                                                         │
│  Shows: Pending, Approved, or Rejected status                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  APPROVAL & NOTIFICATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Employer views both types in [ApproveShiftScreen]             │
│  (Tab: "Employee Requests" for submitted shifts)               │
│       ↓                                                         │
│  PUT /api/employer/shifts/<id>/approve                         │
│       ↓                                                         │
│  Shift status → 'approved'                                     │
│  Notification created: "Your shift has been approved"          │
│       ↓                                                         │
│  Employee sees notification in [NotificationsScreen]           │
│  Shift status updated in [MyShiftsScreen]                      │
│                                                                 │
│  OR                                                             │
│                                                                 │
│  PUT /api/employer/shifts/<id>/reject                          │
│       ↓                                                         │
│  Shift status → 'rejected'                                     │
│  Notification created: "Your shift has been rejected"          │
│       ↓                                                         │
│  Employee sees notification in [NotificationsScreen]           │
│  Shift status updated in [MyShiftsScreen] with rejection note  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Screens

### Employee Screens

#### 1. SubmitShiftScreen (NEW)
**Path:** `src/screens/SubmitShiftScreen.js`
**Location:** Employee Navigator → "Submit Shift" Tab
**Purpose:** Allows employees to request shifts

**Form Fields:**
- Shift Name (text input)
- Date (YYYY-MM-DD format)
- Start Time (HH:MM format, 24-hour)
- End Time (HH:MM format, 24-hour)
- Description (text area, optional)

**Validation:**
- All fields required except description
- Date format: `/^\d{4}-\d{2}-\d{2}$/`
- Time format: `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
- End time must be after start time (auto-calculated hours)

**API Call:**
```javascript
POST /api/employee/shifts
Body: {
  shift_name: string,
  shift_date: YYYY-MM-DD,
  start_time: HH:MM,
  end_time: HH:MM,
  description: string,
  employee_id: number
}
Response: {
  success: boolean,
  shift_id: number,
  message: string
}
```

**User Experience:**
1. Employee fills form with shift details
2. Clicks "Submit Shift"
3. Form validates all fields
4. API submits shift with `shift_type='employee_submitted'` and `created_by=employee_id`
5. Toast notification shows success
6. Form resets
7. Employee can view status in MyShiftsScreen

#### 2. MyShiftsScreen (NEW)
**Path:** `src/screens/MyShiftsScreen.js`
**Location:** Employee Navigator → "My Shifts" Tab
**Purpose:** View all submitted shifts and their approval status

**Displays:**
- List of all employee-submitted shifts
- Shift name, date, time range, hours worked
- Status badge: Pending (orange), Approved (green), Rejected (red)
- Submitted date
- Pending status note: "Awaiting employer approval"

**API Call:**
```javascript
GET /api/employee/submitted-shifts?employee_id=123
Response: {
  success: boolean,
  data: [
    {
      id: number,
      shiftName: string,
      date: YYYY-MM-DD,
      startTime: HH:MM,
      endTime: HH:MM,
      hoursWorked: decimal,
      status: 'pending'|'approved'|'rejected',
      createdAt: ISO timestamp
    },
    ...
  ]
}
```

**Features:**
- Pull-to-refresh functionality
- Empty state with helpful message
- Status color coding
- Loading indicators

#### 3. NotificationsScreen (EXISTING, ENHANCED)
**Path:** `src/screens/NotificationsScreen.js`
**Location:** Employee Navigator → "Notifications" Tab
**Purpose:** Receive approval/rejection notifications

**Shows When:**
- Employer approves employee-submitted shift → "Your shift has been approved"
- Employer rejects employee-submitted shift → "Your shift has been rejected"
- Employer-created shift is approved → "Your shift has been approved"

**User Journey:**
1. Employer approves shift in ApproveShiftScreen
2. Notification created in database
3. Employee receives toast notification
4. Notification appears in NotificationsScreen
5. Employee can mark as read

### Employer Screens

#### 1. CreateShiftScreen (EXISTING)
**Path:** `src/screens/CreateShiftScreen.js`
**Location:** Employer Navigator → "Create Shift" Tab
**Purpose:** Create shifts for employees (existing functionality)

**Remains Unchanged:**
- Employer creates shift for employee
- shift_type set to 'employer_created'
- created_by = employer_id
- Status set to 'pending' for employer approval

#### 2. ApproveShiftScreen (ENHANCED)
**Path:** `src/screens/ApproveShiftScreen.js`
**Location:** Employer Navigator → "Approve Shift" Tab
**Purpose:** Review and approve/reject BOTH types of shifts

**New Tab Structure:**

**Tab 1: "My Created Shifts"**
- Shows employer-created shifts pending approval
- API: GET /api/employer/pending-shifts
- Employer created these shifts for employees

**Tab 2: "Employee Requests" (NEW)**
- Shows employee-submitted shifts pending approval
- API: GET /api/employer/pending-employee-shifts
- Badge shows "Submitted by Employee"
- Lists all system-wide employee submissions (not just employer's employees)

**Unified Approval Flow:**
1. Select tab (My Created Shifts OR Employee Requests)
2. View pending shifts with:
   - Employee name
   - Date, time, hours
   - Status badge
   - [Reject] and [Approve] buttons
3. Click Approve:
   - PUT /api/employer/shifts/<id>/approve
   - Shift status → approved
   - Notification sent to employee
   - Shift removed from pending list
   - Toast confirms approval
4. Click Reject:
   - PUT /api/employer/shifts/<id>/reject
   - Shift status → rejected
   - Notification sent to employee
   - Shift removed from pending list
   - Toast confirms rejection

**Visual Indicators:**
- Pending Status: Orange badge "PENDING"
- Employee Submitted: Blue badge "Submitted by Employee"
- Both types shown in same card format for consistency

## Backend API Endpoints

### Employee Shift Submission Endpoints

#### 1. Submit Shift
```
POST /api/employee/shifts
Headers: {"Authorization": "Bearer token"}
Body: {
  shift_name: string,
  shift_date: YYYY-MM-DD,
  start_time: HH:MM,
  end_time: HH:MM,
  description: string,
  employee_id: number
}

Response 200:
{
  success: true,
  shift_id: 42,
  message: "Shift submitted successfully"
}

Response 400:
{
  success: false,
  message: "All fields are required"
}

Response 500:
{
  success: false,
  message: "Error submitting shift"
}
```

**Database Operation:**
```sql
INSERT INTO shifts (
  employee_id, created_by, shift_type, shift_name, date,
  start_time, end_time, hours_worked, status, description, created_at
) VALUES (
  ?, ?, 'employee_submitted', ?, ?, ?, ?, 
  TIMESTAMPDIFF(HOUR, ?, ?), 'pending', ?, NOW()
)
```

#### 2. Get Employee's Submitted Shifts
```
GET /api/employee/submitted-shifts?employee_id=123
Headers: {"Authorization": "Bearer token"}

Response 200:
{
  success: true,
  data: [
    {
      id: 42,
      shiftName: "Morning Shift",
      date: "2024-12-15",
      startTime: "08:00",
      endTime: "16:00",
      hoursWorked: 8,
      status: "pending",
      createdAt: "2024-12-14T14:30:00Z"
    }
  ]
}

Response 200 (no shifts):
{
  success: true,
  data: []
}
```

**Database Query:**
```sql
SELECT 
  s.id, s.shift_name as shiftName, s.date, 
  s.start_time as startTime, s.end_time as endTime,
  s.hours_worked as hoursWorked, s.status, s.created_at as createdAt
FROM shifts s
WHERE s.employee_id = ? AND s.shift_type = 'employee_submitted'
ORDER BY s.created_at DESC
```

### Employer Review Endpoints

#### 3. Get Pending Employee-Submitted Shifts
```
GET /api/employer/pending-employee-shifts?employer_id=99
Headers: {"Authorization": "Bearer token"}

Response 200:
{
  success: true,
  data: [
    {
      id: 42,
      employeeId: 5,
      employeeName: "John Doe",
      date: "2024-12-15",
      startTime: "08:00",
      endTime: "16:00",
      hoursWorked: 8,
      status: "pending",
      description: "Regular morning shift"
    }
  ]
}

Response 200 (no submissions):
{
  success: true,
  data: []
}
```

**Database Query:**
```sql
SELECT 
  s.id, s.employee_id as employeeId, u.name as employeeName,
  s.date, s.start_time as startTime, s.end_time as endTime,
  s.hours_worked as hoursWorked, s.status, s.description
FROM shifts s
JOIN users u ON s.employee_id = u.user_id
WHERE s.shift_type = 'employee_submitted' AND s.status = 'pending'
ORDER BY s.created_at DESC
```

**Note:** This endpoint returns ALL pending employee-submitted shifts in the system (not filtered by employer_id) to give all employers visibility into employee shift requests.

### Existing Approval Endpoints (Work for Both Types)

#### 4. Approve Shift (Both Types)
```
PUT /api/employer/shifts/<id>/approve
Headers: {"Authorization": "Bearer token"}

Response 200:
{
  success: true,
  message: "Shift approved successfully"
}
```

**Backend Logic:**
```python
shift = db.query(Shift).filter(Shift.id == shift_id).first()
shift.status = 'approved'
shift.approved_at = datetime.now()
db.commit()

# Create notification for employee
notification = Notification(
  employee_id = shift.employee_id,
  shift_id = shift.id,
  message = f"Your shift on {shift.date} has been approved",
  status = 'unread'
)
db.add(notification)
db.commit()
```

#### 5. Reject Shift (Both Types)
```
PUT /api/employer/shifts/<id>/reject
Headers: {"Authorization": "Bearer token"}

Response 200:
{
  success: true,
  message: "Shift rejected successfully"
}
```

**Backend Logic:**
```python
shift = db.query(Shift).filter(Shift.id == shift_id).first()
shift.status = 'rejected'
db.commit()

# Create notification for employee
notification = Notification(
  employee_id = shift.employee_id,
  shift_id = shift.id,
  message = f"Your shift on {shift.date} has been rejected",
  status = 'unread'
)
db.add(notification)
db.commit()
```

## API Service Layer

### File: `src/services/api.js`

#### Employee Shift Submission API
```javascript
const employeeShiftSubmissionAPI = {
  submitShift: async (shiftData) => {
    // POST /api/employee/shifts
    // Takes: {shift_name, shift_date, start_time, end_time, description, employee_id}
    // Returns: {success, shift_id, message}
  },
  
  getSubmittedShifts: async (employeeId) => {
    // GET /api/employee/submitted-shifts?employee_id
    // Returns: {success, data: [shifts]}
  }
}
```

#### Employer Review API
```javascript
const employerEmployeeShiftAPI = {
  getPendingEmployeeShifts: async (employerId) => {
    // GET /api/employer/pending-employee-shifts?employer_id
    // Returns: {success, data: [employee-submitted shifts]}
  }
}
```

#### Existing Employer API (Enhanced)
```javascript
const employerShiftAPI = {
  // Works for BOTH shift types now
  approveShift: async (shiftId) => {
    // PUT /api/employer/shifts/:id/approve
    // Handles employer-created AND employee-submitted shifts
  },
  
  rejectShift: async (shiftId) => {
    // PUT /api/employer/shifts/:id/reject
    // Handles employer-created AND employee-submitted shifts
  }
}
```

## Complete User Journeys

### Journey 1: Employee Submits Shift Request

**Step 1: Employee Navigates to Submit Shift**
- Opens "Submit Shift" tab in Employee Navigator
- Sees SubmitShiftScreen form

**Step 2: Employee Fills Form**
```
Shift Name: "Afternoon Shift"
Date: 2024-12-20
Start Time: 14:00
End Time: 22:00
Description: "Extra evening hours"
```

**Step 3: Employee Submits**
- Clicks "Submit Shift" button
- Form validates all fields
- POST /api/employee/shifts sent with:
  - shift_type: 'employee_submitted'
  - created_by: employee_id
  - status: 'pending'

**Step 4: Backend Processing**
- Hours calculated: (22:00 - 14:00) = 8 hours
- Shift stored in database
- Toast: "Shift submitted successfully"
- Form resets

**Step 5: Employee Tracks Status**
- Opens "My Shifts" tab
- GET /api/employee/submitted-shifts
- Sees shift with status: "PENDING"
- Orange "Awaiting employer approval" indicator

### Journey 2: Employer Reviews and Approves Employee Shift

**Step 1: Employer Reviews Submissions**
- Opens "Approve Shift" tab
- Clicks "Employee Requests" tab (showing employee-submitted shifts)
- Sees "Afternoon Shift" from John Doe on 2024-12-20

**Step 2: Employer Approves**
- Clicks "Approve" button
- PUT /api/employer/shifts/<id>/approve called
- Backend:
  - Sets status: 'approved'
  - Creates Notification for employee
  - Message: "Your shift on 2024-12-20 has been approved"

**Step 3: Shift Removed from Review List**
- Shift disappears from Employee Requests tab
- Toast: "Shift has been approved and employee notified"

**Step 4: Employee Receives Notification**
- Toast notification appears on employee's phone
- Notification appears in NotificationsScreen
- Shows: "Your shift on 2024-12-20 has been approved"
- Read indicator: unread initially, can mark as read

**Step 5: Employee Sees Updated Status**
- Opens "My Shifts" tab
- Shift now shows status: "APPROVED" (green badge)
- Confirms employer has accepted their request

### Journey 3: Employer Rejects Employee Shift

**Same as Journey 2 until Step 2:**

**Step 2 (Alternative): Employer Rejects**
- Clicks "Reject" button
- Confirmation alert: "Are you sure you want to reject this shift?"
- Click "Reject" in alert
- PUT /api/employer/shifts/<id>/reject called
- Backend:
  - Sets status: 'rejected'
  - Creates Notification for employee
  - Message: "Your shift on 2024-12-20 has been rejected"

**Step 3: Shift Removed from Review List**
- Shift disappears from Employee Requests tab
- Toast: "Shift has been rejected and employee notified"

**Step 4: Employee Receives Rejection**
- Toast notification appears
- Notification appears in NotificationsScreen
- Shows: "Your shift on 2024-12-20 has been rejected"

**Step 5: Employee Sees Rejection Status**
- Opens "My Shifts" tab
- Shift now shows status: "REJECTED" (red badge)
- Can submit new shift request if needed

## Key Features

### 1. Dual Shift Types
- **Employer-Created:** Employer decides when employee works
- **Employee-Submitted:** Employee requests when they can work
- Both tracked with `shift_type` ENUM in database
- Same approval/notification workflow

### 2. Unified Approval Interface
- Single ApproveShiftScreen handles both types
- Tabs separate "My Created" from "Employee Requests"
- Same approval/rejection logic for both
- Visual indicators show shift source

### 3. Automatic Notifications
- Approval creates notification automatically
- Rejection creates notification automatically
- Employee sees in NotificationsScreen
- Toast notifications provide immediate feedback

### 4. Real-Time Status Tracking
- Employee can view submitted shift status anytime
- Status options: Pending, Approved, Rejected
- Color-coded badges for visual clarity
- Shows when submitted vs when approved

### 5. Validation & Error Handling
- Date/time format validation on frontend
- Required fields check before submission
- Server-side validation in backend
- Proper error messages to user

## Database Changes Summary

### Modified Tables

**shifts Table - Added Column:**
```sql
ALTER TABLE shifts ADD COLUMN 
shift_type ENUM('employer_created', 'employee_submitted') 
DEFAULT 'employer_created' AFTER status;
```

### Existing Tables (Unchanged)
- users
- notifications
- All other tables remain unchanged

## Files Created/Modified

### New Files Created:
1. **src/screens/SubmitShiftScreen.js** (190 lines)
   - Employee shift submission form
   - Validation and API integration
   - Success/error feedback

2. **src/screens/MyShiftsScreen.js** (270 lines)
   - Display employee's submitted shifts
   - Status tracking (pending/approved/rejected)
   - Pull-to-refresh functionality

3. **BIDIRECTIONAL_SHIFT_WORKFLOW.md** (This File)
   - Complete documentation

### Files Modified:

1. **database_and_table.py**
   - Added shift_type column to shifts table

2. **api_server.py**
   - Added POST /api/employee/shifts endpoint (70 lines)
   - Added GET /api/employee/submitted-shifts endpoint (40 lines)
   - Added GET /api/employer/pending-employee-shifts endpoint (40 lines)

3. **src/services/api.js**
   - Added employeeShiftSubmissionAPI object (2 methods)
   - Added employerEmployeeShiftAPI object (1 method)
   - Enhanced existing APIs for dual shift type handling

4. **src/navigation/EmployeeNavigator.js**
   - Imported SubmitShiftScreen and MyShiftsScreen
   - Added "Submit Shift" tab with plus-circle icon
   - Added "My Shifts" tab with document icon
   - Updated tab icon mapping

5. **src/screens/ApproveShiftScreen.js**
   - Added tab navigation (My Created Shifts / Employee Requests)
   - Fetches both employer-created and employee-submitted shifts
   - Visual indicators for shift source
   - Enhanced card UI with submitted badge
   - Updated approval/rejection to handle both types

## Testing Checklist

- [ ] Employee can submit shift from SubmitShiftScreen
- [ ] Submitted shift appears in MyShiftsScreen with "PENDING" status
- [ ] Employer sees employee submissions in ApproveShiftScreen "Employee Requests" tab
- [ ] Employer can approve employee submission
- [ ] Approval creates notification for employee
- [ ] Employee sees notification in NotificationsScreen
- [ ] MyShiftsScreen shows approved shift with "APPROVED" status (green)
- [ ] Employer can reject employee submission
- [ ] Rejection creates notification for employee
- [ ] MyShiftsScreen shows rejected shift with "REJECTED" status (red)
- [ ] Date/time validation prevents invalid submissions
- [ ] Hours are calculated correctly based on start/end times
- [ ] Pull-to-refresh works on MyShiftsScreen
- [ ] Empty states display correctly on all new screens
- [ ] Toast notifications appear on success/error

## Troubleshooting

### Employee's submitted shift not showing in employer's "Employee Requests" tab

**Check:**
1. Verify `shift_type='employee_submitted'` in database
2. Verify shift status is 'pending'
3. Check network request in browser DevTools
4. Ensure backend is running on port 5000

### Approval notification not appearing

**Check:**
1. Verify notification was created in database
2. Check employee is viewing NotificationsScreen
3. Verify notification status is 'unread' in database
4. Check employee_id matches in notification and user

### Date/time validation errors

**Check:**
- Date format must be: YYYY-MM-DD (e.g., 2024-12-20)
- Time format must be: HH:MM in 24-hour format (e.g., 14:30)
- End time must be after start time

## Future Enhancements

1. **Bulk Operations:** Allow employer to approve/reject multiple shifts at once
2. **Shift Templates:** Employees create recurring shift templates
3. **Calendar View:** Visual calendar showing submitted and approved shifts
4. **Notes in Rejection:** Add comments when rejecting shifts
5. **Shift Swap:** Employees can swap shifts with each other (pending employer approval)
6. **Schedule Conflict Detection:** Warn if employee submits overlapping shifts
7. **Analytics:** Employer sees trends in shift requests and approvals
8. **Mobile Notifications:** Push notifications when shifts are approved/rejected (requires setup)

---

**Version:** 1.0
**Last Updated:** 2024
**Status:** Complete - Bidirectional Workflow Implemented
