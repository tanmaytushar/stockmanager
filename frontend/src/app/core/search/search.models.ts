import { Customer, Portfolio, Stock, StockTransaction } from '../models';
import { IconName } from '../../shared/icon.component';

export type SearchCategory = 'navigation' | 'actions' | 'customers' | 'stocks' | 'transactions' | 'portfolios' | 'ai';
export type CommandAction = 'navigate' | 'toggle-theme' | 'refresh-index' | 'ask-ai';

export interface SearchAction {
  label: string;
  route?: string;
  queryParams?: Record<string, string | number>;
  action?: CommandAction;
}

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  meta?: string;
  icon: IconName;
  score: number;
  route?: string;
  queryParams?: Record<string, string | number>;
  action?: CommandAction;
  badge?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info';
  previewTitle?: string;
  previewLines?: string[];
  actions?: SearchAction[];
}

export interface SearchIndex {
  customers: Customer[];
  stocks: Stock[];
  transactions: StockTransaction[];
  portfolios: Portfolio[];
  partiallyUnavailable: boolean;
}

export interface SearchGroup {
  category: SearchCategory;
  label: string;
  results: SearchResult[];
}
