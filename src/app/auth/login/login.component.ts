import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 60vh;">
      <div style="background: white; padding: 2.5rem; border-radius: 12px; shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #eee; width: 100%; max-width: 350px; text-align: center;">
        <h2 style="margin-top: 0; color: #1976d2;">Welcome Back</h2>
        <p style="color: #666; margin-bottom: 2rem;">Please sign in to access your dashboard</p>
        
        <div style="text-align: left; margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">Username</label>
          <input type="text" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
        </div>

        <div style="text-align: left; margin-bottom: 2rem;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">Password</label>
          <input type="password" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box;">
        </div>

        <button (click)="onLogin()" style="width: 100%; padding: 12px; background: #1976d2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.3s;">
          Sign In
        </button>

        <p style="margin-top: 1.5rem; font-size: 0.8rem; color: #999;">
          In a real integration, this would authenticate against the Cordys Gateway.
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private router = inject(Router);

  onLogin() {
    alert('Mock Login Successful!');
    this.router.navigate(['/dashboard']);
  }
}
