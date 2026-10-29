import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="text-center mb-6">
          <div class="text-4xl mb-2">🔑</div>
          <h1 class="text-2xl font-bold text-slate-900">Reset Your Password</h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ step === 1 ? 'Enter your account email to receive a password reset token' : 'Set your new password' }}
          </p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger mb-4">{{ errorMessage }}</div>
        }
        @if (successMessage) {
          <div class="alert alert-success mb-4">{{ successMessage }}</div>
        }

        <!-- STEP 1: Enter Email -->
        @if (step === 1) {
          <form (ngSubmit)="onRequestToken()">
            <div class="form-group">
              <label class="form-label">Registered Email Address</label>
              <input 
                type="email" 
                class="form-control" 
                placeholder="e.g. admin@apexacademy.edu"
                [(ngModel)]="email" 
                name="email" 
                required>
            </div>

            <button type="submit" class="btn btn-primary w-full py-3" [disabled]="loading">
              {{ loading ? 'Generating Reset Token...' : 'Send Password Reset Token' }}
            </button>
          </form>
        }

        <!-- STEP 2: Enter Token & New Password -->
        @if (step === 2) {
          <form (ngSubmit)="onResetPassword()">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" [(ngModel)]="email" name="email" disabled>
            </div>

            <div class="form-group">
              <label class="form-label">Reset Token</label>
              <input 
                type="text" 
                class="form-control font-mono text-xs" 
                placeholder="Paste token received"
                [(ngModel)]="token" 
                name="token" 
                required>
            </div>

            <div class="form-group">
              <label class="form-label">New Password</label>
              <input 
                type="password" 
                class="form-control" 
                placeholder="Minimum 6 characters"
                [(ngModel)]="newPassword" 
                name="newPassword" 
                required>
            </div>

            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input 
                type="password" 
                class="form-control" 
                placeholder="Re-enter new password"
                [(ngModel)]="confirmPassword" 
                name="confirmPassword" 
                required>
            </div>

            <button type="submit" class="btn btn-primary w-full py-3" [disabled]="loading">
              {{ loading ? 'Updating Password...' : 'Save New Password' }}
            </button>

            <button type="button" (click)="step = 1" class="btn btn-outline w-full py-2 mt-2">
              Back
            </button>
          </form>
        }

        <!-- STEP 3: Completed -->
        @if (step === 3) {
          <div class="text-center py-4">
            <p class="text-sm text-slate-700 mb-4">Your password has been changed successfully. You can now log in.</p>
            <a routerLink="/login" class="btn btn-primary w-full py-3">Back to Sign In</a>
          </div>
        }

        <div class="text-center mt-6 text-sm text-slate-600">
          Remember your password?
          <a routerLink="/login" class="text-primary font-semibold hover:underline ml-1">Sign In</a>
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
      max-width: 460px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .text-center { text-align: center; }
    .mb-1 { margin-top: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .w-full { width: 100%; }
    .text-primary { color: var(--primary); }
    .font-mono { font-family: monospace; }
  `]
})
export class ForgotPasswordComponent {
  step = 1;
  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRequestToken(): void {
    if (!this.email) {
      this.errorMessage = 'Please provide an email address.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = res.data?.message || 'Password reset token generated.';
          if (res.data?.resetToken) {
            this.token = res.data.resetToken; // Auto-fill token in demo/dev mode
          }
          this.step = 2;
        } else {
          this.errorMessage = res.message || 'Unable to process request.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Connection to server failed.';
      }
    });
  }

  onResetPassword(): void {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService.resetPassword({
      email: this.email,
      token: this.token,
      newPassword: this.newPassword
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = 'Your password has been reset successfully!';
          this.step = 3;
        } else {
          this.errorMessage = res.message || 'Password reset failed.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Server error occurred.';
      }
    });
  }
}
