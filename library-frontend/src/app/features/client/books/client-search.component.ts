import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { BookService } from '../../../core/services/book.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { BookDto } from '../../../core/models/book.model';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; books: BookDto[] };

@Component({
  selector: 'app-client-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-search.component.html',
})
export class ClientSearchComponent {
  private bookService = inject(BookService);
  private reservationService = inject(ReservationService);

  query = signal('');

  state = signal<UiState>({ status: 'loading' });

  private search$ = new Subject<string>();

  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  showConfirmReserve = signal(false);

  messageOpen = signal(false);
  messageTitle = signal('');
  messageText = signal('');
  messageType = signal<'success' | 'error' | 'info'>('info');

  reserving = signal(false);

  isLoading = computed(() => this.state().status === 'loading');
  isError = computed(() => this.state().status === 'error');

  errorMessage = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  });

  books = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.books : [];
  });

  noResults = computed(
    () => !this.isLoading() && !this.isError() && this.books().length === 0
  );

  ngOnInit() {
    this.loadAll();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((raw) => {
        const q = raw.trim();

        if (!q) {
          this.loadAll();
          return;
        }

        this.state.set({ status: 'loading' });
        this.bookService.search(q, 0, 12).subscribe({
          next: (page: any) => {
            this.state.set({ status: 'ready', books: page.content ?? [] });
          },
          error: (err: any) => {
            const msg = err?.error?.message ?? 'Greška pri pretrazi.';
            this.state.set({ status: 'error', message: msg });
          },
        });
      });
  }

  private loadAll() {
    this.state.set({ status: 'loading' });
    this.bookService.getPage(0, 12).subscribe({
      next: (page: any) => {
        this.state.set({ status: 'ready', books: page.content ?? [] });
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? 'Greška pri učitavanju knjiga.';
        this.state.set({ status: 'error', message: msg });
      },
    });
  }

  onQueryChange(value: string) {
    this.query.set(value);
    this.search$.next(value);
  }

  clear() {
    this.query.set('');
    this.search$.next('');
  }

  openDetails(book: BookDto) {
    this.selectedBook.set(book);
    this.showConfirmReserve.set(false);
  }

  closeDetails() {
    this.selectedBook.set(null);
    this.showConfirmReserve.set(false);
  }

  private openMessage(type: 'success' | 'error' | 'info', title: string, text: string) {
    this.messageType.set(type);
    this.messageTitle.set(title);
    this.messageText.set(text);
    this.messageOpen.set(true);
  }

  private parseReserveError(err: any): { title: string; text: string } {
  const raw =
    (err?.error?.message || err?.message || 'Greška pri rezervaciji.').toString();

  const msg = raw.toLowerCase();

  // nema dostupnih knjiga
  if (
    msg.includes('nije dostupna') ||
    msg.includes('nema dostup') ||
    msg.includes('dostupna za rezervaciju')
  ) {
    return {
      title: 'Rezervacija nije moguća',
      text: 'Trenutno nema dostupnih primjeraka ove knjige.',
    };
  }

  // već ima rezervaciju
  if (msg.includes('već imate rezervaciju') || msg.includes('vec imate rezervaciju')) {
    return {
      title: 'Već imate rezervaciju',
      text: 'Već imate rezervaciju na čekanju za ovu knjigu. Pogledajte "Moje rezervacije".',
    };
  }

  // već ima iznajmljenu
  if (
    msg.includes('iznajmljen') ||
    msg.includes('iznajmljenu') ||
    msg.includes('aktivno iznajmljivanje') ||
    msg.includes('already') && msg.includes('loan')
  ) {
    return {
      title: 'Knjiga je već izdata',
      text: 'Ovu knjigu već imate iznajmljenu. Ne možete je rezervisati dok je ne vratite.',
    };
  }

  return { title: 'Greška', text: raw };
}


  closeMessage() {
    this.messageOpen.set(false);
    this.messageTitle.set('');
    this.messageText.set('');
    this.messageType.set('info');
  }

  clickReserveFromDetails() {
    const b = this.selectedBook();
    if (!b) return;

    if (b.copiesAvailable <= 0) {
      this.openMessage('error', 'Rezervacija nije moguća', 'Nema dostupnih primjeraka ove knjige.');
      return;
    }

    this.showConfirmReserve.set(true);
  }

  cancelReserveConfirm() {
    this.showConfirmReserve.set(false);
  }

  confirmReserve() {
    const b = this.selectedBook();
    if (!b) return;

    this.reserving.set(true);
    this.showConfirmReserve.set(false);

    this.reservationService.reserve({ bookID: b.bookID }).subscribe({
      next: (res: any) => {
        this.reserving.set(false);

        const expiresAt = res?.expiresAt ? new Date(res.expiresAt) : null;
        const fmt = (d: Date) => d.toLocaleDateString('sr-RS');

        const msg = expiresAt
          ? `Rezervacija je uspješna! Rok za preuzimanje je do ${fmt(expiresAt)} (3 dana od rezervacije).`
          : `Rezervacija je uspješna! Imate 3 dana od rezervacije da preuzmete knjigu.`;

        this.closeDetails();
        this.openMessage('success', 'Uspješno', msg);

      const q = this.query().trim();
      if (q) this.search$.next(q);
      else this.loadAll();
      },
      error: (err: any) => {
        this.reserving.set(false);
        const parsed = this.parseReserveError(err);
        this.openMessage('error', parsed.title, parsed.text);
      },
    });
  }
}
