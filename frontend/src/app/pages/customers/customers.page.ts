import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import { WorkspaceRefreshService } from '../../core/workspace-refresh.service';
import { Customer, CustomerInput } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'app-customers-page',
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './customers.page.html',
  styleUrl: './customers.page.css',
})
export class CustomersPage {
  private readonly api = inject(ApiService);
  private readonly workspaceRefresh = inject(WorkspaceRefreshService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly pageSize = 8;

  protected readonly customers = signal<Customer[]>([]);
  protected readonly query = signal(this.route.snapshot.queryParamMap.get('query') ?? '');
  protected readonly page = signal(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly editingId = signal<number | null>(null);

  protected readonly customerForm = this.fb.nonNullable.group({
    customerName: ['', [Validators.required, Validators.maxLength(100)]],
    emailAddress: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
  });

  protected readonly filteredCustomers = computed(() => {
    const needle = this.query().trim().toLowerCase();
    if (!needle) return this.customers();
    return this.customers().filter((customer) =>
      customer.customerName.toLowerCase().includes(needle)
      || customer.emailAddress.toLowerCase().includes(needle)
      || String(customer.customerId).includes(needle),
    );
  });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredCustomers().length / this.pageSize)));
  protected readonly pageItems = computed(() => {
    const safePage = Math.min(this.page(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.filteredCustomers().slice(start, start + this.pageSize);
  });
  protected readonly firstItem = computed(() => this.filteredCustomers().length ? (Math.min(this.page(), this.totalPages()) - 1) * this.pageSize + 1 : 0);
  protected readonly lastItem = computed(() => Math.min(this.firstItem() + this.pageSize - 1, this.filteredCustomers().length));

  constructor() {
    this.loadCustomers();
    this.workspaceRefresh.updates$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadCustomers());
    if (this.route.snapshot.queryParamMap.get('create') === '1') setTimeout(() => this.openCreate());
  }

  protected loadCustomers(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getCustomers().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (customers) => this.customers.set(customers),
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected updateQuery(value: string): void { this.query.set(value); this.page.set(1); }

  protected openCreate(): void {
    this.editingId.set(null);
    this.customerForm.reset({ customerName: '', emailAddress: '' });
    this.modalOpen.set(true);
  }

  protected openEdit(customer: Customer): void {
    this.editingId.set(customer.customerId);
    this.customerForm.reset({ customerName: customer.customerName, emailAddress: customer.emailAddress });
    this.modalOpen.set(true);
  }

  protected closeModal(): void { if (!this.saving()) this.modalOpen.set(false); }

  protected saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }
    const raw = this.customerForm.getRawValue();
    const customer: CustomerInput = { customerName: raw.customerName.trim(), emailAddress: raw.emailAddress.trim().toLowerCase() };
    const editing = this.editingId();
    const request = editing !== null ? this.api.updateCustomer(editing, customer) : this.api.createCustomer(customer);

    this.saving.set(true);
    this.error.set('');
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.customers.update((items) => editing !== null
          ? items.map((item) => item.customerId === editing ? saved : item)
          : [...items, saved],
        );
        this.modalOpen.set(false);
        this.showSuccess(editing !== null ? `${saved.customerName} was updated.` : `${saved.customerName} was registered.`);
      },
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected deleteCustomer(customer: Customer): void {
    if (!window.confirm(`Delete ${customer.customerName}? Their portfolio and transaction history may prevent deletion.`)) return;
    this.deletingId.set(customer.customerId);
    this.error.set('');
    this.api.deleteCustomer(customer.customerId).pipe(finalize(() => this.deletingId.set(null))).subscribe({
      next: () => {
        this.customers.update((items) => items.filter((item) => item.customerId !== customer.customerId));
        this.page.set(Math.min(this.page(), this.totalPages()));
        this.showSuccess(`${customer.customerName} was deleted.`);
      },
      error: (error: Error) => this.error.set(error.message),
    });
  }

  protected initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }
  protected previousPage(): void { this.page.update((value) => Math.max(1, value - 1)); }
  protected nextPage(): void { this.page.update((value) => Math.min(this.totalPages(), value + 1)); }
  private showSuccess(message: string): void { this.success.set(message); window.setTimeout(() => this.success.set(''), 3200); }
}
