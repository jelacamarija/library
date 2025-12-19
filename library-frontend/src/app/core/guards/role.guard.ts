import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = route.data?.['roles'] as string[] | undefined;

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  if (!required || required.length === 0) return true;

  const userRole = auth.getRole();

  if (userRole && required.includes(userRole)) {
    return true;
  }

  router.navigateByUrl('/forbidden');
  return false;
};
