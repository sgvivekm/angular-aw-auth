# Cordys SAML Authentication — Integration Guide (Angular 18/19+)

This guide explains how to port the authentication layer from this project into any new Angular application. This implementation uses **Angular Signals**, **Functional Guards/Interceptors**, and a **Reactive SOAP Client**.

---

## 1. Files to Copy

Copy the following structure into your new project:

```text
src/app/auth/
├── login/                ← Standalone Login Component
├── auth.service.ts        ← Central state (Signals)
├── auth.guard.ts          ← Route protection (Functional)
├── auth.interceptor.ts    ← HTTP 401/403 handling (Functional)
├── auth.providers.ts      ← provideAuth() helper
├── login.service.ts       ← Session validation logic
└── index.ts               ← Barrel exports

src/app/common/
└── cordys-soap-client.ts  ← Reactive SOAP Client (RxJS)

public/assets/config/
└── server.config.txt      ← Environment configuration
```

---

## 2. Configuration

Update `public/assets/config/server.config.txt` with your Cordys Gateway URL:

```json
{
  "endPointURL": "http://YOUR_SERVER:8080/cordys/com.eibus.web.soap.Gateway.wcp?organization=..."
}
```

---

## 3. Register Providers

In your `app.config.ts` (for standalone apps), add `provideAuth()` to the providers array:

```typescript
import { provideAuth } from './app/auth/auth.providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    ...provideAuth() // 👈 Registers HttpClient and Auth infrastructure
  ]
};
```

---

## 4. Protect Routes

Apply the `authGuard` to any route that requires a valid session in `app.routes.ts`:

```typescript
import { authGuard } from './app/auth';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard] // 👈 Protects this route
  },
  {
    path: 'login',
    component: LoginComponent
  }
];
```

---

## 5. UI Integration (Signals)

In your components, inject `AuthService` to react to the login state:

```typescript
import { AuthService } from './app/auth';

@Component({ ... })
export class MyComponent {
  protected auth = inject(AuthService);

  // Template usage:
  // @if (auth.isAuthenticated()) { ... }
}
```

---

## 6. Testing & Mocking

To develop without a real Cordys backend, you can toggle **Mock Mode** in `login.service.ts`:

```typescript
// src/app/auth/login.service.ts

isLoginValid(): Observable<boolean> {
  return this.resetPreLoginDetails().pipe(
    map(data => {
      return true; // 👈 Set to true to bypass real check
    }),
    catchError(() => of(true))
  );
}
```

---

## Key Benefits of this Implementation

1.  **Reactive Performance**: Uses Angular Signals for synchronous auth state checks.
2.  **No Redundancy**: Functional interceptors and guards reduce boilerplate code.
3.  **Modern SOAP**: The `CordysSoapClient` is 100% RxJS and does not require jQuery or legacy SDKs.
4.  **Self-Configuring**: The client automatically handles gateway URL resolution from the config file.
