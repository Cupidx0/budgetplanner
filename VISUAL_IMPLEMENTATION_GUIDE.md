# Visual Implementation Guide

## Navigation Structure

### Employee App Navigation (Bottom Tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│                      EMPLOYEE NAVIGATOR                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tab 1: Home              [Home Icon]                           │
│         ↓                                                       │
│         Dashboard with salary summary                          │
│                                                                 │
│  Tab 2: DailySalary       [Clock Icon]                         │
│         ↓                                                       │
│         Daily salary tracking                                  │
│                                                                 │
│  Tab 3: Bills             [Credit Card Icon]                   │
│         ↓                                                       │
│         Bill management                                        │
│                                                                 │
│  Tab 4: Earnings          [Chart Line Icon]                    │
│         ↓                                                       │
│         Earnings analytics                                     │
│                                                                 │
│  ★ Tab 5: Submit Shift    [Plus Circle Icon] ← NEW            │
│         ↓                                                       │
│         [Form: Shift Name, Date, Start Time, End Time]         │
│         - Validates date (YYYY-MM-DD)                          │
│         - Validates time (HH:MM 24-hour)                       │
│         - Calculates hours automatically                       │
│         - On submit: POST /api/employee/shifts                 │
│                                                                 │
│  ★ Tab 6: My Shifts       [Document Icon] ← NEW               │
│         ↓                                                       │
│         [List of submitted shifts with status]                 │
│         - Status badges: PENDING | APPROVED | REJECTED         │
│         - Shows: Date, Time, Hours, Submitted date             │
│         - Pull-to-refresh to update status                     │
│         - GET /api/employee/submitted-shifts                   │
│                                                                 │
│  Tab 7: Chat              [Chat Outline Icon]                  │
│         ↓                                                       │
│         Chat with employer/support                             │
│                                                                 │
│  Tab 8: Notifications     [Bell Icon]                          │
│         ↓                                                       │
│         Approval/Rejection notifications ← ENHANCED            │
│         Shows shift approval/rejection messages                │
│         Can mark as read                                       │
│                                                                 │
│  Tab 9: Profile           [Person Icon]                        │
│         ↓                                                       │
│         User profile and settings                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Employer App Navigation (Bottom Tabs)

