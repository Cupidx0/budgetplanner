// Shapes returned by the Flask API (Budget_planner_app/Budgetbackend/api_server.py).

export interface AuthUser {
  user_id: number;
  username: string;
}

export interface Account {
  account_id: string;
  name: string;
  /** 'current' | 'savings' | 'credit', or whatever the bank reports. */
  type: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  /** Signed: positive = money in, negative = money out. */
  amount: number;
  category: string;
}

export interface Bill {
  bill_id: number;
  name: string;
  amount: number;
}

export interface CategorySpend {
  category: string;
  amount: number;
}

export interface BudgetSummary {
  /** YYYY-MM */
  month: string;
  total_balance: number;
  /** Money in so far this month (excluding transfers between own accounts). */
  income: number;
  /** Larger of this month's and last month's income — used for planning. */
  expected_income: number;
  /** Money out so far this month (excluding transfers). */
  spending: number;
  net: number;
  spending_by_category: CategorySpend[];
  /** Sum of the user's planned monthly bills. */
  bills_total: number;
  savings_target: number;
  /** 0–100 */
  savings_progress: number;
  transaction_count: number;
}
