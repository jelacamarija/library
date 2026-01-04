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

  // DETAILS MODAL
  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  // CONFIRM MODAL (Da li ste sigurni?)
  showConfirmReserve = signal(false);

  // MESSAGE MODAL (za sve poruke)
  messageOpen = signal(false);
  messageTitle = signal('');
  messageText = signal('');
  messageType = signal<'success' | 'error' | 'info'>('info');

  // optional: loading tokom rezervacije da disable dugmad
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

  // === MESSAGE MODAL HELPERS ===
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

  // === RESERVE FLOW ===
  clickReserveFromDetails() {
    const b = this.selectedBook();
    if (!b) return;

    if (b.copiesAvailable <= 0) {
      this.openMessage('error', 'Rezervacija nije moguća', 'Nema dostupnih primjeraka ove knjige.');
      return;
    }

    // Otvori confirm modal
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
      next: (res) => {
        this.reserving.set(false);

        // backend vraća expiresAt (ReservationResponseDto)
        const expiresAt = res?.expiresAt ? new Date(res.expiresAt) : null;
        const fmt = (d: Date) => d.toLocaleDateString('sr-RS');

        const msg = expiresAt
          ? `Rezervacija je uspješna! Rok za preuzimanje je do ${fmt(expiresAt)} (3 dana od rezervacije).`
          : `Rezervacija je uspješna! Imate 3 dana od rezervacije da preuzmete knjigu.`;

        // zatvori details i pokaži poruku
        this.closeDetails();
        this.openMessage('success', 'Uspješno', msg);

        // refresh lista da se osvježi copiesAvailable
        this.loadBooks();
      },
      error: (err) => {
        this.reserving.set(false);
        const msg = err?.error?.message ?? 'Greška pri rezervaciji.';
        this.openMessage('error', 'Greška', msg);
      },
    });
  }
}
