import { Routes } from '@angular/router';
import { anonymousOnlyGuard, authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.page').then((m) => m.DashboardPage) },
      { path: 'stocks', loadComponent: () => import('./pages/stocks/stocks.page').then((m) => m.StocksPage) },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers.page').then((m) => m.CustomersPage) },
      { path: 'trade', loadComponent: () => import('./pages/trade/trade.page').then((m) => m.TradePage) },
      { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions.page').then((m) => m.TransactionsPage) },
      { path: 'portfolios', loadComponent: () => import('./pages/portfolios/portfolios.page').then((m) => m.PortfoliosPage) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.page').then((m) => m.ReportsPage) },
      { path: '**', loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage) },
    ],
  },
];
