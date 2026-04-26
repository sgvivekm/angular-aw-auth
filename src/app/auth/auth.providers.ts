import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

import { AuthService } from './auth.service';
import { LoginService } from './login.service';

/**
 * Registers all Cordys authentication providers.
 *
 * Usage — AppModule/NgModule:
 *   providers: [provideAuth()]
 */
export function provideAuth(): any[] {
  return [
    AuthService,
    LoginService,
    provideHttpClient(withInterceptors([authInterceptor])),
  ];
}
