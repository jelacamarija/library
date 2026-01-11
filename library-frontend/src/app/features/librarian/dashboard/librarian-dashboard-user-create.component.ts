import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LibrarianUsersService } from '../../../core/services/librarian-users.service';

@Component({
  selector: 'app-librarian-user-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="mx-auto max-w-2xl px-4 py-6">
    <div class="mb-4">
      <h1 class="text-2xl font-bold">Dodaj novog korisnika</h1>
      <p class="text-sm text-gray-600">
        Unesite podatke. Korisniku će stići mejl za postavljanje lozinke.
      </p>
    </div>

    <div *ngIf="error()" class="mb-4 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
      {{ error() }}
    </div>

    <div *ngIf="success()" class="mb-4 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
      {{ success() }}
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white border rounded-2xl p-6 space-y-4">
      <div>
        <label class="block text-sm text-gray-700 mb-1">Ime i prezime</label>
        <input
          class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          formControlName="name"
          placeholder="npr. Petar Petrović"
        />
        <div *ngIf="form.controls.name.touched && form.controls.name.invalid" class="text-xs text-red-600 mt-1">
          Unesi ime i prezime.
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-700 mb-1">Email</label>
        <input
          type="email"
          class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          formControlName="email"
          placeholder="npr. petar@gmail.com"
        />
        <div *ngIf="form.controls.email.touched && form.controls.email.invalid" class="text-xs text-red-600 mt-1">
          Unesi ispravan email.
        </div>
      </div>

      <div>
        <label class="block text-sm text-gray-700 mb-1">Broj telefona</label>
        <input
          class="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          formControlName="phoneNumber"
          placeholder="npr. 06x/xxx-xxx"
        />
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <button type="button" class="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50" (click)="back()">
          Nazad
        </button>
        <button
          type="submit"
          class="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          [disabled]="form.invalid || loading()"
        >
          <span *ngIf="loading()">Kreiram...</span>
          <span *ngIf="!loading()">Kreiraj korisnika</span>
        </button>
      </div>
    </form>
  </div>
  `,
})
export class LibrarianDashboardUserCreateComponent {
  private api = inject(LibrarianUsersService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
  });

  submit(): void {
    this.error.set(null);
    this.success.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = this.form.getRawValue();

    this.api.createUser(payload).subscribe({
      next: (msg) => {
        this.loading.set(false);
        this.success.set(msg || 'Korisnik kreiran. Poslat mejl za postavljanje lozinke.');
        this.form.reset({ name: '', email: '', phoneNumber: '' });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Neuspješno kreiranje korisnika.');
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/librarian/dashboard/users');
  }
}
