import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { interval, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { Stock, StockInput } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { StockLogoComponent } from '../../shared/stock-logo.component';

@Component({
  selector: 'app-stocks-page',
  imports: [CurrencyPipe, DecimalPipe, ReactiveFormsModule, IconComponent, StockLogoComponent],
  templateUrl: './stocks.page.html',
  styleUrl: './stocks.page.css',
})
export class StocksPage {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly pageSize = 8;

  protected readonly stocks = signal<Stock[]>([]);
  protected readonly priceDirections = signal<Record<string, 'up' | 'down'>>({});
  protected readonly query = signal(this.route.snapshot.queryParamMap.get('query') ?? '');
  protected readonly lowOnly = signal(this.route.snapshot.queryParamMap.get('filter') === 'low');
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deletingSymbol = signal('');
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly editingSymbol = signal<string | null>(null);

  protected readonly stockForm = this.fb.nonNullable.group({
    stockSymbol: ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Za-z0-9.-]+$/)]],
    stockName: ['', [Validators.required, Validators.maxLength(100)]],
    currentPrice: [0, [Validators.required, Validators.min(0.01)]],
    availableQuantity: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  protected readonly filteredStocks = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (!needle && !this.lowOnly()) return this.stocks();
    return this.stocks().filter((stock) =>
      (!this.lowOnly() || stock.availableQuantity <= 10)
      && (!needle || stock.stockSymbol.toLowerCase().includes(needle) || stock.stockName.toLowerCase().includes(needle)),
    );
  });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredStocks().length / this.pageSize)));
  protected readonly pageItems = computed(() => {
    const safePage = Math.min(this.page(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.filteredStocks().slice(start, start + this.pageSize);
  });
  protected readonly firstItem = computed(() => this.filteredStocks().length ? (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize + 1 : 0);
  protected readonly lastItem = computed(() => Math.min(this.firstItem() + this.pageSize - 1, this.filteredStocks().length));

  constructor() {
    this.loadStocks();
    if (this.route.snapshot.queryParamMap.get('create') === '1') setTimeout(() => this.openCreate());
    interval(1_000).pipe(
      switchMap(() => this.api.getStocks()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (stocks) => this.applyStocks(stocks, true),
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected loadStocks(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getStocks().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (stocks) => this.applyStocks(stocks, false),
      error: (error: Error) => this.error.set(error.message),
    });
  }

  private applyStocks(stocks: Stock[], trackPriceChanges: boolean): void {
    const previousPrices = new Map(this.stocks().map((stock) => [stock.stockSymbol, stock.currentPrice]));
    const directions: Record<string, 'up' | 'down'> = {};
    if (trackPriceChanges) {
      stocks.forEach((stock) => {
        const previousPrice = previousPrices.get(stock.stockSymbol);
        if (previousPrice !== undefined && previousPrice !== stock.currentPrice) {
          directions[stock.stockSymbol] = stock.currentPrice > previousPrice ? 'up' : 'down';
        }
      });
    }
    this.priceDirections.set(directions);
    this.stocks.set(stocks);
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  protected openCreate(): void {
    this.editingSymbol.set(null);
    this.stockForm.reset({ stockSymbol: '', stockName: '', currentPrice: 0, availableQuantity: 0 });
    this.modalOpen.set(true);
  }

  protected openEdit(stock: Stock): void {
    this.editingSymbol.set(stock.stockSymbol);
    this.stockForm.reset(stock);
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    if (!this.saving()) this.modalOpen.set(false);
  }

  protected saveStock(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }

    const raw = this.stockForm.getRawValue();
    const stock: StockInput = {
      stockSymbol: raw.stockSymbol.trim().toUpperCase(),
      stockName: raw.stockName.trim(),
      currentPrice: Number(raw.currentPrice),
      availableQuantity: Number(raw.availableQuantity),
    };
    const editing = this.editingSymbol();
    const request = editing
      ? this.api.updateStock(editing, {
          stockName: stock.stockName,
          currentPrice: stock.currentPrice,
          availableQuantity: stock.availableQuantity,
        })
      : this.api.createStock(stock);

    this.saving.set(true);
    this.error.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.stocks.update((items) => editing
          ? items.map((item) => item.stockSymbol === editing ? saved : item)
          : [...items, saved],
        );
        this.modalOpen.set(false);
        this.showSuccess(editing ? `${saved.stockSymbol} was updated.` : `${saved.stockSymbol} was added.`);
      },
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected deleteStock(stock: Stock): void {
    if (!window.confirm(`Delete ${stock.stockSymbol}? This cannot be undone.`)) return;
    this.deletingSymbol.set(stock.stockSymbol);
    this.error.set('');
    this.api.deleteStock(stock.stockSymbol).pipe(finalize(() => this.deletingSymbol.set(''))).subscribe({
      next: () => {
        this.stocks.update((items) => items.filter((item) => item.stockSymbol !== stock.stockSymbol));
        this.page.set(Math.min(this.page(), this.totalPages()));
        this.showSuccess(`${stock.stockSymbol} was deleted.`);
      },
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected previousPage(): void { this.page.update((value) => Math.max(1, value - 1)); }
  protected nextPage(): void { this.page.update((value) => Math.min(this.totalPages(), value + 1)); }

  private showSuccess(message: string): void {
    this.success.set(message);
    window.setTimeout(() => this.success.set(''), 3200);
  }
}
