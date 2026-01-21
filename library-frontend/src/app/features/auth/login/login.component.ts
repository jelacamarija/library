import { Component, inject ,ChangeDetectorRef} from '@angular/core';
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
  private cdr=inject(ChangeDetectorRef)

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

    this.cdr.detectChanges();
  }

  closeModal() {
    this.modalOpen = false;
    this.modalTitle = '';
    this.modalText = '';
    this.modalType = 'info';
  }

  private parseLoginError(err: any): { title: string; text: string; type: 'error' | 'info' | 'success' } {
  const raw =
    (err?.error?.message ??
      err?.error?.error ??
      (typeof err?.error === 'string' ? err.error : null) ??
      err?.message ??
      'Prijava nije uspjela.'
    ).toString();

  const msg = raw.toLowerCase();
  const status = err?.status;

  //nalog nije verifikovan
  if (status === 403 || msg.includes('verifik') || msg.includes('nije verifik')) {
    return {
      type: 'error',
      title: 'Nalog nije verifikovan',
      text: raw || 'Morate verifikovati nalog prije prijave.',
    };
  }

  //nalog nije aktiviran
  if (status === 403 && (msg.includes('nije aktiviran') || msg.includes('postavite lozinku') || msg.includes('set-password'))) {
    return {
      type: 'error',
      title: 'Nalog nije aktiviran',
      text: raw,
    };
  }

  // pogrešni podaci
  if (status === 401 || msg.includes('pogrešan email') || msg.includes('pogresan email')) {
    return {
      type: 'error',
      title: 'Pogrešni podaci',
      text: 'Pogrešan email ili lozinka, pokusajte opet!',
    };
  }

  // pogrešna lozinka
  if (status === 409 && (msg.includes('pogrešna lozinka') || msg.includes('pogresna lozinka'))) {
    return {
      type: 'error',
      title: 'Pogrešni podaci',
      text: 'Pogrešan email ili lozinka, pokusajte opet!',
    };
  }
  return { type: 'error', title: 'Prijava nije uspjela', text: raw };
}


  submit(): void {
  this.errorMsg = '';
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  this.loading = true;
  this.cdr.detectChanges();

  this.auth.login(this.form.getRawValue()).subscribe({
    next: () => {
      this.loading = false;
      const role = this.auth.getRole();
      if (role === 'LIBRARIAN') this.router.navigateByUrl('/librarian/books');
      else this.router.navigateByUrl('/client/books');
    },
    error: (err) => {
      this.loading = false;
      const parsed = this.parseLoginError(err);
      this.openModal(parsed.type, parsed.title, parsed.text);
    },
  });
}
}