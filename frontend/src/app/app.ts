import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent, IconName } from './shared/icon.component';

interface NavItem {
  label: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly menuOpen = signal(false);
  protected readonly navItems: NavItem[] = [
    { label: 'Overview', route: '/dashboard', icon: 'dashboard' },
    { label: 'Stocks', route: '/stocks', icon: 'chart' },
    { label: 'Customers', route: '/customers', icon: 'users' },
    { label: 'Trade', route: '/trade', icon: 'swap' },
    { label: 'Transactions', route: '/transactions', icon: 'receipt' },
    { label: 'Portfolios', route: '/portfolios', icon: 'briefcase' },
    { label: 'Reports', route: '/reports', icon: 'report' },
  ];

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
