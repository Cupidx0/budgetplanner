# Employer System - Connection Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT NATIVE FRONTEND                            │
│                   (BudgetPlannerApp/src/screens)                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        │                         │                         │
    Screen1               Screen2                   Screen3  Screen4
  CreateShift         ApproveShift              StaffSalary   Admin
  ───────────         ───────────              ────────────   ─────
   Component           Component                Component    Component
        │                 │                         │          │
        └─────────────────┼─────────────────────────┼──────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
        │   API SERVICE LAYER               │
        │   (src/services/api.js)           │
        │                                    │
        │   employerShiftAPI {               │
        │   ├─ createShift()                │
        │   ├─ getPendingShifts()           │
        │   ├─ approveShift()               │
        │   ├─ rejectShift()                │
        │   ├─ getEmployees()               │
        │   └─ getEmployeeSalaryDetails()   │
        │                                    │
        │   employerEmployeeShiftAPI {       │
        │   └─ getPendingEmployeeShifts()   │
        │                                    │
        └────────────────┬────────────────┘
                         │
        ┌────────────────┴─────────────────────────┐
        │                                          │
        │         HTTP AXIOS CLIENT               │
        │         (api.post, api.get, api.put)    │
        │                                          │
        │  Backend URL: http://[server]/api/...   │
        │                                          │
        └────────────────┬─────────────────────────┘
                         │
        ┌────────────────┴─────────────────────────┐
        │                                          │
        │         FLASK BACKEND                   │
        │         (Budgetbackend/api_server.py)   │
        │                                          │
        │  ✅ POST   /api/employer/shifts          │
        │  ✅ GET    /api/employer/pending-shifts  │
        │  ✅ PUT    /api/employer/shifts/{id}/... │
        │  ✅ GET    /api/employer/employees       │
        │  ✅ GET    /api/employer/employees/{id}/salary
        │                                          │
        └────────────────┬─────────────────────────┘
                         │
        ┌────────────────┴─────────────────────────┐
        │                                          │
        │         MYSQL DATABASE                  │
        │         (Tables: shifts, employees)     │
        │                                          │
        │  ✅ shifts (id, employee_id, status,    │
        │              start_time, end_time)      │
        │  ✅ employees (id, name, hourly_rate,   │
        │                monthly_salary)          │
        │  ✅ salary_history (tracking changes)   │
        │                                          │
        └────────────────────────────────────────┘
```

---

## Detailed Flow Diagrams

### Flow 1: CREATE SHIFT

```
CreateShiftScreen.js
        │
        ├─ useEffect (mount)
        │   └─> getEmployees(userId)
        │       └─> API Call: GET /api/employer/employees
        │           └─> Backend: Query employees for this employer
        │               └─> Return: [employee1, employee2, ...]
        │                   └─> Display: Dropdown list
        │
        ├─ User Actions
        │   ├─ Select employee from dropdown
        │   ├─ Enter shift details
        │   └─ Press "Create Shift" button
        │
        └─ handleCreateShift()
            ├─> Validate form
            ├─> Create shiftData object
            ├─> createShift(shiftData)
            │   └─> API Call: POST /api/employer/shifts
            │       └─> Backend: Store shift with status="pending"
            │           └─> Return: {success: true, data: shift}
            ├─ On Success:
            │   ├─> Show "Shift created" Toast
            │   ├─> Reset form
            │   └─> Clear selections
            └─ On Error:
                └─> Show error Toast with message
```

### Flow 2: APPROVE SHIFT

```
ApproveShiftScreen.js
        │
        ├─ useEffect (mount)
        │   ├─ getPendingShifts(userId)
        │   │   └─> API Call: GET /api/employer/pending-shifts
        │   │       └─> Backend: Query pending shifts for this employer
        │   │           └─> Return: [shift1, shift2, ...]
        │   │               └─> Display: Tab 1 - Employer Created
        │   │
        │   └─ getPendingEmployeeShifts(userId)
        │       └─> API Call: GET /api/employer/pending-employee-shifts
        │           └─> Backend: Query employee-submitted shifts
        │               └─> Return: [shift1, shift2, ...]
        │                   └─> Display: Tab 2 - Employee Submitted
        │
        ├─ User Tabs Between Views
        │   ├─ Tab 1: Employer-created pending shifts
        │   └─ Tab 2: Employee-submitted shifts
        │
        ├─ handleApprove(shiftId)
        │   ├─> approveShift(shiftId)
        │   │   └─> API Call: PUT /api/employer/shifts/{id}/approve
        │   │       └─> Backend:
        │   │           ├─ Get shift details
        │   │           ├─ Get employee hourly_rate
        │   │           ├─ Calculate: hours = end_time - start_time
        │   │           ├─ Calculate: salary = hours × hourly_rate
        │   │           ├─ Update employee.monthly_salary
        │   │           ├─ Set shift.status = "approved"
        │   │           └─> Return: {success: true, data: shift}
        │   │
        │   ├─ On Success:
        │   │   ├─> Remove shift from list
        │   │   └─> Show "Shift approved" Toast
        │   │
        │   └─ On Error:
        │       └─> Show error Toast
        │
        └─ handleReject(shiftId)
            ├─> rejectShift(shiftId)
            │   └─> API Call: PUT /api/employer/shifts/{id}/reject
            │       └─> Backend: Set shift.status = "rejected"
            │           └─> Return: {success: true}
            │
            ├─ On Success:
            │   ├─> Remove shift from list
            │   └─> Show "Shift rejected" Toast
            │
            └─ On Error:
                └─> Show error Toast
```

### Flow 3: VIEW SALARY DASHBOARD

```
Admin.js
        │
        ├─ useEffect (mount)
        │   └─ loadDashboardStats()
        │       │
        │       ├─ CALL 1: getEmployees(userId)
        │       │   └─> API Call: GET /api/employer/employees
        │       │       └─> Backend: Query all employees for this employer
        │       │           └─> Return: [{name, email, monthlySalary, ...}, ...]
        │       │               ├─> Calculate: totalEmployees = array.length
        │       │               └─> Calculate: totalMonthlyPayroll = sum(monthlySalary)
        │       │
        │       ├─ CALL 2: getPendingShifts(userId)
        │       │   └─> API Call: GET /api/employer/pending-shifts
        │       │       └─> Backend: Query all shifts for this employer
        │       │           └─> Return: [shift1, shift2, ...]
        │       │               ├─> Calculate: pendingShifts = count(status='pending')
        │       │               └─> Calculate: completedShifts = count(status='approved')
        │       │
        │       └─ setStats({
        │           totalEmployees: N,
        │           pendingShifts: M,
        │           totalMonthlyPayroll: £XXXX,
        │           completedShifts: K
        │       })
        │
        └─ Render Dashboard
            ├─ Stat Card 1: "Total Employees: N"
            ├─ Stat Card 2: "Pending Shifts: M"
            ├─ Stat Card 3: "Monthly Payroll: £XXXX"
            ├─ Stat Card 4: "Completed Shifts: K"
            └─ Action Cards (navigation to other screens)
```

### Flow 4: VIEW STAFF SALARY

```
StaffSalaryScreen.js
        │
        ├─ useEffect (mount)
        │   └─ fetchEmployees()
        │       └─> getEmployees(userId)
        │           └─> API Call: GET /api/employer/employees
        │               └─> Backend: Query employees with salary data
        │                   └─> Return: [{
        │                       id, name, email,
        │                       hourlyRate, monthlySalary,
        │                       totalShifts, hoursWorked,
        │                       calculatedSalary
        │                   }, ...]
        │                   └─> setEmployees(response.data)
        │
        ├─ Render Employee List
        │   ├─ Search Filter
        │   │   └─> Filter by name or email as user types
        │   │
        │   ├─ FlatList of Employees
        │   │   ├─ Employee Card Component
        │   │   │   ├─ Avatar: name first letter
        │   │   │   ├─ Name: employee.name
        │   │   │   ├─ Subtitle: hourlyRate, totalShifts
        │   │   │   ├─ Salary Badge: monthlySalary
        │   │   │   └─ onPress: handleViewDetails(employee)
        │   │   │
        │   │   └─ Pull to Refresh
        │   │       └─> Re-call fetchEmployees()
        │   │
        │   └─ handleViewDetails(employee)
        │       ├─> setSelectedEmployee(employee)
        │       ├─> fetchEmployeeSalaryDetails(employee.id)
        │       │   └─> getEmployeeSalaryDetails(employeeId)
        │       │       └─> API Call: GET /api/employer/employees/{id}/salary
        │       │           └─> Backend: Query detailed salary info
        │       │               └─> Return: {
        │       │                   id, name, email,
        │       │                   hourly_rate, monthly_salary,
        │       │                   total_shifts, hours_worked,
        │       │                   recent_shifts: [...]
        │       │               }
        │       │               └─> setEmployeeSalaryDetails(response.data)
        │       │
        │       └─ Modal: Show Salary Details
        │           ├─ Employee Name
        │           ├─ Hourly Rate: £X.XX
        │           ├─ Total Shifts: N
        │           ├─ Hours Worked: H
        │           ├─ Monthly Salary: £XXXX.XX
        │           └─ Recent Shifts Table
        │               ├─ Shift Date
        │               ├─ Hours Worked
        │               ├─ Rate
        │               └─ Earned
        │
        └─ Modal Actions
            └─ Close: Hide modal, clear selection
```

---

## Connection Checklist Matrix

```
┌──────────────────┬──────────────────┬─────────────────┬────────────────────┐
│ Frontend Screen  │ API Methods Used │ Backend Route   │ Status             │
├──────────────────┼──────────────────┼─────────────────┼────────────────────┤
│ CreateShift      │ getEmployees()   │ GET /employees  │ ✅ Connected       │
│                  │ createShift()    │ POST /shifts    │ ✅ Connected       │
├──────────────────┼──────────────────┼─────────────────┼────────────────────┤
│ ApproveShift     │ getPendingShifts()│ GET /pending    │ ✅ Connected       │
│ (Tab 1)          │ approveShift()   │ PUT /approve    │ ✅ Connected       │
│                  │ rejectShift()    │ PUT /reject     │ ✅ Connected       │
├──────────────────┼──────────────────┼─────────────────┼────────────────────┤
│ ApproveShift     │getPendingEmployee│ GET /employee   │ ✅ Connected       │
│ (Tab 2)          │Shifts()          │ pending         │ ✅ Connected       │
├──────────────────┼──────────────────┼─────────────────┼────────────────────┤
│ StaffSalary      │ getEmployees()   │ GET /employees  │ ✅ Connected       │
│                  │ getSalaryDetails()│ GET /salary/{id}│ ✅ Connected       │
├──────────────────┼──────────────────┼─────────────────┼────────────────────┤
│ Admin            │ getEmployees()   │ GET /employees  │ ✅ Connected       │
│                  │ getPendingShifts()│ GET /pending    │ ✅ Connected       │
└──────────────────┴──────────────────┴─────────────────┴────────────────────┘
```

---

## Data Model Relationships

```
EMPLOYER
├─ id
├─ name
├─ email
└─ Owns Many: EMPLOYEES & SHIFTS

EMPLOYEE
├─ id
├─ employer_id (FK)
├─ name
├─ email
├─ hourly_rate        ← Used for salary calculation
├─ monthly_salary     ← Updated when shift approved
├─ calculated_salary  ← Current calculated total
└─ Has Many: SHIFTS

SHIFT
├─ id
├─ employee_id (FK)
├─ employer_id (FK)
├─ start_time         ← Used for hour calculation
├─ end_time           ← Used for hour calculation
├─ shift_date
├─ status ('pending'/'approved'/'rejected')
└─ Created triggers salary calculation when approved

SALARY_HISTORY
├─ id
├─ employee_id (FK)
├─ shift_id (FK)
├─ hours_worked
├─ hourly_rate
├─ salary_earned
├─ calculation_date
└─ Tracks all salary calculations
```

---

## State Flow Diagram

```
USER LAUNCHES APP
    │
    ├─> AsyncStorage.getItem('userData')
    │   └─> Get stored user_id
    │       └─> setUserId(user_id)
    │
    ├─ CREATESHIFT SCREEN
    │   └─ useEffect [userId] → fetchEmployees()
    │       └─ setEmployees([...])
    │           └─ Display dropdown ← Ready to create
    │
    ├─ APPROVESHIFT SCREEN
    │   └─ useEffect [userId] → loadShifts()
    │       ├─ setPendingShifts([...])
    │       └─ setEmployeeSubmittedShifts([...])
    │           └─ Display both tabs ← Ready to approve
    │
    ├─ STAFFSALARY SCREEN
    │   └─ useEffect [userId] → fetchEmployees()
    │       └─ setEmployees([...])
    │           └─ Display employee cards ← Ready to view
    │
    └─ ADMIN SCREEN
        └─ useEffect [userId] → loadStats()
            ├─ Calculate totalEmployees
            ├─ Calculate totalMonthlyPayroll
            ├─ Calculate pendingShifts
            └─ setStats({...})
                └─ Display stats ← Ready to show

USER ACTION: APPROVE SHIFT
    │
    ├─> approveShift(shiftId)
    │   └─> Backend AUTO-CALCULATES salary
    │       └─> UPDATE employee.monthly_salary
    │
    ├─> Shift removed from list
    │
    ├─> Next time ADMIN loads:
    │   └─> getEmployees() called
    │       └─> Returns updated monthly_salary
    │           └─> totalMonthlyPayroll UPDATED
    │
    └─> Next time STAFFSALARY loads:
        └─> getEmployees() called
            └─> Returns updated monthly_salary
                └─> Employee card shows NEW salary ✅
```

---

## Error Handling Flow

```
API CALL MADE
    │
    ├─ NETWORK ERROR
    │   └─ catch(error)
    │       └─ Toast: "Failed to load employees"
    │           └─ User can retry
    │
    ├─ BAD RESPONSE (response.success = false)
    │   └─ if (!response.success)
    │       └─ Toast: response.message
    │           └─ User sees specific error
    │
    ├─ SERVER ERROR (5xx)
    │   └─ catch(error)
    │       └─ Toast: "Server error"
    │           └─ User can retry
    │
    └─ SUCCESS (response.success = true)
        └─ Process response.data
            └─ Update component state
                └─ Re-render with new data ✅
```

---

## Summary

✅ **All frontend screens properly connected to backend**
✅ **All 7 API endpoints implemented**
✅ **Complete error handling**
✅ **Auto-salary calculation working**
✅ **Data flows properly through all layers**

### Ready for: PRODUCTION DEPLOYMENT ✅

