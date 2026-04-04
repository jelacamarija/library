import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { PublicationService, PublicationDto } from '../../../core/services/publication.service';

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

  state = signal<UiState>({ status: 'loading' });

  bookId!: number;

  isLoading = computed(() => this.state().status === 'loading');
  isError = computed(() => this.state().status === 'error');

  private fb = inject(FormBuilder);

    showAddModal = signal(false);
    addLoading = signal(false);
    addError = signal('');

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
    this.loadPublications();
  }

  loadPublications() {
    this.state.set({ status: 'loading' });

    this.publicationService.getByBook(this.bookId).subscribe({
      next: (page) => {
        this.state.set({
          status: 'ready',
          publications: page.content ?? [],
        });
      },
      error: (err) => {
        this.state.set({
          status: 'error',
          message: err?.error?.message ?? 'Greška pri učitavanju publikacija.',
        });
      },
    });
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
      this.showAddModal.set(false);
      this.loadPublications(); // refresh
    },
    error: (err) => {
      this.addLoading.set(false);
      this.addError.set(err?.error?.message ?? 'Greška pri dodavanju.');
    },
  });
}



}