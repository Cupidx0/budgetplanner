# Phase 5: Enhanced Features - Salary Updates & Employee Selection by Name

## Overview

This phase introduces two critical improvements to the Budget Planner shift management system:

1. **Automatic Salary Updates on Shift Approval** - When an employer approves a shift, the employee's salary is automatically calculated and updated
2. **Manager Create Shift by Employee Name** - Employers can now select employees by name instead of needing to know their ID

## Feature 1: Automatic Salary Updates on Shift Approval

### What Changed

When an employer approves a shift (whether employer-created or employee-submitted), the system now:
1. Fetches the employee's hourly rate
2. Calculates earnings: `hours_worked × hourly_rate`
3. Updates the `daily_keep` table with the calculated amount
4. Updates the `weekly_earnings` automatically
5. Updates the `monthly_salaries` total
6. Notifies the employee with the earnings amount

### Backend Implementation

**File:** `Budget_planner_app/Budgetbackend/api_server.py`
**Endpoint:** `PUT /api/employer/shifts/<shift_id>/approve`

**Key Changes:**
```python
# 1. Fetch employee's hourly rate along with shift details
cur.execute(
    "SELECT s.employee_id, s.shift_date, s.hours_worked, u.hourly_rate "
    "FROM shifts s "
    "JOIN users u ON s.employee_id = u.user_id "
    "WHERE s.shift_id = %s"
)

# 2. Calculate earnings
shift_earnings = float(hours_worked) * float(hourly_rate)

# 3. Insert into daily_keep with calculated amount (not 0)
cur.execute(
    "INSERT INTO daily_keep (daily_keep_date, daily_hours_worked, daily_keep_amount, user_id) "
    "VALUES (%s, %s, %s, %s)",
    (shift_date, hours_worked, shift_earnings, employee_id)
)

# 4. Auto-update weekly earnings
auto_update_weekly_earnings(employee_id)

# 5. Update monthly salary summary
```

### How It Works

**Step-by-Step Process:**

1. **Employer Approves Shift**
   ```
   Employer clicks "Approve" in ApproveShiftScreen
   ```

2. **Backend Calculates Salary**
   ```
   Get employee hourly_rate from users table
   Calculate: £10/hour × 8 hours = £80
   ```

3. **Daily Record Created**
   ```
   INSERT into daily_keep:
   - daily_keep_date: 2024-12-20
   - daily_hours_worked: 8
   - daily_keep_amount: £80  ← Actual amount, not 0
   - user_id: employee_id
   ```

4. **Weekly Earnings Recalculated**
   ```
   auto_update_weekly_earnings(employee_id)
   → Sums all daily_keep amounts for that week
   → Updates weekly_earnings table
   ```

5. **Monthly Salary Updated**
   ```
   SELECT SUM(daily_keep_amount) FROM daily_keep
   WHERE YEAR = 2024 AND MONTH = 12 AND user_id = employee_id
   → Updates monthly_salaries table
   ```

6. **Employee Notified**
   ```
   Notification message: "Your shift on 2024-12-20 has been approved! Earned: £80.00"
   ```

7. **Employee Sees Updated Salary**
   ```
   Earnings Screen shows:
   - Daily earnings updated
   - Weekly earnings updated
   - Monthly salary updated
   ```

### Example Scenario

**Before Approval:**
```
Employee: John Doe
Hourly Rate: £12.50
Shift: 2024-12-20, 09:00-17:00 (8 hours)
Status: PENDING
Earnings: Not yet recorded
```

**After Approval:**
```
Employee: John Doe
Hourly Rate: £12.50
Shift: 2024-12-20, 09:00-17:00 (8 hours)
Status: APPROVED ✓
Earnings: £100.00 (8 × £12.50)

Daily Keep: +£100.00
Weekly Total: +£100.00
Monthly Total: +£100.00
Employee Notified: "Your shift has been approved! Earned: £100.00"
```

