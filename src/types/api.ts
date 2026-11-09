export type PocketType = 'cash' | 'bank' | 'ewallet' | 'forex' | 'investment';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type AssetType = 'forex' | 'gold' | 'stock' | 'mutual_fund' | 'crypto' | 'other';
export type AssetTxType = 'BUY' | 'SELL';

export interface User {
  id: string;
  name: string;
  email: string;
  base_currency: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Pocket {
  id: string;
  user_id: string;
  name: string;
  type: PocketType;
  currency: string;
  balance: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  pocket_id: string;
  pocket?: Pocket;
  related_pocket_id?: string | null;
  related_pocket?: Pocket | null;
  category_id?: string | null;
  category?: Category | null;
  type: TransactionType;
  amount: string;
  description: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionSummaryResponse {
  total_income: string;
  total_expense: string;
  net_cashflow: string;
  transactions: Transaction[];
}

export interface AssetHolding {
  id: string;
  user_id: string;
  pocket_id?: string | null;
  pocket?: Pocket | null;
  asset_type: AssetType;
  symbol: string;
  name: string;
  total_units: string;
  total_cost_idr: string;
  average_buy_rate_idr: string;
  last_known_rate_idr: string;
  realized_pnl_idr: string;
  created_at: string;
  updated_at: string;
}

export interface AssetTransaction {
  id: string;
  holding_id: string;
  user_id: string;
  source_pocket_id?: string | null;
  source_pocket?: Pocket | null;
  type: AssetTxType;
  units: string;
  rate_idr: string;
  fee_idr: string;
  total_idr: string;
  realized_pnl_idr: string;
  notes: string;
  transaction_date: string;
  created_at: string;
}

export interface HoldingMarginView {
  holding: AssetHolding;
  current_rate_idr: string;
  market_value_idr: string;
  unrealized_pnl_idr: string;
  unrealized_pnl_percent: string;
  total_return_idr: string;
}

export interface PortfolioOverviewResponse {
  total_invested_idr: string;
  total_market_value_idr: string;
  total_unrealized_pnl_idr: string;
  total_unrealized_percent: string;
  total_realized_pnl_idr: string;
  holdings: HoldingMarginView[];
}

export interface CategoryBreakdownItem {
  category_id: string;
  category_name: string;
  type: string;
  total_amount: string;
}

export interface DashboardSummaryResponse {
  total_idr_pockets_balance: string;
  portfolio_market_value_idr: string;
  portfolio_invested_cost_idr: string;
  portfolio_unrealized_pnl_idr: string;
  portfolio_unrealized_percent: string;
  total_net_worth_idr: string;
  monthly_income_idr: string;
  monthly_expense_idr: string;
  monthly_net_cashflow_idr: string;
  expense_by_category: CategoryBreakdownItem[];
  pockets: Pocket[];
  portfolio?: PortfolioOverviewResponse | null;
}

