# 🧪 Quick Test: Approve/Reject Shifts

**What's Fixed:**
- ✅ Approve button now works
- ✅ Reject button now works
- ✅ Salary calculation works
- ✅ Error messages display properly

---

## How to Test

### Step 1: Start Backend
```bash
cd /Users/user/budgetplanner/Budget_planner_app/Budgetbackend
python3 api_server.py
```

**Should see:**
```
* Running on http://localhost:5000
* Debug mode: on
```

### Step 2: Start Frontend
```bash
cd /Users/user/budgetplanner/BudgetPlannerApp
npm run start
```

### Step 3: Test Approve Shift

1. **Open the app and navigate to ApproveShiftScreen**
   - Look for "Approve Shifts" tab
   - Should see "My Created Shifts" tab selected

2. **Find a pending shift**
   - If none exist, create one first from CreateShiftScreen
   - Should see shift with employee name and times

3. **Click Approve button**
   - Check your terminal/console for: `Approving shift: {id}`
   - Check for: `Approve response: { success: true, ... }`
   - Should see green toast: "Shift has been approved..."
   - Shift should disappear from pending list

4. **Open Admin dashboard**
   - Monthly payroll should have increased
   - New salary visible in stats

5. **Open StaffSalaryScreen**
   - Employee salary should be updated
   - Tap employee to see detailed breakdown

### Step 4: Test Reject Shift

1. **Create another shift** (if none available)

2. **Click Reject button**
   - Dialog appears: "Are you sure you want to reject this shift?"
   - Check console for: `Rejecting shift: {id}`

3. **Click Reject in dialog**
   - Check for: `Reject response: { success: true, ... }`
   - Should see info toast: "Shift has been rejected..."
   - Shift should disappear from list

4. **Verify employee notification**
   - Employee can see rejection notification in NotificationsScreen

---

## What to Look For

### Console Output (Developer Tools)

**Good Signs:**
```
✅ Approving shift: 5
✅ Approve response: { success: true, message: "...", earnings: 120.00 }
✅ Toast message appears
✅ Shift removed from list
```

**Bad Signs (Need to Debug):**
```
❌ Approving shift: 5
❌ Error: Cannot read property 'success' of undefined
❌ Network error or timeout
```

### Toast Messages

**Expected Success Messages:**
- ✅ "Shift has been approved and employee notified"
- ✅ "Shift has been rejected and employee notified"

**Expected Error Messages:**
- ❌ "Shift not found"
- ❌ "Database unavailable"
- ❌ "Failed to approve shift"

---

## Troubleshooting

### Problem: Nothing Happens When Clicking Approve

**Check 1: Is backend running?**
```bash
ps aux | grep python | grep api_server
```
Should see running Python process

**Check 2: Check console logs**
- Open browser DevTools (F12)
- Look for "Approving shift:" message
- Look for API response

**Check 3: Check backend logs**
- Look in terminal where backend is running
- Should see request: `PUT /api/employer/shifts/1/approve`
- Should see response status

### Problem: Error Toast Appears

**Read the error message:**
- "Shift not found" → Shift ID is invalid
- "Database unavailable" → MySQL not running
- "Failed to approve shift" → Check backend logs for details

**Check backend error:**
```bash
# Look in terminal where api_server.py is running
# Should see error message and traceback
```

### Problem: Salary Not Updating

**Check database:**
```sql
-- Check if shift was approved
SELECT * FROM shifts WHERE shift_id = 1;
-- Should see: status = 'approved'

-- Check if daily_keep entry created
SELECT * FROM daily_keep ORDER BY daily_keep_id DESC LIMIT 1;
-- Should see new entry with calculated amount

-- Check if monthly salary updated
SELECT * FROM monthly_salaries WHERE user_id = 1 AND month = 1 AND year_num = 2026;
-- Should see updated salary_amount
```

---

## Expected Data Flow

### When Approve Button Clicked:

```
Frontend                      Backend                    Database
─────────────────────────────────────────────────────────────────
User clicks button
    │
    ├─> console.log()
    │
    └─> PUT /api/employer/shifts/1/approve
            │
            └─> Query shifts table              ✅ Get shift details
                │
                ├─> Query users table           ✅ Get hourly_rate
                │
                └─> Calculate earnings         ✅ hours × rate
                    │
                    ├─> UPDATE shifts           ✅ status → 'approved'
                    │
                    ├─> INSERT notifications    ✅ Create notification
                    │
                    ├─> INSERT daily_keep       ✅ Add to salary tracking
                    │
                    └─> UPDATE monthly_salaries ✅ Update total salary
                        │
                        └─> return { success: true, ... }
    │
    ├─> console.log('response')
    │
    ├─> if (response.success)
    │   │
    │   ├─> Remove shift from list
    │   │
    │   └─> Toast.show('Shift approved...')  ✅ Green toast
    │
    └─> refresh StaffSalaryScreen           ✅ Show new salary
```

---

## Success Indicators ✅

### You'll Know It Works When:

1. **Approve Button:**
   - Click button → shift disappears immediately
   - Green toast says "Shift has been approved..."
   - Salary dashboard updates
   - Employee salary increases

2. **Reject Button:**
   - Click button → confirmation dialog appears
   - Click confirm → shift disappears
   - Blue/info toast says "Shift has been rejected..."
   - Shift no longer in pending list

3. **Salary Updates:**
   - Admin dashboard shows increased payroll
   - Employee card in StaffSalaryScreen shows new salary
   - Employee salary details show breakdown

4. **Notifications:**
   - Employee receives notification
   - Notification shows approval/rejection message
   - Notification shows earned amount (for approvals)

---

## Database Verification

After successful approval, run these queries:

```sql
-- 1. Check shift status changed
SELECT shift_id, status FROM shifts WHERE shift_id = 1;
-- Expected: status = 'approved'

-- 2. Check daily_keep entry created
SELECT * FROM daily_keep WHERE user_id = ? ORDER BY daily_keep_id DESC LIMIT 1;
-- Expected: New row with calculated amount

-- 3. Check monthly_salaries updated
SELECT * FROM monthly_salaries WHERE user_id = ? AND month = ? AND year_num = ?;
-- Expected: salary_amount updated

-- 4. Check notification created
SELECT * FROM notifications WHERE user_id = ? ORDER BY notification_id DESC LIMIT 1;
-- Expected: New notification with 'shift_approved' type
```

---

## Next Steps

1. ✅ Verify syntax: `python3 -m py_compile api_server.py`
2. ✅ Start backend: `python3 api_server.py`
3. ✅ Start frontend: `npm run start`
4. ✅ Test approve/reject flows
5. ✅ Check console logs
6. ✅ Verify database updates
7. ✅ Test salary calculations

**Everything should work now!** 🎉

