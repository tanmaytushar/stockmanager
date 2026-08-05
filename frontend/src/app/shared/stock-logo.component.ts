import { Component, computed, input, signal } from '@angular/core';

const STOCK_LOGO_PATHS: Readonly<Record<string, string>> = {
  AAPL: 'imgs/apple.png',
  AMZN: 'imgs/amazon.png',
  GOOGL: 'imgs/google.png',
  MSFT: 'imgs/microsoft.png',
  ORCL: 'imgs/oracle.png',
  TSLA: 'imgs/tesla.png',
};

@Component({
  selector: 'app-stock-logo',
  template: `
    <span class="stock-logo" [class.stock-logo--fallback]="!logoPath() || imageLoadFailed()">
      @if (logoPath() && !imageLoadFailed()) {
        <img [src]="logoPath()" alt="" aria-hidden="true" (error)="handleImageError()" />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }
    </span>
  `,
  styles: [`
    :host {
      display: inline-grid;
      flex: 0 0 auto;
      width: 44px;
      height: 30px;
      place-items: center;
    }

    .stock-logo {
      display: grid;
      width: 100%;
      height: 100%;
      overflow: hidden;
      place-items: center;
      border: 1px solid #e2e8f0;
      border-radius: 7px;
      background: #fff;
    }

    img {
      display: block;
      width: auto;
      max-width: 38px;
      height: auto;
      max-height: 24px;
      object-fit: contain;
    }

    .stock-logo--fallback {
      border-color: transparent;
      background: var(--accent-soft);
      color: var(--accent-dark);
      font-size: .64rem;
      font-weight: 800;
    }
  `],
})
export class StockLogoComponent {
  readonly symbol = input.required<string>();
  protected readonly imageLoadFailed = signal(false);
  protected readonly logoPath = computed(() => STOCK_LOGO_PATHS[this.symbol().trim().toUpperCase()] ?? '');
  protected readonly initials = computed(() => this.symbol().trim().slice(0, 2).toUpperCase());

  protected handleImageError(): void {
    this.imageLoadFailed.set(true);
  }
}
