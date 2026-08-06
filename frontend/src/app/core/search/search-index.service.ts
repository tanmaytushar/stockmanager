import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay } from 'rxjs';
import { ApiService } from '../api.service';
import { Customer, Portfolio, Stock, StockTransaction } from '../models';
import { SearchIndex } from './search.models';

interface SafeResult<T> {
  data: T;
  failed: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchIndexService {
  private readonly api = inject(ApiService);
  private cache$?: Observable<SearchIndex>;

  load(force = false): Observable<SearchIndex> {
    if (!this.cache$ || force) {
      this.cache$ = forkJoin({
        customers: this.safe(this.api.getCustomers(), [] as Customer[]),
        stocks: this.safe(this.api.getStocks(), [] as Stock[]),
        transactions: this.safe(this.api.getTransactions(), [] as StockTransaction[]),
        portfolios: this.safe(this.api.getPortfolios(), [] as Portfolio[]),
      }).pipe(
        map(({ customers, stocks, transactions, portfolios }) => ({
          customers: customers.data,
          stocks: stocks.data,
          transactions: transactions.data,
          portfolios: portfolios.data,
          partiallyUnavailable: customers.failed || stocks.failed || transactions.failed || portfolios.failed,
        })),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.cache$;
  }

  private safe<T>(request: Observable<T>, fallback: T): Observable<SafeResult<T>> {
    return request.pipe(
      map((data) => ({ data, failed: false })),
      catchError(() => of({ data: fallback, failed: true })),
    );
  }
}