### API Response

```json
{
  "success": true,
  "message": "Shift approved, salary updated, and notification sent",
  "earnings": 100.00
}
```

---

## Feature 2: Manager Create Shift by Employee Name

### What Changed

**Before:**
- Manager had to enter employee ID manually
- No visual feedback on who was selected
- Error-prone process

**After:**
- Manager taps "Select Employee" button
- Modal shows searchable list of all employees
- Can search by name
- Shows employee name and hourly rate
- One-tap selection

### Frontend Implementation

**File:** `BudgetPlannerApp/src/screens/CreateShiftScreen.js`

**Major Updates:**

1. **New State Variables**
   ```javascript
   const [employees, setEmployees] = useState([]);
   const [selectedEmployee, setSelectedEmployee] = useState(null);
   const [showEmployeeModal, setShowEmployeeModal] = useState(false);
   const [employeeSearch, setEmployeeSearch] = useState('');
   const [filteredEmployees, setFilteredEmployees] = useState([]);
   ```

2. **Fetch Employees on Component Load**
   ```javascript
   useEffect(() => {
     if (employerId) {
       fetchEmployees();
     }
   }, [employerId]);
   
   const fetchEmployees = async () => {
     const response = await employerShiftAPI.getEmployees(employerId);
     setEmployees(response.data);
   };
   ```

3. **Search Functionality**
   ```javascript
   useEffect(() => {
     if (employeeSearch.trim() === '') {
       setFilteredEmployees(employees);
     } else {
       const filtered = employees.filter(emp =>
         emp.name.toLowerCase().includes(employeeSearch.toLowerCase())
       );
       setFilteredEmployees(filtered);
     }
   }, [employeeSearch, employees]);
   ```

4. **Employee Selection Modal**
   ```javascript
   <Modal visible={showEmployeeModal} transparent animationType="slide">
     <TextInput
       placeholder="Search by name..."
       value={employeeSearch}
       onChangeText={setEmployeeSearch}
     />
     <FlatList
       data={filteredEmployees}
       renderItem={renderEmployeeItem}
     />
   </Modal>
   ```

5. **Validation**
   ```javascript
   const validateForm = () => {
     if (!selectedEmployee) {
       Alert.alert('Error', 'Please select an employee');
       return false;
     }
     // ... other validations
   };
   ```

### User Interface Flow

**Step 1: Open Create Shift Screen**
```
Manager sees:
┌─────────────────────┐
│  Create Shift       │
├─────────────────────┤
│ [Tap to select]  ▼ │ ← Employee selection button
│ Shift Name: ___     │
│ Date: ___           │
│ Start: ___          │
│ End: ___            │
│ [Create Shift]      │
└─────────────────────┘
```

**Step 2: Tap Employee Button**
```
Modal appears with employee list:
┌──────────────────────────┐
│ Select Employee       ✕  │
├──────────────────────────┤
│ 🔍 Search by name...     │
├──────────────────────────┤
│ John Doe        £12.50/hr│
│ Jane Smith      £15.00/hr│
│ Bob Wilson      £11.00/hr│
└──────────────────────────┘
```

**Step 3: Search (Optional)**
```
Manager types "john":
┌──────────────────────────┐
│ Select Employee       ✕  │
├──────────────────────────┤
│ 🔍 john                  │
├──────────────────────────┤
│ John Doe        £12.50/hr│
└──────────────────────────┘
```

**Step 4: Tap to Select**
```
Manager taps "John Doe"
Modal closes, form updates:
┌─────────────────────┐
│  Create Shift       │
├─────────────────────┤
│ John Doe       ▼    │ ← Updated with selection
│ £12.50/hr           │   and hourly rate
│ Shift Name: ___     │
│ Date: ___           │
│ [Create Shift]      │
└─────────────────────┘
```