```
┌─────────────────────────────────────────────────────────────────┐
│                     EMPLOYER NAVIGATOR                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Tab 1: Admin             [Admin Icon]                         │
│         ↓                                                       │
│         Admin dashboard                                        │
│                                                                 │
│  Tab 2: Create Shift      [Create Icon]                        │
│         ↓                                                       │
│         [Form: Create shift for employee]                      │
│         - Employee selection                                   │
│         - Date, time, description                              │
│         - POST /api/employer/shifts                            │
│         - shift_type: 'employer_created'                       │
│                                                                 │
│  ★ Tab 3: Approve Shift   [Check Icon] ← ENHANCED             │
│         ↓                                                       │
│    ┌──────────────────────────────────────┐                    │
│    │ TAB 1: My Created Shifts (3)          │                   │
│    ├──────────────────────────────────────┤                    │
│    │ [Shift Card]                         │                   │
│    │ Employee: John Doe                   │                   │
│    │ Date: 2024-12-20                     │                   │
│    │ Time: 08:00 - 16:00 (8 hours)       │                   │
│    │ Status: PENDING                      │                   │
│    │ [Reject] [Approve]                   │                   │
│    │                                      │                   │
│    │ [Shift Card]                         │                   │
│    │ ...more shifts...                    │                   │
│    └──────────────────────────────────────┘                    │
│                    ↕                                           │
│    ┌──────────────────────────────────────┐                    │
│    │ TAB 2: Employee Requests (5) ← NEW    │                   │
│    ├──────────────────────────────────────┤                    │
│    │ [Shift Card]                         │                   │
│    │ Employee: Sarah Smith                │                   │
│    │ Submitted by Employee ← INDICATOR    │                   │
│    │ Date: 2024-12-25                     │                   │
│    │ Time: 14:00 - 22:00 (8 hours)       │                   │
│    │ Status: PENDING                      │                   │
│    │ [Reject] [Approve]                   │                   │
│    │                                      │                   │
│    │ [Shift Card]                         │                   │
│    │ Employee: Mike Johnson               │                   │
│    │ Submitted by Employee                │                   │
│    │ ...more submissions...               │                   │
│    └──────────────────────────────────────┘                    │
│                                                                 │
│  Tab 4: Employees         [People Icon]                        │
│         ↓                                                       │
│         View employees and their logs                          │
│                                                                 │
│  Tab 5: Profile           [Person Icon]                        │
│         ↓                                                       │
│         Employer profile and settings                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    EMPLOYEE WORKFLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [SubmitShiftScreen]                                         │
│  User fills: Name, Date, StartTime, EndTime, Description   │
│       │                                                      │
│       ├─ Validate Format                                    │
│       │   ├─ Date: YYYY-MM-DD                             │
│       │   ├─ Time: HH:MM (24-hour)                         │
│       │   └─ End > Start                                    │
│       │                                                      │
│       └─ Success: POST /api/employee/shifts                │
│            {                                               │
│              shift_name: "...",                             │
│              shift_date: "2024-12-20",                      │
│              start_time: "14:00",                           │
│              end_time: "22:00",                             │
│              employee_id: 5,                                │
│              description: "..."                             │
│            }                                                │
│                                                              │
│            ↓ Backend Processing ↓                           │
│                                                              │
│            INSERT INTO shifts (                             │
│              employee_id: 5,                                │
│              created_by: 5,  ← Employee as creator          │
│              shift_type: 'employee_submitted',              │
│              status: 'pending',                             │
│              hours_worked: 8  ← Auto-calculated             │
│            )                                                │
│                                                              │
│  Toast: "Shift submitted successfully!"                     │
│  Form resets                                                │
│       │                                                      │
│       └─ [MyShiftsScreen]                                   │
│          GET /api/employee/submitted-shifts                │
│          ↓                                                   │
│          [List of Shifts]                                   │
│          ├─ Shift 1: PENDING (orange) ← Awaiting approval   │
│          ├─ Shift 2: APPROVED (green)                       │
│          └─ Shift 3: REJECTED (red)                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   EMPLOYER APPROVAL                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [ApproveShiftScreen]                                        │
│       │                                                      │
│       ├─ Tab: "My Created Shifts"                           │
│       │   GET /api/employer/pending-shifts                  │
│       │   Shows shifts created by employer                  │
│       │                                                      │
│       └─ Tab: "Employee Requests" ← NEW                     │
│           GET /api/employer/pending-employee-shifts         │
│           Shows shifts submitted by employees               │
│                                                              │
│  User sees shift and clicks [Approve]                       │
│       │                                                      │
│       └─ PUT /api/employer/shifts/<id>/approve             │
│            {                                                │
│              status: 'approved',                            │
│              approved_at: now()                             │
│            }                                                │
│                                                              │
│            ↓ Backend Processing ↓                           │
│                                                              │
│            1. UPDATE shifts SET status='approved'           │
│            2. CREATE Notification                           │
│               {                                             │
│                 employee_id: 5,                             │
│                 shift_id: 42,                               │
│                 message: "Your shift has been approved",   │
│                 status: 'unread'                            │
│               }                                             │
│                                                              │
│  Toast: "Shift approved and employee notified"             │
│  Shift removed from list                                    │
│       │                                                      │
│       └─ [Employee receives notification]                   │
│          ├─ Toast appears on screen                         │
│          ├─ Notification added to NotificationsScreen       │
│          └─ [MyShiftsScreen shows status: APPROVED (green)]  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.js
├─ Auth Check
├─ Role Check (employee vs employer)
│
├─ EmployeeNavigator (if role='employee')
│  ├─ HomeScreen
│  ├─ DailySalaryScreen
│  ├─ BillsScreen
│  ├─ EarningsScreen
│  ├─ SubmitShiftScreen ← NEW
│  │  ├─ Form with validation
│  │  ├─ employeeShiftSubmissionAPI.submitShift()
│  │  └─ Toast notifications
│  ├─ MyShiftsScreen ← NEW
│  │  ├─ FlatList of shifts
│  │  ├─ employeeShiftSubmissionAPI.getSubmittedShifts()
│  │  └─ Status color badges
│  ├─ ChatScreen
│  ├─ NotificationsScreen (enhanced)
│  │  ├─ Approval notifications
│  │  ├─ Rejection notifications
│  │  └─ employeeNotificationAPI
│  └─ ProfileScreen
│
└─ EmployerNavigator (if role='employer')
   ├─ AdminScreen
   ├─ CreateShiftScreen
   ├─ ApproveShiftScreen (enhanced) ← ENHANCED
   │  ├─ Tab Navigation
   │  │  ├─ Tab 1: "My Created Shifts"
   │  │  │  └─ employerShiftAPI.getPendingShifts()
   │  │  └─ Tab 2: "Employee Requests"
   │  │     └─ employerEmployeeShiftAPI.getPendingEmployeeShifts()
   │  └─ Unified approve/reject logic
   ├─ EmployeeScreen
   └─ ProfileScreen
```

