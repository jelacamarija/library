import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  loading = false;

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

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.snack.open('Registracija uspješna. Provjeri email za verifikaciju ✅', 'OK', {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;

        // Angular može dobiti: string, {message}, ili Spring "detail"
        const msg =
          err?.error?.message ||
          err?.error?.detail ||
          (typeof err?.error === 'string' ? err.error : '') ||
          'Greška prilikom registracije.';

        // Ako je 409 (mejl postoji) - pokaži specifičnu poruku
        if (err?.status === 409) {
          this.snack.open('Korisnik sa tim mejlom već postoji ❌', 'OK', {
            duration: 3500,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          return;
        }

        this.snack.open(msg, 'OK', {
          duration: 3500,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
      },
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
