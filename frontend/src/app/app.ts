import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { IconComponent, IconName } from './shared/icon.component';
import { AssistantChatComponent } from './shared/assistant-chat.component';

interface NavItem {
  label: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent, AssistantChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
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

  protected logout(): void {
    this.closeMenu();
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/login'),
      error: () => window.alert('Unable to log out. Please try again.'),
    });
  }
}
