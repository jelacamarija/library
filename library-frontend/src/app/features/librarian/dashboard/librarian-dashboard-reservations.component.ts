import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LibrarianReservationsService, ReservationRow } from '../../../core/services/librarian-reservations.service';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
  <div class="mx-auto max-w-7xl px-4 py-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold">Rezervacije</h1>
        <p class="text-sm text-gray-600">Pregled svih rezervacija korisnika.</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          (click)="reload()"
          class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
          [disabled]="loading()"
        >
          Osvježi
        </button>

        <select
          class="px-3 py-2 rounded-xl border border-gray-300 bg-white"
          [value]="size()"
          (change)="onSizeChange($any($event.target).value)"
        >
          <option [value]="5">5</option>
          <option [value]="10">10</option>
          <option [value]="20">20</option>
          <option [value]="50">50</option>
        </select>
      </div>
    </div>

    <!-- SEARCH -->
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
            type="text"
            class="w-full sm:flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            [value]="query()"
            (input)="onQueryChange($any($event.target).value)"
            placeholder="Pretraži po broju članske karte (npr. LIB000123)"
        />
        <button
            *ngIf="query()"
            class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
            (click)="clearQuery()"
        >
            Obriši
        </button>
        </div>

    <!-- ERROR -->
    <div *ngIf="error()" class="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
      {{ error() }}
    </div>

    <!-- TABLE -->
    <div class="bg-white border rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-gray-700">
            <tr>
              <th class="text-left font-semibold px-4 py-3">Korisnik</th>
              <th class="text-left font-semibold px-4 py-3">Broj članske karte</th>
              <th class="text-left font-semibold px-4 py-3">Naslov</th>
              <th class="text-left font-semibold px-4 py-3">Autor</th>

              <th class="text-left font-semibold px-4 py-3">
                <button class="hover:underline" (click)="toggleSort('reservedAt')">
                  Datum rezervacije
                  <span class="ml-1 text-xs text-gray-500" *ngIf="sortField()==='reservedAt'">
                    {{ sortDir()==='desc' ? '↓' : '↑' }}
                  </span>
                </button>
              </th>

              <th class="text-left font-semibold px-4 py-3">
                <button class="hover:underline" (click)="toggleSort('expiresAt')">
                  Rok podizanja
                  <span class="ml-1 text-xs text-gray-500" *ngIf="sortField()==='expiresAt'">
                    {{ sortDir()==='desc' ? '↓' : '↑' }}
                  </span>
                </button>
              </th>

              <th class="text-left font-semibold px-4 py-3">Status</th>
              <th class="text-right font-semibold px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            <!-- LOADING -->
            <tr *ngIf="loading()">
              <td colspan="7" class="px-4 py-6 text-gray-600">Učitavanje...</td>
            </tr>

            <!-- EMPTY -->
            <tr *ngIf="!loading() && rows().length === 0">
              <td colspan="7" class="px-4 py-6 text-gray-600">Nema rezervacija.</td>
            </tr>

            <!-- ROWS -->
            <tr *ngFor="let r of rows()" class="border-t">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ r.userName}}</div>
                
              </td>

              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ r.membershipNumber }}</div>
                
              </td>

              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ r.bookTitle }}</div>
                
              </td>

              <td class="px-4 py-3 text-gray-800">{{ r.bookAuthor }}</td>

              <td class="px-4 py-3 text-gray-800">
                {{ r.reservedAt | date:'dd.MM.yyyy' }}
              </td>

              <td class="px-4 py-3 text-gray-800">
                <span *ngIf="r.expiresAt; else noDeadline">
                  {{ r.expiresAt | date:'dd.MM.yyyy' }}
                </span>
                <ng-template #noDeadline>—</ng-template>
              </td>

              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                  [ngClass]="statusClass(r.status)"
                >
                  {{ r.status }}
                </span>

              
              </td>

              <td class="px-4 py-3 text-right">
                <button
                class="px-3 py-2 rounded-xl text-white disabled:opacity-50"
                [ngClass]="canActivate(r) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'"
                [disabled]="!canActivate(r) || actionLoadingId()===r.reservationID"
                (click)="openActivateModal(r)"
              >
                <span *ngIf="actionLoadingId()===r.reservationID">Aktiviram...</span>
                <span *ngIf="actionLoadingId()!==r.reservationID">Aktiviraj</span>
              </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- FOOTER PAGINATION -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t bg-gray-50">
        <div class="text-sm text-gray-600">
          Ukupno: <span class="font-medium text-gray-900">{{ totalElements() }}</span>
          • Stranica <span class="font-medium text-gray-900">{{ page()+1 }}</span> / {{ totalPages() }}
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-white disabled:opacity-50"
            (click)="prevPage()"
            [disabled]="loading() || page()===0"
          >
            Prethodna
          </button>
          <button
            class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-white disabled:opacity-50"
            (click)="nextPage()"
            [disabled]="loading() || page()+1>=totalPages()"
          >
            Sledeća
          </button>
        </div>
      </div>
    </div>

    <!-- ACTIVATE MODAL -->
    <div *ngIf="activateModalOpen()" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" (click)="closeActivateModal()"></div>

      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-lg border">
          <div class="p-5 border-b">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold">Aktiviraj rezervaciju</h2>
                
              </div>
              <button class="text-gray-500 hover:text-gray-800" (click)="closeActivateModal()">✕</button>
            </div>
          </div>

          <div class="p-5">
            <div class="text-sm text-gray-700 space-y-1 mb-4" *ngIf="selected() as s">
              <div><span class="text-gray-500">Korisnik:</span> <span class="font-medium">{{ s.userName }}</span></div>
              <div><span class="text-gray-500">Knjiga:</span> <span class="font-medium">{{ s.bookTitle }}</span></div>
              <div><span class="text-gray-500">Autor:</span> <span class="font-medium">{{ s.bookAuthor }}</span></div>
            </div>

            <div class="space-y-3">
              <p class="text-sm text-gray-700">
                Aktivacijom se rezervacija označava kao <span class="font-medium">FULFILLED</span> i automatski se kreira iznajmljivanje
                sa rokom vraćanja <span class="font-medium">30 dana</span> od dana preuzimanja.
              </p>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                  (click)="closeActivateModal()"
                  [disabled]="actionLoadingId()!==null"
                >
                  Otkaži
                </button>

                <button
                  type="button"
                  class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                  (click)="confirmActivate()"
                  [disabled]="actionLoadingId()!==null"
                >
                  <span *ngIf="actionLoadingId()!==null">Aktiviram...</span>
                  <span *ngIf="actionLoadingId()===null">Potvrdi aktivaciju</span>
                </button>
              </div>

              <div
                *ngIf="modalError()"
                class="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm"
              >
                {{ modalError() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
  `,
})
export class LibrarianDashboardReservationsComponent {
  private api = inject(LibrarianReservationsService);
  private fb = inject(FormBuilder);

  rows = signal<ReservationRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);

  query = signal('');
  private debounceTimer: any = null;

  sortField = signal<'reservedAt' | 'expiresAt'>('reservedAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  totalElements = signal(0);
  totalPages = signal(1);

  // activate modal
  activateModalOpen = signal(false);
  selected = signal<ReservationRow | null>(null);
  actionLoadingId = signal<number | null>(null);
  modalError = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.fetch();
    });
  }

  private sortParam = computed(() => `${this.sortField()},${this.sortDir()}`);

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    const q = this.query().trim();
    const obs = q
      ? this.api.searchByMembership(q, this.page(), this.size(), this.sortParam())
      : this.api.getAll(this.page(), this.size(), this.sortParam());

    obs.subscribe({
      next: (res) => {
        this.rows.set(res.content ?? []);
        this.totalElements.set(res.totalElements ?? 0);
        this.totalPages.set(Math.max(1, res.totalPages ?? 1));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Greška pri učitavanju rezervacija.');
      },
    });
  }

  reload(): void {
    this.fetch();
  }

  onSizeChange(value: string): void {
    const next = Number(value);
    this.size.set(Number.isFinite(next) && next > 0 ? next : 10);
    this.page.set(0);
  }

    onQueryChange(value: string): void {
        this.query.set(value);
        this.page.set(0);

        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.fetch(), 300);
    }

  clearQuery(): void {
    this.query.set('');
    this.page.set(0);
    this.fetch();
  }

  prevPage(): void {
    this.page.set(Math.max(0, this.page() - 1));
  }

  nextPage(): void {
    this.page.set(Math.min(this.totalPages() - 1, this.page() + 1));
  }

  toggleSort(field: 'reservedAt' | 'expiresAt'): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
    this.page.set(0);
  }

  canActivate(r: ReservationRow): boolean {
    return (r.status || '').toUpperCase() === 'PENDING';
  }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') return 'border-yellow-300 bg-yellow-50 text-yellow-800';
    if (s === 'FULFILLED') return 'border-green-300 bg-green-50 text-green-800';
    if (s === 'EXPIRED') return 'border-gray-300 bg-gray-50 text-gray-700';
    if (s === 'CANCELED' || s === 'CANCELLED') return 'border-red-300 bg-red-50 text-red-700';
    return 'border-gray-300 bg-white text-gray-700';
  }

  openActivateModal(r: ReservationRow): void {
    this.modalError.set(null);
    this.selected.set(r);
    this.activateModalOpen.set(true);
  }

  closeActivateModal(): void {
    if (this.actionLoadingId() !== null) return;
    this.activateModalOpen.set(false);
    this.selected.set(null);
    this.modalError.set(null);
  }

  confirmActivate(): void {
    this.modalError.set(null);
    const s = this.selected();
    if (!s) return;

    this.actionLoadingId.set(s.reservationID);

    this.api.activate({ reservationID: s.reservationID }).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.activateModalOpen.set(false);
        this.selected.set(null);
        this.fetch();
      },
      error: (err) => {
        this.actionLoadingId.set(null);
        this.modalError.set(err?.error?.message ?? 'Neuspešna aktivacija rezervacije.');
      },
    });
  }
}
