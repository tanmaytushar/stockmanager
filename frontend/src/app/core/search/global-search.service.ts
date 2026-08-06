import { Injectable } from '@angular/core';
import { SearchAction, SearchCategory, SearchIndex, SearchResult } from './search.models';

const PREFIXES: Record<string, SearchCategory> = {
  customer: 'customers',
  stock: 'stocks',
  transaction: 'transactions',
  portfolio: 'portfolios',
  report: 'navigation',
  action: 'actions',
};

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  search(input: string, index: SearchIndex, commands: SearchResult[]): SearchResult[] {
    const parsed = this.parseQuery(input);
    if (!parsed.query) return [];

    const portfolioByCustomer = new Map(index.portfolios.map((portfolio) => [portfolio.customerId, portfolio]));
    const transactionCounts = new Map<number, number>();
    index.transactions.forEach((transaction) => transactionCounts.set(
      transaction.customerId,
      (transactionCounts.get(transaction.customerId) ?? 0) + 1,
    ));

    const candidates: SearchResult[] = [
      ...commands,
      ...index.customers.map((customer) => {
        const portfolio = portfolioByCustomer.get(customer.customerId);
        return {
          id: `customer-${customer.customerId}`,
          category: 'customers' as const,
          title: customer.customerName,
          subtitle: `Customer #${customer.customerId} · ${customer.emailAddress}`,
          meta: `${portfolio?.holdings.length ?? 0} holdings · ${this.money(portfolio?.totalAssetValue ?? 0)}`,
          icon: 'users' as const,
          score: 0,
          route: '/customers',
          queryParams: { query: customer.customerName },
          previewTitle: customer.customerName,
          previewLines: [
            `Customer ID: ${customer.customerId}`,
            `Email: ${customer.emailAddress}`,
            `Portfolio value: ${this.money(portfolio?.totalAssetValue ?? 0)}`,
            `Holdings: ${portfolio?.holdings.length ?? 0} · Transactions: ${transactionCounts.get(customer.customerId) ?? 0}`,
          ],
          actions: [
            { label: 'Open customer', route: '/customers', queryParams: { query: customer.customerName } },
            { label: 'Portfolio', route: '/portfolios', queryParams: { customerId: customer.customerId } },
            { label: 'Start trade', route: '/trade', queryParams: { customerId: customer.customerId } },
          ] as SearchAction[],
        };
      }),
      ...index.stocks.map((stock) => {
        const holdingCustomers = index.portfolios.filter((portfolio) =>
          portfolio.holdings.some((holding) => holding.stockSymbol === stock.stockSymbol),
        ).length;
        const recentTransactions = index.transactions.filter((transaction) => transaction.stockSymbol === stock.stockSymbol).length;
        const inventory = stock.availableQuantity <= 10
          ? { badge: 'Low stock', tone: 'danger' as const }
          : stock.availableQuantity <= 50
            ? { badge: 'Moderate', tone: 'warning' as const }
            : { badge: 'Healthy', tone: 'success' as const };
        return {
          id: `stock-${stock.stockSymbol}`,
          category: 'stocks' as const,
          title: `${stock.stockSymbol} — ${stock.stockName}`,
          subtitle: `${this.money(stock.currentPrice)} · ${stock.availableQuantity} available`,
          meta: `${holdingCustomers} customers holding · ${recentTransactions} transactions`,
          icon: 'chart' as const,
          score: 0,
          route: '/stocks',
          queryParams: { query: stock.stockSymbol },
          badge: inventory.badge,
          tone: inventory.tone,
          previewTitle: `${stock.stockSymbol} — ${stock.stockName}`,
          previewLines: [
            `Current price: ${this.money(stock.currentPrice)}`,
            `Available quantity: ${stock.availableQuantity}`,
            `Customers holding: ${holdingCustomers}`,
            `Recent transactions: ${recentTransactions}`,
          ],
          actions: [
            { label: 'Open stock', route: '/stocks', queryParams: { query: stock.stockSymbol } },
            { label: 'Start trade', route: '/trade', queryParams: { stock: stock.stockSymbol } },
            { label: 'Transactions', route: '/transactions', queryParams: { query: stock.stockSymbol } },
          ] as SearchAction[],
        };
      }),
      ...index.portfolios.map((portfolio) => ({
        id: `portfolio-${portfolio.customerId}`,
        category: 'portfolios' as const,
        title: `${portfolio.customerName}'s portfolio`,
        subtitle: `${portfolio.holdings.length} holdings · ${this.totalShares(portfolio.holdings)} total shares`,
        meta: `Total value ${this.money(portfolio.totalAssetValue)}`,
        icon: 'briefcase' as const,
        score: 0,
        route: '/portfolios',
        queryParams: { customerId: portfolio.customerId },
        previewTitle: `${portfolio.customerName}'s portfolio`,
        previewLines: [
          `Total value: ${this.money(portfolio.totalAssetValue)}`,
          `Holdings: ${portfolio.holdings.length}`,
          `Total shares: ${this.totalShares(portfolio.holdings)}`,
          `Largest position: ${[...portfolio.holdings].sort((a, b) => b.totalAssetValue - a.totalAssetValue)[0]?.stockSymbol ?? 'None'}`,
        ],
        actions: [
          { label: 'Open portfolio', route: '/portfolios', queryParams: { customerId: portfolio.customerId } },
          { label: 'Buy stock', route: '/trade', queryParams: { type: 'BUY', customerId: portfolio.customerId } },
          { label: 'Sell stock', route: '/trade', queryParams: { type: 'SELL', customerId: portfolio.customerId } },
        ] as SearchAction[],
      })),
      ...index.transactions.map((transaction) => ({
        id: `transaction-${transaction.transactionId}`,
        category: 'transactions' as const,
        title: `Transaction #${transaction.transactionId}`,
        subtitle: `${transaction.customerName ?? `Customer #${transaction.customerId}`} ${transaction.transactionType === 'BUY' ? 'purchased' : 'sold'} ${transaction.quantity} ${transaction.stockSymbol}`,
        meta: `${this.money(transaction.quantity * transaction.price)} · ${this.date(transaction.transactionDate)}`,
        icon: (transaction.transactionType === 'BUY' ? 'trending-up' : 'trending-down') as SearchResult['icon'],
        score: 0,
        route: '/transactions',
        queryParams: { query: String(transaction.transactionId) },
        badge: transaction.transactionType,
        tone: transaction.transactionType === 'BUY' ? 'success' as const : 'danger' as const,
        previewTitle: `Transaction #${transaction.transactionId}`,
        previewLines: [
          `Customer: ${transaction.customerName ?? `#${transaction.customerId}`}`,
          `Order: ${transaction.transactionType} ${transaction.quantity} ${transaction.stockSymbol}`,
          `Execution price: ${this.money(transaction.price)}`,
          `Total value: ${this.money(transaction.quantity * transaction.price)}`,
          `Date: ${this.date(transaction.transactionDate)}`,
        ],
        actions: [
          { label: 'View transactions', route: '/transactions', queryParams: { query: String(transaction.transactionId) } },
          { label: 'Customer portfolio', route: '/portfolios', queryParams: { customerId: transaction.customerId } },
        ] as SearchAction[],
      })),
    ];

    const filtered = candidates
      .filter((candidate) => !parsed.category || candidate.category === parsed.category
        || (parsed.category === 'navigation' && candidate.title.toLowerCase().includes('report')))
      .map((candidate) => ({ ...candidate, score: this.score(parsed.query, this.searchableText(candidate)) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

    const perCategory = new Map<SearchCategory, number>();
    const limited = filtered.filter((result) => {
      const count = perCategory.get(result.category) ?? 0;
      if (count >= 5) return false;
      perCategory.set(result.category, count + 1);
      return true;
    }).slice(0, 20);

    if (!parsed.category && input.trim().length >= 3) {
      limited.push({
        id: `ai-${input.trim().toLowerCase()}`,
        category: 'ai',
        title: `Ask Stock Assistant: “${input.trim()}”`,
        subtitle: 'Use workspace data to answer this question',
        icon: 'database',
        score: 1,
        action: 'ask-ai',
        previewTitle: 'AI workspace question',
        previewLines: ['The assistant will use current workspace data.', 'Answers are informational and are not investment advice.'],
      });
    }
    return limited;
  }

  private parseQuery(input: string): { query: string; category?: SearchCategory } {
    const trimmed = input.trim();
    const match = trimmed.match(/^(customer|stock|transaction|portfolio|report|action):\s*(.*)$/i);
    return match
      ? { query: match[2].trim().toLowerCase(), category: PREFIXES[match[1].toLowerCase()] }
      : { query: trimmed.toLowerCase() };
  }

  private searchableText(result: SearchResult): string {
    return [result.title, result.subtitle, result.meta, ...(result.previewLines ?? [])].filter(Boolean).join(' ').toLowerCase();
  }

  private score(query: string, text: string): number {
    if (!query) return 0;
    if (text === query) return 120;
    if (text.startsWith(query)) return 100;
    if (text.includes(query)) return 82;
    const words = text.split(/[^a-z0-9]+/).filter(Boolean);
    const tokens = query.split(/\s+/).filter(Boolean);
    let total = 0;
    for (const token of tokens) {
      if (words.some((word) => word.startsWith(token))) total += 28;
      else {
        const distance = Math.min(...words.map((word) => this.distance(token, word)));
        const tolerance = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0;
        if (distance <= tolerance) total += 20 - distance * 4;
        else return 0;
      }
    }
    return total;
  }

  private distance(a: string, b: string): number {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[b.length];
  }

  private totalShares(holdings: SearchIndex['portfolios'][number]['holdings']): number {
    return holdings.reduce((sum, holding) => sum + holding.quantity, 0);
  }

  private money(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  private date(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
