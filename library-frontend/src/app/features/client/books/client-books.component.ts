import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';
import { ReservationService } from '../../../core/services/reservation.service';
import { PublicationDto} from '../../../core/models/publication.model';

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
  publications=signal<PublicationDto[]>([]);

  state = signal<UiState>({ status: 'loading' });
  selectedPublication=signal<PublicationDto | null>(null);

  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

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
  this.publications.set([]);

  this.bookService.getPublications(book.bookID).subscribe({
    next: (res: any) => {
      this.publications.set(res.content); // 🔥 OVO JE KLJUČ
    },
    error: () => this.publications.set([]),
  });
}

  closeDetails() {
    this.selectedBook.set(null);
    this.showReserveConfirm.set(false);
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

 openReserveConfirm(p: PublicationDto) {
  this.selectedPublication.set(p);
  this.showReserveConfirm.set(true);
}

  cancelReserveConfirm() {
    this.showReserveConfirm.set(false);
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

      this.openMessage(
        'error',
        parsed.title,
        parsed.text
      );
    },
  });
}

  private parseReserveError(err: any): { title: string; text: string } {
  const raw =
    (err?.error?.message || err?.message || 'Greška pri rezervaciji.').toString();

  const msg = raw.toLowerCase();

  //morate imati aktivnu clanarinu
  if (msg.includes('imati aktivnu') || msg.includes('clan') || msg.includes('clanarinu')) {
    return {
      title: 'Rezervacija nije moguća',
      text: 'Morate imati aktivnu clanarinu kako biste napravili rezervaciju.',
    };
  }

  //već postoji rezervacija (pending)
  if (msg.includes('već imate rezervaciju') || msg.includes('za ovaj primerak')) {
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



}
