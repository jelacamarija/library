import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { LibrarianReservationsService, ReservationRow } from '../../../core/services/librarian-reservations.service';
import { BookInstanceService } from '../../../core/services/book-instance.service';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
  <div class="mx-auto max-w-7xl px-4 py-6">

    
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold">Rezervacije</h1>
        <p class="text-sm text-gray-600">Pregled svih rezervacija korisnika</p>
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

    <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="text"
        class="w-full sm:flex-1 border rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        [value]="query()"
        (input)="onQueryChange($any($event.target).value)"
        placeholder="Pretraži po broju članske karte (npr. CL0000123)"
      />

      <button
        *ngIf="query()"
        class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
        (click)="clearQuery()"
      >
        Obriši
      </button>
    </div>

   
    <div *ngIf="error()" class="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
      {{ error() }}
    </div>
    <div class="bg-white border rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50 text-gray-700">
            <tr>
              <th class="px-4 py-3 text-left">Korisnik</th>
              <th class="px-4 py-3 text-left">Knjiga</th>
              <th class="px-4 py-3 text-left">ISBN</th>
              <th class="px-4 py-3 text-left">
                <button type="button" class="hover:underline" (click)="toggleSort('expiresAt')">
                  Datum isteka
                  <span class="ml-1 text-xs text-gray-500" *ngIf="sortField() === 'expiresAt'">
                    {{ sortDir() === 'desc' ? '↓' : '↑' }}
                  </span>
                </button>
              </th>
              <th class="px-4 py-3 text-left">Status</th>
              <th class="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="loading()">
              <td colspan="7" class="px-4 py-6">Učitavanje...</td>
            </tr>
            <tr *ngIf="!loading() && rows().length === 0">
              <td colspan="7" class="px-4 py-6">Nema rezervacija.</td>
            </tr>
            <tr *ngFor="let r of rows()" class="hover:bg-gray-50/60">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">
                  {{ r.userName }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ r.membershipNumber || '—' }}
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="font-semibold text-gray-900">
                  {{ r.bookTitle }}
                </div>
                <div class="text-xs text-gray-500 mt-0.5">
                  {{ r.bookAuthor }}
                </div>
              </td>
              <td class="px-4 py-3">{{ r.isbn || '—' }}</td>
              <td class="px-4 py-3 text-gray-800">
                {{ r.expiresAt ? (r.expiresAt | date:'dd.MM.yyyy') : '—' }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 rounded-full text-xs border"
                  [ngClass]="statusClass(r.status)"
                >
                  {{ statusLabel(r.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right space-x-2">
                <button
                  class="px-3 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                  (click)="openDetailsModal(r)"
                >
                  Detalji
                </button>
                <button
                  class="px-3 py-2 rounded-xl text-white"
                  [ngClass]="canActivate(r) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'"
                  [disabled]="!canActivate(r)"
                  (click)="openActivateModal(r)"
                >
                  Aktiviraj
                </button>
                <button
                  class="px-3 py-2 rounded-xl border"
                  [ngClass]="canChangeInstanceStatus(r) 
                  ? 'hover:bg-gray-50 border-gray-300' 
                  : 'border-gray-200 text-gray-400 shadow-inner'"
                  [disabled]="!canChangeInstanceStatus(r)"
                  (click)="openStatusModal(r)"
                >
                  Status primerka
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

       
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

   
    <div *ngIf="detailsModalOpen()" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" (click)="closeDetailsModal()"></div>

      <div class="relative mx-auto mt-16 w-[92%] max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">

        <div class="px-6 py-4 bg-blue-600 text-white flex justify-between">
          <h2 class="text-xl font-semibold">Detalji rezervacije</h2>
          <button (click)="closeDetailsModal()">✕</button>
        </div>

        <div class="p-6 space-y-3" *ngIf="detailsSelected() as s">

          <div><b>Korisnik:</b> {{ s.userName }}</div>
          <div><b>Članska karta:</b> {{ s.membershipNumber }}</div>
          <div><b>Naslov:</b> {{ s.bookTitle }}</div>
          <div><b>Autor:</b> {{ s.bookAuthor }}</div>
          <div><b>ISBN:</b> {{ s.isbn }}</div>
          <div><b>Inventory:</b> {{ s.inventoryNumber }}</div>
          <div><b>Lokacija:</b> {{ s.location }}</div>
          <div><b>Datum rezervacije:</b> {{ s.reservedAt | date:'dd.MM.yyyy' }}</div>
          <div><b>Datum isteka:</b> {{ s.expiresAt | date:'dd.MM.yyyy' }}</div>

          
          <div>
            <span
              class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border"
              [ngClass]="statusClass(s.status)"
            >
              {{ statusLabel(s.status) }}
            </span>
          </div>

          <!-- AKTIVIRAJ -->
          <div class="pt-4">
            <button
              class="w-full py-3 rounded-xl text-white font-semibold"
              [ngClass]="canActivate(s) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'"
              [disabled]="!canActivate(s)"
              (click)="openActivateModal(s); closeDetailsModal()"
            >
              Aktiviraj rezervaciju
            </button>
          </div>

        </div>
      </div>
    </div>

  </div>

  <div *ngIf="statusModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

    <div class="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">

      <h3 class="text-lg font-semibold mb-4">
        Izmena statusa primjerka
      </h3>

      <p class="text-sm text-gray-600 mb-4">
        Odaberite novi status:
      </p>

      <div class="space-y-3">

        <button
          (click)="confirmStatusChange('DAMAGED')"
          class="w-full px-4 py-2 rounded-xl bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        >
          Označi kao oštećena
        </button>

        <button
          (click)="confirmStatusChange('LOST')"
          class="w-full px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
        >
          Označi kao izgubljena
        </button>

      </div>

      <div class="mt-6 flex justify-end">
        <button
          (click)="closeStatusModal()"
          class="px-4 py-2 border rounded-xl"
        >
          Otkaži
        </button>
      </div>

    </div>
  </div>
  `
})
export class LibrarianDashboardReservationsComponent {

  private api = inject(LibrarianReservationsService);
  private instanceService = inject(BookInstanceService);

  rows = signal<ReservationRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);
  totalElements = signal(0);
  totalPages = signal(1);

  query = signal('');

  detailsModalOpen = signal(false);
  detailsSelected = signal<ReservationRow | null>(null);

  sortField = signal<'reservedAt' | 'expiresAt'>('expiresAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  private sortParam = computed(() => 
    `${this.sortField()},${this.sortDir()}`
  );

  constructor() {
    effect(() => this.fetch());
  }

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
  
  reload() {
    this.fetch();
  }

  onSizeChange(value: string): void {
    const next = Number(value);

    this.size.set(Number.isFinite(next) && next > 0 ? next : 10);
    this.page.set(0);

    this.fetch();
  }

  private debounceTimer: any = null;

  onQueryChange(value: string): void {
    this.query.set(value);
    this.page.set(0);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.fetch();
    }, 300);
  }

  clearQuery() {
    this.query.set('');
  }

  prevPage() {
    this.page.set(Math.max(0, this.page() - 1));
  }

  nextPage() {
    this.page.set(Math.min(this.totalPages() - 1, this.page() + 1));
  }

  toggleSort(field: 'reservedAt' | 'expiresAt') {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
    this.page.set(0);
  }

  openDetailsModal(r: ReservationRow) {
    this.detailsSelected.set(r);
    this.detailsModalOpen.set(true);
  }

  closeDetailsModal() {
    this.detailsModalOpen.set(false);
  }

  openActivateModal(r: ReservationRow) {
    this.api.activate({ reservationID: r.reservationID })
      .subscribe(() => this.fetch());
  }

  canActivate(r: ReservationRow) {
    return r.status === 'PENDING';
  }

  statusLabel(s: string) {
    if (s === 'PENDING') return 'Na čekanju';
    if (s === 'FULFILLED') return 'Preuzeta';
    if (s === 'EXPIRED') return 'Istekla';
    if (s === 'CANCELED') return 'Otkazana';
    return s;
  }

  statusClass(s: string) {
    if (s === 'PENDING') return 'bg-yellow-50 text-yellow-800';
    if (s === 'FULFILLED') return 'bg-green-50 text-green-800';
    if (s === 'EXPIRED') return 'bg-gray-50 text-gray-700';
    if (s === 'CANCELED') return 'bg-red-50 text-red-700';
    return '';
  }

  canChangeInstanceStatus(r: ReservationRow) {
    return r.status === 'PENDING';
  }

  statusModalOpen = signal(false);
  selectedReservation = signal<ReservationRow | null>(null);

  openStatusModal(r: ReservationRow) {
    this.selectedReservation.set(r);
    this.statusModalOpen.set(true);
  }

  closeStatusModal() {
    this.statusModalOpen.set(false);
  }

  confirmStatusChange(status: string) {
    const r = this.selectedReservation();
    if (!r) return;

    this.instanceService.updateStatus(r.instanceID, status).subscribe({
      next: () => {
        this.statusModalOpen.set(false);
        this.fetch(); // refresh tabela
      },
      error: (err) => {
        alert(err?.error?.message || 'Greška');
      }
    });
  }

}