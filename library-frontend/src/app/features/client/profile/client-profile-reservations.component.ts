import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReservationService,
  ReservationResponseDto,
} from '../../../core/services/reservation.service';

type StatusFilter = 'ALL' | 'PENDING' | 'FULFILLED' | 'CANCELED' | 'EXPIRED';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold">Moje rezervacije</h2>
          <span class="text-sm text-gray-500" *ngIf="!loading && !error">
            Prikazano: {{ filteredItems.length }} / Ukupno: {{ items.length }}
          </span>
        </div>

        <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
          <!-- SEARCH -->
          <div class="relative">
            <input
              type="text"
              class="w-full sm:w-72 border rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Pretraži po naslovu ili piscu..."
              [value]="query"
              (input)="onQuery(($any($event.target).value))"
            />
            <button
              *ngIf="query"
              (click)="clearQuery()"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Obriši"
              title="Obriši"
            >
              ✕
            </button>
          </div>

          <!-- FILTER -->
          <select
            class="border rounded-xl px-3 py-2 bg-white"
            [value]="statusFilter"
            (change)="onFilter(($any($event.target).value))"
          >
            <option value="ALL">Sve</option>
            <option value="PENDING">Na čekanju</option>
            <option value="FULFILLED">Preuzete</option>
            <option value="CANCELED">Otkazane</option>
            <option value="EXPIRED">Istekle</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-gray-600">Učitavanje...</div>

      <!-- Error -->
      <div
        *ngIf="error"
        class="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-700"
      >
        Ne mogu da učitam rezervacije. Pokušaj ponovo.
      </div>

      <!-- Empty -->
      <div
        *ngIf="!loading && !error && filteredItems.length === 0"
        class="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700"
      >
        Nema rezultata za izabrani filter/pretragu.
      </div>

      <!-- Table -->
      <div
        *ngIf="!loading && !error && filteredItems.length"
        class="bg-white border rounded-lg overflow-auto"
      >
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr class="text-left">
              <th class="p-3">Naslov</th>
              <th class="p-3">Pisac</th>
              <th class="p-3">Rezervisano</th>
              <th class="p-3">Rok</th>
              <th class="p-3">Status</th>
              <th class="p-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let r of filteredItems" class="border-t">
              <td class="p-3 font-medium text-gray-900">
                {{ r.bookTitle || '—' }}
              </td>

              <td class="p-3 text-gray-700">
                {{ r.bookAuthor || '—' }}
              </td>

              <td class="p-3 text-gray-700">
                {{ formatDate(r.reservedAt) }}
              </td>

              <td class="p-3 text-gray-700">
                {{ formatDate(r.expiresAt) }}
              </td>

              <td class="p-3">
                <span [class]="statusBadgeClass(r.status)">
                  {{ statusLabel(r.status) }}
                </span>
              </td>

              <td class="p-3 text-right">
             <button
  *ngIf="canCancel(r)"
  (click)="openCancelConfirm(r)"
  class="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-sm
         hover:bg-red-50 hover:border-red-400 transition"
>
  Otkaži
</button>

                <span *ngIf="!canCancel(r)" class="text-gray-400 text-sm">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- CONFIRM CANCEL MODAL -->
      <div
        *ngIf="confirmOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      >
        <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Da li ste sigurni?
          </h3>

          <div class="text-sm text-gray-700 space-y-1">
            <p>
              Želite da otkažete rezervaciju za knjigu
              <span class="font-semibold">{{ selectedReservation?.bookTitle }}</span>?
            </p>
          </div>

          <div class="mt-8 flex justify-end gap-3">
            <button
              (click)="closeConfirm()"
              class="px-6 py-2 rounded-xl border text-sm hover:bg-gray-50 disabled:opacity-50"
              [disabled]="cancelLoading"
            >
              Ne
            </button>

            <button
              (click)="confirmCancel()"
              class="px-6 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              [disabled]="cancelLoading"
            >
              {{ cancelLoading ? 'Otkazujem...' : 'Da, otkaži' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ClientProfileReservationsComponent implements OnInit {
  private service = inject(ReservationService);
  private cd = inject(ChangeDetectorRef);

  items: ReservationResponseDto[] = [];
  loading = true;
  error = false;

  query = '';
  statusFilter: StatusFilter = 'ALL';

  confirmOpen = false;
  selectedReservation: ReservationResponseDto | null = null;
  cancelLoading = false;

  ngOnInit(): void {
    this.service.getMyReservations().subscribe({
      next: (res) => {
        this.items = (res ?? []);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  get filteredItems(): ReservationResponseDto[] {
    const q = this.query.trim().toLowerCase();
    const f = this.statusFilter;

    return this.items
      .filter(r => {
        const status = (r.status || '').toUpperCase();
        if (f === 'ALL') return true;
        return status === f;
      })
      .filter(r => {
        if (!q) return true;
        const title = (r.bookTitle || '').toLowerCase();
        const author = (r.bookAuthor || '').toLowerCase();
        return title.includes(q) || author.includes(q);
      });
  }

  onQuery(v: string): void {
    this.query = v ?? '';
  }

  clearQuery(): void {
    this.query = '';
  }

  onFilter(v: string): void {
    const up = (v || 'ALL').toUpperCase();
    this.statusFilter = (['ALL','PENDING','FULFILLED','CANCELED','EXPIRED'] as const).includes(up as any)
      ? (up as StatusFilter)
      : 'ALL';
  }

  canCancel(r: ReservationResponseDto): boolean {
    const s = (r.status || '').toUpperCase();
    if (s !== 'PENDING') return false;
    if (!r.expiresAt) return true;
    const d = new Date(r.expiresAt);
    return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
  }

  openCancelConfirm(r: ReservationResponseDto): void {
    this.selectedReservation = r;
    this.confirmOpen = true;
  }

  closeConfirm(): void {
    this.confirmOpen = false;
    this.selectedReservation = null;
    this.cancelLoading = false;
  }

  confirmCancel(): void {
    if (!this.selectedReservation) return;

    this.cancelLoading = true;

    this.service.cancelReservation(this.selectedReservation.reservationID).subscribe({
      next: (updated) => {
        const id = updated.reservationID;
        this.items = this.items.map(x => x.reservationID === id ? updated : x);

        this.closeConfirm();
        this.cd.detectChanges();
      },
      error: () => {
        this.cancelLoading = false;
        alert('Ne mogu da otkažem rezervaciju. Pokušaj ponovo.');
      },
    });
  }

  formatDate(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }

  statusLabel(status?: string | null): string {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') return 'Na čekanju';
    if (s === 'FULFILLED') return 'Preuzeto';
    if (s === 'EXPIRED') return 'Istekla';
    if (s === 'CANCELED') return 'Otkazana';
    return status || '—';
  }

  statusBadgeClass(status?: string | null): string {
    const s = (status || '').toUpperCase();
    const base =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border';

    if (s === 'FULFILLED')
      return `${base} bg-green-50 text-green-700 border-green-200`;
    if (s === 'PENDING')
      return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
    if (s === 'EXPIRED')
      return `${base} bg-gray-100 text-gray-700 border-gray-200`;
    if (s === 'CANCELED')
      return `${base} bg-red-50 text-red-700 border-red-200`;

    return `${base} bg-gray-50 text-gray-700 border-gray-200`;
  }
}
