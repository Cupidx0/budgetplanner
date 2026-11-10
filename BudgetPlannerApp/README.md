# Budget Planner

A clean, focused budgeting dashboard and AI assistant built with Expo and React Native for web.

## Overview

This app is designed to help users:

- track monthly income and spending
- review budget categories and totals
- monitor savings progress
- ask an AI-style budgeting assistant for guidance
- review recent transactions in a clean dashboard layout

## Current app structure

- Overview screen for financial health
- Insights screen for recommendations
- Assistant screen for budgeting guidance
- Transactions screen for recent activity

## Tech stack

- React Native
- Expo SDK
- React Native Web
- JavaScript

## Getting started

1. Open the project folder:
```bash
cd BudgetPlannerApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the web app:
```bash
npm run web
```

4. Or build the production web bundle:
```bash
npm run build
```

## Project layout

```bash
BudgetPlannerApp/
├── App.js
├── package.json
├── src/
│   ├── data/
│   │   └── mockData.js
│   └── screens/
│       ├── OverviewScreen.js
│       ├── InsightsScreen.js
│       ├── AssistantScreen.js
│       └── TransactionsScreen.js
└── dist/
```

## Notes

This version is intentionally simplified and focused on the budgeting experience instead of legacy employee/employer auth flows and extra project clutter.

## Run locally

The app runs in the browser with Expo web support. After starting the project, open:

```text
http://localhost:8081
```

## License

For personal or prototype use.

