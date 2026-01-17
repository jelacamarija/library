import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LibrarianLoansService, LoanRow } from '../../../core/services/librarian-loans.service';

@Component({
  selector: 'app-admin-loans',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="mx-auto max-w-7xl px-4 py-6">
      <!-- HEADER -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold">Iznajmljivanja</h1>
          <p class="text-sm text-gray-600">Pregled svih iznajmljivanja korisnika.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            (click)="reload()"
            class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            [disabled]="loading()"
          >
            Osvježi
          </button>

          <button
            (click)="goToCreate()"
            class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            [disabled]="loading()"
          >
            Dodaj novo iznajmljivanje
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

      <!-- TABLE CARD -->
      <div class="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-gray-700">
              <tr>
                <th class="text-left font-semibold px-4 py-3">Ime i prezime</th>
                <th class="text-left font-semibold px-4 py-3">Broj clanske karte</th>
                <th class="text-left font-semibold px-4 py-3">Naslov</th>
                <th class="text-left font-semibold px-4 py-3">Autor</th>

                <th class="text-left font-semibold px-4 py-3">
                  <button type="button" class="hover:underline" (click)="toggleSort('dueDate')">
                    Rok vraćanja
                    <span class="ml-1 text-xs text-gray-500" *ngIf="sortField()==='dueDate'">
                      {{ sortDir()==='desc' ? '↓' : '↑' }}
                    </span>
                  </button>
                </th>

                <th class="text-left font-semibold px-4 py-3">Vraćena</th>
                <th class="text-left font-semibold px-4 py-3">Datum vraćanja</th>
                <th class="text-left font-semibold px-4 py-3">Status</th>
                <th class="text-right font-semibold px-4 py-3"></th>
              </tr>
            </thead>

            <tbody class="divide-y">
              <!-- LOADING -->
              <tr *ngIf="loading()">
                <td colspan="9" class="px-4 py-6 text-gray-600">Učitavanje...</td>
              </tr>

              <!-- EMPTY -->
              <tr *ngIf="!loading() && rows().length === 0">
                <td colspan="9" class="px-4 py-6 text-gray-600">Nema iznajmljivanja.</td>
              </tr>

              <!-- ROWS -->
              <tr *ngFor="let l of rows()" class="hover:bg-gray-50/60">
                <!-- Korisnik -->
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ l.userName || ($any(l).name) || ($any(l).user?.name) || '—' }}
</div>
                  
                </td>

                <!-- Članska -->
                <td class="px-4 py-3 text-gray-800">
                  <span class="font-medium">{{ l.membershipNumber || '—' }}</span>
                </td>

                <!-- Knjiga -->
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ l.bookTitle }}</div>
                  
                </td>

                <!-- Autor -->
                <td class="px-4 py-3 text-gray-800">{{ l.bookAuthor }}</td>

                <!-- Rok -->
                <td class="px-4 py-3 text-gray-800">
                  {{ l.dueDate | date:'dd.MM.yyyy' }}
                </td>

                <!-- Vraćena -->
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                    [ngClass]="isReturned(l)
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : (isExpired(l)
                          ? 'border-red-300 bg-red-50 text-red-800'
                          : 'border-yellow-300 bg-yellow-50 text-yellow-800')"
                  >
                    {{ isReturned(l) ? 'DA' : (isExpired(l) ? 'ISTEKLO' : 'NE') }}
                  </span>
                </td>

                <!-- Datum vraćanja -->
                <td class="px-4 py-3 text-gray-800">
                  {{ l.returnedAt ? (l.returnedAt | date:'dd.MM.yyyy') : '—' }}
                </td>

                <!-- Status -->
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                    [ngClass]="statusBadgeClass(l)"
                  >
                    {{ (l.status || '').toUpperCase() }}
                  </span>
                </td>

                <!-- Akcije -->
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    class="px-3 py-2 rounded-xl text-white text-xs disabled:opacity-50"
                    [ngClass]="canReturn(l)
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-gray-300 cursor-not-allowed'"
                    [disabled]="!canReturn(l) || actionLoadingId()===l.loanId"
                    (click)="openReturnModal(l)"
                  >
                    <span *ngIf="actionLoadingId()===l.loanId">Vraćam...</span>
                    <span *ngIf="actionLoadingId()!==l.loanId">Vrati knjigu</span>
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

      <!-- RETURN CONFIRM MODAL -->
      <div *ngIf="returnModalOpen()" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/40" (click)="closeReturnModal()"></div>

        <div class="absolute inset-0 flex items-center justify-center p-4">
          <div class="w-full max-w-md bg-white rounded-2xl shadow-lg border">
            <div class="p-5 border-b">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold">Vrati knjigu</h2>
                  <p class="text-sm text-gray-600">
                    Da li ste sigurni da želite da označite iznajmljivanje kao vraćeno?
                  </p>
                </div>
                <button class="text-gray-500 hover:text-gray-800" (click)="closeReturnModal()">✕</button>
              </div>
            </div>

            <div class="p-5">
              <div class="text-sm text-gray-700 space-y-1 mb-4" *ngIf="selectedReturn() as s">
                <div><span class="text-gray-500">Korisnik:</span> <span class="font-medium">{{ s.userName }}</span></div>
                <div><span class="text-gray-500">Članska:</span> <span class="font-medium">{{ s.membershipNumber || '—' }}</span></div>
                <div><span class="text-gray-500">Knjiga:</span> <span class="font-medium">{{ s.bookTitle }}</span></div>
                <div><span class="text-gray-500">Autor:</span> <span class="font-medium">{{ s.bookAuthor }}</span></div>
                <div><span class="text-gray-500">Rok:</span> <span class="font-medium">{{ s.dueDate | date:'dd.MM.yyyy' }}</span></div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                  (click)="closeReturnModal()"
                  [disabled]="actionLoadingId()!==null"
                >
                  Otkaži
                </button>

                <button
                  type="button"
                  class="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  (click)="confirmReturn()"
                  [disabled]="actionLoadingId()!==null || !selectedReturn()"
                >
                  Potvrdi
                </button>
              </div>

              <div *ngIf="modalError()" class="mt-3 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
                {{ modalError() }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `,
})
export class LibrarianDashboardLoansComponent {
  private api = inject(LibrarianLoansService);
  private router = inject(Router);

  rows = signal<LoanRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);

  query = signal('');
  private debounceTimer: any = null;

  sortField = signal<'dueDate' | 'loanedAt'>('dueDate');
  sortDir = signal<'asc' | 'desc'>('desc');

  totalElements = signal(0);
  totalPages = signal(1);

  // return modal state
  returnModalOpen = signal(false);
  selectedReturn = signal<LoanRow | null>(null);
  actionLoadingId = signal<number | null>(null);
  modalError = signal<string | null>(null);

  private sortParam = computed(() => `${this.sortField()},${this.sortDir()}`);

  constructor() {
    effect(() => this.fetch());
  }

  goToCreate(): void {
    this.router.navigateByUrl('/librarian/dashboard/loans/new');
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
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Greška pri učitavanju iznajmljivanja.');
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

  toggleSort(field: 'dueDate' | 'loanedAt'): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'desc' ? 'asc' : 'desc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
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

  isExpired(l: LoanRow): boolean {
    return (l.status || '').toUpperCase() === 'EXPIRED';
  }

  isReturned(l: LoanRow): boolean {
    const s = (l.status || '').toUpperCase();
    return s === 'RETURNED' || l.returnedAt != null;
  }

  canReturn(l: LoanRow): boolean {
    return !this.isReturned(l) && !this.isExpired(l);
  }

  statusBadgeClass(l: LoanRow): string {
    const s = (l.status || '').toUpperCase();
      if (s === 'RETURNED') return 'border-green-300 bg-green-50 text-green-800';
      if (s === 'ACTIVE') return 'border-blue-300 bg-blue-50 text-blue-800';
      if (s === 'EXPIRED') return 'border-red-300 bg-red-50 text-red-800';
      return 'border-gray-300 bg-gray-50 text-gray-800';
  }

  openReturnModal(l: LoanRow): void {
    if (!this.canReturn(l)) return;
    this.modalError.set(null);
    this.selectedReturn.set(l);
    this.returnModalOpen.set(true);
  }

  closeReturnModal(): void {
    if (this.actionLoadingId() !== null) return;
    this.returnModalOpen.set(false);
    this.selectedReturn.set(null);
    this.modalError.set(null);
  }

  confirmReturn(): void {
    const s = this.selectedReturn();
    if (!s) return;

    this.modalError.set(null);
    this.actionLoadingId.set(s.loanId);

    this.api.returnLoan(s.loanId).subscribe({
      next: () => {
        this.actionLoadingId.set(null);
        this.returnModalOpen.set(false);
        this.selectedReturn.set(null);
        this.fetch();
      },
      error: (err) => {
        this.actionLoadingId.set(null);
        this.modalError.set(err?.error?.message ?? 'Neuspješno vraćanje knjige.');
      },
    });
  }
}
