
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  state = signal<UiState>({ status: 'loading' });

  selectedBook = signal<BookDto | null>(null);
  showDetailsModal = computed(() => this.selectedBook() !== null);

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

  openConfirm(opts: { title?: string; message: string; okText?: string; action: () => void }) {
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
    title: ['', [Validators.required, Validators.minLength(2)]],
    author: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', [Validators.required]],
    description: [''],
  });

  // EDIT MODAL
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
      next: (page) => this.state.set({ status: 'ready', books: page.content ?? [] }),
      error: (err) => {
        const msg = err?.error?.message ?? 'Greška pri učitavanju knjiga.';
        this.state.set({ status: 'error', message: msg });
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
  this.router.navigate(['/librarian/publications', book.bookID]);
}



 




 

  
 

  
}

