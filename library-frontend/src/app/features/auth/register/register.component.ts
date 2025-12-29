import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  errorMsg = '';
  successMsg = '';

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg =
          'Registracija uspješna. Provjeri email radi potvrde naloga.';
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg =
          err?.error?.message ?? 'Greška prilikom registracije.';
      },
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}