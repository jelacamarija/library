import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanService, LoanResponseDto } from '../../../core/services/loan.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">

      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Moja iznajmljivanja</h2>
        <span class="text-sm text-gray-500" *ngIf="items">
          Ukupno: {{ items.length }}
        </span>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-gray-600">
        Učitavanje...
      </div>

      <!-- Error -->
      <div
        *ngIf="error"
        class="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700"
      >
        Ne mogu da učitam iznajmljivanja. Pokušaj ponovo.
      </div>

      <!-- Empty -->
      <div
        *ngIf="!loading && !error && items.length === 0"
        class="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700"
      >
        Trenutno nemaš iznajmljivanja.
      </div>

      <!-- Table -->
      <div
        *ngIf="!loading && !error && items.length"
        class="bg-white border rounded-lg overflow-auto"
      >
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-left">
              <th class="p-3">Naslov</th>
              <th class="p-3">Autor</th>
              <th class="p-3">Datum iznajmljivanja</th>
              <th class="p-3">Rok vraćanja</th>
              <th class="p-3">Status</th>
              <th class="p-3">Vraćeno</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let l of items" class="border-t">
              <td class="p-3 font-medium text-gray-900">
                {{ l.bookTitle || '—' }}
              </td>

              <td class="p-3 text-gray-700">
                {{ l.bookAuthor || '—' }}
              </td>

              <td class="p-3 text-gray-700">
                {{ formatDate(l.loanedAt) }}
              </td>

              <td class="p-3 text-gray-700">
                <!-- Rok vraćanja prikazujemo samo ako je ACTIVE -->
                <span *ngIf="isActive(l) || isExpired(l); else dash">
                  {{ formatDate(l.dueDate) }}
                </span>
                <ng-template #dash>—</ng-template>
              </td>

              <td class="p-3">
                <span [class]="statusBadgeClass(l.status)">
                  {{ statusLabel(l.status) }}
                </span>
              </td>

              <td class="p-3 text-gray-700">
                <!-- Ako je RETURNED, pokaži datum vraćanja (ako ga ima), inače — -->
                <span *ngIf="isReturned(l); else notReturned">
                  {{ formatDate(l.returnedAt) }}
                </span>
                <ng-template #notReturned>—</ng-template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `,
})
export class ClientProfileLoansComponent implements OnInit {
  private service = inject(LoanService);
  private cd = inject(ChangeDetectorRef);

  items: LoanResponseDto[] = [];
  loading = true;
  error = false;

  ngOnInit(): void {
    this.service.getMyLoans().subscribe({
      next: (res) => {
        this.items = (res ?? []).slice();

        this.items = this.items.filter((l) =>
          ['ACTIVE', 'RETURNED', 'EXPIRED'].includes((l.status || '').toUpperCase())
        );

        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  isActive(l: LoanResponseDto): boolean {
    return (l.status || '').toUpperCase() === 'ACTIVE';
  }

  isReturned(l: LoanResponseDto): boolean {
    return (l.status || '').toUpperCase() === 'RETURNED';
  }

  isExpired(l: LoanResponseDto): boolean {
    return (l.status || '').toUpperCase() === 'EXPIRED';
  }

  formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}.${month}.${year}`;
}


  statusLabel(status?: string | null): string {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE') return 'Aktivno';
    if (s === 'RETURNED') return 'Vraćeno';
    if (s === 'EXPIRED') return 'Isteklo';
    return status || '—';
  }

  statusBadgeClass(status?: string | null): string {
    const s = (status || '').toUpperCase();
    const base =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border';

    if (s === 'ACTIVE')
      return `${base} bg-blue-50 text-blue-700 border-blue-200`;

    if (s === 'RETURNED')
      return `${base} bg-green-50 text-green-700 border-green-200`;

    if (s === 'EXPIRED')
      return `${base} bg-orange-50 text-red-700 border-red-200`;

    return `${base} bg-gray-50 text-gray-700 border-gray-200`;
  }
}
