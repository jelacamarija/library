import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

function checkRole(required: string[] | undefined): boolean {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  if (!required || required.length === 0) return true;

  const userRole = auth.getRole();
  if (userRole && required.includes(userRole)) return true;

  router.navigateByUrl('/forbidden');
  return false;
}

export const roleGuard: CanActivateFn = (route) => {
  const required = route.data?.['roles'] as string[] | undefined;
  return checkRole(required);
};

export const roleChildGuard: CanActivateChildFn = (childRoute) => {
  const required = childRoute.parent?.data?.['roles'] as string[] | undefined;
  return checkRole(required);
};
