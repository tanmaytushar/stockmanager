import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { StockTransaction, TransactionType } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

type TypeFilter = 'ALL' | TransactionType;

@Component({
  selector: 'app-transactions-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, IconComponent],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.css',
})
export class TransactionsPage {
  private readonly api = inject(ApiService);
  private readonly pageSize = 10;

  protected readonly transactions = signal<StockTransaction[]>([]);
  protected readonly query = signal('');
  protected readonly typeFilter = signal<TypeFilter>('ALL');
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly sortedTransactions = computed(() => [...this.transactions()].sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
  ));
  protected readonly filteredTransactions = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const type = this.typeFilter();
    return this.sortedTransactions().filter((transaction) => {
      const matchesType = type === 'ALL' || transaction.transactionType === type;
      const matchesQuery = !needle
        || transaction.stockSymbol.toLowerCase().includes(needle)
        || (transaction.customerName ?? '').toLowerCase().includes(needle)
        || String(transaction.customerId).includes(needle)
        || String(transaction.transactionId).includes(needle);
      return matchesType && matchesQuery;
    });
  });
  protected readonly buyCount = computed(() => this.transactions().filter((item) => item.transactionType === 'BUY').length);
  protected readonly sellCount = computed(() => this.transactions().filter((item) => item.transactionType === 'SELL').length);
  protected readonly tradedValue = computed(() => this.transactions().reduce((sum, item) => sum + item.quantity * item.price, 0));
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTransactions().length / this.pageSize)));
  protected readonly pageItems = computed(() => {
    const safePage = Math.min(this.page(), this.totalPages());
    return this.filteredTransactions().slice((safePage - 1) * this.pageSize, safePage * this.pageSize);
  });
  protected readonly firstItem = computed(() => this.filteredTransactions().length ? (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize + 1 : 0);
  protected readonly lastItem = computed(() => Math.min(this.firstItem() + this.pageSize - 1, this.filteredTransactions().length));

  constructor() { this.loadTransactions(); }

  protected loadTransactions(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getTransactions().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (transactions) => this.transactions.set(transactions),
      error: (error: Error) => this.error.set(error.message),
    });
  }
  protected updateQuery(value: string): void { this.query.set(value); this.page.set(1); }
  protected updateType(value: string): void { this.typeFilter.set(value as TypeFilter); this.page.set(1); }
  protected previousPage(): void { this.page.update((value) => Math.max(1, value - 1)); }
  protected nextPage(): void { this.page.update((value) => Math.min(this.totalPages(), value + 1)); }
}
