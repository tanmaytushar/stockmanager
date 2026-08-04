import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from './api.config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthenticatedAdmin {
  username: string;
}

type AuthenticationState = 'unknown' | 'authenticated' | 'anonymous';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<AuthenticationState>('unknown');
  private readonly currentAdmin = signal<AuthenticatedAdmin | null>(null);

  readonly authenticated = computed(() => this.state() === 'authenticated');
  readonly username = computed(() => this.currentAdmin()?.username ?? '');

  login(credentials: LoginCredentials): Observable<AuthenticatedAdmin> {
    return this.http.post<AuthenticatedAdmin>(`${API_BASE_URL}/auth/login`, credentials).pipe(
      tap((admin) => this.setAuthenticated(admin)),
      catchError((error: HttpErrorResponse) => {
        const message = error.status === 401
          ? 'The username or password is incorrect.'
          : 'Unable to sign in. Make sure the backend is running and try again.';
        return throwError(() => new Error(message));
      }),
    );
  }

  ensureAuthenticated(): Observable<boolean> {
    if (this.state() === 'authenticated') {
      return of(true);
    }
    if (this.state() === 'anonymous') {
      return of(false);
    }

    return this.http.get<AuthenticatedAdmin>(`${API_BASE_URL}/auth/session`).pipe(
      tap((admin) => this.setAuthenticated(admin)),
      map(() => true),
      catchError(() => {
        this.clearAuthentication();
        return of(false);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${API_BASE_URL}/auth/logout`, {}).pipe(
      tap(() => this.clearAuthentication()),
    );
  }

  private setAuthenticated(admin: AuthenticatedAdmin): void {
    this.currentAdmin.set(admin);
    this.state.set('authenticated');
  }

  private clearAuthentication(): void {
    this.currentAdmin.set(null);
    this.state.set('anonymous');
  }
}
