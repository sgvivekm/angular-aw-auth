import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Functional HTTP interceptor — Angular 15+ style.
 *
 * Catches 401/403 globally and calls AuthService.logout() so the authState
 * signal is updated before the browser redirects. Components subscribed to
 * isAuthenticated$ will reflect the session end immediately.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
