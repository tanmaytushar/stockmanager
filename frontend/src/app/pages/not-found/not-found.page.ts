import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="page not-found card">
      <span>404</span>
      <h1>Page not found</h1>
      <p>The page you requested does not exist in this workspace.</p>
      <a class="button" routerLink="/dashboard"><app-icon name="dashboard" /> Return to overview</a>
    </section>
  `,
  styles: [`
    .not-found { display: grid; min-height: 430px; place-items: center; align-content: center; padding: 40px; text-align: center; }
    .not-found > span { margin-bottom: 8px; color: var(--accent); font-family: 'Manrope', sans-serif; font-size: 3rem; font-weight: 800; }
    h1 { margin-bottom: 7px; font-size: 1.3rem; }
    p { margin-bottom: 18px; color: var(--muted); font-size: .78rem; }
  `],
})
export class NotFoundPage {}
