import { Component, DestroyRef, ElementRef, HostListener, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ThemeService } from '../../core/theme.service';
import { CommandRegistryService } from '../../core/search/command-registry.service';
import { GlobalSearchService } from '../../core/search/global-search.service';
import { SearchIndexService } from '../../core/search/search-index.service';
import { SearchAction, SearchGroup, SearchIndex, SearchResult } from '../../core/search/search.models';
import { IconComponent } from '../icon.component';

const EMPTY_INDEX: SearchIndex = { customers: [], stocks: [], transactions: [], portfolios: [], partiallyUnavailable: false };
const CATEGORY_ORDER: SearchGroup['category'][] = ['navigation', 'actions', 'customers', 'stocks', 'portfolios', 'transactions', 'ai'];
const CATEGORY_LABELS: Record<SearchGroup['category'], string> = {
  navigation: 'Navigation', actions: 'Quick actions', customers: 'Customers', stocks: 'Stocks',
  portfolios: 'Portfolios', transactions: 'Transactions', ai: 'AI suggestions',
};

@Component({
  selector: 'app-command-palette',
  imports: [IconComponent],
  templateUrl: './command-palette.component.html',
})
export class CommandPaletteComponent {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly theme = inject(ThemeService);
  private readonly registry = inject(CommandRegistryService);
  private readonly indexService = inject(SearchIndexService);
  private readonly searchService = inject(GlobalSearchService);
  private readonly queryChanges = new Subject<string>();

  protected readonly open = signal(false);
  protected readonly aiMode = signal(false);
  protected readonly query = signal('');
  protected readonly loading = signal(false);
  protected readonly aiLoading = signal(false);
  protected readonly warning = signal('');
  protected readonly aiAnswer = signal('');
  protected readonly index = signal<SearchIndex>(EMPTY_INDEX);
  protected readonly results = signal<SearchResult[]>([]);
  protected readonly selectedIndex = signal(0);
  protected readonly recent = signal<SearchResult[]>(this.readStored('stockpilot-recent'));
  protected readonly pinned = signal<SearchResult[]>(this.readStored('stockpilot-pinned'));
  protected readonly shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

  protected readonly sections = computed(() => {
    if (!this.query().trim()) {
      const contextual = this.registry.contextual(this.router.url);
      return [
        { label: 'Pinned', results: this.pinned() },
        { label: 'Recent', results: this.recent() },
        { label: 'Suggested here', results: contextual },
        { label: 'Quick actions', results: this.registry.commands.filter((item) => item.category === 'actions').slice(0, 5) },
      ].filter((section) => section.results.length);
    }
    return CATEGORY_ORDER.map((category) => ({
      label: CATEGORY_LABELS[category],
      results: this.results().filter((result) => result.category === category),
    })).filter((group) => group.results.length);
  });

  protected readonly flatResults = computed(() => this.sections().flatMap((section) => section.results));
  protected readonly selected = computed(() => this.flatResults()[this.selectedIndex()] ?? null);

  constructor() {
    this.queryChanges.pipe(debounceTime(280), takeUntilDestroyed()).subscribe(() => this.runSearch());
  }

