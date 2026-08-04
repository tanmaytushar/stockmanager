import { Component, input } from '@angular/core';

export type IconName =
  | 'dashboard' | 'chart' | 'users' | 'swap' | 'receipt' | 'briefcase' | 'report'
  | 'menu' | 'plus' | 'search' | 'edit' | 'trash' | 'refresh' | 'arrow-right'
  | 'trending-up' | 'trending-down' | 'wallet' | 'database' | 'close' | 'check'
  | 'alert' | 'chevron-left' | 'chevron-right';

@Component({
  selector: 'app-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name()) {
        @case ('dashboard') { <path d="M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-13h6V4h-6v3Z"/> }
        @case ('chart') { <path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/> }
        @case ('users') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-3-12a4 4 0 0 1 0 7.75"/> }
        @case ('swap') { <path d="m17 3 4 4-4 4M3 7h18M7 21l-4-4 4-4m14 4H3"/> }
        @case ('receipt') { <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Zm3 5h6m-6 4h6m-6 4h4"/> }
        @case ('briefcase') { <path d="M9 6V4h6v2m-12 5h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm5 5v2h4v-2"/> }
        @case ('report') { <path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/> }
        @case ('menu') { <path d="M4 7h16M4 12h16M4 17h16"/> }
        @case ('plus') { <path d="M12 5v14M5 12h14"/> }
        @case ('search') { <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/> }
        @case ('edit') { <path d="m14 5 5 5M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/> }
        @case ('trash') { <path d="M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m3 0-1 14H7L6 7"/> }
        @case ('refresh') { <path d="M20 7v5h-5M4 17v-5h5m10.5-2A8 8 0 0 0 6 6l-2 6m.5 2A8 8 0 0 0 18 18l2-6"/> }
        @case ('arrow-right') { <path d="M5 12h14m-5-5 5 5-5 5"/> }
        @case ('trending-up') { <path d="m3 17 6-6 4 4 8-8m-5 0h5v5"/> }
        @case ('trending-down') { <path d="m3 7 6 6 4-4 8 8m-5 0h5v-5"/> }
        @case ('wallet') { <path d="M4 5h15a2 2 0 0 1 2 2v12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13m0 9h4m-4 0a1 1 0 1 0 0 .01"/> }
        @case ('database') { <ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12v7c0 1.66 3.58 3 8 3s8-1.34 8-3v-7"/> }
        @case ('close') { <path d="m6 6 12 12M18 6 6 18"/> }
        @case ('check') { <path d="m5 12 4 4L19 6"/> }
        @case ('alert') { <path d="M12 9v4m0 4h.01M10.3 3.8 2.4 18a2 2 0 0 0 1.75 3h15.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"/> }
        @case ('chevron-left') { <path d="m15 18-6-6 6-6"/> }
        @case ('chevron-right') { <path d="m9 18 6-6-6-6"/> }
      }
    </svg>
  `,
  styles: [`:host { display: inline-grid; flex: 0 0 auto; width: 20px; height: 20px; place-items: center; } svg { width: 100%; height: 100%; }`],
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
