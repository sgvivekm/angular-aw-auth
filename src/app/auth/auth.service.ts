import { computed, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginService } from './login.service';
import { CordysSoapWService } from '../common/cordys-soap-ws';

/**
 * Central auth state store — Angular 21 optimized.
 *
 * Reactive state uses Angular Signals (not BehaviorSubject):
 *   - authState  — writable signal, source of truth
 *   - isAuthenticated — computed boolean (null = not yet checked)
 *   - isAuthenticated$ — Observable for components using the async pipe
 *
 * All redirect logic lives here (inject(DOCUMENT) keeps it testable).
 * Guard and interceptor both call this service — never raw window/location.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _loginService = inject(LoginService);
  private readonly _doc = inject(DOCUMENT);

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
   * Used by authGuard — do not call from interceptor (causes infinite loop risk).
   */
  checkAuth(): Observable<boolean> {
    return this._loginService.isLoginValid().pipe(
      tap((isValid: boolean) => this.authState.set(isValid))
    );
  }

  /**
   * Invalidates the session:
   * 1. Sets authState to false (components react immediately)
   * 2. Clears sessionStorage
   * 3. Redirects to the Cordys login portal
   *
   * Called by: authGuard (on invalid session), authInterceptor (on 401/403),
   *            CordysSoapWService (on SOAP-level auth errors), components (logout button).
   */
  logout(): void {
    this.authState.set(false);
    sessionStorage.clear();
    this._redirectToLogin();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Computes the Cordys server base URL from the gateway URL and redirects.
   * Uses inject(DOCUMENT) — mockable in unit tests via DOCUMENT provider.
   */
  private _redirectToLogin(): void {
    const gwUrl = CordysSoapWService.getGateWayURL() || '';
    const serverBase = gwUrl.includes('/cordys/')
      ? gwUrl.split('/cordys/')[0]
      : (this._doc.defaultView?.location.origin ?? '');

    const loginUrl = serverBase + '/cordys/html5/login.htm';
    
    if (this._doc.defaultView) {
      // this._doc.defaultView.location.href = loginUrl;
      console.log('Redirect to login suppressed:', loginUrl);
    } else {
      console.error('AuthService: Cannot redirect, defaultView is missing.');
    }
  }
}
