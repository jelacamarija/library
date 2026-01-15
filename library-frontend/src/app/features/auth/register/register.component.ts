import { Component, inject, ChangeDetectorRef,NgZone } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

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
  private cdr = inject(ChangeDetectorRef);
  private zone=inject(NgZone);

  // MODAL STATE (isto kao Login)
  modalOpen = false;
  modalTitle = '';
  modalText = '';
  modalType: 'error' | 'info' | 'success' = 'info';

  loading = false;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[+0-9\s\-()]{6,20}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  private openModal(type: 'error' | 'info' | 'success', title: string, text: string) {
    this.modalType = type;
    this.modalTitle = title;
    this.modalText = text;
    this.modalOpen = true;
    this.cdr.detectChanges(); // ✅ da se odmah prikaže
  }

  closeModal() {
    this.modalOpen = false;
    this.modalTitle = '';
    this.modalText = '';
    this.modalType = 'info';
  }

  private parseRegisterError(err: any): { title: string; text: string; type: 'error' | 'info' } {
    const raw =
      (err?.error?.message ??
        err?.error?.detail ??
        err?.error?.error ??
        (typeof err?.error === 'string' ? err.error : null) ??
        err?.message ??
        'Greška prilikom registracije.'
      ).toString();

    const msg = raw.toLowerCase();
    const status = err?.status;

    // 1) email već postoji (tvoj najčešći slučaj)
    if (status === 409 && (msg.includes('vec postoji') || msg.includes('već postoji') || msg.includes('postoji'))) {
      return {
        type: 'error',
        title: 'Email je zauzet',
        text: 'Korisnik sa ovim emailom već postoji. Probaj da se prijaviš ili koristi drugi email.',
      };
    }

    // 2) validaciona greška (ako/ kada dodaš @Valid)
    if (status === 400) {
      return {
        type: 'error',
        title: 'Neispravni podaci',
        text: raw,
      };
    }

    // fallback
    return { type: 'error', title: 'Registracija nije uspjela', text: raw };
  }

  submit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  // ✅ sve promjene stanja radi u zoni
  this.zone.run(() => {
    this.loading = true;
    this.cdr.detectChanges();
  });

  this.auth.register(this.form.getRawValue())
    .pipe(
      finalize(() => {
        this.zone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      })
    )
    .subscribe({
      next: (resText) => {
        this.zone.run(() => {
          this.form.reset();
          this.openModal(
            'success',
            'Registracija uspješna',
            resText || 'Provjeri email i klikni na link za verifikaciju naloga.'
          );
          // openModal već radi detectChanges (ako si ga tako ostavila)
        });
      },
      error: (err) => {
        this.zone.run(() => {
          const parsed = this.parseRegisterError(err);
          this.openModal(parsed.type, parsed.title, parsed.text);
        });
      },
    });
}


  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
