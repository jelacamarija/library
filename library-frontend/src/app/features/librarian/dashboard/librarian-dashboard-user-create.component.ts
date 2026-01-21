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

    <form
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="bg-white border rounded-2xl p-6 space-y-4"
    >
      <div>
        <label class="block text-sm text-gray-700 mb-1">Ime i prezime</label>
        <input
          class="w-full border rounded-xl px-3 py-2"
          formControlName="name"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-700 mb-1">Email</label>
        <input
          type="email"
          class="w-full border rounded-xl px-3 py-2"
          formControlName="email"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-700 mb-1">Broj telefona</label>
        <input
          class="w-full border rounded-xl px-3 py-2"
          formControlName="phoneNumber"
        />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border"
          (click)="back()"
        >
          Nazad
        </button>

        <button
          type="submit"
          [disabled]="form.invalid || loading()"
          class="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
        >
          {{ loading() ? 'Kreiram...' : 'Kreiraj korisnika' }}
        </button>
      </div>
    </form>
  </div>

  <!-- ===== MODAL ===== -->
  <div
    *ngIf="modalOpen()"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  >
    <div class="bg-white rounded-2xl shadow-xl w-[92%] max-w-md p-6 relative">
      <button
        (click)="closeModal()"
        class="absolute top-3 right-3 text-gray-400 text-xl"
      >
        ✕
      </button>

      <h2
        class="text-lg font-semibold mb-2"
        [ngClass]="{
          'text-red-600': modalType() === 'error',
          'text-green-600': modalType() === 'success'
        }"
      >
        {{ modalTitle() }}
      </h2>

      <p class="text-gray-700 mb-6">
        {{ modalText() }}
      </p>

      <div class="flex justify-end">
        <button
          (click)="closeModal()"
          class="px-4 py-2 bg-blue-600 text-white rounded-xl"
        >
          OK
        </button>
      </div>
    </div>
  </div>
  `,
})
export class LibrarianDashboardUserCreateComponent {
  private api = inject(LibrarianUsersService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loading = signal(false);

  modalOpen = signal(false);
  modalTitle = signal('');
  modalText = signal('');
  modalType = signal<'error' | 'info' | 'success'>('info');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    this.api.createUser(this.form.getRawValue()).subscribe({
      next: (msg) => {
        this.loading.set(false);
        this.form.reset({ name: '', email: '', phoneNumber: '' });

        this.openModal(
          'success',
          'Uspješno',
          msg || 'Korisnik kreiran. Poslat mejl za postavljanje lozinke.'
        );
      },
      error: (err) => {
        this.loading.set(false);
        const parsed = this.parseCreateUserError(err);
        this.openModal('error', parsed.title, parsed.text);
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/librarian/dashboard/users');
  }

  private openModal(type: 'error' | 'info' | 'success', title: string, text: string) {
    this.modalType.set(type);
    this.modalTitle.set(title);
    this.modalText.set(text);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
    this.modalTitle.set('');
    this.modalText.set('');
    this.modalType.set('info');
  }

  private parseCreateUserError(err: any): { title: string; text: string } {
    const raw =
      (err?.error?.message ??
        err?.error?.error ??
        (typeof err?.error === 'string' ? err.error : null) ??
        'Neuspješno kreiranje korisnika.'
      ).toString();

    const msg = raw.toLowerCase();

    if (err?.status === 409 || msg.includes('vec postoji') || msg.includes('već postoji')) {
      return {
        title: 'Email je zauzet',
        text: 'Korisnik sa ovim emailom već postoji. Unesite drugi email.',
      };
    }

    return {
      title: 'Greška',
      text: raw,
    };
  }
}
