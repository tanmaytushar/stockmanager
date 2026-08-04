import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { ReportBundle } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-reports-page',
  imports: [CurrencyPipe, DecimalPipe, IconComponent],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
})
export class ReportsPage {
  private readonly api = inject(ApiService);

  protected readonly reports = signal<ReportBundle | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly rankedPortfolios = computed(() => [...(this.reports()?.portfolios ?? [])].sort((a, b) => b.totalAssetValue - a.totalAssetValue));
  protected readonly maxPortfolioValue = computed(() => Math.max(1, ...this.rankedPortfolios().map((item) => item.totalAssetValue)));
  protected readonly unavailable = computed(() => {
    const reports = this.reports();
    return !!reports && Object.values(reports).every((value) => value === null);
  });

  constructor() { this.loadReports(); }

  protected loadReports(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getReports().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (reports) => this.reports.set(reports),
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected portfolioWidth(value: number): number { return Math.max(2, value / this.maxPortfolioValue() * 100); }
  protected frequencyWidth(value: number): number {
    const frequency = this.reports()?.transactionFrequency;
    const max = Math.max(1, frequency?.buyCount ?? 0, frequency?.sellCount ?? 0);
    return value / max * 100;
  }
}
