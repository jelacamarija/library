import { Component, OnInit, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-librarian-receipts',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './librarian-receipts.component.html'
})
export class LibrarianReceiptsComponent implements OnInit {

  loading = signal(false);

  successMessage = signal('');

  errorMessage = signal('');

  form!: FormGroup;

  publications = signal<any[]>([]);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {

    this.form = this.fb.group({
      supplier: [''],
      note: [''],
      items: this.fb.array([])
    });

    this.addItem();

    this.loadPublications();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem(): void {

    this.items.push(
      this.fb.group({
        publicationId: [
          null,
          Validators.required
        ],
        quantity: [
          1,
          [Validators.required, Validators.min(1)]
        ],
        location: [
          '',
          Validators.required
        ]
      })
    );
  }

  removeItem(index: number): void {

    if (this.items.length === 1) {
      return;
    }

    this.items.removeAt(index);
  }

  loadPublications(): void {

    this.http.get<any>(
      'http://localhost:8080/api/publications/all'
    ).subscribe({
      next: (response) => {

        this.publications.set(
          response.content || response
        );
      }
    });
  }

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    this.loading.set(true);

    this.http.post(
      'http://localhost:8080/api/receipts',
      this.form.value
    ).subscribe({
      next: () => {

        this.loading.set(false);

        this.successMessage.set(
          'Prijemnica je uspešno kreirana.'
        );

        this.errorMessage.set('');

        this.form.reset();

        this.items.clear();

        this.addItem();
      },
      error: (err) => {

        this.loading.set(false);

        this.errorMessage.set(
          err?.error?.message ||
          'Došlo je do greške.'
        );
      }
    });
  }
}