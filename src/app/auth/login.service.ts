import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { iif, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CordysSoapWService } from '../common/cordys-soap-ws';

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
  private readonly _cordysService = inject(CordysSoapWService);
  private readonly _doc           = inject(DOCUMENT);

  private _cookieName: string | null = null;
  private _checkName:  string | null = null;
  private _cookiePath: string | null = null;
  private readonly _developerCookie  = 'developer_SAMLart';

  // ─── Session validation ─────────────────────────────────────────────────────

  /**
   * TEMPORARY MOCK: Forces the session to be valid for UI preview.
   * (Original logic commented out below)
   */
  isLoginValid(): Observable<boolean> {
    console.warn('AUTH MOCK: Forcing session to be valid for UI preview.');
    return of(true);
    /*
    return this.resetPreLoginDetails().pipe(
      map(data => {
        console.log('SAML Session Check Response:', data);
        const valid = !!data?.SamlArtifactCookieName;
        console.log('Session is valid:', valid);
        return valid;
      })
    );
    */
  }

  /**
   * Calls GetPreLoginInfo and stores SAML cookie metadata.
   */
  resetPreLoginDetails(): Observable<any> {
    return new Observable(observer => {
      this._cordysService.callCordysSoapService(
        'GetPreLoginInfo',
        'http://schemas.cordys.com/SSO/Runtime/1.0',
        '',
        (resp: any) => {
          this._cookieName = resp?.SamlArtifactCookieName ?? null;
          this._checkName  = resp?.CheckName              ?? null;
          this._cookiePath = resp?.SamlArtifactCookiePath ?? null;
          observer.next(resp);
          observer.complete();
        },
        (err: any) => {
          observer.next(null);
          observer.complete();
        },
        true, null
      );
    });
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
    CordysSoapWService.clearSAMLFromGateWayURL();
  }
}
