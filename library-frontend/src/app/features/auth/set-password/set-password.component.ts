import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
  <div class="min-h-screen flex items-center justify-center bg-gray-100 p-6">
    <div class="max-w-md w-full bg-white p-6 rounded shadow">
      <h1 class="text-2xl font-semibold mb-2">Postavi lozinku</h1>
      <p class="text-sm text-gray-600 mb-4">
        Unesi lozinku da aktiviraš nalog.
      </p>

      <div *ngIf="error()" class="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {{ error() }}
      </div>

      <div *ngIf="success()" class="mb-4 p-3 rounded border border-green-200 bg-green-50 text-green-800 text-sm">
        {{ success() }}
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="block text-sm text-gray-700 mb-1">Lozinka</label>
          <input
            type="password"
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            formControlName="password"
          />
          <div *ngIf="form.controls.password.touched && form.controls.password.invalid"
               class="text-xs text-red-600 mt-1">
            Lozinka je obavezna (min 6 karaktera).
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-700 mb-1">Potvrdi lozinku</label>
          <input
            type="password"
            class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            formControlName="confirm"
          />
          <div *ngIf="form.controls.confirm.touched && form.controls.confirm.invalid"
               class="text-xs text-red-600 mt-1">
            Potvrda lozinke je obavezna.
          </div>
          <div *ngIf="passwordMismatch()" class="text-xs text-red-600 mt-1">
            Lozinke se ne poklapaju.
          </div>
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          [disabled]="loading() || form.invalid || passwordMismatch() || !code"
        >
          <span *ngIf="loading()">Snima...</span>
          <span *ngIf="!loading()">Sačuvaj lozinku</span>
        </button>

        <button
          type="button"
          class="w-full border border-gray-300 py-2 rounded hover:bg-gray-50"
          (click)="goToLogin()"
        >
          Nazad na prijavu
        </button>
      </form>
    </div>
  </div>
  `
})
export class SetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  code = this.route.snapshot.queryParamMap.get('code') ?? '';

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
  });

  passwordMismatch(): boolean {
    const { password, confirm } = this.form.getRawValue();
    return !!password && !!confirm && password !== confirm;
  }

  submit(): void {
    this.error.set(null);
    this.success.set(null);

    if (!this.code) {
      this.error.set('Nedostaje verifikacioni kod u linku.');
      return;
    }
    if (this.form.invalid || this.passwordMismatch()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const password = this.form.getRawValue().password;

    this.http.post('/api/register/set-password', { code: this.code, password }, { responseType: 'text' })
      .subscribe({
        next: (msg) => {
          this.loading.set(false);
          this.success.set(msg || 'Lozinka postavljena. Nalog je aktiviran.');
          // opcionalno: nakon 1-2 sekunde preusmjeri na login
          setTimeout(() => this.router.navigateByUrl('/login'), 800);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.message ?? err?.error ?? 'Neuspješno postavljanje lozinke.');
        }
      });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
