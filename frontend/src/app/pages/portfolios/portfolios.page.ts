import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { Customer, Portfolio } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-portfolios-page',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, IconComponent],
  templateUrl: './portfolios.page.html',
  styleUrl: './portfolios.page.css',
})
export class PortfoliosPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly pageSize = 6;

  protected readonly portfolios = signal<Portfolio[]>([]);
  protected readonly customers = signal<Customer[]>([]);
  protected readonly selectedCustomerId = signal<number | null>(Number(this.route.snapshot.queryParamMap.get('customerId')) || null);
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly totalValue = computed(() => this.portfolios().reduce((sum, item) => sum + item.totalAssetValue, 0));
  protected readonly totalPositions = computed(() => this.portfolios().reduce((sum, item) => sum + item.holdings.length, 0));
  protected readonly largestPortfolio = computed(() => [...this.portfolios()].sort((a, b) => b.totalAssetValue - a.totalAssetValue)[0] ?? null);
  protected readonly filteredPortfolios = computed(() => {
    const selectedId = this.selectedCustomerId();
    const needle = this.query().trim().toLowerCase();
    return this.portfolios().filter((portfolio) => {
      const matchesCustomer = selectedId === null || portfolio.customerId === selectedId;
      const matchesQuery = !needle
        || portfolio.customerName.toLowerCase().includes(needle)
        || String(portfolio.customerId).includes(needle)
        || portfolio.holdings.some((holding) => holding.stockSymbol.toLowerCase().includes(needle) || holding.stockName.toLowerCase().includes(needle));
      return matchesCustomer && matchesQuery;
    });
  });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredPortfolios().length / this.pageSize)));
  protected readonly pageItems = computed(() => {
    const safePage = Math.min(this.page(), this.totalPages());
    return this.filteredPortfolios().slice((safePage - 1) * this.pageSize, safePage * this.pageSize);
  });

  constructor() { this.loadPortfolios(); }

  protected loadPortfolios(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ portfolios: this.api.getPortfolios(), customers: this.api.getCustomers() })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ portfolios, customers }) => { this.portfolios.set(portfolios); this.customers.set(customers); },
        error: (error: Error) => this.error.set(error.message),
      });
  }
  protected updateQuery(value: string): void { this.query.set(value); this.page.set(1); }
  protected updateCustomer(value: string): void { this.selectedCustomerId.set(Number(value) || null); this.page.set(1); }
  protected previousPage(): void { this.page.update((value) => Math.max(1, value - 1)); }
  protected nextPage(): void { this.page.update((value) => Math.min(this.totalPages(), value + 1)); }
  protected initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
}