**Step 5: Fill Remaining Fields & Submit**
```
Manager fills:
- Shift Name: "Morning Shift"
- Date: 2024-12-25
- Start: 09:00
- End: 17:00

Clicks "Create Shift"
→ Shift created for John Doe
→ Success notification shown
→ Form resets
```

### Backend API Calls

**1. Get Employees List**
```
GET /api/employer/employees?employer_id=99
Response: {
  "success": true,
  "data": [
    {"id": 5, "name": "John Doe", "hourly_rate": 12.50},
    {"id": 6, "name": "Jane Smith", "hourly_rate": 15.00},
    {"id": 7, "name": "Bob Wilson", "hourly_rate": 11.00}
  ]
}
```

**2. Create Shift**
```
POST /api/employer/shifts
Body: {
  "shift_name": "Morning Shift",
  "shift_date": "2024-12-25",
  "start_time": "09:00",
  "end_time": "17:00",
  "description": "Regular morning shift",
  "employee_id": 5,
  "created_by": 99
}
Response: {
  "success": true,
  "shift_id": 42,
  "message": "Shift created successfully for employee"
}
```

### Key Features

✅ **Search by Name** - Type employee name to filter list
✅ **Show Hourly Rate** - See salary info before selecting
✅ **Visual Feedback** - Selected employee shows in button
✅ **Form Validation** - Can't submit without selecting employee
✅ **Empty State** - Helpful message if no employees found
✅ **Loading State** - Shows loading indicator while fetching

---

## Combined Usage Example

### Complete Workflow

**Monday - Manager Creates Shift for Employee**

1. Manager opens "Create Shift" tab
2. Taps "Select Employee"
3. Searches for "John"
4. Taps "John Doe" (£12.50/hr)
5. Fills in:
   - Shift Name: "Monday Morning"
   - Date: 2024-12-23
   - Start: 09:00
   - End: 17:00
6. Clicks "Create Shift"
7. Shift created with shift_type='employer_created'

**Thursday - Manager Approves Shift**

1. Manager opens "Approve Shift" tab
2. Sees "Monday Morning" shift for John Doe
3. Reviews details (8 hours)
4. Clicks "Approve"
5. Backend:
   - Gets John's hourly rate: £12.50
   - Calculates: 8 × £12.50 = £100.00
   - Inserts into daily_keep with amount £100.00
   - Updates weekly_earnings: +£100.00
   - Updates monthly_salaries: +£100.00
6. John receives notification: "Your shift on 2024-12-23 has been approved! Earned: £100.00"

**Friday - John Checks Earnings**

1. John opens "Earnings" tab
2. Sees:
   - Daily: Monday +£100.00
   - Weekly: +£100.00
   - Monthly: +£100.00
3. Opens "My Shifts" tab
4. Sees shift with "APPROVED" status (green badge)

---

## Files Modified

### Backend: `api_server.py`

**1. Enhanced `approve_shift()` endpoint (lines ~977-1048)**
- Now fetches hourly_rate
- Calculates shift_earnings
- Inserts into daily_keep with calculated amount
- Auto-updates weekly earnings
- Updates monthly salary
- Includes earnings in notification message

**2. Updated `create_shift()` endpoint (lines ~867-913)**
- Added shift_type='employer_created'
- Added explicit status='pending'
- Improved docstring

### Frontend: `CreateShiftScreen.js`

**Complete rewrite (~600 lines)**
- Added employee selection modal
- Added search functionality
- Added employee list display
- Enhanced form validation
- Integrated with API service
- Added loading states
- Added empty states

**Key Additions:**
- `loadEmployerId()` - Get employer from AsyncStorage
- `fetchEmployees()` - Load employee list from API
- `handleSelectEmployee()` - Handle employee selection
- `validateForm()` - Enhanced validation
- `renderEmployeeItem()` - List item renderer
- Employee selection modal UI
- Search input field
- Selected employee display

---

## Data Flow Diagrams

