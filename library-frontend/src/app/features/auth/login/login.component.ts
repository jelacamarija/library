import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  toastMessage = '';
  showToast = false;

  loading = false;
  errorMsg = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private openToast(message: string) {
  this.toastMessage = message;
  this.showToast = true;

  setTimeout(() => {
    this.showToast = false;
    this.toastMessage = '';
  }, 3500);
}
  submit(): void {
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        const role = this.auth.getRole();
      if (role === 'LIBRARIAN') this.router.navigateByUrl('/librarian');
        else this.router.navigateByUrl('/client/books');
      },
      error: (err) => {
  this.loading = false;

  const backendMsg =
    err?.error?.message ??
    err?.error?.error ??
    (typeof err?.error === 'string' ? err.error : null);

  // ako je 403 (neverifikovan)
  if (err?.status === 403) {
    this.errorMsg = backendMsg ?? 'Morate da verifikujete svoj nalog.';
    return;
  }

  this.errorMsg = backendMsg ?? 'Pogrešan email ili lozinka.';
  },
    });
  }
}
