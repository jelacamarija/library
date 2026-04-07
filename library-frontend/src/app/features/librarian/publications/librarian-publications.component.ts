import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { PublicationService, PublicationDto } from '../../../core/services/publication.service';
import { BookService } from '../../../core/services/book.service';
import { BookDto } from '../../../core/models/book.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

type UiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; publications: PublicationDto[] };

@Component({
  selector: 'app-librarian-publications',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './librarian-publications.component.html',
})

export class LibrarianPublicationsComponent {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private publicationService = inject(PublicationService);
  private bookService=inject(BookService);

  state = signal<UiState>({ status: 'loading' });


  bookId!: number;
  book=signal<BookDto | null>(null);
  isLoading = computed(() => this.state().status === 'loading');
  isError = computed(() => this.state().status === 'error');

  private fb = inject(FormBuilder);

  showAddModal = signal(false);
  addLoading = signal(false);
  addError = signal('');
  successMessage=signal('');
  query = signal('');
  private debounceTimer: any;;


  page = 0;
size = 5;
totalPages = 1;
totalElements = 0;

  errorMessage = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  });

  publications = computed(() => {
    const s = this.state();
    return s.status === 'ready' ? s.publications : [];
  });

  ngOnInit() {
    this.bookId = Number(this.route.snapshot.paramMap.get('bookId'));
    this.loadBook();

      

    this.fetch();
  }

  fetch() {
  this.state.set({ status: 'loading' });

  const q = this.query().trim();

  const obs = this.publicationService.getByBook(
    this.bookId,
    this.page,
    this.size
  );

  obs.subscribe({
    next: (res: any) => {
      let data = res.content ?? [];

      // 🔥 FRONTEND FILTER (jer backend nema isbn filter po bookId)
      if (q) {
        data = data.filter((p: PublicationDto) =>
  p.isbn.toLowerCase().includes(q.toLowerCase())
);
      }

      this.state.set({
        status: 'ready',
        publications: data,
      });

      this.totalPages = res.totalPages;
      this.totalElements = res.totalElements;
    },
    error: () => {
      this.state.set({
        status: 'error',
        message: 'Greška pri učitavanju publikacija.',
      });
    },
  });
}

  loadBook(){
    this.bookService.getById(this.bookId).subscribe({
      next: (b) => this.book.set(b),
    });
  }

onQueryChange(value: string) {
  this.query.set(value);
  this.page = 0;

  clearTimeout(this.debounceTimer);

  this.debounceTimer = setTimeout(() => {
    this.fetch();
  }, 300);
}

  openInstances(p: PublicationDto) {
    this.router.navigate(['/librarian/instances', p.publicationID]);
  }

  addForm = this.fb.nonNullable.group({
  isbn: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
  publisher: ['', Validators.required],
  publishedYear: [new Date().getFullYear(), Validators.required],
  edition: ['', Validators.required],
  language: ['', Validators.required],
  });

openAdd() {
  this.addError.set('');

  this.addForm.reset({
    isbn: '',
    publisher: '',
    publishedYear: new Date().getFullYear(),
    edition: '',
    language: '',
  });

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

  const payload = {
    ...this.addForm.getRawValue(),
    bookId: this.bookId, // VEOMA BITNO
  };

  this.addLoading.set(true);

  this.publicationService.create(payload).subscribe({
    next: () => {
      this.addLoading.set(false);

      this.successMessage.set("Uspjesno ste dodali novu publikaciju");

      this.showAddModal.set(false);
      this.fetch(); // refresh

       setTimeout(() => this.successMessage.set(''), 3000);
    },
    error: (err) => {
      this.addLoading.set(false);
      this.addError.set(err?.error?.message ?? 'Greška pri dodavanju.');
    },
  });
}

nextPage() {
  if (this.page < this.totalPages - 1) {
    this.page++;
    this.fetch();
  }
}

prevPage() {
  if (this.page > 0) {
    this.page--;
    this.fetch();
  }
}

refresh() {
  this.page = 0;
  this.fetch();
}

onSizeChange(value: number) {
  this.size = Number(value);
  this.page = 0; // 🔥 reset stranice
  this.fetch();
}

}