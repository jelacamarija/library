import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  private router = inject(Router);

  state = signal<UiState>({ status: 'loading' });

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


  goDetails(book: BookDto) {
    this.router.navigate(['/client/books', book.bookID]);
  }

  goReserve(book: BookDto) {
    this.router.navigate(['/client/books', book.bookID, 'reserve']);
  }
}
