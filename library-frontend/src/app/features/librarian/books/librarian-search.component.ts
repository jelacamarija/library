import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; books: BookDto[] };

@Component({
  selector: 'app-librarian-search',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './librarian-search.component.html',
})
export class LibrarianSearchComponent {
  private bookService = inject(BookService);

  // SEARCH INPUT
  query = signal('');

  // UI state
  state = signal<UiState>({ status: 'loading' });

  // debounce stream
  private search$ = new Subject<string>();

  // DETAILS MODAL
  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  // computed
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
    // 1) odmah prikaži sve
    this.loadAll();

    // 2) auto pretraga dok kucaš
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

  // DETAILS MODAL
  openDetails(book: BookDto) {
    this.selectedBook.set(book);
  }

  closeDetails() {
    this.selectedBook.set(null);
  }
}