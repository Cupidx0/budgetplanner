# Budget Planner - Quick Setup Guide

## Step 1: Backend Setup

1. **Install Python dependencies:**
```bash
cd Budget_planner_app/Budgetbackend
pip install -r requirements.txt
```

2. **Configure MySQL:**
   - Make sure MySQL is installed and running
   - Update the database password in `database_and_table.py` and `budgetset.py` if needed:
   ```python
   DB_CONFIG = {
       "user": "root",
       "password": "YOUR_PASSWORD",  # Update this
       "host": "localhost",
       "raise_on_warnings": True
   }
   ```

3. **Start the API server:**
```bash
python api_server.py
```
   - Server will run on `http://localhost:5000`
   - Keep this terminal window open

## Step 2: Frontend Setup

1. **Install Node.js dependencies:**
```bash
cd BudgetPlannerApp
npm install
```

2. **Configure API URL:**
   - Open `src/services/api.js`
   - Update `API_BASE_URL` based on your setup:
     - **iOS Simulator**: `http://localhost:5000`
     - **Android Emulator**: `http://10.0.2.2:5000`
     - **Physical Device**: `http://YOUR_COMPUTER_IP:5000`
       - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
       - Make sure your phone and computer are on the same WiFi network

3. **Start Expo:**
```bash
npm start
# or
expo start
```

4. **Run on device:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Step 3: First Use

1. Create an account with username, password, and hourly rate
2. Start tracking your daily work hours
3. Add your bills
4. View your earnings and budget overview

## Troubleshooting

### Backend won't start
- Check MySQL is running: `mysql -u root -p`
- Verify database credentials in `database_and_table.py`
- Check if port 5000 is available

### Frontend can't connect to backend
- Make sure backend is running on port 5000
- Check API_BASE_URL in `src/services/api.js`
- For physical device: ensure same WiFi network
- Try restarting both servers

### Database errors
- Run the database initialization manually:
```bash
python database_and_table.py
```

## Testing the Connection

1. Start the backend server
2. Test the health endpoint:
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status":"ok"}`

3. If this works, your backend is ready for the mobile app!

