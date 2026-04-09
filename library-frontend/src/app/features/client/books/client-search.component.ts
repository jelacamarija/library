import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { BookService } from '../../../core/services/book.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { BookDto } from '../../../core/models/book.model';
import { PublicationDto } from '../../../core/models/publication.model';

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
  publications = signal<PublicationDto[]>([]);
  selectedPublication = signal<PublicationDto | null>(null);
  showReserveConfirm = signal(false);

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
        next: (page) => {
          this.state.set({ status: 'ready', books: page.content });
        },
        error: (err) => {
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
  this.publications.set([]);

  this.bookService.getAvailablePublications(book.bookID).subscribe({
    next: (res: any) => {
      this.publications.set(res.content ?? res);
    },
    error: () => this.publications.set([]),
  });
}

  closeDetails() {
    this.selectedBook.set(null);
    this.showReserveConfirm.set(false);
  }

  openReserveConfirm(p: PublicationDto) {
  this.selectedPublication.set(p);
  this.showReserveConfirm.set(true);
}

confirmReservePublication() {
  const p = this.selectedPublication();
  if (!p) return;

  this.bookService.reserveByPublication(p.publicationID).subscribe({
    next: () => {
      this.showReserveConfirm.set(false);

      this.openMessage(
        'success',
        'Uspješno',
        `Uspješno ste napravili rezervaciju za knjigu "${this.selectedBook()?.title}". 
Imate 3 dana da je preuzmete.`
      );
    },
    error: (err) => {
      this.showReserveConfirm.set(false);

      const parsed = this.parseReserveError(err);

      this.openMessage('error', parsed.title, parsed.text);
    },
  });
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

  
  if (
    msg.includes('clanar') ||
    msg.includes('članar') ||
    msg.includes('membership') ||
    msg.includes('aktivnu')
  ) {
    return {
      title: 'Rezervacija nije moguća',
      text: 'Morate imati aktivnu članarinu kako biste napravili rezervaciju.',
    };
  }

  
  if (msg.includes('već imate rezervaciju')) {
    return {
      title: 'Već imate rezervaciju',
      text: 'Već imate aktivnu rezervaciju za ovu knjigu. Pogledajte "Moje rezervacije".',
    };
  }

  
  if (
    msg.includes('već imate ovu knjigu') ||
    (msg.includes('već ima') && (msg.includes('iznajmlj') || msg.includes('loan')))
  ) {
    return {
      title: 'Knjiga je već kod vas',
      text: 'Ovu knjigu već imate iznajmljenu. Ne možete je ponovo rezervisati dok je ne vratite.',
    };
  }

  
  if (
    msg.includes('nema dostupnih') ||
    msg.includes('nije dostupan') ||
    msg.includes('no available')
  ) {
    return {
      title: 'Nema dostupnih primjeraka',
      text: 'Trenutno nema slobodnih primjeraka ove knjige. Pokušajte kasnije.',
    };
  }


  if (
    msg.includes('više nije dostupan') ||
    msg.includes('already reserved') ||
    msg.includes('not available anymore')
  ) {
    return {
      title: 'Knjiga je upravo rezervisana',
      text: 'Nažalost, neko drugi je upravo rezervisao ovu knjigu prije vas.',
    };
  }

  
  if (
    msg.includes('istekla') ||
    msg.includes('expired')
  ) {
    return {
      title: 'Rezervacija je istekla',
      text: 'Vaša prethodna rezervacija je istekla. Možete pokušati ponovo.',
    };
  }

  if (
    msg.includes('nije verifikovan') ||
    msg.includes('not verified')
  ) {
    return {
      title: 'Nalog nije aktiviran',
      text: 'Morate verifikovati nalog prije nego što napravite rezervaciju.',
    };
  }

  if (
    msg.includes('publikacija ne postoji') ||
    msg.includes('not found')
  ) {
    return {
      title: 'Greška',
      text: 'Odabrana publikacija više nije dostupna.',
    };
  }

 
  return {
    title: 'Greška',
    text: raw,
  };
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

   

    this.showReserveConfirm.set(true);
  }

  cancelReserveConfirm() {
    this.showReserveConfirm.set(false);
  }

  confirmReserve() {
    const b = this.selectedBook();
    if (!b) return;

    this.reserving.set(true);
    this.showReserveConfirm.set(false);

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
