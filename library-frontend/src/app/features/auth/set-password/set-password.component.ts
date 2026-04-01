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

      <div *ngIf="!code" class="mb-4 text-red-600 text-sm">
        Nevažeći link. Nedostaje kod.
      </div>

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
            autofocus
            class="w-full border rounded px-3 py-2"
            formControlName="password"
          />
          <div *ngIf="form.controls.password.touched && form.controls.password.invalid"
               class="text-xs text-red-600 mt-1">
            Lozinka mora imati minimum 6 karaktera.
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-700 mb-1">Potvrdi lozinku</label>
          <input
            type="password"
            class="w-full border rounded px-3 py-2"
            formControlName="confirm"
          />
        </div>

        <div *ngIf="form.errors?.['mismatch'] && form.touched"
             class="text-xs text-red-600 mt-1">
          Lozinke se ne poklapaju.
        </div>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          [disabled]="loading() || form.invalid || !code"
        >
          {{ loading() ? 'Postavljam lozinku...' : 'Sačuvaj lozinku' }}
        </button>

        <button
          type="button"
          class="w-full border py-2 rounded"
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

  code = '';

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
  }, {
    validators: this.passwordMatchValidator
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.code = params['code'] || '';
    });
  }

  passwordMatchValidator(group: any) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  submit(): void {
    this.error.set(null);
    this.success.set(null);

    if (!this.code) {
      this.error.set('Nedostaje verifikacioni kod.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const password = this.form.getRawValue().password;

    this.http.post('/api/register/set-password', { code: this.code, password }, { responseType: 'text' })
      .subscribe({
        next: (msg) => {
          this.loading.set(false);
          this.success.set(msg || 'Lozinka postavljena.');

          setTimeout(() => this.router.navigateByUrl('/login'), 1000);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(this.parseError(err));
        }
      });
  }

  private parseError(err: any): string {
    const msg = (err?.error?.message ?? err?.error ?? '').toString().toLowerCase();

    if (msg.includes('istekao')) return 'Link je istekao. Zatražite novi.';
    if (msg.includes('invalid') || msg.includes('ne postoji')) return 'Link nije validan.';

    return err?.error?.message ?? err?.error ?? 'Greška pri postavljanju lozinke.';
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}