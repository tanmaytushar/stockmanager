import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'stock-manager-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly systemTheme = window.matchMedia?.('(prefers-color-scheme: dark)');
  private readonly preferenceState = signal<ThemePreference>(this.readPreference());

  readonly preference = this.preferenceState.asReadonly();

  constructor() {
    this.applyTheme();
    this.systemTheme?.addEventListener('change', () => {
      if (this.preferenceState() === 'system') this.applyTheme();
    });
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceState.set(preference);
    localStorage.setItem(STORAGE_KEY, preference);
    this.applyTheme();
  }

  private readPreference(): ThemePreference {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  }

  private applyTheme(): void {
    const preference = this.preferenceState();
    const resolved: ResolvedTheme = preference === 'system'
      ? (this.systemTheme?.matches ? 'dark' : 'light')
      : preference;
    const root = this.document.documentElement;
    root.dataset['theme'] = resolved;
    root.dataset['themePreference'] = preference;
    root.style.colorScheme = resolved;
    this.document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0b1120' : '#f4f7fa');
  }
}
