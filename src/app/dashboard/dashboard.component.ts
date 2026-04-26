import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div style="margin-top: 2rem; padding: 1.5rem; border: 1px dashed #1976d2; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #1976d2;">Protected Dashboard</h3>
      <p>If you can see this, your Cordys SAML session is <strong>VALID</strong>.</p>
      <a href="/" style="color: #1976d2; text-decoration: none;">← Back to Home</a>
    </div>
  `
})
export class DashboardComponent {}
