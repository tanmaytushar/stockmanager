import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin, interval, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { WorkspaceRefreshService } from '../../core/workspace-refresh.service';
import { Customer, Portfolio, Stock, StockTransaction } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { StockLogoComponent } from '../../shared/stock-logo.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, IconComponent, StockLogoComponent],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private readonly api = inject(ApiService);
  private readonly workspaceRefresh = inject(WorkspaceRefreshService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stocks = signal<Stock[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly transactions = signal<StockTransaction[]>([]);
  protected readonly portfolios = signal<Portfolio[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly inventoryValue = computed(() =>
    this.stocks().reduce((sum, stock) => sum + stock.currentPrice * stock.availableQuantity, 0),
  );
  protected readonly portfolioValue = computed(() =>
    this.portfolios().reduce((sum, portfolio) => sum + portfolio.totalAssetValue, 0),
  );
  protected readonly recentTransactions = computed(() =>
    [...this.transactions()]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 6),
  );
  protected readonly lowStock = computed(() =>
    [...this.stocks()].sort((a, b) => a.availableQuantity - b.availableQuantity).slice(0, 5),
  );

  constructor() {
    this.loadDashboard();
    this.workspaceRefresh.updates$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadDashboard());
    interval(1_000).pipe(
      switchMap(() => this.api.getPortfolios()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (portfolios) => this.portfolios.set(portfolios),
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      stocks: this.api.getStocks(),
      customers: this.api.getCustomers(),
      transactions: this.api.getTransactions(),
      portfolios: this.api.getPortfolios(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ stocks, customers, transactions, portfolios }) => {
          this.stocks.set(stocks);
          this.customers.set(customers);
          this.transactions.set(transactions);
          this.portfolios.set(portfolios);
        },
        error: (error: Error) => this.error.set(error.message),
      });
  }
}
