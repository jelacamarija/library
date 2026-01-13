import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LibrarianLoansService } from '../../../core/services/librarian-loans.service';

type UserOpt = { userId: number; name: string; membershipNumber: string };
type BookOpt = { bookId: number; title: string; author: string };

@Component({
  selector: 'app-librarian-create-loan',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="mx-auto max-w-3xl px-4 py-6">
      <div class="mb-4">
        <h1 class="text-2xl font-bold">Dodaj novo iznajmljivanje</h1>
        <p class="text-sm text-gray-600">
          Izaberi korisnika i knjigu. Rok vraćanja je automatski 30 dana od danas.
        </p>
      </div>

      <div *ngIf="error()" class="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
        {{ error() }}
      </div>

      <div *ngIf="success()" class="mb-4 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
        {{ success() }}
      </div>

      <!-- ✅ BITNO: (submit) + preventDefault u TS -->
      <form class="bg-white border rounded-2xl p-6 space-y-4" (submit)="submit($event)">
        <!-- USER AUTOCOMPLETE -->
        <div class="relative user-autocomplete">
          <label class="block text-sm text-gray-700 mb-1">Broj članske karte</label>

          <input
            class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            [value]="userQuery()"
            (input)="onUserQueryChange($any($event.target).value)"
            placeholder="npr. LIB000123"
            autocomplete="off"
          />

          <div *ngIf="selectedUser()" class="text-xs text-gray-600 mt-1">
            Izabrano:
            <span class="font-medium text-gray-900">
              {{ selectedUser()!.membershipNumber }} — {{ selectedUser()!.name }}
            </span>
            <button type="button" class="ml-2 hover:underline" (click)="clearSelectedUser()">
              promijeni
            </button>
          </div>

          <div
            *ngIf="userDropdownOpen()"
            class="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden"
          >
            <div class="px-4 py-3 text-sm text-gray-600" *ngIf="userLoading()">
              Pretraga korisnika...
            </div>

            <button
              type="button"
              *ngFor="let u of userOptions()"
              class="w-full text-left px-4 py-2 hover:bg-gray-50"
              (click)="selectUser(u)"
            >
              <div class="font-medium text-gray-900">{{ u.membershipNumber }}</div>
              <div class="text-xs text-gray-600">{{ u.name }}</div>
            </button>

            <div class="px-4 py-3 text-sm text-gray-600"
                 *ngIf="!userLoading() && userOptions().length === 0">
              Ne postoji korisnik.
            </div>
          </div>
        </div>

        <!-- BOOK AUTOCOMPLETE -->
        <!-- ✅ BITNO: book-autocomplete -->
        <div class="relative book-autocomplete">
          <label class="block text-sm text-gray-700 mb-1">Knjiga (naslov ili autor)</label>

          <input
            class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            [value]="bookQuery()"
            (input)="onBookQueryChange($any($event.target).value)"
            placeholder="npr. Harry ili Rowling"
            autocomplete="off"
          />

          <div *ngIf="selectedBook()" class="text-xs text-gray-600 mt-1">
            Izabrano:
            <span class="font-medium text-gray-900">
              {{ selectedBook()!.title }} — {{ selectedBook()!.author }}
            </span>
            <button type="button" class="ml-2 hover:underline" (click)="clearSelectedBook()">
              promijeni
            </button>
          </div>

          <div
            *ngIf="bookDropdownOpen()"
            class="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden"
          >
            <div class="px-4 py-3 text-sm text-gray-600" *ngIf="bookLoading()">
              Pretraga knjiga...
            </div>

            <button
              type="button"
              *ngFor="let b of bookOptions()"
              class="w-full text-left px-4 py-2 hover:bg-gray-50"
              (click)="selectBook(b)"
            >
              <div class="font-medium text-gray-900">{{ b.title }}</div>
              <div class="text-xs text-gray-600">{{ b.author }}</div>
            </button>

            <div class="px-4 py-3 text-sm text-gray-600"
                 *ngIf="!bookLoading() && bookOptions().length === 0">
              Ne postoji knjiga.
            </div>
          </div>
        </div>

        <!-- DATES PREVIEW -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 rounded-xl border bg-gray-50">
            <div class="text-xs text-gray-500">Datum podizanja</div>
            <div class="font-medium text-gray-900">{{ today() | date:'dd.MM.yyyy' }}</div>
          </div>
          <div class="p-4 rounded-xl border bg-gray-50">
            <div class="text-xs text-gray-500">Rok vraćanja</div>
            <div class="font-medium text-gray-900">{{ dueDatePreview() | date:'dd.MM.yyyy' }}</div>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50"
            (click)="back()"
          >
            Nazad
          </button>

          <button
            type="submit"
            class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            [disabled]="loading() || !selectedUser() || !selectedBook()"
          >
            <span *ngIf="loading()">Kreiram...</span>
            <span *ngIf="!loading()">Kreiraj iznajmljivanje</span>
          </button>
        </div>
      </form>
    </div>
  `,
})
export class LibrarianDashboardCreateLoanComponent {
  private api = inject(LibrarianLoansService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  today = signal(new Date());
  dueDatePreview = computed(() => {
    const d = new Date(this.today().getTime());
    d.setDate(d.getDate() + 30);
    return d;
  });

  // ---- USER ----
  userQuery = signal('');
  userOptions = signal<UserOpt[]>([]);
  userLoading = signal(false);
  userDropdownOpen = signal(false);
  selectedUser = signal<UserOpt | null>(null);

  private userDebounce: any = null;
  private lastUserQuery = '';

  onUserQueryChange(value: string): void {
    this.userQuery.set(value);
    this.selectedUser.set(null);
    this.error.set(null);
    this.success.set(null);

    const q = value.trim();
    if (this.userDebounce) clearTimeout(this.userDebounce);

    if (q.length < 2) {
      this.userOptions.set([]);
      this.userDropdownOpen.set(false);
      return;
    }

    this.userDropdownOpen.set(true);
    this.userDebounce = setTimeout(() => this.fetchUsers(q), 250);
  }

  private fetchUsers(q: string): void {
    this.lastUserQuery = q;
    this.userLoading.set(true);

    this.api.searchClientsByMembership(q, 0, 8).subscribe({
      next: (res: any) => {
        if (this.lastUserQuery !== q) return;

        const list: UserOpt[] = (res?.content ?? [])
          .map((u: any) => ({
            userId: u.userId ?? u.userID ?? u.id,
            name: u.name,
            membershipNumber: u.membershipNumber,
          }))
          .filter((x: any) => !!x.userId && !!x.membershipNumber);

        this.userOptions.set(list);
        this.userLoading.set(false);
        this.userDropdownOpen.set(true);
      },
      error: () => {
        if (this.lastUserQuery !== q) return;
        this.userLoading.set(false);
        this.userOptions.set([]);
        this.userDropdownOpen.set(true);
      },
    });
  }

  selectUser(u: UserOpt): void {
    this.selectedUser.set(u);
    this.userQuery.set(`${u.membershipNumber} — ${u.name}`);
    this.userOptions.set([]);
    this.userDropdownOpen.set(false);
  }

  clearSelectedUser(): void {
    this.selectedUser.set(null);
    this.userQuery.set('');
    this.userOptions.set([]);
    this.userDropdownOpen.set(false);
  }

  // ---- BOOK ----
  bookQuery = signal('');
  bookOptions = signal<BookOpt[]>([]);
  bookLoading = signal(false);
  bookDropdownOpen = signal(false);
  selectedBook = signal<BookOpt | null>(null);

  private bookDebounce: any = null;
  private lastBookQuery = '';

  onBookQueryChange(value: string): void {
    this.bookQuery.set(value);
    this.selectedBook.set(null);
    this.error.set(null);
    this.success.set(null);

    const q = value.trim();
    if (this.bookDebounce) clearTimeout(this.bookDebounce);

    if (q.length < 2) {
      this.bookOptions.set([]);
      this.bookDropdownOpen.set(false);
      return;
    }

    this.bookDropdownOpen.set(true);
    this.bookDebounce = setTimeout(() => this.fetchBooks(q), 250);
  }

  private fetchBooks(q: string): void {
    this.lastBookQuery = q;
    this.bookLoading.set(true);

    this.api.searchBooks(q, 0, 8).subscribe({
      next: (res: any) => {
        if (this.lastBookQuery !== q) return;

        const list: BookOpt[] = (res?.content ?? [])
          .map((b: any) => ({
            bookId: b.bookId ?? b.bookID ?? b.id,
            title: b.title,
            author: b.author,
          }))
          .filter((x: any) => !!x.bookId && !!x.title);

        this.bookOptions.set(list);
        this.bookLoading.set(false);
        this.bookDropdownOpen.set(true);
      },
      error: () => {
        if (this.lastBookQuery !== q) return;
        this.bookLoading.set(false);
        this.bookOptions.set([]);
        this.bookDropdownOpen.set(true);
      },
    });
  }

  selectBook(b: BookOpt): void {
    this.selectedBook.set(b);
    this.bookQuery.set(`${b.title} — ${b.author}`);
    this.bookOptions.set([]);
    this.bookDropdownOpen.set(false);
  }

  clearSelectedBook(): void {
    this.selectedBook.set(null);
    this.bookQuery.set('');
    this.bookOptions.set([]);
    this.bookDropdownOpen.set(false);
  }

  // ✅ klik van => zatvori dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    if (!target.closest('.user-autocomplete')) this.userDropdownOpen.set(false);
    if (!target.closest('.book-autocomplete')) this.bookDropdownOpen.set(false);
  }

  // ✅ BITNO: preventDefault da nema refresh
  submit(ev?: Event): void {
    ev?.preventDefault();

    console.log('SUBMIT FIRED');

    const u = this.selectedUser();
    const b = this.selectedBook();
    if (!u || !b) return;

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    const payload = {
      userId: u.userId,
      bookId: b.bookId,
      reservationId: null,
      days: 30,
    };

    this.api.createLoan(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Iznajmljivanje uspješno kreirano.');
        this.router.navigateByUrl('/librarian/dashboard/loans');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Neuspješno kreiranje iznajmljivanja.');
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/librarian/dashboard/loans');
  }
}
