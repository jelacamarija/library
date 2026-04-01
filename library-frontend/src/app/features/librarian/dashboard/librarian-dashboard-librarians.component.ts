import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LibrarianUsersService, LibrarianRow } from '../../../core/services/librarian-users.service';

@Component({
  selector: 'app-librarian-dashboard-librarians',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="mx-auto max-w-7xl px-4 py-6">

    <!-- HEADER -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold">Bibliotekari</h1>
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
          [routerLink]="['/librarian/dashboard/librarians/new']"
        >
          Dodaj bibliotekara
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
        placeholder="Pretraži po kodu zaposlenog..."
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
              <th class="px-4 py-3 text-left">Ime i prezime</th>
              <th class="px-4 py-3 text-left">Email</th>
              <th class="px-4 py-3 text-left">Telefon</th>
              <th class="px-4 py-3 text-left">Kod zaposlenog</th>
              <th class="px-4 py-3 text-left">Verifikovan</th>
              <th class="px-4 py-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            <tr *ngIf="loading()">
              <td colspan="7" class="px-4 py-6 text-gray-600">Učitavanje...</td>
            </tr>

            <tr *ngIf="!loading() && rows().length === 0">
              <td colspan="7" class="px-4 py-6 text-gray-600">Nema bibliotekara.</td>
            </tr>

            <tr *ngFor="let u of rows()" class="border-t">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ u.name }}</div>
              </td>

              <td class="px-4 py-3 text-gray-800">{{ u.email }}</td>

              <td class="px-4 py-3 text-gray-800">
                {{ u.phoneNumber || '—' }}
              </td>

              <td class="px-4 py-3 text-gray-800">
                <span class="font-medium">{{ u.employeeCode || '—' }}</span>
              </td>

              <!-- VERIFIKOVAN -->
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border"
                  [ngClass]="u.isVerified ? green : yellow"
                >
                  {{ u.isVerified ? 'DA' : 'NE' }}
                </span>
              </td>

              <td class="px-4 py-3 text-right">
                <button
                  class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  (click)="openEditModal(u)"
                >
                  Uredi
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- FOOTER -->
      <div class="flex justify-between items-center px-4 py-3 border-t bg-gray-50 text-sm">
        <div>
          Ukupno: <b>{{ totalElements() }}</b> |
          Stranica <b>{{ page()+1 }}</b> / {{ totalPages() }}
        </div>

        <div class="flex gap-2">
          <button
            class="px-3 py-2 border rounded"
            (click)="prevPage()"
            [disabled]="page()===0">Prethodna</button>

          <button
            class="px-3 py-2 border rounded"
            (click)="nextPage()"
            [disabled]="page()+1>=totalPages()">Sledeća</button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div *ngIf="editOpen()" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" (click)="closeEditModal()"></div>

      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-lg border">

          <div class="p-5 border-b">
            <div class="flex justify-between">
              <div>
                <h2 class="text-lg font-bold">Uredi bibliotekara</h2>
                <p class="text-sm text-gray-600" *ngIf="selected() as s">
                  {{ s.name }} • {{ s.employeeCode || 'bez koda' }}
                </p>
              </div>
              <button (click)="closeEditModal()">✕</button>
            </div>
          </div>

          <div class="p-5">
            <form [formGroup]="editForm" (ngSubmit)="savePhone()" class="space-y-3">

              <input
                class="w-full border rounded-xl px-3 py-2"
                formControlName="phoneNumber"
                placeholder="Telefon"
              />

              <div class="flex justify-end gap-2">
                <button type="button" (click)="closeEditModal()">Otkaži</button>
                <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-xl">
                  Sačuvaj
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>

  </div>
  `
})
export class LibrarianDashboardLibrariansComponent {

  private api = inject(LibrarianUsersService);
  private fb = inject(FormBuilder);

  rows = signal<LibrarianRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);
  totalElements = signal(0);
  totalPages = signal(1);

  query = signal('');

  editOpen = signal(false);
  selected = signal<LibrarianRow | null>(null);

  green = 'border-green-300 bg-green-50 text-green-800';
  red = 'border-red-300 bg-red-50 text-red-800';
  yellow = 'border-yellow-300 bg-yellow-50 text-yellow-800';

  editForm = this.fb.nonNullable.group({
    phoneNumber: ['', Validators.required],
  });

  constructor() {
    effect(() => this.fetch());
  }

  fetch() {
    this.loading.set(true);

    const q = this.query().trim();
    const obs = q
      ? this.api.searchLibrarians(q, this.page(), this.size())
      : this.api.getAllLibrarians(this.page(), this.size());

    obs.subscribe({
      next: res => {
        this.rows.set(res.content || []);
        this.totalElements.set(res.totalElements || 0);
        this.totalPages.set(res.totalPages || 1);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Greška.');
      }
    });
  }

  reload() { this.fetch(); }

  prevPage() { this.page.set(Math.max(0, this.page() - 1)); }
  nextPage() { this.page.set(Math.min(this.totalPages() - 1, this.page() + 1)); }

  onSizeChange(val: string) {
    this.size.set(Number(val));
    this.page.set(0);
  }

  onQueryChange(val: string) {
    this.query.set(val);
    this.page.set(0);
  }

  clearQuery() {
    this.query.set('');
    this.fetch();
  }

  openEditModal(u: LibrarianRow) {
    this.selected.set(u);
    this.editForm.patchValue({ phoneNumber: u.phoneNumber || '' });
    this.editOpen.set(true);
  }

  closeEditModal() {
    this.editOpen.set(false);
    this.selected.set(null);
  }

  savePhone() {
    const s = this.selected();
    if (!s) return;

    this.api.updateLibrarianPhone(s.userID, this.editForm.value.phoneNumber!).subscribe(() => {
      this.editOpen.set(false);
      this.fetch();
    });
  }
}