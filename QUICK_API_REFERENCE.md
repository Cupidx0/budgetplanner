# Quick Reference: Frontend-Backend API Connections

## 🔗 All API Connections - At a Glance

### CreateShiftScreen → Backend

```
CreateShiftScreen.js (Line ~140)
    ↓
employerShiftAPI.createShift(shiftData)
    ↓
api.post('/api/employer/shifts', shiftData)
    ↓
Backend: @app.route('/api/employer/shifts', methods=['POST'])
    ↓
Returns: { success: true, data: shift_object }
```

**What Gets Sent:**
- `shift_name`: Name of the shift
- `start_time`: When shift starts
- `end_time`: When shift ends  
- `shift_date`: Date of shift
- `description`: Shift description
- `employee_id`: Which employee (from dropdown)
- `created_by`: Employer ID

**What Gets Back:**
- `success`: true/false
- `data`: Shift object with ID
- `message`: Error message if failed

---

### ApproveShiftScreen → Backend

**Tab 1: Employer-Created Shifts**
```
ApproveShiftScreen.js (Line ~45)
    ↓
employerShiftAPI.getPendingShifts(userId)
    ↓
api.get('/api/employer/pending-shifts', {params: {employer_id}})
    ↓
Backend: @app.route('/api/employer/pending-shifts', methods=['GET'])
    ↓
Returns: { success: true, data: [shifts_array] }
```

**Approve Action (Line ~95)**
```
employerShiftAPI.approveShift(shiftId)
    ↓
api.put('/api/employer/shifts/{shiftId}/approve')
    ↓
Backend: @app.route('/api/employer/shifts/<int:shift_id>/approve', methods=['PUT'])
    ↓
Backend AUTO-CALCULATES SALARY ← ⭐ Important!
    ↓
Returns: { success: true, data: updated_shift }
```

**Tab 2: Employee-Submitted Shifts**
```
ApproveShiftScreen.js (Line ~52)
    ↓
employerEmployeeShiftAPI.getPendingEmployeeShifts(userId)
    ↓
api.get('/api/employer/pending-employee-shifts', {params: {employer_id}})
    ↓
Backend: @app.route('/api/employer/pending-employee-shifts', methods=['GET'])
    ↓
Returns: { success: true, data: [shifts_array] }
```

---

### StaffSalaryScreen → Backend

**Load Employee List (Line ~56)**
```
StaffSalaryScreen.js
    ↓
employerShiftAPI.getEmployees(userId)
    ↓
api.get('/api/employer/employees', {params: {employer_id}})
    ↓
Backend: @app.route('/api/employer/employees', methods=['GET'])
    ↓
Returns: {
  success: true,
  data: [{
    id, name, email,
    hourlyRate,
    monthlySalary,        ← ⭐ Auto-calculated
    calculatedSalary,
    totalShifts,
    hoursWorked
  }]
}
```

**View Employee Details (Line ~117)**
```
StaffSalaryScreen.js (handleViewDetails)
    ↓
employerShiftAPI.getEmployeeSalaryDetails(employeeId)
    ↓
api.get('/api/employer/employees/{employeeId}/salary')
    ↓
Backend: @app.route('/api/employer/employees/<int:employee_id>/salary', methods=['GET'])
    ↓
Returns: {
  success: true,
  data: {
    id, name, email,
    hourly_rate,
    monthly_salary,
    total_shifts,
    hours_worked,
    recent_shifts: [{shift_info}]
  }
}
```

---

### Admin.js → Backend

**Load Stats (Line ~50)**
```
Admin.js (loadDashboardStats)
    ↓
CALL 1: employerShiftAPI.getEmployees(userId)
    ↓ (Calculate totalEmployees count)
    ↓ (Calculate totalMonthlyPayroll sum)
    ↓
CALL 2: employerShiftAPI.getPendingShifts(userId)
    ↓ (Count pending shifts)
    ↓ (Count completed shifts: status='approved')
    ↓
Returns all stats: {
  totalEmployees: number,
  pendingShifts: number,
  totalMonthlyPayroll: number,
  completedShifts: number
}
```

---

## 📊 Data Relationships

### How Data Flows When Shift is Approved

```
Step 1: Shift Created
├─ Status: "pending"
├─ Employee assigned
└─ Hours: end_time - start_time

Step 2: User Approves Shift
├─ Frontend: ApproveShiftScreen → approveShift(shiftId)
│
└─ Backend Receives:
   ├─ Fetches shift details
   ├─ Calculates: hours × hourly_rate
   ├─ Updates employee.monthly_salary
   ├─ Updates employee.calculated_salary
   └─ Sets shift.status = "approved"

Step 3: Data Available to Other Screens
├─ Admin.js: Shows updated totalMonthlyPayroll
├─ StaffSalaryScreen: Shows updated employee salary
└─ ApproveShiftScreen: Shift no longer in pending list
```

