import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register-tenant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="register-wrapper">
      <div class="register-card">
        <div class="text-center mb-6">
          <div class="text-3xl mb-1">🏢</div>
          <h1 class="text-2xl font-bold text-slate-900">Register Your Institution</h1>
          <p class="text-sm text-slate-500">Create a secure, dedicated tenant space on EduManage Cloud</p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger mb-4">
            {{ errorMessage }}
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Organization Name *</label>
              <input type="text" class="form-control" placeholder="e.g. Cambridge Global Academy" [(ngModel)]="form.organizationName" name="organizationName" required>
            </div>
            <div class="form-group">
              <label class="form-label">Unique Tenant Code *</label>
              <input type="text" class="form-control" placeholder="e.g. CGA" [(ngModel)]="form.tenantCode" name="tenantCode" required>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Primary Institution Name *</label>
              <input type="text" class="form-control" placeholder="e.g. CGA Main Campus" [(ngModel)]="form.institutionName" name="institutionName" required>
            </div>
            <div class="form-group">
              <label class="form-label">Institution Type *</label>
              <select class="form-control" [(ngModel)]="form.institutionType" name="institutionType">
                <option [value]="1">School (K-12)</option>
                <option [value]="2">College / Degree Institute</option>
                <option [value]="3">Combined School & College</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Admin First Name *</label>
              <input type="text" class="form-control" [(ngModel)]="form.adminFirstName" name="adminFirstName" required>
            </div>
            <div class="form-group">
              <label class="form-label">Admin Last Name *</label>
              <input type="text" class="form-control" [(ngModel)]="form.adminLastName" name="adminLastName" required>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">Official Work Email *</label>
              <input type="email" class="form-control" placeholder="admin@cga.edu" [(ngModel)]="form.adminEmail" name="adminEmail" required>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone *</label>
              <input type="text" class="form-control" placeholder="+91 9876543210" [(ngModel)]="form.contactPhone" name="contactPhone" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Secure Admin Password *</label>
            <input type="password" class="form-control" placeholder="Minimum 6 characters" [(ngModel)]="form.password" name="password" required>
          </div>

          <div class="form-group">
            <label class="form-label">Billing Currency</label>
            <select class="form-control" [(ngModel)]="form.currencyCode" name="currencyCode">
              <option value="INR">INR (₹ - Indian Rupee)</option>
              <option value="USD">USD ($ - US Dollar)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary w-full py-3 mt-4" [disabled]="loading">
            {{ loading ? 'Provisioning Tenant...' : 'Create Institution Account (30-Day Free Trial)' }}
          </button>
        </form>

        <div class="text-center mt-6 text-sm text-slate-600">
          Already registered?
          <a routerLink="/login" class="text-primary font-semibold hover:underline ml-1">Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 2rem 1rem;
    }
    .register-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 680px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .text-center { text-align: center; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .w-full { width: 100%; }
    .text-primary { color: var(--primary); }
  `]
})
export class RegisterTenantComponent {
  form = {
    organizationName: '',
    tenantCode: '',
    institutionName: '',
    institutionType: 1,
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    contactPhone: '',
    password: '',
    currencyCode: 'INR'
  };

  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;

    this.authService.registerTenant(this.form).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Tenant registration failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Server connection failed';
      }
    });
  }
}
