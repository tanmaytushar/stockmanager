import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { SearchIndexService } from '../../core/search/search-index.service';
import { ThemeService } from '../../core/theme.service';
import { CommandPaletteComponent } from './command-palette.component';

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        provideRouter([]),
        { provide: SearchIndexService, useValue: { load: () => of({ customers: [], stocks: [], transactions: [], portfolios: [], partiallyUnavailable: false }) } },
        { provide: ApiService, useValue: { chatWithAssistant: () => of({ reply: 'Answer', tradeProposal: null }) } },
        { provide: ThemeService, useValue: { toggle: () => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CommandPaletteComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('opens with Ctrl + K', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('opens AI mode with Ctrl + Shift + K', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, shiftKey: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ask StockPilot');
  });
});
