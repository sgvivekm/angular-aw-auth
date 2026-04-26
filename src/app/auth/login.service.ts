import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { iif, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CordysSoapClient } from '../common/cordys-soap-client';

/**
 * Cordys SAML session validation service.
 * Lives inside auth/ — it is auth infrastructure, not a general-purpose service.
 *
 * Responsibilities:
 *  - Validate the SAML session via GetPreLoginInfo SOAP call
 *  - Store SAML cookie metadata (name, path) for cookie management
 *  - Provide cookie deletion helpers used during logout
 */
@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly _cordysService = inject(CordysSoapClient);
  private readonly _doc           = inject(DOCUMENT);

  private _cookieName: string | null = null;
  private _checkName:  string | null = null;
  private _cookiePath: string | null = null;
  private readonly _developerCookie  = 'developer_SAMLart';

  // ─── Session validation ─────────────────────────────────────────────────────

  /**
   * Validates the current Cordys SAML session.
   * If valid, updates internal cookie metadata.
   */
  isLoginValid(): Observable<boolean> {
    return this.resetPreLoginDetails().pipe(
      map(data => {
        // MOCK SUCCESS: Set to 'true' for UI testing without a backend
        const isValid = true; 

        // REAL LOGIC: Uncomment this and comment out the line above for production
        // const isValid = !!data?.SamlArtifactCookieName; 
        
        console.log('SAML Session Check (MOCK):', isValid ? 'VALID' : 'INVALID');
        return isValid;
      }),
      catchError(() => {
        console.warn('SAML Check failed, but MOCK SUCCESS is enabled.');
        return of(true); // Change to 'of(false)' for real environment
      })
    );
  }

  /**
   * Calls GetPreLoginInfo and stores SAML cookie metadata.
   */
  resetPreLoginDetails(): Observable<any> {
    return this._cordysService.call(
      'GetPreLoginInfo',
      'http://schemas.cordys.com/SSO/Runtime/1.0'
    ).pipe(
      map(resp => {
        this._cookieName = resp?.SamlArtifactCookieName ?? null;
        this._checkName  = resp?.CheckName              ?? null;
        this._cookiePath = resp?.SamlArtifactCookiePath ?? null;
        return resp;
      }),
      catchError(() => of(null))
    );
  }

  // ─── Cookie accessors ───────────────────────────────────────────────────────

  getCookieName():    string | null { return this._cookieName; }
  getDevCookieName(): string        { return this._developerCookie; }
  getCheckName():     string | null { return this._checkName; }
  getCookiePath():    string | null { return this._cookiePath; }

  resetCookieVars(): void {
    this._cookieName = null;
    this._checkName  = null;
    this._cookiePath = null;
  }

  // ─── Cookie deletion ────────────────────────────────────────────────────────

  deleteCookies(): void {
    const expiry = ';expires=Thu, 01-Jan-1970 00:00:01 GMT; path=';
    this._doc.cookie.split(';').forEach(raw => {
      const name = raw.trim().split('=')[0];
      if (name === this._cookieName || name === this._checkName) {
        this._doc.cookie = `${name}=${expiry}${this._cookiePath}`;
      }
    });
  }

  deleteDevCookies(): void {
    const expiry = ';expires=Thu, 01-Jan-1970 00:00:01 GMT; path=';
    this._doc.cookie = `${this._developerCookie}=${expiry}${this._cookiePath}`;
  }
}
