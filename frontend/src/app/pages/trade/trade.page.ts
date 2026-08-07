import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, interval, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { WorkspaceRefreshService } from '../../core/workspace-refresh.service';
import { Customer, Portfolio, Stock, TradeRequest, TransactionType } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-trade-page',
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './trade.page.html',
  styleUrl: './trade.page.css',
})
export class TradePage {
  private readonly api = inject(ApiService);
  private readonly workspaceRefresh = inject(WorkspaceRefreshService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly presetCustomerId = Number(this.route.snapshot.queryParamMap.get('customerId')) || 0;
  private readonly presetStock = this.route.snapshot.queryParamMap.get('stock') ?? '';
  private readonly presetType: TransactionType = this.route.snapshot.queryParamMap.get('type') === 'SELL' ? 'SELL' : 'BUY';

  protected readonly customers = signal<Customer[]>([]);
  protected readonly stocks = signal<Stock[]>([]);
  protected readonly portfolio = signal<Portfolio | null>(null);
  protected readonly tradeType = signal<TransactionType>(this.presetType);
  protected readonly customerId = signal<number | null>(this.presetCustomerId || null);
  protected readonly stockSymbol = signal(this.presetStock);
  protected readonly quantity = signal(1);
  protected readonly loading = signal(true);
  protected readonly portfolioLoading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly tradeForm = this.fb.nonNullable.group({
    customerId: [this.presetCustomerId, [Validators.required, Validators.min(1)]],
    stockSymbol: [this.presetStock, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
  });

  protected readonly selectedCustomer = computed(() => this.customers().find((customer) => customer.customerId === this.customerId()) ?? null);
  protected readonly selectedStock = computed(() => this.stocks().find((stock) => stock.stockSymbol === this.stockSymbol()) ?? null);
  protected readonly selectedHolding = computed(() => this.portfolio()?.holdings.find((holding) => holding.stockSymbol === this.stockSymbol()) ?? null);
  protected readonly estimatedValue = computed(() => (this.selectedStock()?.currentPrice ?? 0) * this.quantity());
  protected readonly exceedsLimit = computed(() => {
    const amount = this.quantity();
    return this.tradeType() === 'BUY'
      ? amount > (this.selectedStock()?.availableQuantity ?? 0)
      : amount > (this.selectedHolding()?.quantity ?? 0);
  });

  constructor() {
    this.loadOptions();
    this.workspaceRefresh.updates$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadOptions());
    interval(1_000).pipe(
      switchMap(() => this.api.getStocks()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (stocks) => this.stocks.set(stocks),
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected loadOptions(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ customers: this.api.getCustomers(), stocks: this.api.getStocks() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ customers, stocks }) => {
          this.customers.set(customers);
          this.stocks.set(stocks);
          if (this.presetCustomerId) this.onCustomerChange(String(this.presetCustomerId));
        },
        error: (error: Error) => this.error.set(error.message),
      });
  }

  protected setTradeType(type: TransactionType): void {
    this.tradeType.set(type);
    this.success.set('');
  }

  protected onCustomerChange(value: string): void {
    const id = Number(value);
    this.customerId.set(id || null);
    this.portfolio.set(null);
    if (!id) return;
    const requestedCustomerId = id;
    this.portfolioLoading.set(true);
    this.api.getPortfolio(id).pipe(finalize(() => {
      if (this.customerId() === requestedCustomerId) {
        this.portfolioLoading.set(false);
      }
    })).subscribe({
      next: (portfolio) => {
        if (this.customerId() === requestedCustomerId) {
          this.portfolio.set(portfolio);
        }
      },
      error: (error: Error) => {
        if (this.customerId() === requestedCustomerId) {
          this.portfolio.set(null);
          this.error.set(error.message);
        }
      },
    });
  }

  protected onStockChange(value: string): void { this.stockSymbol.set(value); }
  protected onQuantityChange(value: string): void { this.quantity.set(Math.max(0, Number(value) || 0)); }

  protected submitTrade(): void {
    if (this.tradeForm.invalid || this.exceedsLimit()) {
      this.tradeForm.markAllAsTouched();
      return;
    }
    const raw = this.tradeForm.getRawValue();
    const request: TradeRequest = { customerId: Number(raw.customerId), stockSymbol: raw.stockSymbol, quantity: Number(raw.quantity) };
    const type = this.tradeType();
    const operation = type === 'BUY' ? this.api.buyStock(request) : this.api.sellStock(request);

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');
    operation.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: (transaction) => {
        this.success.set(`${type === 'BUY' ? 'Purchase' : 'Sale'} completed. Transaction #${transaction.transactionId} was recorded.`);
        this.stocks.update((stocks) => stocks.map((stock) => stock.stockSymbol === request.stockSymbol
          ? { ...stock, availableQuantity: stock.availableQuantity + (type === 'BUY' ? -request.quantity : request.quantity) }
          : stock,
        ));
        this.tradeForm.controls.quantity.setValue(1);
        this.quantity.set(1);
        this.onCustomerChange(String(request.customerId));
      },
      error: (error: Error) => this.error.set(error.message),
    });
  }
}
