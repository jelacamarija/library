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

  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  showAddModal = signal(false);
  addError = signal('');
  addLoading = signal(false);
  addSuccess = signal('');

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    author: ['', [Validators.required, Validators.minLength(2)]],

    isbn: [
      '',
      [
        Validators.required,
        Validators.pattern(/^\d{13}$/),
      ],
    ],

    category: ['', [Validators.required]],

    publishedYear: [
      new Date().getFullYear(),
      [Validators.required, Validators.min(1)],
    ],

    copiesTotal: [1, [Validators.required, Validators.min(1)]],

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

  showEditModal = signal(false);
  editLoading = signal(false);
  editError = signal('');
  editMode = signal<'description' | 'copies'>('description');

    editDescriptionForm = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  editCopiesForm = this.fb.nonNullable.group({
    copiesToAdd: [1, [Validators.required, Validators.min(1)]],
  });

  openEdit(mode: 'description' | 'copies') {
  this.editError.set('');
  this.editMode.set(mode);

  const b = this.selectedBook();
  if (!b) return;

  if (mode === 'description') {
    this.editDescriptionForm.reset({ description: b.description ?? '' });
  } else {
    this.editCopiesForm.reset({ copiesToAdd: 1 });
  }

  this.showEditModal.set(true);
}

closeEdit() {
  if (this.editLoading()) return;
  this.showEditModal.set(false);
}

submitEditDescription() {
  this.editError.set('');
  const b = this.selectedBook();
  if (!b) return;

  if (this.editDescriptionForm.invalid) {
    this.editDescriptionForm.markAllAsTouched();
    return;
  }

  const ok = window.confirm('Da li ste sigurni da želite da izmijenite opis?');
  if (!ok) return;

  this.editLoading.set(true);

  const { description } = this.editDescriptionForm.getRawValue();

  this.bookService.updateDescription(b.bookID as any, description).subscribe({
    next: (updated) => {
      this.editLoading.set(false);
      this.showEditModal.set(false);
      this.selectedBook.set(updated); 
      this.loadBooks(); 
    },
    error: (err) => {
      this.editLoading.set(false);
      this.editError.set(err?.error?.message ?? 'Greška pri izmjeni opisa.');
    }
  });
}

submitEditCopies() {
  this.editError.set('');
  const b = this.selectedBook();
  if (!b) return;

  if (this.editCopiesForm.invalid) {
    this.editCopiesForm.markAllAsTouched();
    return;
  }

  const ok = window.confirm('Da li ste sigurni da želite da dodate kopije?');
  if (!ok) return;

  this.editLoading.set(true);

  const { copiesToAdd } = this.editCopiesForm.getRawValue();

  this.bookService.updateCopies(b.bookID as any, copiesToAdd).subscribe({
    next: (updated) => {
      this.editLoading.set(false);
      this.showEditModal.set(false);
      this.selectedBook.set(updated);
      this.loadBooks();
    },
    error: (err) => {
      this.editLoading.set(false);
      this.editError.set(err?.error?.message ?? 'Greška pri dodavanju kopija.');
    }
  });
}
}