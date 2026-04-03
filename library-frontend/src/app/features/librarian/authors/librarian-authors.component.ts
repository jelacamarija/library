import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorService, Author } from '../../../core/services/author.service';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; authors: Author[] };

@Component({
  selector: 'app-librarian-authors',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './librarian-authors.component.html',
})
export class LibrarianAuthorsComponent {

  private authorService = inject(AuthorService);
  private fb = inject(FormBuilder);

  state = signal<UiState>({ status: 'loading' });

  loading = signal(false);
  error = signal<string | null>(null);

  page = signal(0);
  size = signal(9);
  totalPages = signal(1);
  totalElements = signal(0);

  query = signal('');

  selectedAuthor = signal<Author | null>(null);
  showDetailsModal = computed(() => this.selectedAuthor() !== null);

  showAddModal = signal(false);
  addError = signal('');
  addLoading = signal(false);

  showEditModal = signal(false);
  editLoading = signal(false);
  editError = signal('');

  addForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    biography: [''],
  });

  editForm = this.fb.nonNullable.group({
    biography: ['', [Validators.required, Validators.minLength(3)]],
  });

  isLoading = computed(() => this.state().status === 'loading');
  isError = computed(() => this.state().status === 'error');

  errorMessage = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  });

  authors = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.authors : [];
  });

  constructor() {
    effect(() => this.fetch());
  }

  fetch() {
    this.loading.set(true);

    const q = this.query().trim();

    const obs = q
      ? this.authorService.search(q, this.page(), this.size())
      : this.authorService.getAll(this.page(), this.size());

    obs.subscribe({
      next: (res) => {
        this.state.set({ status: 'ready', authors: res.content ?? [] });
        this.totalPages.set(res.totalPages ?? 1);
        this.totalElements.set(res.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.state.set({ status: 'error', message: 'Greška pri učitavanju autora.' });
      },
    });
  }

  private debounceTimer: any;

  onQueryChange(value: string) {
    this.query.set(value);
    this.page.set(0);

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.fetch(), 300);
  }

  clearQuery() {
    this.query.set('');
    this.page.set(0);
    this.fetch();
  }

  prevPage() {
    if (this.page() > 0) this.page.set(this.page() - 1);
  }

  nextPage() {
    if (this.page() + 1 < this.totalPages()) this.page.set(this.page() + 1);
  }

  onSizeChange(value: string) {
    this.size.set(Number(value));
    this.page.set(0);
  }

  openDetails(a: Author) {
    this.selectedAuthor.set(a);
  }

  closeDetails() {
    this.selectedAuthor.set(null);
  }

  openAdd() {
    this.addForm.reset({ name: '', biography: '' });
    this.showAddModal.set(true);
  }

  closeAdd() {
    if (this.addLoading()) return;
    this.showAddModal.set(false);
  }

  submitAdd() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    this.addLoading.set(true);

    this.authorService.create(this.addForm.getRawValue()).subscribe({
      next: () => {
        this.addLoading.set(false);
        this.showAddModal.set(false);
        this.fetch();
      },
      error: () => {
        this.addLoading.set(false);
        this.addError.set('Greška pri dodavanju autora.');
      },
    });
  }

  // EDIT
  openEdit() {
    const a = this.selectedAuthor();
    if (!a) return;

    this.editForm.patchValue({
      biography: a.biography || '',
    });

    this.showEditModal.set(true);
  }

  closeEdit() {
    if (this.editLoading()) return;
    this.showEditModal.set(false);
  }

  submitEdit() {
    const a = this.selectedAuthor();
    if (!a) return;

    this.editLoading.set(true);

    this.authorService.updateBiography(a.authorID, this.editForm.value.biography!).subscribe({
      next: (updated) => {
        this.editLoading.set(false);
        this.selectedAuthor.set(updated);
        this.showEditModal.set(false);
        this.fetch();
      },
      error: () => {
        this.editLoading.set(false);
        this.editError.set('Greška pri izmjeni.');
      },
    });
  }
}