import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; books: BookDto[] };

@Component({
  selector: 'app-librarian-books',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './librarian-books.component.html',
})
export class LibrarianBooksComponent {
  private bookService = inject(BookService);
  private fb = inject(FormBuilder);

  state = signal<UiState>({ status: 'loading' });

  // DETAILS MODAL
  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  // ADD BOOK MODAL
  showAddModal = signal(false);
  addError = signal('');
  addLoading = signal(false);
  addSuccess = signal('');

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    author: ['', [Validators.required, Validators.minLength(2)]],
    isbn: ['', [Validators.required, Validators.minLength(5)]],
    category: ['', [Validators.required]],
    publishedYear: [new Date().getFullYear(), [Validators.required, Validators.min(0)]],
    copiesTotal: [1, [Validators.required, Validators.min(1)]],
    copiesAvailable: [1, [Validators.required, Validators.min(0)]],
    description: [''],
  });

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
  }

  closeDetails() {
    this.selectedBook.set(null);
  }

  // ADD MODAL handlers
  openAdd() {
    this.addError.set('');
    this.addSuccess.set('');
    this.form.reset({
      title: '',
      author: '',
      isbn: '',
      category: '',
      publishedYear: new Date().getFullYear(),
      copiesTotal: 1,
      copiesAvailable: 1,
      description: '',
    });
    this.showAddModal.set(true);
  }

  closeAdd() {
    if (this.addLoading()) return;
    this.showAddModal.set(false);
  }

  submitAdd() {
    this.addError.set('');
    this.addSuccess.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const ok = window.confirm('Da li ste sigurni da želite da dodate novu knjigu?');
    if (!ok) return;

    const payload = this.form.getRawValue();

    if (payload.copiesAvailable > payload.copiesTotal) {
      this.addError.set('Dostupne kopije ne mogu biti veće od ukupnih.');
      return;
    }

    this.addLoading.set(true);

    this.bookService.create(payload).subscribe({
      next: () => {
        this.addLoading.set(false);
        this.addSuccess.set('Knjiga je uspješno dodata.');
        this.showAddModal.set(false);
        this.loadBooks();
      },
      error: (err) => {
        this.addLoading.set(false);
        const msg = err?.error?.message ?? 'Greška pri dodavanju knjige.';
        this.addError.set(msg);
      },
    });
  }
}