  @HostListener('document:keydown', ['$event'])
  protected handleGlobalKey(event: KeyboardEvent): void {
    const target = event.target;
    const editing = target instanceof Element && target.matches('input, textarea, select, [contenteditable="true"]');
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openPalette(event.shiftKey);
    } else if (event.key === '/' && !editing && !this.open()) {
      event.preventDefault();
      this.openPalette(false);
    } else if (event.altKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      void this.router.navigateByUrl('/dashboard');
    } else if (event.altKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      void this.router.navigateByUrl('/trade');
    } else if (event.key === 'Escape' && this.open()) {
      this.closePalette();
    }
  }

  protected openPalette(aiMode = false): void {
    this.open.set(true);
    this.aiMode.set(aiMode);
    this.query.set('');
    this.results.set([]);
    this.aiAnswer.set('');
    this.selectedIndex.set(0);
    this.loadIndex(false);
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  protected closePalette(): void {
    this.open.set(false);
    this.aiLoading.set(false);
  }

  protected updateQuery(value: string): void {
    this.query.set(value);
    this.aiAnswer.set('');
    this.selectedIndex.set(0);
    this.queryChanges.next(value);
  }

  protected handleSearchKey(event: KeyboardEvent): void {
    const count = this.flatResults().length;
    if (event.key === 'ArrowDown' && count) {
      event.preventDefault();
      this.selectedIndex.update((index) => (index + 1) % count);
    } else if (event.key === 'ArrowUp' && count) {
      event.preventDefault();
      this.selectedIndex.update((index) => (index - 1 + count) % count);
    } else if (event.key === 'Enter' && count) {
      event.preventDefault();
      if ((event.ctrlKey || event.metaKey) && this.aiMode()) this.askAssistant(this.query());
      else void this.execute(this.flatResults()[this.selectedIndex()]);
    }
  }

  protected selectResult(result: SearchResult): void {
    this.selectedIndex.set(this.flatResults().findIndex((item) => item.id === result.id));
  }

  protected async execute(result: SearchResult): Promise<void> {
    if (result.action === 'toggle-theme') {
      this.theme.toggle();
      return;
    }
    if (result.action === 'refresh-index') {
      this.loadIndex(true);
      return;
    }
    if (result.action === 'ask-ai') {
      const question = this.query().trim();
      if (question) this.askAssistant(question);
      else {
        this.aiMode.set(true);
        setTimeout(() => this.searchInput?.nativeElement.focus());
      }
      return;
    }
    if (result.route) {
      this.remember(result);
      this.closePalette();
      await this.navigate(result.route, result.queryParams);
    }
  }

  protected async executeAction(action: SearchAction): Promise<void> {
    if (action.action === 'toggle-theme') this.theme.toggle();
    else if (action.action === 'refresh-index') this.loadIndex(true);
    else if (action.action === 'ask-ai') this.askAssistant(this.query());
    else if (action.route) {
      this.closePalette();
      await this.navigate(action.route, action.queryParams);
    }
  }

  protected togglePin(result: SearchResult): void {
    const exists = this.isPinned(result);
    const next = exists ? this.pinned().filter((item) => item.id !== result.id) : [result, ...this.pinned()].slice(0, 8);
    this.pinned.set(next);
    localStorage.setItem('stockpilot-pinned', JSON.stringify(next));
  }

  protected isPinned(result: SearchResult): boolean {
    return this.pinned().some((item) => item.id === result.id);
  }

  protected retry(): void {
    this.loadIndex(true);
  }

  private loadIndex(force: boolean): void {
    this.loading.set(true);
    this.warning.set('');
    this.indexService.load(force).subscribe({
      next: (index) => {
        this.index.set(index);
        if (index.partiallyUnavailable) this.warning.set('Some live records are unavailable. Navigation and commands still work.');
        this.runSearch();
      },
      error: () => this.warning.set('Live search is temporarily unavailable. Navigation and commands still work.'),
      complete: () => this.loading.set(false),
    });
  }

  private runSearch(): void {
    const text = this.query().trim();
    if (!text) {
      this.results.set([]);
      return;
    }
    if (this.aiMode()) {
      this.results.set([{
        id: `ai-${text.toLowerCase()}`, category: 'ai', title: `Ask: “${text}”`,
        subtitle: 'Analyze current workspace data with Stock Assistant', icon: 'database', score: 1, action: 'ask-ai',
      }]);
      return;
    }
    this.results.set(this.searchService.search(text, this.index(), this.registry.commands));
  }

  private askAssistant(question: string): void {
    if (!question.trim() || this.aiLoading()) return;
    this.aiMode.set(true);
    this.aiLoading.set(true);
    this.aiAnswer.set('');
    this.api.chatWithAssistant(question.trim()).subscribe({
      next: ({ reply, tradeProposal }) => {
        const proposalNote = tradeProposal
          ? `\n\nA ${tradeProposal.type} order can be prepared safely in Trade; no order has been submitted.`
          : '';
        this.aiAnswer.set(this.cleanAssistantText(reply) + proposalNote);
      },
      error: (error: Error) => {
        this.aiAnswer.set(error.message);
        this.aiLoading.set(false);
      },
      complete: () => this.aiLoading.set(false),
    });
  }

  private async navigate(route: string, queryParams?: Record<string, string | number>): Promise<void> {
    if (queryParams) await this.router.navigate([route], { queryParams });
    else await this.router.navigateByUrl(route);
  }

  private remember(result: SearchResult): void {
    const next = [result, ...this.recent().filter((item) => item.id !== result.id)].slice(0, 6);
    this.recent.set(next);
    localStorage.setItem('stockpilot-recent', JSON.stringify(next));
  }

  private readStored(key: string): SearchResult[] {
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? '[]');
      return Array.isArray(value) ? value.slice(0, 8) : [];
    } catch {
      return [];
    }
  }

  private cleanAssistantText(text: string): string {
    return text.replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
  }
}
