import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Functional route guard — Angular 15+ style.
 *
 * Delegates entirely to AuthService.checkAuth() so the shared authState
 * signal is always updated when the guard runs. On failure, calls
 * AuthService.logout() which handles both state update and redirect.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  return authService.checkAuth().pipe(
    map((isValid: boolean) => {
      if (isValid) return true;
      authService.logout();
      return false;
    }),
    catchError(() => {
      authService.logout();
      return of(false);
    })
  );
};
