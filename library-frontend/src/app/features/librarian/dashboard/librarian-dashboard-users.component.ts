import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LibrarianUsersService, ClientRow } from '../../../core/services/librarian-users.service';

@Component({
  selector: 'app-librarian-dashboard-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="mx-auto max-w-7xl px-4 py-6">

    <!-- HEADER -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <h1 class="text-2xl font-bold">Korisnici</h1>

      <div class="flex items-center gap-2">
        <button class="px-4 py-2 rounded-xl border" (click)="reload()" [disabled]="loading()">
          Osvježi
        </button>

        <button
          class="px-4 py-2 rounded-xl bg-blue-600 text-white"
          [routerLink]="['/librarian/dashboard/users/new']"
        >
          Dodaj korisnika
        </button>

        <select
          class="px-3 py-2 rounded-xl border"
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
    <div class="mb-4 flex gap-2">
      <input
        class="flex-1 border rounded-xl px-4 py-2"
        [value]="query()"
        (input)="onQueryChange($any($event.target).value)"
        placeholder="Pretraga po članskoj karti..."
      />
      <button *ngIf="query()" class="px-4 py-2 border rounded-xl" (click)="clearQuery()">
        Obriši
      </button>
    </div>

    <!-- ERROR -->
    <div *ngIf="error()" class="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl">
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
              <th class="px-4 py-3 text-left">Članska karta</th>
              <th class="px-4 py-3 text-left">Status članarine</th>
              <th class="px-4 py-3 text-left">Verifikovan</th>
              <th class="px-4 py-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            <tr *ngIf="loading()">
              <td colspan="8" class="px-4 py-6">Učitavanje...</td>
            </tr>

            <tr *ngIf="!loading() && rows().length === 0">
              <td colspan="8" class="px-4 py-6">Nema korisnika.</td>
            </tr>

            <tr *ngFor="let u of rows()" class="border-t">
              <td class="px-4 py-3 font-medium">{{ u.name }}</td>
              <td class="px-4 py-3">{{ u.email }}</td>
              <td class="px-4 py-3">{{ u.phoneNumber || '—' }}</td>
              <td class="px-4 py-3">{{ u.membershipNumber || '—' }}</td>

              <!-- STATUS -->
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs border"
                  [ngClass]="getMembershipClass(u.membershipStatus)">
                  {{ formatStatus(u.membershipStatus) }}
                </span>
              </td>

              <!-- VERIFIKOVAN -->
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-xs border"
                  [ngClass]="u.isVerified ? green : yellow">
                  {{ u.isVerified ? 'DA' : 'NE' }}
                </span>
              </td>

              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">

                  <button
                    class="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    (click)="openEditModal(u)"
                  >
                    Uredi
                  </button>

                  <button
                    *ngIf="u.membershipStatus !== 'ACTIVE'"
                    class="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
                    (click)="activateMembership(u)"
                  >
                    Aktiviraj
                  </button>

                </div>
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
          <button class="px-3 py-2 border rounded"
                  (click)="prevPage()"
                  [disabled]="page()===0">Prethodna</button>

          <button class="px-3 py-2 border rounded"
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
                <h2 class="text-lg font-bold">Uredi korisnika</h2>
                <p class="text-sm text-gray-600" *ngIf="selected() as s">
                  {{ s.name }} • {{ s.membershipNumber || 'bez koda' }}
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

    <!-- CONFIRM MODAL -->
    <div
      *ngIf="confirmOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8">

        <h3 class="text-xl font-semibold text-gray-900 mb-3">
          Aktivacija članarine
        </h3>

        <div class="text-sm text-gray-700 space-y-1">
          <p>
            Da li ste sigurni da želite da aktivirate članarinu za korisnika
            <span class="font-semibold">
              {{ selectedClient()?.name }}
            </span>?
          </p>

          <p *ngIf="selectedClient()?.membershipNumber">
            Broj članske karte:
            <span class="font-semibold">
              {{ selectedClient()?.membershipNumber }}
            </span>
          </p>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <button
            (click)="closeConfirm()"
            class="px-6 py-2 rounded-xl border text-sm hover:bg-gray-50 disabled:opacity-50"
            [disabled]="cashLoading()"
          >
            Ne
          </button>

          <button
            (click)="confirmActivate()"
            class="px-6 py-2 rounded-xl bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            [disabled]="cashLoading()"
          >
            {{ cashLoading() ? 'Aktiviram...' : 'Da, aktiviraj' }}
          </button>
        </div>

      </div>
    </div>
  </div>
  `
})
export class LibrarianDashboardUsersComponent {

  private api = inject(LibrarianUsersService);
  private fb = inject(FormBuilder);

  rows = signal<ClientRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(10);
  totalElements = signal(0);
  totalPages = signal(1);

  query = signal('');

  editOpen = signal(false);
  selected = signal<ClientRow | null>(null);
  modalError = signal<string | null>(null);

  confirmOpen = signal(false);
  selectedClient = signal<ClientRow | null>(null);
  cashLoading = signal(false);

  green = 'bg-green-50 border-green-300 text-green-800';
  red = 'bg-red-50 border-red-300 text-red-800';
  yellow = 'bg-yellow-50 border-yellow-300 text-yellow-800';

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
      ? this.api.searchByMembership(q, this.page(), this.size())
      : this.api.getAll(this.page(), this.size());

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

  openEditModal(u: ClientRow) {
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

    this.api.updatePhone(s.userID, this.editForm.value.phoneNumber!).subscribe({
      next: () => {
        this.editOpen.set(false);
        this.fetch();
      },
      error: err => {
        this.modalError.set(err?.error?.message || 'Greška.');
      }
    });
  }

  formatStatus(status: string | null): string {
    switch (status) {
      case 'ACTIVE': return 'Aktivna';
      case 'PENDING': return 'Na čekanju';
      case 'EXPIRED': return 'Istekla';
      case 'CANCELED': return 'Otkazana';
      default: return '—';
    }
  }

  getMembershipClass(status: string | null) {
    switch (status) {
      case 'ACTIVE': return this.green;
      case 'PENDING': return this.yellow;
      case 'EXPIRED': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'CANCELED': return this.red;
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  }

  closeConfirm() {
    this.confirmOpen.set(false);
    this.selectedClient.set(null);
  }

  confirmActivate() {
    const client = this.selectedClient();
    if (!client?.membershipNumber) return;

    this.cashLoading.set(true);

    this.api.activateMembershipCash(client.membershipNumber)
      .subscribe({
        next: () => {
          this.cashLoading.set(false);
          this.closeConfirm();
          this.fetch();
        },
        error: err => {
          this.cashLoading.set(false);
          console.error(err);
        }
      });
  }

  activateMembership(u: ClientRow) {
    this.selectedClient.set(u);
    this.confirmOpen.set(true);
  }
}