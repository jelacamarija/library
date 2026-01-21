import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const landingGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  const role = auth.getRole();
  if (role === 'LIBRARIAN') {
    router.navigateByUrl('/librarian/books');
  } else if (role === 'CLIENT') {
    router.navigateByUrl('/client/books');
  } else {
    router.navigateByUrl('/login');
  }

  return false;
};
