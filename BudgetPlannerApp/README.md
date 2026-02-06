# Budget Planner React Native App

A mobile application for managing your budget, tracking daily salary, weekly earnings, monthly salary, and bills.

## Features

- **User Authentication**: Sign up and login
- **Daily Salary Calculation**: Calculate your daily earnings based on work hours
- **Weekly Earnings**: View your total weekly earnings
- **Monthly Salary**: Track monthly salary with tax calculations
- **Bills Management**: Add, view, and delete bills
- **Earnings Overview**: Comprehensive view of all your earnings
- **Profile Management**: Update hourly rate and manage account

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Python 3.x (for backend)
- MySQL database

## Backend Setup

1. Navigate to the backend directory:
```bash
cd Budget_planner_app/Budgetbackend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Make sure MySQL is running and update the database configuration in `database_and_table.py` and `budgetset.py` if needed:
```python
DB_CONFIG = {
    "user": "root",
    "password": "",  # Your MySQL password
    "host": "localhost",
    "raise_on_warnings": True
}
```

4. Initialize the database (this happens automatically when you import the modules, but you can also run):
```bash
python database_and_table.py
```

5. Start the Flask API server:
```bash
python api_server.py
```

The API server will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the React Native app directory:
```bash
cd BudgetPlannerApp
```

2. Install dependencies:
```bash
npm install
```

3. Update the API base URL in `src/services/api.js`:
   - For iOS Simulator: `http://localhost:5000`
   - For Android Emulator: `http://10.0.2.2:5000`
   - For Physical Device: `http://localhost:5000` (find your IP with `ipconfig` on Windows or `ifconfig` on Mac/Linux)

4. Start the Expo development server:
```bash
npm start
# or
expo start
```

5. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan the QR code with Expo Go app on your physical device

## Project Structure

```
BudgetPlannerApp/
├── App.js                 # Main app component with navigation
├── src/
│   ├── screens/           # Screen components
│   │   ├── LoginScreen.js
│   │   ├── SignupScreen.js
│   │   ├── HomeScreen.js
│   │   ├── DailySalaryScreen.js
│   │   ├── BillsScreen.js
│   │   ├── EarningsScreen.js
│   │   └── ProfileScreen.js
│   └── services/
│       └── api.js         # API service layer
└── package.json
```

## API Endpoints

The backend provides the following endpoints:

- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/user/:id/hourly-rate` - Get hourly rate
- `PUT /api/user/:id/hourly-rate` - Update hourly rate
- `POST /api/user/:id/daily-salary` - Calculate daily salary
- `GET /api/user/:id/weekly-earnings` - Get weekly earnings
- `GET /api/user/:id/monthly-salary` - Get monthly salary
- `GET /api/user/:id/salary-after-bills` - Get salary after bills
- `GET /api/user/:id/daily-salary-history` - Get daily salary history
- `GET /api/user/:id/bills` - Get all bills
- `POST /api/user/:id/bills` - Add a bill
- `DELETE /api/user/:id/bills/:bill_id` - Delete a bill

## Troubleshooting

### Backend Issues

1. **Database Connection Error**: Make sure MySQL is running and the credentials in `database_and_table.py` are correct.

2. **Port Already in Use**: If port 5000 is already in use, change it in `api_server.py`:
```python
app.run(host='0.0.0.0', port=5000, debug=True)
```

### Frontend Issues

1. **Cannot Connect to Backend**: 
   - Make sure the backend server is running
   - Check that the API_BASE_URL in `src/services/api.js` matches your setup
   - For physical devices, ensure your phone and computer are on the same network

2. **Module Not Found**: Run `npm install` again to ensure all dependencies are installed.

3. **Expo Issues**: Clear the cache with `expo start -c`

## Development Notes

- The app uses AsyncStorage for local data persistence
- Authentication state is managed through AsyncStorage
- All API calls are handled through the service layer in `src/services/api.js`
- The app uses React Navigation for navigation between screens

## License

This project is for personal use.

