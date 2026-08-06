import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { StockTransaction, TransactionType } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { StockLogoComponent } from '../../shared/stock-logo.component';

type TypeFilter = 'ALL' | TransactionType;

@Component({
  selector: 'app-transactions-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink, IconComponent, StockLogoComponent],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.css',
})
export class TransactionsPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly pageSize = 10;

  protected readonly transactions = signal<StockTransaction[]>([]);
  protected readonly query = signal(this.route.snapshot.queryParamMap.get('query') ?? '');
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

  protected downloadPdf(): void {
    const transactions = this.filteredTransactions();
    if (!transactions.length) return;

    const filter = this.typeFilter();
    const title = filter === 'ALL' ? 'Transaction ledger' : `${filter} transaction ledger`;
    const generatedAt = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    const lines = [
      title,
      `Generated ${generatedAt}`,
      '',
      'ID | Type | Stock | Customer | Quantity | Price | Total | Date',
      ...transactions.map((transaction) => [
        `#${transaction.transactionId}`,
        transaction.transactionType,
        transaction.stockSymbol,
        transaction.customerName || `Customer #${transaction.customerId}`,
        this.number(transaction.quantity),
        this.currency(transaction.price),
        this.currency(transaction.quantity * transaction.price),
        new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(transaction.transactionDate)),
      ].join(' | ')),
    ];

    const pdf = this.createPdf(lines);
    const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${filter.toLowerCase()}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  private createPdf(lines: string[]): string {
    const header = lines.slice(0, 4);
    const records = lines.slice(4);
    const recordsPerPage = 42;
    const pages = Array.from({ length: Math.ceil(records.length / recordsPerPage) }, (_, index) =>
      [...header, ...records.slice(index * recordsPerPage, (index + 1) * recordsPerPage)],
    );
    const pageObjectIds = pages.map((_, index) => 4 + index * 2);
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];

    pages.forEach((page, index) => {
      const content = page.map((line, lineIndex) => {
        const fontSize = lineIndex === 0 ? 16 : 8;
        const move = lineIndex === 0 ? '54 800 Td' : '0 -15 Td';
        return `/F1 ${fontSize} Tf\n${move}\n(${this.pdfText(line)}) Tj`;
      }).join('\n');
      const pageId = pageObjectIds[index];
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
      objects.push(`<< /Length ${content.length} >>\nstream\nBT\n${content}\nET\nendstream`);
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
  }

  private pdfText(value: string): string {
    return value.replace(/[\\()]/g, '\\$&').replace(/[^\x20-\x7E]/g, '?');
  }

  private number(value: number): string { return new Intl.NumberFormat('en-US').format(value); }
  private currency(value: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value); }
}
