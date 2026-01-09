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
        <p class="text-sm text-gray-600">Pregled svih rezervacija korisnika (svi statusi).</p>
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
                <div class="font-medium text-gray-900">{{ r.userName || ('User #' + r.userID) }}</div>
                
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

            <form [formGroup]="activateForm" class="space-y-3" (ngSubmit)="confirmActivate()">
              <div>
                <label class="block text-sm text-gray-700 mb-1">Broj dana iznajmljivanja</label>
                <input
                  type="number"
                  min="1"
                  class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  formControlName="days"
                />
                <div *ngIf="activateForm.controls.days.touched && activateForm.controls.days.invalid"
                     class="text-xs text-red-600 mt-1">
                  Unesi broj dana (min 1).
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button"
                        class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                        (click)="closeActivateModal()">
                  Otkaži
                </button>

                <button type="submit"
                        class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        [disabled]="activateForm.invalid || actionLoadingId()!==null">
                  Potvrdi aktivaciju
                </button>
              </div>

              <div *ngIf="modalError()" class="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                {{ modalError() }}
              </div>
            </form>
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

  // state
  rows = signal<ReservationRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);

  sortField = signal<'reservedAt' | 'expiresAt'>('reservedAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  totalElements = signal(0);
  totalPages = signal(1);

  // activate modal
  activateModalOpen = signal(false);
  selected = signal<ReservationRow | null>(null);
  actionLoadingId = signal<number | null>(null);
  modalError = signal<string | null>(null);

  activateForm = this.fb.nonNullable.group({
    days: [14, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      // auto-load on init and on paging/sorting changes
      this.fetch();
    });
  }

  private sortParam = computed(() => `${this.sortField()},${this.sortDir()}`);

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.getAll(this.page(), this.size(), this.sortParam()).subscribe({
      next: (res) => {
        this.rows.set(res.content ?? []);
        this.totalElements.set(res.totalElements ?? 0);
        this.totalPages.set(Math.max(1, res.totalPages ?? 1));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Greška pri učitavanju rezervacija.');
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
    if (s === 'ACTIVE') return 'border-green-300 bg-green-50 text-green-800';
    if (s === 'EXPIRED') return 'border-gray-300 bg-gray-50 text-gray-700';
    if (s === 'CANCELED' || s === 'CANCELLED') return 'border-red-300 bg-red-50 text-red-700';
    return 'border-gray-300 bg-white text-gray-700';
  }

  openActivateModal(r: ReservationRow): void {
    this.modalError.set(null);
    this.selected.set(r);
    this.activateForm.patchValue({ days: 14 });
    this.activateModalOpen.set(true);
  }

  closeActivateModal(): void {
    if (this.actionLoadingId() !== null) return; // ne zatvaraj dok traje akcija
    this.activateModalOpen.set(false);
    this.selected.set(null);
    this.modalError.set(null);
  }

  confirmActivate(): void {
    this.modalError.set(null);
    const s = this.selected();
    if (!s) return;

    if (this.activateForm.invalid) {
      this.activateForm.markAllAsTouched();
      return;
    }

    const days = this.activateForm.getRawValue().days;

    this.actionLoadingId.set(s.reservationID);

    this.api.activate({ reservationID: s.reservationID, days }).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.activateModalOpen.set(false);
        this.selected.set(null);
        this.fetch(); // refresh lista da pokaže ACTIVE + loanID
      },
      error: (err) => {
        this.actionLoadingId.set(null);
        this.modalError.set(err?.error?.message ?? 'Neuspješna aktivacija rezervacije.');
      },
    });
  }
}
