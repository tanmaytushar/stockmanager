import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { WorkspaceRefreshService } from '../core/workspace-refresh.service';
import { AssistantCustomerProposal, AssistantTradeProposal, CustomerInput, TradeRequest } from '../core/models';
import { IconComponent } from './icon.component';

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

@Component({
  selector: 'app-assistant-chat',
  imports: [FormsModule, IconComponent],
  templateUrl: './assistant-chat.component.html',
  styleUrl: './assistant-chat.component.css',
})
export class AssistantChatComponent {
  private readonly api = inject(ApiService);
  private readonly workspaceRefresh = inject(WorkspaceRefreshService);
  protected readonly open = signal(false);
  protected readonly loading = signal(false);
  protected readonly draft = signal('');
  protected readonly pendingTrade = signal<AssistantTradeProposal | null>(null);
  protected readonly pendingCustomer = signal<AssistantCustomerProposal | null>(null);
  protected readonly submittingTrade = signal(false);
  protected readonly submittingCustomer = signal(false);
  protected readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', text: 'Hi — I can summarize stocks, recent trading activity, and portfolio totals from this workspace.' },
  ]);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected readableText(text: string): string {
    return text
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/^\s*\d+\.\s+/gm, '• ')
      .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
      .replace(/\s*\|\s*/g, '  •  ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  protected send(): void {
    const text = this.draft().trim();
    if (!text || this.loading()) return;

    this.messages.update((messages) => [...messages, { role: 'user', text }]);
    this.draft.set('');
    this.loading.set(true);
    this.api.chatWithAssistant(text).subscribe({
      next: ({ reply, tradeProposal, customerProposal }) => {
        this.messages.update((messages) => [...messages, { role: 'assistant', text: reply }]);
        this.pendingTrade.set(tradeProposal);
        this.pendingCustomer.set(customerProposal);
      },
      error: (error: Error) => {
        this.messages.update((messages) => [...messages, { role: 'assistant', text: error.message }]);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  protected confirmTrade(): void {
    const proposal = this.pendingTrade();
    if (!proposal || this.submittingTrade()) return;

    const request: TradeRequest = {
      customerId: proposal.customerId,
      stockSymbol: proposal.stockSymbol,
      quantity: proposal.quantity,
    };
    this.submittingTrade.set(true);
    const trade = proposal.type === 'BUY' ? this.api.buyStock(request) : this.api.sellStock(request);
    trade.subscribe({
      next: (transaction) => {
        this.messages.update((messages) => [...messages, {
          role: 'assistant',
          text: `${proposal.type === 'BUY' ? 'Purchase' : 'Sale'} completed for customer #${proposal.customerId}. Transaction #${transaction.transactionId} was recorded.`,
        }]);
        this.pendingTrade.set(null);
        this.workspaceRefresh.notify();
      },
      error: (error: Error) => {
        this.messages.update((messages) => [...messages, { role: 'assistant', text: error.message }]);
        this.submittingTrade.set(false);
      },
      complete: () => this.submittingTrade.set(false),
    });
  }

  protected cancelTrade(): void {
    this.pendingTrade.set(null);
  }

  protected confirmCustomer(): void {
    const proposal = this.pendingCustomer();
    if (!proposal || this.submittingCustomer()) return;

    const request: CustomerInput = {
      customerName: proposal.customerName,
      emailAddress: proposal.emailAddress,
    };
    this.submittingCustomer.set(true);
    this.api.createCustomer(request).subscribe({
      next: (customer) => {
        this.messages.update((messages) => [...messages, {
          role: 'assistant',
          text: `Customer ${customer.customerName} was registered with account #${customer.customerId}.`,
        }]);
        this.pendingCustomer.set(null);
        this.workspaceRefresh.notify();
      },
      error: (error: Error) => {
        this.messages.update((messages) => [...messages, { role: 'assistant', text: error.message }]);
        this.submittingCustomer.set(false);
      },
      complete: () => this.submittingCustomer.set(false),
    });
  }

  protected cancelCustomer(): void {
    this.pendingCustomer.set(null);
  }
}
