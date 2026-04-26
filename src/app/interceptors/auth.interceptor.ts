import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CordysSoapWService } from '../common/cordys-soap-ws';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this._redirectToLogin();
        }
        return throwError(() => error);
      })
    );
  }

  private _redirectToLogin(): void {
    const gwUrl = CordysSoapWService.getGateWayURL() || '';
    const serverBase = gwUrl.includes('/cordys/')
      ? gwUrl.split('/cordys/')[0]
      : window.location.origin;
    window.location.href = serverBase + '/cordys/html5/login.htm';
  }
}
