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
  if (role === 'LIBRARIAN') router.navigateByUrl('/librarian');
  else router.navigateByUrl('/client');

  return false;
};
