import { Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthorService } from '../../../core/services/author.service';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; books: BookDto[] };

type AuthorItem = {
  authorID: number;
  name: string;
};

@Component({
  selector: 'app-librarian-books',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './librarian-books.component.html',
})
export class LibrarianBooksComponent {

  private bookService = inject(BookService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authorService = inject(AuthorService);

  state = signal<UiState>({ status: 'loading' });

  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

  // AUTORI
  authors = signal<AuthorItem[]>([]);
  authorQuery = signal('');
  selectedAuthors = signal<AuthorItem[]>([]);

  filteredAuthors = computed(() => {
    const query = this.authorQuery().trim().toLowerCase();

    if (!query) {
      return [];
    }

    const selectedIds = this.selectedAuthors().map(
      author => author.authorID
    );

    return this.authors()
      .filter(author =>
        author.name.toLowerCase().includes(query) &&
        !selectedIds.includes(author.authorID)
      )
      .slice(0, 5);
  });

  // PAGINACIJA
  page = signal(0);
  size = signal(9);
  totalPages = signal(1);
  totalElements = signal(0);

  // PRETRAGA KNJIGA
  query = signal('');

  private debounceTimer: any;

  onQueryChange(value: string) {
    this.query.set(value);
    this.page.set(0);

    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.fetch();
    }, 300);
  }

  clearQuery() {
    this.query.set('');
    this.page.set(0);
    this.fetch();
  }

  prevPage() {
    if (this.page() === 0) return;

    this.page.set(this.page() - 1);
  }

  nextPage() {
    if (this.page() + 1 >= this.totalPages()) return;

    this.page.set(this.page() + 1);
  }

  // ADD MODAL
  showAddModal = signal(false);
  addError = signal('');
  addLoading = signal(false);
  addSuccess = signal('');

  // CONFIRM MODAL
  showConfirm = signal(false);
  confirmTitle = signal('Potvrda');
  confirmMessage = signal('');
  confirmOkText = signal('Potvrdi');
  confirmLoading = signal(false);

  private pendingConfirmAction: (() => void) | null = null;

  openConfirm(opts: {
    title?: string;
    message: string;
    okText?: string;
    action: () => void;
  }) {
    this.confirmTitle.set(opts.title ?? 'Potvrda');
    this.confirmMessage.set(opts.message);
    this.confirmOkText.set(opts.okText ?? 'Potvrdi');
    this.pendingConfirmAction = opts.action;
    this.showConfirm.set(true);
  }

  closeConfirm() {
    if (this.confirmLoading()) return;

    this.showConfirm.set(false);
    this.pendingConfirmAction = null;
  }

  confirmProceed() {
    const action = this.pendingConfirmAction;

    if (!action) return;

    this.showConfirm.set(false);
    this.pendingConfirmAction = null;

    action();
  }

  // ADD FORM
  addForm = this.fb.nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(2)
      ]
    ],

    authorIds: this.fb.nonNullable.control<number[]>(
      [],
      [
        Validators.required,
        (control) =>
          control.value.length > 0
            ? null
            : { required: true }
      ]
    ),

    category: [
      '',
      Validators.required
    ],

    description: ['']
  });

  // PRETRAGA AUTORA
  onAuthorSearch(value: string) {
    this.authorQuery.set(value);
  }

  // DODAJ AUTORA
  addAuthor(author: AuthorItem) {
    const current = this.selectedAuthors();

    const alreadySelected = current.some(
      a => a.authorID === author.authorID
    );

    if (alreadySelected) {
      return;
    }

    const updated = [
      ...current,
      author
    ];

    this.selectedAuthors.set(updated);

    this.addForm.controls.authorIds.setValue(
      updated.map(a => a.authorID)
    );

    this.addForm.controls.authorIds.markAsTouched();
    this.addForm.controls.authorIds.updateValueAndValidity();

    // očisti pretragu nakon izbora
    this.authorQuery.set('');
  }

  // UKLONI AUTORA
  removeAuthor(authorId: number) {
    const updated = this.selectedAuthors().filter(
      author => author.authorID !== authorId
    );

    this.selectedAuthors.set(updated);

    this.addForm.controls.authorIds.setValue(
      updated.map(author => author.authorID)
    );

    this.addForm.controls.authorIds.markAsTouched();
    this.addForm.controls.authorIds.updateValueAndValidity();
  }

  // EDIT MODAL
  showEditModal = signal(false);
  editLoading = signal(false);
  editError = signal('');
  editMode = signal<'description' | 'copies'>('description');

  editDescriptionForm = this.fb.nonNullable.group({
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(3)
      ]
    ],
  });

  editCopiesForm = this.fb.nonNullable.group({
    copiesToAdd: [
      1,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],
  });

  isLoading = computed(
    () => this.state().status === 'loading'
  );

  isError = computed(
    () => this.state().status === 'error'
  );

  errorMessage = computed(() => {
    const s = this.state();

    return s.status === 'error'
      ? s.message
      : '';
  });

  books = computed(() => {
    const s = this.state();

    return s.status === 'ready'
      ? s.books
      : [];
  });

  ngOnInit() {
    this.loadAuthors();
  }

  constructor() {
    effect(() => {
      this.page();
      this.size();
      this.query();

      this.fetch();
    });
  }

  private loadAuthors() {
    this.authorService
      .getAll(0, 100)
      .subscribe({
        next: (res) => {
          this.authors.set(res.content ?? []);
        },

        error: () => {
          this.authors.set([]);
        },
      });
  }

  private loadBooks() {
    this.state.set({
      status: 'loading'
    });

    this.bookService
      .getPage(0, 12)
      .subscribe({
        next: (page) => {
          this.state.set({
            status: 'ready',
            books: page.content ?? []
          });
        },

        error: (err) => {
          const msg =
            err?.error?.message ??
            'Greška pri učitavanju knjiga.';

          this.state.set({
            status: 'error',
            message: msg
          });
        },
      });
  }

  fetch() {
    this.state.set({
      status: 'loading'
    });

    const q = this.query().trim();

    const obs = q
      ? this.bookService.search(
          q,
          this.page(),
          this.size()
        )
      : this.bookService.getPage(
          this.page(),
          this.size()
        );

    obs.subscribe({
      next: (res) => {
        this.state.set({
          status: 'ready',
          books: res.content ?? []
        });

        this.totalPages.set(
          res.totalPages ?? 1
        );

        this.totalElements.set(
          res.totalElements ?? 0
        );
      },

      error: () => {
        this.state.set({
          status: 'error',
          message: 'Greška pri učitavanju knjiga.'
        });
      },
    });
  }

  // DETAILS
  openDetails(book: BookDto) {
    this.selectedBook.set(book);
  }

  closeDetails() {
    this.selectedBook.set(null);
  }

  openPublications(book: BookDto) {
    this.router.navigate([
      '/librarian/publications',
      book.bookID
    ]);
  }

  // OTVORI ADD MODAL
  openAdd() {
    this.addForm.reset({
      title: '',
      authorIds: [],
      category: '',
      description: ''
    });

    this.authorQuery.set('');
    this.selectedAuthors.set([]);

    this.addError.set('');
    this.addSuccess.set('');

    this.showAddModal.set(true);
  }

  // ZATVORI ADD MODAL
  closeAdd() {
    if (this.addLoading()) return;

    this.showAddModal.set(false);

    this.authorQuery.set('');
    this.selectedAuthors.set([]);

    this.addForm.reset({
      title: '',
      authorIds: [],
      category: '',
      description: ''
    });
  }

  // DODAJ KNJIGU
  submitAdd() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.addLoading.set(true);
    this.addError.set('');

    const raw = this.addForm.getRawValue();

    const payload = {
      ...raw,

      authorIds: raw.authorIds.map(
        id => Number(id)
      )
    };

    this.bookService
      .create(payload)
      .subscribe({
        next: () => {
          this.addLoading.set(false);

          this.addSuccess.set(
            'Knjiga uspešno dodata!'
          );

          this.closeAdd();
          this.loadBooks();
        },

        error: (err) => {
          this.addLoading.set(false);

          this.addError.set(
            err?.error?.message ||
            'Greška pri dodavanju.'
          );
        },
      });
  }

  // EDIT DESCRIPTION
  openEditDescription() {
    const b = this.selectedBook();

    if (!b) return;

    this.editMode.set('description');

    this.editDescriptionForm.patchValue({
      description: b.description || ''
    });

    this.showEditModal.set(true);
  }

  submitEditDescription() {
    const b = this.selectedBook();

    if (
      !b ||
      this.editDescriptionForm.invalid
    ) {
      return;
    }

    this.editLoading.set(true);

    this.bookService
      .updateDescription(
        b.bookID,
        this.editDescriptionForm.value.description!
      )
      .subscribe({
        next: (updated) => {
          this.editLoading.set(false);

          this.selectedBook.set(updated);
          this.showEditModal.set(false);

          this.fetch();
        },

        error: () => {
          this.editLoading.set(false);

          this.editError.set(
            'Greška pri izmjeni.'
          );
        },
      });
  }

  closeEdit() {
    if (this.editLoading()) return;

    this.showEditModal.set(false);
    this.editError.set('');

    this.editDescriptionForm.reset({
      description: ''
    });
  }
}