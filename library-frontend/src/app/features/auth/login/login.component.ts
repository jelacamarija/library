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

  modalOpen = false;
  modalTitle = '';
  modalText = '';
  modalType: 'error' | 'info' | 'success' = 'info';

  loading = false;
  errorMsg = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private openModal(type: 'error' | 'info' | 'success', title: string, text: string) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalText = text;
    this.modalOpen = true;
  }

  closeModal() {
    this.modalOpen = false;
    this.modalTitle = '';
    this.modalText = '';
    this.modalType = 'info';
  }

  private parseLoginError(err: any): { title: string; text: string } {
    const backendMsg =
      err?.error?.message ??
      err?.error?.error ??
      (typeof err?.error === 'string' ? err.error : null) ??
      'Prijava nije uspjela.';

    if (err?.status === 403) {
      return {
        title: 'Nalog nije verifikovan',
        text: backendMsg || 'Morate verifikovati nalog prije prijave.',
      };
    }

    if (err?.status === 401) {
      return {
        title: 'Pogrešni podaci',
        text: 'Pogrešan email ili lozinka.',
      };
    }

    return {
      title: 'Prijava nije uspjela',
      text: backendMsg,
    };
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
      if (role === 'LIBRARIAN') this.router.navigateByUrl('/librarian/books');
      else this.router.navigateByUrl('/client/books');
    },
    error: (err) => {
    this.loading = false;

    const backendMsg =
      err?.error?.message ??
      'Prijava nije uspjela.';

    if (err?.status === 403) {
      this.openModal('error', 'Nalog nije verifikovan', backendMsg);
      return;
    }

    if (err?.status === 401) {
      this.openModal('error', 'Pogrešni podaci', 'Pogrešan email ili lozinka.');
      return;
    }

    this.openModal('error', 'Prijava nije uspjela', backendMsg);
  },
  });
}
}