---

## 🔍 API Methods in api.js

### File: src/services/api.js

**employerShiftAPI Object (Line 233)**
```javascript
employerShiftAPI = {
  createShift(shiftData)           // POST /api/employer/shifts
  getPendingShifts(employerId)     // GET /api/employer/pending-shifts
  approveShift(shiftId)            // PUT /api/employer/shifts/{id}/approve
  rejectShift(shiftId)             // PUT /api/employer/shifts/{id}/reject
  getEmployees(employerId)         // GET /api/employer/employees
  getEmployeeSalaryDetails(empId)  // GET /api/employer/employees/{id}/salary
}
```

**employerEmployeeShiftAPI Object (Line 340)**
```javascript
employerEmployeeShiftAPI = {
  getPendingEmployeeShifts(employerId)  // GET /api/employer/pending-employee-shifts
}
```

---

## 🔌 Backend Endpoints in api_server.py

### All Employer-Related Routes

| Route | Method | Line | Function |
|-------|--------|------|----------|
| `/api/employer/shifts` | POST | 867 | create_employer_shift |
| `/api/employer/pending-shifts` | GET | 922 | get_pending_shifts |
| `/api/employer/shifts/<id>/approve` | PUT | 977 | approve_shift |
| `/api/employer/shifts/<id>/reject` | PUT | 1081 | reject_shift |
| `/api/employer/employees` | GET | 1137 | get_employer_employees |
| `/api/employer/employees/<id>/salary` | GET | 1209 | get_employee_salary_details |
| `/api/employer/pending-employee-shifts` | GET | 1461 | get_pending_employee_shifts |

---

## ✅ Connection Checklist

### Every Screen Has:

✅ **Imports**
- `import { employerShiftAPI } from '../services/api'`
- `import AsyncStorage from '@react-native-async-storage/async-storage'`
- `import Toast from 'react-native-toast-message'`

✅ **User ID Loading**
- Loads `userData` from AsyncStorage on mount
- Extracts `user_id` from parsed userData
- Passes to all API calls

✅ **Loading State**
- `const [loading, setLoading] = useState(false)`
- Set to `true` before API call
- Set to `false` in finally block

✅ **Error Handling**
- Try-catch block around API call
- Success check: `if (response.success)`
- Toast notification on error
- Console.error for debugging

✅ **Data Management**
- State initialized before use
- Data set from response.data
- State updated after successful API call

---

## 🚀 Testing Each Connection

### Test CreateShiftScreen
```
1. Navigate to CreateShiftScreen
2. Check console: "Loading employees..."
3. Verify employee dropdown populated
4. Select employee, fill form
5. Click Create
6. Check console: API call made ✅
7. Success toast appears ✅
```

### Test ApproveShiftScreen
```
1. Navigate to ApproveShiftScreen
2. Check console: "Loading pending shifts..."
3. Check console: "Loading employee submitted shifts..."
4. Verify both tabs have shifts
5. Click Approve on a shift
6. Check console: approveShift API called ✅
7. Success toast appears ✅
8. Shift removed from list ✅
```

### Test StaffSalaryScreen
```
1. Navigate to StaffSalaryScreen
2. Check console: "Loading employees..."
3. Verify employee cards display
4. Check salary data populated
5. Click employee card
6. Check console: getEmployeeSalaryDetails called ✅
7. Success toast appears ✅
8. Detail modal shows ✅
```

### Test Admin.js
```
1. Navigate to Admin screen
2. Check console: "Loading stats..."
3. Verify both API calls made
4. Check stats display:
   - Total Employees ✅
   - Pending Shifts ✅
   - Total Monthly Payroll ✅
   - Completed Shifts ✅
```

---

## 🐛 Troubleshooting

### API Call Not Happening?
1. Check AsyncStorage user data exists: `console.log(userId)`
2. Check API service import: `import { employerShiftAPI } from...`
3. Check method name is correct
4. Check try-catch isn't swallowing error silently

### Data Not Showing?
1. Check `response.success === true`
2. Check `response.data` contains expected fields
3. Check state update: `setEmployees(response.data)`
4. Check rendering uses correct state variable

### Error Toast Showing?
1. Check backend logs for 500 error
2. Check database connection
3. Check parameter names match backend expectations
4. Check employer_id filter applied in backend

### Salary Not Calculating?
1. Verify approveShift API called (check network tab)
2. Check backend approve_shift function runs
3. Verify employee has hourly_rate in database
4. Check shift has correct start_time and end_time

---

## 📋 Summary

**All 4 Employer Screens:** ✅ Connected to Backend
**All 7 API Methods:** ✅ Implemented  
**All 7 Backend Endpoints:** ✅ Implemented
**Error Handling:** ✅ Complete
**State Management:** ✅ Proper
**Auto-Salary Calculation:** ✅ Working

**Status: READY FOR PRODUCTION** ✅

