import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, Observable, of, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';
import {
  ApiProblem,
  Customer,
  CustomerInput,
  Portfolio,
  ReportBundle,
  Stock,
  StockInput,
  StockUpdateInput,
  StockTradeReport,
  StockTransaction,
  TotalAssetValue,
  TradeRequest,
  TransactionTypeFrequency,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = API_BASE_URL;

  getStocks(query = ''): Observable<Stock[]> {
    const params = query.trim() ? new HttpParams().set('query', query.trim()) : undefined;
    return this.http.get<Stock[]>(`${this.baseUrl}/stocks`, { params }).pipe(catchError(this.handleError));
  }

  getStock(symbol: string): Observable<Stock> {
    return this.http.get<Stock>(`${this.baseUrl}/stocks/${encodeURIComponent(symbol)}`).pipe(catchError(this.handleError));
  }

  createStock(stock: StockInput): Observable<Stock> {
    return this.http.post<Stock>(`${this.baseUrl}/stocks`, stock).pipe(catchError(this.handleError));
  }

  updateStock(symbol: string, stock: StockUpdateInput): Observable<Stock> {
    return this.http.put<Stock>(`${this.baseUrl}/stocks/${encodeURIComponent(symbol)}`, stock).pipe(catchError(this.handleError));
  }

  deleteStock(symbol: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/stocks/${encodeURIComponent(symbol)}`).pipe(catchError(this.handleError));
  }

  getCustomers(query = ''): Observable<Customer[]> {
    const params = query.trim() ? new HttpParams().set('query', query.trim()) : undefined;
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`, { params }).pipe(catchError(this.handleError));
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/customers/${id}`).pipe(catchError(this.handleError));
  }

  createCustomer(customer: CustomerInput): Observable<Customer> {
    return this.http.post<Customer>(`${this.baseUrl}/customers`, customer).pipe(catchError(this.handleError));
  }

  updateCustomer(id: number, customer: CustomerInput): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/customers/${id}`, customer).pipe(catchError(this.handleError));
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/customers/${id}`).pipe(catchError(this.handleError));
  }

  buyStock(request: TradeRequest): Observable<StockTransaction> {
    return this.http.post<StockTransaction>(`${this.baseUrl}/transactions/buy`, request).pipe(catchError(this.handleError));
  }

  sellStock(request: TradeRequest): Observable<StockTransaction> {
    return this.http.post<StockTransaction>(`${this.baseUrl}/transactions/sell`, request).pipe(catchError(this.handleError));
  }

  getTransactions(): Observable<StockTransaction[]> {
    return this.http.get<StockTransaction[]>(`${this.baseUrl}/transactions`).pipe(catchError(this.handleError));
  }

  getPortfolios(): Observable<Portfolio[]> {
    return this.http.get<Portfolio[]>(`${this.baseUrl}/portfolios`).pipe(catchError(this.handleError));
  }

  getPortfolio(customerId: number): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.baseUrl}/portfolios/${customerId}`).pipe(catchError(this.handleError));
  }

  getReports(): Observable<ReportBundle> {
    return forkJoin({
      portfolios: this.http.get<Portfolio[]>(`${this.baseUrl}/reports/portfolios`).pipe(catchError(() => of(null))),
      highestPortfolio: this.http.get<Portfolio>(`${this.baseUrl}/reports/highest-portfolio`).pipe(catchError(() => of(null))),
      lowestPortfolio: this.http.get<Portfolio>(`${this.baseUrl}/reports/lowest-portfolio`).pipe(catchError(() => of(null))),
      mostTradedStock: this.http.get<StockTradeReport>(`${this.baseUrl}/reports/most-traded-stock`).pipe(catchError(() => of(null))),
      leastTradedStock: this.http.get<StockTradeReport>(`${this.baseUrl}/reports/least-traded-stock`).pipe(catchError(() => of(null))),
      highestPricedStock: this.http.get<Stock>(`${this.baseUrl}/reports/highest-priced-stock`).pipe(catchError(() => of(null))),
      transactionFrequency: this.http.get<TransactionTypeFrequency>(`${this.baseUrl}/reports/transaction-type-frequency`).pipe(catchError(() => of(null))),
      totalAssetValue: this.http.get<TotalAssetValue>(`${this.baseUrl}/reports/total-asset-value`).pipe(catchError(() => of(null))),
    });
  }

  private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
    const problem = error.error as ApiProblem | string | null;
    let message = 'Unable to reach the server. Make sure the backend is running.';

    if (typeof problem === 'string' && problem.trim()) {
      message = problem;
    } else if (problem && typeof problem === 'object') {
      message = problem.message || problem.detail || message;
      const validationErrors = problem.validationErrors || problem.errors;
      if (validationErrors) {
        message = Object.values(validationErrors).join(' ');
      }
    } else if (error.status) {
      message = `Request failed (${error.status}). Please try again.`;
    }

    return throwError(() => new Error(message));
  };
}
