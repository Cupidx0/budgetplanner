import type { Account, AuthUser, Bill, BudgetSummary, Transaction } from '../types';

/**
 * Thin client for the Flask backend. In dev, Vite proxies `/api` to the
 * backend (see vite.config.ts). Set VITE_API_URL to call a backend on another
 * origin directly (e.g. in a deployed build).
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Cannot reach the Budget Planner server. Is the backend running on port 5001?', 0);
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const message = (body.message ?? body.error ?? `Request failed (${res.status})`) as string;
    throw new ApiError(message, res.status);
  }
  return body as T;
}

const post = (data: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(data) });

/** Local-time YYYY-MM-DD (toISOString would shift to UTC). */
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const api = {
  login: (username: string, password: string) => request<AuthUser>('/api/login', post({ username, password })),

  register: (username: string, password: string) =>
    request<AuthUser>('/api/register', post({ username, password })),

  summary: (userId: number) => request<BudgetSummary>(`/api/user/${userId}/summary`),

  accounts: (userId: number) =>
    request<{ accounts: Account[] }>(`/api/user/${userId}/accounts`).then((r) => r.accounts),

  /** Transactions from the last `days` days, newest first. */
  transactions: (userId: number, days = 90) => {
    const from = new Date();
    from.setDate(from.getDate() - days);
    return request<{ transactions: Transaction[] }>(
      `/api/user/${userId}/transactions?from=${isoDate(from)}&to=${isoDate(new Date())}`,
    ).then((r) => r.transactions);
  },

  bills: (userId: number) => request<{ bills: Bill[] }>(`/api/user/${userId}/bills`).then((r) => r.bills),

  addBill: (userId: number, name: string, amount: number) =>
    request<Bill>(`/api/user/${userId}/bills`, post({ name, amount })),

  deleteBill: (userId: number, billId: number) =>
    request<{ message: string }>(`/api/user/${userId}/bills/${billId}`, { method: 'DELETE' }),

  askAssistant: (userId: number, message: string) =>
    request<{ response: string }>(`/api/assistant/user/${userId}/chat`, post({ message })).then((r) => r.response),
};
