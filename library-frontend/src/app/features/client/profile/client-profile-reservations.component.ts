import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReservationService,
  ReservationResponseDto,
} from '../../../core/services/reservation.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">

      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Moje rezervacije</h2>
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
        Ne mogu da učitam rezervacije. Pokušaj ponovo.
      </div>

      <!-- Empty -->
      <div
        *ngIf="!loading && !error && items.length === 0"
        class="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700"
      >
        Trenutno nemaš rezervacija.
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
              <th class="p-3">Pisac</th>
              <th class="p-3">Rezervisano</th>
              <th class="p-3">Rok</th>
              <th class="p-3">Status</th>
              <th class="p-3"></th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let r of items" class="border-t">
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
                  (click)="cancel(r)"
                  class="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
                >
                  Otkaži
                </button>
                <span *ngIf="!canCancel(r)" class="text-gray-400 text-sm">—</span>
              </td>
            </tr>
          </tbody>
        </table>
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

  ngOnInit(): void {
    this.service.getMyReservations().subscribe({
      next: (res) => {
        this.items = (res ?? []).filter((r) =>
          ['PENDING', 'ACTIVE'].includes((r.status || '').toUpperCase())
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

  canCancel(r: ReservationResponseDto): boolean {
    return (r.status || '').toUpperCase() === 'PENDING'; 
  }

  cancel(r: ReservationResponseDto): void {
    const ok = window.confirm(
      'Da li si siguran/na da želiš da otkažeš ovu rezervaciju?'
    );
    if (!ok) return;

    this.service.cancelReservation(r.reservationID).subscribe({
      next: () => {
        this.items = this.items.filter((x) => x.reservationID !== r.reservationID);
        this.cd.detectChanges();
      },
      error: () => {
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
    if (s === 'ACTIVE') return 'Aktivna';
    if (s === 'PENDING') return 'Na čekanju';
    if (s === 'EXPIRED') return 'Istekla';
    if (s === 'CANCELED') return 'Otkazana';
    return status || '—';
  }

  statusBadgeClass(status?: string | null): string {
    const s = (status || '').toUpperCase();
    const base =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border';

    if (s === 'ACTIVE')
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