### Salary Update Flow
```
Manager Approves Shift
         ↓
GET shift (hours_worked)
         ↓
GET employee hourly_rate
         ↓
Calculate: earnings = hours × rate
         ↓
INSERT into daily_keep (earnings amount)
         ↓
auto_update_weekly_earnings()
         ↓
UPDATE monthly_salaries
         ↓
CREATE notification with earnings
         ↓
Employee sees: Salary updated + Notification
```

### Employee Selection Flow
```
Manager opens CreateShift
         ↓
Component mounts
         ↓
GET employees list from API
         ↓
Display: [John, Jane, Bob]
         ↓
Manager types search: "john"
         ↓
Filter list: [John]
         ↓
Manager taps "John Doe"
         ↓
selectedEmployee = {id: 5, name: "John", rate: 12.50}
         ↓
Form validates with employee_id = 5
         ↓
POST /api/employer/shifts with employee_id: 5
         ↓
Shift created successfully
```

---

## Testing Checklist

### Salary Update Feature
- [ ] Employer approves shift
- [ ] Notification shows earning amount
- [ ] daily_keep record created with correct amount
- [ ] Employee can see daily earnings updated
- [ ] Weekly earnings updated correctly
- [ ] Monthly salary updated correctly
- [ ] Multiple approvals accumulate correctly
- [ ] Different hourly rates calculate correctly

### Employee Selection Feature
- [ ] Employee list loads on screen open
- [ ] Can search by employee name
- [ ] Search is case-insensitive
- [ ] Selected employee shows in button
- [ ] Can change selection
- [ ] Form validation requires employee
- [ ] Cannot submit without selecting employee
- [ ] Hourly rate displays correctly
- [ ] Empty state shows when no employees
- [ ] Loading state shows while fetching

### Integration Tests
- [ ] Create shift by name
- [ ] Approve shift
- [ ] Verify salary updated
- [ ] Employee gets notification
- [ ] Employee earnings screen shows correct total
- [ ] Multiple shifts accumulate correctly
- [ ] Reject shift doesn't update salary
- [ ] Create shift by name for different employees

---

## Error Handling

### Salary Update Errors
- ✅ Shift not found → "Shift not found" error
- ✅ Employee not found → Query error caught
- ✅ Database unavailable → "Database unavailable" error
- ✅ Missing hourly_rate → Defaults to 0
- ✅ Invalid time calculation → Handled by datetime

### Employee Selection Errors
- ✅ No employees found → "No employees available" message
- ✅ API fails → Toast error notification
- ✅ Employee deselected → Form validation error
- ✅ Network error → Caught and displayed

---

## Performance Considerations

### Salary Update
- Single database query joins shifts + users
- Weekly recalculation uses existing helper function
- Monthly calculation uses SUM aggregate
- Total queries per approval: 4-5 (efficient)

### Employee Selection
- Employee list fetched once on mount
- Filtered in-memory (no additional API calls)
- Search O(n) complexity (acceptable for <1000 employees)
- Modal doesn't block UI

---

## Future Enhancements

1. **Bulk Approvals with Salary** - Approve multiple shifts, update all salaries at once
2. **Salary Preview** - Show calculated salary before approval
3. **Hourly Rate Override** - Allow different rate for specific shifts
4. **Salary Deductions** - Support tax/deductions in calculation
5. **Payroll Reports** - Generate payroll summaries
6. **Direct Deposit** - Integrate payment processing

---

## Summary

Phase 5 brings two powerful features:

✅ **Automatic Salary Calculation** - Eliminates manual salary tracking errors
✅ **Name-Based Selection** - Improves UX for creating shifts

Together, these features create a complete shift-to-salary pipeline:
1. Manager creates shift by employee name
2. Employee submits or receives shift
3. Manager approves
4. **Salary automatically calculated and updated**
5. Employee sees earnings reflected immediately

The system is now fully automated for shift-to-salary workflow, eliminating manual data entry and calculation errors.

**Status: ✅ COMPLETE**
