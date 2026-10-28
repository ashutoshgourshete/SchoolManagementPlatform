import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🎓</div>
          <h1 class="text-2xl font-bold text-slate-900">Sign in to EduManage</h1>
          <p class="text-sm text-slate-500 mt-1">School & College Multi-Tenant SaaS Platform</p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger mb-4">
            {{ errorMessage }}
          </div>
        }

        <form (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input 
              type="email" 
              class="form-control" 
              placeholder="e.g. admin@apexacademy.edu"
              [(ngModel)]="email" 
              name="email" 
              required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-control" 
              placeholder="••••••••"
              [(ngModel)]="password" 
              name="password" 
              required>
          </div>

          <button type="submit" class="btn btn-primary w-full py-3" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="demo-box mt-6">
          <p class="text-xs font-semibold text-slate-600 mb-2">Quick-Fill Demo Credentials:</p>
          <div class="flex flex-wrap gap-2">
            <button type="button" (click)="fillDemo('admin@apexacademy.edu', 'Admin@123456')" class="btn btn-outline btn-sm text-xs">
              Institution Admin
            </button>
            <button type="button" (click)="fillDemo('teacher@apexacademy.edu', 'Teacher@123456')" class="btn btn-outline btn-sm text-xs">
              Teacher
            </button>
            <button type="button" (click)="fillDemo('accountant@apexacademy.edu', 'Account@123456')" class="btn btn-outline btn-sm text-xs">
              Accountant
            </button>
            <button type="button" (click)="fillDemo('platformadmin@schoolsaas.com', 'Admin@123456')" class="btn btn-outline btn-sm text-xs">
              Platform SuperAdmin
            </button>
          </div>
        </div>

        <div class="text-center mt-6 text-sm text-slate-600">
          Want to register your school or college?
          <a routerLink="/register-tenant" class="text-primary font-semibold hover:underline ml-1">Register Institution</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 1.5rem;
    }
    .login-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .text-center { text-align: center; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-6 { margin-top: 1.5rem; }
    .w-full { width: 100%; }
    .demo-box {
      background-color: var(--slate-50);
      border: 1px dashed var(--slate-300);
      border-radius: 8px;
      padding: 0.875rem;
    }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-2 { gap: 0.5rem; }
    .text-primary { color: var(--primary); }
  `]
})
export class LoginComponent {
  email = 'admin@apexacademy.edu';
  password = 'Admin@123456';
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  fillDemo(e: string, p: string): void {
    this.email = e;
    this.password = p;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = res.message || 'Login failed';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Server connection failed. Ensure backend API is running.';
      }
    });
  }
}
