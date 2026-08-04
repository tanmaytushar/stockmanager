export interface Stock {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  availableQuantity: number;
}

export type StockInput = Stock;
export type StockUpdateInput = Omit<Stock, 'stockSymbol'>;

export interface Customer {
  customerId: number;
  customerName: string;
  emailAddress: string;
}

export type CustomerInput = Omit<Customer, 'customerId'>;

export type TransactionType = 'BUY' | 'SELL';

export interface StockTransaction {
  transactionId: number;
  customerId: number;
  customerName?: string;
  stockSymbol: string;
  stockName?: string;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  transactionDate: string;
}

export interface TradeRequest {
  customerId: number;
  stockSymbol: string;
  quantity: number;
}

export interface PortfolioHolding {
  stockSymbol: string;
  stockName: string;
  quantity: number;
  currentPrice: number;
  totalAssetValue: number;
}

export interface Portfolio {
  customerId: number;
  customerName: string;
  emailAddress?: string;
  holdings: PortfolioHolding[];
  totalAssetValue: number;
}

export interface StockTradeReport {
  stockSymbol: string;
  stockName?: string;
  tradeCount: number;
}

export interface TransactionTypeFrequency {
  buyCount: number;
  sellCount: number;
  mostFrequentType: TransactionType | 'EQUAL' | 'NONE' | null;
}

export interface TotalAssetValue {
  totalAssetValue: number;
}

export interface ApiProblem {
  status?: number;
  message?: string;
  detail?: string;
  errors?: Record<string, string>;
  validationErrors?: Record<string, string>;
}

export interface ReportBundle {
  portfolios: Portfolio[] | null;
  highestPortfolio: Portfolio | null;
  lowestPortfolio: Portfolio | null;
  mostTradedStock: StockTradeReport | null;
  leastTradedStock: StockTradeReport | null;
  highestPricedStock: Stock | null;
  transactionFrequency: TransactionTypeFrequency | null;
  totalAssetValue: TotalAssetValue | null;
}
