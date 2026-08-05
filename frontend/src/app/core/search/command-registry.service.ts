import { Injectable } from '@angular/core';
import { SearchResult } from './search.models';

@Injectable({ providedIn: 'root' })
export class CommandRegistryService {
  readonly commands: SearchResult[] = [
    this.command('nav-dashboard', 'navigation', 'Dashboard', 'Open the workspace overview', 'dashboard', '/dashboard', 'home overview metrics'),
    this.command('nav-customers', 'navigation', 'Customers', 'Browse customer accounts', 'users', '/customers', 'people clients accounts'),
    this.command('nav-stocks', 'navigation', 'Stocks', 'Browse stock inventory and live prices', 'chart', '/stocks', 'market symbols instruments shares'),
    this.command('nav-trade', 'navigation', 'Trade', 'Open the reviewed order workflow', 'swap', '/trade', 'buy sell purchase order'),
    this.command('nav-portfolios', 'navigation', 'Portfolios', 'Review customer holdings', 'briefcase', '/portfolios', 'holdings assets value'),
    this.command('nav-transactions', 'navigation', 'Transactions', 'Open the transaction ledger', 'receipt', '/transactions', 'orders history buy sell'),
    this.command('nav-reports', 'navigation', 'Reports', 'Open analytics and rankings', 'report', '/reports', 'analytics summary most traded'),
    this.command('action-add-customer', 'actions', 'Add customer', 'Open the customer registration form', 'plus', '/customers?create=1', 'create new client register'),
    this.command('action-add-stock', 'actions', 'Add stock', 'Open the stock creation form', 'plus', '/stocks?create=1', 'create new instrument inventory'),
    this.command('action-buy', 'actions', 'Start buy order', 'Prepare a purchase in the reviewed trade flow', 'trending-up', '/trade?type=BUY', 'buy purchase shares'),
    this.command('action-sell', 'actions', 'Start sell order', 'Prepare a sale in the reviewed trade flow', 'trending-down', '/trade?type=SELL', 'sell shares'),
    this.command('action-low-stock', 'actions', 'Show low inventory', 'Find stocks with 10 or fewer available shares', 'alert', '/stocks?filter=low', 'risk low stock inventory'),
    this.command('action-report', 'actions', 'Generate report', 'Open live portfolio and market reports', 'report', '/reports', 'analytics report summary'),
    { id: 'action-ai', category: 'actions', title: 'Ask Stock Assistant', subtitle: 'Ask a question using workspace data', icon: 'database', score: 0, action: 'ask-ai', meta: 'ai chatbot question explain compare summarize' },
    { id: 'action-theme', category: 'actions', title: 'Toggle dark mode', subtitle: 'Switch between light and dark themes', icon: 'moon', score: 0, action: 'toggle-theme', meta: 'Appearance', previewLines: ['Changes the workspace theme immediately.', 'Your preference remains saved on this device.'] },
    { id: 'action-refresh', category: 'actions', title: 'Refresh application data', subtitle: 'Reload the StockPilot search index', icon: 'refresh', score: 0, action: 'refresh-index', meta: 'Data', previewLines: ['Refreshes searchable customers, stocks, portfolios, and transactions.', 'No records are changed.'] },
  ];

  contextual(path: string): SearchResult[] {
    const ids = path.startsWith('/customers')
      ? ['action-add-customer', 'nav-portfolios', 'nav-transactions']
      : path.startsWith('/stocks')
        ? ['action-add-stock', 'action-low-stock', 'action-buy']
        : path.startsWith('/portfolios')
          ? ['action-buy', 'action-sell', 'nav-transactions']
          : path.startsWith('/transactions')
            ? ['action-buy', 'action-sell', 'nav-reports']
            : ['action-buy', 'nav-reports', 'nav-portfolios'];
    return ids.map((id) => this.commands.find((command) => command.id === id)!).filter(Boolean);
  }

  private command(
    id: string,
    category: 'navigation' | 'actions',
    title: string,
    subtitle: string,
    icon: SearchResult['icon'],
    route: string,
    keywords: string,
  ): SearchResult {
    return { id, category, title, subtitle, icon, route, score: 0, meta: keywords };
  }
}