## API Call Sequence

### Employee Submission Flow:

```
SubmitShiftScreen.js
       │
       └─ employeeShiftSubmissionAPI.submitShift(shiftData)
              │
              └─ axios.post('/api/employee/shifts', {
                   shift_name: "...",
                   shift_date: "...",
                   start_time: "...",
                   end_time: "...",
                   employee_id: 5
                 })
                   │
                   └─ api_server.py
                      │
                      └─ @app.route('/api/employee/shifts', methods=['POST'])
                         │
                         ├─ Validate all fields present
                         ├─ Calculate hours_worked
                         └─ INSERT into shifts
                            shift_type = 'employee_submitted'
                            created_by = employee_id
                            status = 'pending'
                            │
                            └─ Return { success: true, shift_id: 42 }
                               │
                               └─ SubmitShiftScreen receives
                                  │
                                  └─ Show Toast: "Success!"
                                     │
                                     └─ Form resets
```

### Employer Review Flow:

```
ApproveShiftScreen.js (Employee Requests Tab)
       │
       ├─ On Mount: employerEmployeeShiftAPI.getPendingEmployeeShifts()
       │  │
       │  └─ axios.get('/api/employer/pending-employee-shifts')
       │     │
       │     └─ api_server.py endpoint
       │        │
       │        └─ SELECT * FROM shifts WHERE shift_type='employee_submitted'
       │           │
       │           └─ Return [{shift1}, {shift2}, ...]
       │              │
       │              └─ Render cards with [Approve] [Reject]
       │
       └─ User clicks [Approve]
          │
          └─ employerShiftAPI.approveShift(shiftId)
             │
             └─ axios.put('/api/employer/shifts/<id>/approve')
                │
                └─ api_server.py endpoint
                   │
                   ├─ UPDATE shifts SET status='approved'
                   ├─ INSERT INTO notifications (for employee)
                   └─ COMMIT
                      │
                      └─ Return { success: true }
                         │
                         └─ ApproveShiftScreen receives
                            │
                            ├─ Remove shift from list
                            ├─ Show Toast: "Approved"
                            │
                            └─ Employee (elsewhere) receives notification
                               │
                               ├─ Toast alert on screen
                               ├─ Notification in NotificationsScreen
                               └─ [MyShifts] shows APPROVED status
```

## Screen UI Examples

### SubmitShiftScreen UI:

```
┌─────────────────────────────────┐
│  Submit Shift     [X close]     │
├─────────────────────────────────┤
│                                 │
│  Info Box (blue):               │
│  ℹ️ Your employer will review   │
│     and approve or reject your  │
│     shift request.              │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Shift Name *                   │
│  [_____________ text input____] │
│                                 │
│  Date (YYYY-MM-DD) *            │
│  [2024-12-20 ________________]  │
│                                 │
│  Start Time (HH:MM) *           │
│  [14:00 ________________]        │
│                                 │
│  End Time (HH:MM) *             │
│  [22:00 ________________]        │
│                                 │
│  Description                    │
│  [___ multiline _______________]│
│  [___________________________]   │
│                                 │
│  ─────────────────────────────  │
│                                 │
│           [Submit Shift]        │
│                                 │
└─────────────────────────────────┘
```

### MyShiftsScreen UI:

