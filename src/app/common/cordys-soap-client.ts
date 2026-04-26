import { inject, Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, shareReplay } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

/**
 * Modern, Reactive Cordys SOAP Client for new feature development.
 *
 * Features:
 * - Pure RxJS: Returns Observables instead of using callbacks.
 * - Type-safe: Supports generics for strict response typing.
 * - Auto-config: Fetches config once, caches it, and prepends SAMLart automatically.
 * - Centralized Auth: Integrates deeply with AuthService for session management.
 *
 * Usage:
 *   const soapClient = inject(CordysSoapClient);
 *   soapClient.call<MyOrder[]>('GetOrders', 'http://namespace', { status: 'open' })
 *     .subscribe(orders => console.log(orders));
 */
@Injectable({ providedIn: 'root' })
export class CordysSoapClient {
  private readonly _http = inject(HttpClient);
  private readonly _injector = inject(Injector);

  // Cached gateway URL stream
  private _gatewayUrl$: Observable<string> | null = null;

  /**
   * Executes a SOAP call against the Cordys Gateway.
   *
   * @param method The SOAP method name (e.g., 'GetPurchaseOrders')
   * @param namespace The SOAP namespace
   * @param parameters Optional request parameters (JSON object)
   * @returns Observable of the parsed JSON response
   */
  public call<T = any>(method: string, namespace: string, parameters?: any): Observable<T> {
    return this._getGatewayUrl().pipe(
      switchMap(url => {
        const finalUrl = this._appendSamlCookie(url);
        const envelope = this._buildSoapEnvelope(method, namespace, parameters);
        const headers = new HttpHeaders({ 'Content-Type': 'text/xml; charset=utf-8' });

        return this._http.post(finalUrl, envelope, {
          headers,
          responseType: 'text',
          withCredentials: true,
        });
      }),
      map(xml => this._parseXmlResponse(xml, method) as T),
      catchError((err: HttpErrorResponse) => this._handleError(err))
    );
  }

  // ─── Configuration & Context ────────────────────────────────────────────────

  /**
   * Fetches the server config. Uses shareReplay(1) to ensure the HTTP call
   * only happens once per application lifecycle.
   */
  private _getGatewayUrl(): Observable<string> {
    if (!this._gatewayUrl$) {
      this._gatewayUrl$ = this._http.get<{ endPointURL: string }>('/assets/config/server.config.txt').pipe(
        map(config => {
          if (config.endPointURL) {
            localStorage.setItem('cordys_gateway_url', config.endPointURL);
          }
          return config.endPointURL;
        }),
        shareReplay(1) // Cache the result
      );
    }
    return this._gatewayUrl$;
  }

  /**
   * Appends the developer SAMLart cookie if running in development mode.
   */
  private _appendSamlCookie(url: string): string {
    const devCookie = this._getCookieByName('devinst_SAMLart');
    if (devCookie) {
      const cleanUrl = url.split('&SAMLart=')[0];
      return `${cleanUrl}&SAMLart=${devCookie}`;
    }
    return url;
  }

  private _getCookieByName(cname: string): string | null {
    const name = cname + '=';
    for (let cookie of document.cookie.split(';')) {
      cookie = cookie.trim();
      if (cookie.startsWith(name)) return cookie.substring(name.length);
    }
    return null;
  }

  // ─── Error Handling ────────────────────────────────────────────────────────

  private _handleError(err: HttpErrorResponse): Observable<never> {
    const responseText = (err.error as string) || '';
    const isAuthError = /AccessDenied|Artifact_Unbound|Forbidden|invalidCredentials|userDisabled/i.test(responseText);

    if (isAuthError || err.status === 401 || err.status === 403) {
      // Lazy inject to prevent circular dependencies (Client -> Auth -> Login -> Client)
      this._injector.get(AuthService).logout();
    }

    return throwError(() => err);
  }

  // ─── XML Generation ────────────────────────────────────────────────────────

  private _buildSoapEnvelope(method: string, namespace: string, parameters: any): string {
    const body = parameters ? this._objectToXml(parameters) : '';
    return (
      `<SOAP:Envelope xmlns:SOAP="http://schemas.xmlsoap.org/soap/envelope/">` +
      `<SOAP:Body><${method} xmlns="${namespace}">${body}</${method}></SOAP:Body>` +
      `</SOAP:Envelope>`
    );
  }

  private _objectToXml(obj: any): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);

    return Object.entries(obj).map(([key, value]) => {
      if (key.startsWith('@')) return ''; // Attributes handled separately

      const attrs = this._buildAttributes(value);
      if (Array.isArray(value)) {
        return value.map(item => `<${key}${attrs}>${this._objectToXml(item)}</${key}>`).join('');
      }
      if (typeof value === 'object' && value !== null) {
        return `<${key}${attrs}>${this._objectToXml(value)}</${key}>`;
      }
      return `<${key}>${value}</${key}>`;
    }).join('');
  }

  private _buildAttributes(obj: any): string {
    if (typeof obj !== 'object' || obj === null) return '';
    return Object.entries(obj)
      .filter(([k]) => k.startsWith('@'))
      .map(([k, v]) => ` ${k.slice(1)}="${v}"`)
      .join('');
  }

  // ─── XML Parsing ───────────────────────────────────────────────────────────

  private _parseXmlResponse(xml: string, method: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    // Find Body regardless of namespace prefix
    const body = Array.from(doc.documentElement.childNodes)
      .find(n => n.nodeType === 1 && (n as Element).localName === 'Body') as Element;

    if (!body) return null;

    // Check for SOAP Faults inside Body
    const fault = Array.from(body.childNodes)
      .find(n => n.nodeType === 1 && (n as Element).localName === 'Fault') as Element;

    if (fault) {
      const faultString = fault.querySelector('faultstring')?.textContent || fault.textContent;
      throw new Error(`SOAP Fault: ${faultString}`);
    }

    const responseEl = body.firstElementChild;
    if (!responseEl) return null;

    return this._xmlNodeToJson(responseEl);
  }

  private _xmlNodeToJson(node: Element): any {
    const result: any = {};

    // Map attributes
    for (const attr of Array.from(node.attributes)) {
      const key = attr.name.includes(':') ? attr.name.split(':')[1] : attr.name;
      result[`@${key}`] = attr.value;
    }

    // Handle text nodes
    if (!node.children.length) {
      const text = node.textContent?.trim() || '';
      if (Object.keys(result).length) {
        result['#text'] = text;
        return result;
      }
      return text || null;
    }

    // Handle child elements
    const childCounts: Record<string, number> = {};
    for (const child of Array.from(node.children)) {
      childCounts[child.localName] = (childCounts[child.localName] || 0) + 1;
    }

    for (const child of Array.from(node.children)) {
      const tag = child.localName;
      const val = this._xmlNodeToJson(child);

      if (childCounts[tag] > 1) {
        if (!result[tag]) result[tag] = [];
        result[tag].push(val);
      } else {
        result[tag] = val;
      }
    }

    return result;
  }
}
