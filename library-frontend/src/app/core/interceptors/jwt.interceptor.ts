import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  // ne dodaj token na login/register/verify/set-password
  if (
    !token ||
    req.url.includes('/api/login') ||
    req.url.includes('/api/register') ||
    req.url.includes('/api/verify') ||
    req.url.includes('/set-password')
  ) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // ✅ očisti sve i vrati na login
        auth.forceLogout();
        router.navigateByUrl('/login');
      }
      return throwError(() => err);
    })
  );
};
