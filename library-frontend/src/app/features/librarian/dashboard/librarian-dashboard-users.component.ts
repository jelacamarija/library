import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LibrarianUsersService, UserRow } from '../../../core/services/librarian-users.service';

@Component({
  selector: 'app-librarian-dashboard-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="mx-auto max-w-7xl px-4 py-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold">Korisnici</h1>
       
      </div>

      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
          (click)="reload()"
          [disabled]="loading()"
        >
          Osvježi
        </button>

        <button
          class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          [routerLink]="['/librarian/dashboard/users/new']"
        >
          Dodaj novog korisnika
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
        placeholder="Pretraži po broju članske karte (npr. LIB000123)..."
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
              <th class="text-left font-semibold px-4 py-3">Ime i prezime</th>
              <th class="text-left font-semibold px-4 py-3">Email</th>
              <th class="text-left font-semibold px-4 py-3">Broj telefona</th>
              <th class="text-left font-semibold px-4 py-3">Broj članske karte</th>
              <th class="text-left font-semibold px-4 py-3">Verifikovan</th>

              <th class="text-right font-semibold px-4 py-3"></th>
            </tr>
          </thead>

          <tbody>
            <tr *ngIf="loading()">
              <td colspan="5" class="px-4 py-6 text-gray-600">Učitavanje...</td>
            </tr>

            <tr *ngIf="!loading() && rows().length === 0">
              <td colspan="5" class="px-4 py-6 text-gray-600">Nema korisnika.</td>
            </tr>

            <tr *ngFor="let u of rows()" class="border-t">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ u.name }}</div>
              </td>
              <td class="px-4 py-3 text-gray-800">{{ u.email }}</td>
              <td class="px-4 py-3 text-gray-800">{{ u.phoneNumber || '—' }}</td>
              <td class="px-4 py-3 text-gray-800">
                <span class="font-medium">{{ u.membershipNumber || '—' }}</span>
              </td>
              <td class="px-4 py-3">
  <span
    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
    [ngClass]="u.isVerified ? 'border-green-300 bg-green-50 text-green-800' : 'border-yellow-300 bg-yellow-50 text-yellow-800'"
  >
    {{ u.isVerified ? 'DA' : 'NE' }}
  </span>
</td>


              <td class="px-4 py-3 text-right">
                <button
                  class="px-3 py-2 rounded-xl text-white"
                  [ngClass]=" 'bg-blue-600 hover:bg-blue-700' "
                  (click)="openEditModal(u)"
                >
                  Uredi
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

    <!-- EDIT PHONE MODAL -->
    <div *ngIf="editOpen()" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" (click)="closeEditModal()"></div>

      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-lg border">
          <div class="p-5 border-b">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-lg font-bold">Uredi broj telefona</h2>
                <p class="text-sm text-gray-600" *ngIf="selected() as s">
                  {{ s.name }} • {{ s.membershipNumber || 'bez članske' }}
                </p>
              </div>
              <button class="text-gray-500 hover:text-gray-800" (click)="closeEditModal()">✕</button>
            </div>
          </div>

          <div class="p-5">
            <form [formGroup]="editForm" class="space-y-3" (ngSubmit)="savePhone()">
              <div>
                <label class="block text-sm text-gray-700 mb-1">Broj telefona</label>
                <input
                  type="text"
                  class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  formControlName="phoneNumber"
                  placeholder="npr. 06x/xxx-xxx"
                />
                <div *ngIf="editForm.controls.phoneNumber.touched && editForm.controls.phoneNumber.invalid"
                     class="text-xs text-red-600 mt-1">
                  Unesi broj telefona.
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2">
                <button type="button"
                        class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
                        (click)="closeEditModal()">
                  Otkaži
                </button>

                <button type="submit"
                        class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        [disabled]="editForm.invalid || saving()">
                  <span *ngIf="saving()">Snima...</span>
                  <span *ngIf="!saving()">Sačuvaj</span>
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
export class LibrarianDashboardUsersComponent {
  private api = inject(LibrarianUsersService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<UserRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);
  totalElements = signal(0);
  totalPages = signal(1);

  query = signal('');
  private debounceTimer: any = null;

  // modal state
  editOpen = signal(false);
  selected = signal<UserRow | null>(null);
  saving = signal(false);
  modalError = signal<string | null>(null);

  editForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      // auto-load on init and when page/size changes
      this.fetch();
    });
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);

    const q = this.query().trim();
    const obs = q
      ? this.api.searchByMembership(q, this.page(), this.size())
      : this.api.getAll(this.page(), this.size());

    obs.subscribe({
      next: (res) => {
        this.rows.set(res.content ?? []);
        this.totalElements.set(res.totalElements ?? 0);
        this.totalPages.set(Math.max(1, res.totalPages ?? 1));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Greška pri učitavanju korisnika.');
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

  openEditModal(u: UserRow): void {
    this.modalError.set(null);
    this.selected.set(u);
    this.editForm.patchValue({ phoneNumber: u.phoneNumber ?? '' });
    this.editOpen.set(true);
  }

  closeEditModal(): void {
    if (this.saving()) return;
    this.editOpen.set(false);
    this.selected.set(null);
    this.modalError.set(null);
  }

  savePhone(): void {
    this.modalError.set(null);
    const s = this.selected();
    if (!s) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const phoneNumber = this.editForm.getRawValue().phoneNumber.trim();
    this.saving.set(true);

    this.api.updatePhone(s.userID, phoneNumber).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.editOpen.set(false);
        this.selected.set(null);

        // refresh list (da bude 100% sync)
        this.fetch();
      },
      error: (err) => {
        this.saving.set(false);
        this.modalError.set(err?.error?.message ?? 'Neuspješno snimanje broja telefona.');
      },
    });
  }
}
