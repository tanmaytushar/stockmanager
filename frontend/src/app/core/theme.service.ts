import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark';

const STORAGE_KEY = 'stock-manager-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly preferenceState = signal<ThemePreference>(this.readPreference());

  readonly preference = this.preferenceState.asReadonly();

  constructor() {
    this.applyTheme();
  }

  toggle(): void {
    this.setPreference(this.preferenceState() === 'light' ? 'dark' : 'light');
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceState.set(preference);
    localStorage.setItem(STORAGE_KEY, preference);
    this.applyTheme();
  }

  private readPreference(): ThemePreference {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  }

  private applyTheme(): void {
    const resolved = this.preferenceState();
    const root = this.document.documentElement;
    root.dataset['theme'] = resolved;
    root.dataset['themePreference'] = resolved;
    root.style.colorScheme = resolved;
    this.document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0b1120' : '#f4f7fa');
  }
}
