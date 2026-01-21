import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';
import { ReservationService } from '../../../core/services/reservation.service';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; books: BookDto[] };

@Component({
  selector: 'app-client-books',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-books.component.html',
})
export class ClientBooksComponent {
  private bookService = inject(BookService);
  private reservationService = inject(ReservationService);

  state = signal<UiState>({ status: 'loading' });

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

  ngOnInit() {
    this.loadBooks();
  }

  private loadBooks() {
    this.state.set({ status: 'loading' });
    this.bookService.getPage(0, 12).subscribe({
      next: (page) => this.state.set({ status: 'ready', books: page.content }),
      error: (err) => {
        const msg = err?.error?.message ?? 'Greška pri učitavanju knjiga.';
        this.state.set({ status: 'error', message: msg });
      },
    });
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

  private parseReserveError(err: any): { title: string; text: string } {
  const raw =
    (err?.error?.message || err?.message || 'Greška pri rezervaciji.').toString();

  const msg = raw.toLowerCase();

  //nema dostupnih primeraka
  if (msg.includes('nije dostupna') || msg.includes('nema dostup') || msg.includes('dostupna za rezervaciju')) {
    return {
      title: 'Rezervacija nije moguća',
      text: 'Trenutno nema dostupnih primjeraka ove knjige.',
    };
  }

  //već postoji rezervacija (pending)
  if (msg.includes('već imate rezervaciju') || msg.includes('vec imate rezervaciju')) {
    return {
      title: 'Već imate rezervaciju',
      text: 'Već imate rezervaciju na čekanju za ovu knjigu. Pogledajte "Moje rezervacije".',
    };
  }

  //već iznajmljena
  if (msg.includes('već ima') && (msg.includes('iznajmlj') || msg.includes('loan'))) {
    return {
      title: 'Knjiga je već izdata',
      text: 'Ovu knjigu već imate iznajmljenu. Ne možete je ponovo rezervisati dok je ne vratite.',
    };
  }
  return { title: 'Greška', text: raw };
}


  confirmReserve() {
    const b = this.selectedBook();
    if (!b) return;
    if (b.copiesAvailable <= 0) {
      this.openMessage('error', 'Rezervacija nije moguća', 'Trenutno nema dostupnih primjeraka ove knjige.');
      this.showConfirmReserve.set(false);
      return;
    }

    this.reserving.set(true);
    this.showConfirmReserve.set(false);

    this.reservationService.reserve({ bookID: b.bookID }).subscribe({
      next: (res) => {
        this.reserving.set(false);

       
        const expiresAt = res?.expiresAt ? new Date(res.expiresAt) : null;
        const fmt = (d: Date) => d.toLocaleDateString('sr-RS');

        const msg = expiresAt
          ? `Rezervacija je uspješna! Rok za preuzimanje je do ${fmt(expiresAt)} (3 dana od rezervacije).`
          : `Rezervacija je uspješna! Imate 3 dana od rezervacije da preuzmete knjigu.`;

      
        this.closeDetails();
        this.openMessage('success', 'Uspješno', msg);

        
        this.loadBooks();
      },
      error: (err) => {
        this.reserving.set(false);
        const parsed = this.parseReserveError(err);
        this.openMessage('error', parsed.title, parsed.text);
      },
    });
  }
}
