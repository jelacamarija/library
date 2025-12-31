import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';

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

  state = signal<UiState>({ status: 'loading' });

  // MODAL STATE
  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  // poruka kad nema dostupnih
  noCopiesMessage = signal<string>('');

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
    this.bookService.getPage(0, 12).subscribe({
      next: (page) => this.state.set({ status: 'ready', books: page.content }),
      error: (err) => {
        const msg = err?.error?.message ?? 'Greška pri učitavanju knjiga.';
        this.state.set({ status: 'error', message: msg });
      },
    });
  }

  openDetails(book: BookDto) {
    this.noCopiesMessage.set('');
    this.selectedBook.set(book);
  }

  closeDetails() {
    this.selectedBook.set(null);
    this.noCopiesMessage.set('');
  }

  // Za sada ne radi rezervaciju — samo validacija i placeholder
  clickReserveFromDetails() {
    const b = this.selectedBook();
    if (!b) return;

    if (b.copiesAvailable <= 0) {
      this.noCopiesMessage.set('Nema dostupnih knjiga.');
      return;
    }

    // TODO: ovde kasnije otvaraš drugi modal za zakazivanje termina
    // npr. this.openReserveModal(b);
    console.log('Reserve modal placeholder for:', b.bookID);
  }
}