```
┌─────────────────────────────────┐
│  My Shift Requests   Total: 3   │  ← Blue header
├─────────────────────────────────┤
│                                 │
│  [Shift Card 1]                 │
│  ┌─────────────────────────────┐│
│  │ Afternoon Shift      PENDING││ ← Orange badge
│  │ (◆ ⏱️ Awaiting approval)     ││
│  ├─────────────────────────────┤│
│  │ 📅 2024-12-20              ││
│  │ ⏰ 14:00 - 22:00            ││
│  │ ⌛ 8 hours                   ││
│  │ 📤 Submitted: 12/19/2024    ││
│  └─────────────────────────────┘│
│                                 │
│  [Shift Card 2]                 │
│  ┌─────────────────────────────┐│
│  │ Morning Shift        APPROVED││ ← Green badge
│  ├─────────────────────────────┤│
│  │ 📅 2024-12-15              ││
│  │ ⏰ 08:00 - 16:00            ││
│  │ ⌛ 8 hours                   ││
│  │ 📤 Submitted: 12/14/2024    ││
│  └─────────────────────────────┘│
│                                 │
│  [Shift Card 3]                 │
│  ┌─────────────────────────────┐│
│  │ Evening Shift        REJECTED││ ← Red badge
│  ├─────────────────────────────┤│
│  │ 📅 2024-12-10              ││
│  │ ⏰ 18:00 - 23:00            ││
│  │ ⌛ 5 hours                   ││
│  │ 📤 Submitted: 12/09/2024    ││
│  └─────────────────────────────┘│
│                                 │
│              ↺ (Pull to refresh) │
│                                 │
└─────────────────────────────────┘
```

### ApproveShiftScreen (Employee Requests Tab) UI:

```
┌────────────────────────────────────┐
│  Approve Shifts                    │
│  Manage all shift requests         │
├────────────────────────────────────┤
│                                    │
│  [Tab 1]  [Tab 2]                  │
│  My Created  Employee Requests (5) │  ← Active tab
│  Shifts (2)         ▼              │
│  ─────────────────────────────────  │
│                                    │
│  [Shift Card]                      │
│  ┌──────────────────────────────┐  │
│  │ Sarah Smith      PENDING     │  │
│  │ 🔹 Submitted by Employee    │  │ ← Indicator
│  ├──────────────────────────────┤  │
│  │ 📅 2024-12-25               │  │
│  │ ⏰ 14:00 - 22:00             │  │
│  │ ⌛ 8 hours                    │  │
│  ├──────────────────────────────┤  │
│  │ [Reject]  [Approve]         │  │
│  └──────────────────────────────┘  │
│                                    │
│  [Shift Card]                      │
│  ┌──────────────────────────────┐  │
│  │ Mike Johnson     PENDING     │  │
│  │ 🔹 Submitted by Employee    │  │
│  ├──────────────────────────────┤  │
│  │ 📅 2024-12-27               │  │
│  │ ⏰ 09:00 - 17:00             │  │
│  │ ⌛ 8 hours                    │  │
│  ├──────────────────────────────┤  │
│  │ [Reject]  [Approve]         │  │
│  └──────────────────────────────┘  │
│                                    │
│  ...more submissions...            │
│                                    │
└────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────┐
│          shifts TABLE               │
├─────────────────────────────────────┤
│ id (PK)                             │
│ employee_id (FK)                    │
│ created_by (FK)                     │
│ shift_type ← NEW                    │
│  └─ 'employer_created'              │
│  └─ 'employee_submitted'            │
│ shift_name                          │
│ date                                │
│ start_time                          │
│ end_time                            │
│ hours_worked                        │
│ status ('pending'|'approved'|'rjctd')│
│ description                         │
│ created_at                          │
│ approved_at                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      notifications TABLE            │
├─────────────────────────────────────┤
│ id (PK)                             │
│ employee_id (FK)                    │
│ shift_id (FK)                       │
│ message                             │
│  └─ "Your shift has been approved"  │
│  └─ "Your shift has been rejected"  │
│ status ('unread'|'read')            │
│ created_at                          │
└─────────────────────────────────────┘
```

---

**This visual guide shows the complete implementation of the bidirectional shift workflow.**
