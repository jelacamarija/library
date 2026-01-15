import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './librarian-search.component.html',
})
export class LibrarianSearchComponent {
  private bookService = inject(BookService);
  private fb = inject(FormBuilder);

  // SEARCH INPUT
  query = signal('');

  // UI state
  state = signal<UiState>({ status: 'loading' });

  // debounce stream
  private search$ = new Subject<string>();

  // DETAILS MODAL
  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  // ADD BOOK MODAL
  showAddModal = signal(false);
  addError = signal('');
  addLoading = signal(false);

  // EDIT MODAL
  showEditModal = signal(false);
  editLoading = signal(false);
  editError = signal('');
  editMode = signal<'description' | 'copies'>('description');

  // FORMS
  addForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    author: ['', [Validators.required, Validators.minLength(2)]],
    isbn: ['', [Validators.required, Validators.minLength(5)]],
    category: ['', [Validators.required]],
    publishedYear: [new Date().getFullYear(), [Validators.required, Validators.min(0)]],
    copiesTotal: [1, [Validators.required, Validators.min(1)]],
    copiesAvailable: [1, [Validators.required, Validators.min(0)]],
    description: [''],
  });

  editDescriptionForm = this.fb.nonNullable.group({
    description: ['', [Validators.required, Validators.minLength(3)]],
  });

  editCopiesForm = this.fb.nonNullable.group({
    copiesToAdd: [1, [Validators.required, Validators.min(1)]],
  });

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

  // helper: refresh results (ako ima query -> pretraga, ako nema -> sve)
  private refreshAfterChange() {
    const q = this.query().trim();
    if (!q) {
      this.loadAll();
      return;
    }

    this.state.set({ status: 'loading' });
    this.bookService.search(q, 0, 12).subscribe({
      next: (page: any) => this.state.set({ status: 'ready', books: page.content ?? [] }),
      error: (err: any) => {
        const msg = err?.error?.message ?? 'Greška pri pretrazi.';
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

  // ADD BOOK MODAL
  openAdd() {
    this.addError.set('');
    this.addForm.reset({
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

    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    const ok = window.confirm('Da li ste sigurni da želite da dodate novu knjigu?');
    if (!ok) return;

    const payload = this.addForm.getRawValue();

    if (payload.copiesAvailable > payload.copiesTotal) {
      this.addError.set('Dostupne kopije ne mogu biti veće od ukupnih.');
      return;
    }

    this.addLoading.set(true);

    this.bookService.create(payload).subscribe({
      next: () => {
        this.addLoading.set(false);
        this.showAddModal.set(false);
        this.refreshAfterChange();
      },
      error: (err) => {
        this.addLoading.set(false);
        this.addError.set(err?.error?.message ?? 'Greška pri dodavanju knjige.');
      },
    });
  }

  // EDIT MODAL
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
        this.refreshAfterChange();
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message ?? 'Greška pri izmjeni opisa.');
      },
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
        this.refreshAfterChange();
      },
      error: (err) => {
        this.editLoading.set(false);
        this.editError.set(err?.error?.message ?? 'Greška pri dodavanju kopija.');
      },
    });
  }
}
