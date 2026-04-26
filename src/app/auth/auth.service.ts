import { computed, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginService } from './login.service';

/**
 * Central auth state store — Angular 21 optimized.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _loginService = inject(LoginService);
  private readonly _doc           = inject(DOCUMENT);
  private readonly _router        = inject(Router);

  // ─── Reactive state ────────────────────────────────────────────────────────

  /** Writable signal — null = not yet checked, true = valid, false = invalid */
  readonly authState = signal<boolean | null>(null);

  /** Synchronous boolean snapshot — true only when confirmed valid */
  readonly isAuthenticated = computed(() => this.authState() === true);

  /** Observable bridge — for components/pipes using the async pipe */
  readonly isAuthenticated$: Observable<boolean | null> = toObservable(this.authState);

  // ─── Auth actions ──────────────────────────────────────────────────────────

  /**
   * Validates the current Cordys SAML session.
   * Updates authState signal on success or failure.
   */
  checkAuth(): Observable<boolean> {
    return this._loginService.isLoginValid().pipe(
      tap((isValid: boolean) => this.authState.set(isValid))
    );
  }

  /**
   * Invalidates the session:
   * 1. Sets authState to false
   * 2. Clears sessionStorage
   * 3. Redirects to the login page
   */
  logout(): void {
    this.authState.set(false);
    sessionStorage.clear();
    this._redirectToLogin();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private _redirectToLogin(): void {
    /* 
    // OLD EXTERNAL REDIRECT LOGIC
    const origin = this._doc.defaultView?.location.origin ?? '';
    this._loginService.resetPreLoginDetails().subscribe(resp => {
      const gwUrl = this._doc.defaultView?.localStorage.getItem('cordys_gateway_url') || '';
      const serverBase = gwUrl.includes('/cordys/') ? gwUrl.split('/cordys/')[0] : origin;
      const loginUrl = serverBase + '/cordys/html5/login.htm';
      if (this._doc.defaultView) this._doc.defaultView.location.href = loginUrl;
    });
    */

    // NEW INTERNAL NAVIGATION
    this._router.navigate(['/login']);
  }
}
