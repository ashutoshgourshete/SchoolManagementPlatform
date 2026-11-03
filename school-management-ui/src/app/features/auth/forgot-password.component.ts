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
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">Reset Password</h1>
          <p class="text-xs text-slate-500 font-medium mt-1">
            {{ step === 1 ? 'Verify via your registered Email ID or Mobile Number' : (step === 2 ? 'Verify token/OTP and choose a new password' : 'Password changed successfully') }}
          </p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger mb-4">{{ errorMessage }}</div>
        }
        @if (successMessage) {
          <div class="alert alert-success mb-4">{{ successMessage }}</div>
        }

        <!-- STEP 1: Select Mode (Email vs Mobile) & Enter Details -->
        @if (step === 1) {
          <!-- Modern Dual-Mode Capsule Switcher -->
          <div class="flex justify-center mb-5">
            <div class="segmented-pill-group">
              <button 
                type="button" 
                class="segmented-pill-btn" 
                [class.active]="resetMode === 'email'" 
                (click)="switchMode('email')">
                <span>✉️ Via Email</span>
              </button>
              <button 
                type="button" 
                class="segmented-pill-btn" 
                [class.active]="resetMode === 'mobile'" 
                (click)="switchMode('mobile')">
                <span>📱 Via Mobile SMS</span>
              </button>
            </div>
          </div>

          <form (ngSubmit)="onRequestToken()">
            @if (resetMode === 'email') {
              <div class="form-group">
                <label class="form-label">Registered Email Address</label>
                <div class="search-box-pill">
                  <span class="icon-prefix">✉️</span>
                  <input 
                    type="email" 
                    class="form-control-pill" 
                    placeholder="e.g. admin@apexacademy.edu or parent@example.com"
                    [(ngModel)]="identifier" 
                    name="email" 
                    required>
                </div>
                <span class="helper-text">Works for Admins, Teachers, Parents &amp; Students</span>
              </div>
            } @else {
              <div class="form-group">
                <label class="form-label">Registered Mobile Number</label>
                <div class="search-box-pill">
                  <span class="country-badge">+91</span>
                  <input 
                    type="tel" 
                    class="form-control-pill" 
                    placeholder="10-digit mobile (e.g. 98765 22222)"
                    maxlength="15"
                    [(ngModel)]="identifier" 
                    name="mobile" 
                    required>
                </div>
                <span class="helper-text">OTP will be sent to the parent / staff mobile number</span>
              </div>
            }

            <button type="submit" class="btn btn-primary w-full py-3 mt-4" [disabled]="loading">
              {{ loading ? 'Generating Verification Code...' : (resetMode === 'email' ? 'Send Password Reset Token' : 'Send Mobile Verification OTP') }}
            </button>
          </form>
        }

        <!-- STEP 2: Enter Token / OTP & Set New Password -->
        @if (step === 2) {
          <form (ngSubmit)="onResetPassword()">
            <div class="verification-destination-box mb-4">
              <span class="dest-icon">{{ resetMode === 'email' ? '✉️' : '📱' }}</span>
              <div>
                <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">
                  Sent Verification Code To
                </div>
                <div style="font-size: 13px; font-weight: 800; color: #1E5BF6;">
                  {{ maskedDestination || identifier }}
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">{{ resetMode === 'email' ? 'Password Reset Token' : '6-Digit Mobile OTP' }}</label>
              <input 
                type="text" 
                class="form-control font-mono text-xs" 
                [placeholder]="resetMode === 'email' ? 'Paste token from email' : 'Enter 6-digit OTP'"
                [(ngModel)]="token" 
                name="token" 
                required>
              @if (token) {
                <span class="helper-text" style="color: #10B981; font-weight: 600;">✓ Code ready for verification</span>
              }
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

            <button type="submit" class="btn btn-primary w-full py-3 mt-2" [disabled]="loading">
              {{ loading ? 'Updating Password...' : 'Save New Password & Sign In' }}
            </button>

            <button type="button" (click)="step = 1" class="btn btn-outline w-full py-2 mt-2">
              Back to Verification
            </button>
          </form>
        }

        <!-- STEP 3: Completed Successfully -->
        @if (step === 3) {
          <div class="text-center py-4">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <h2 class="text-lg font-bold text-slate-900 mb-2">Password Changed!</h2>
            <p class="text-xs text-slate-500 mb-5">Your account password has been updated securely. You can now access your dashboard.</p>
            <a routerLink="/login" class="btn btn-primary w-full py-3">Sign In Now</a>
          </div>
        }

        <div class="text-center mt-6 text-xs text-slate-500">
          Remember your password?
          <a routerLink="/login" class="text-primary font-bold hover:underline ml-1">Back to Sign In</a>
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
      background: linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #1E5BF6 100%);
      padding: 1.5rem;
    }
    .login-card {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 2.25rem 2.5rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .text-center { text-align: center; }
    .flex { display: flex; }
    .justify-center { justify-content: center; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    .w-full { width: 100%; }
    .text-primary { color: #1E5BF6; }
    .font-mono { font-family: monospace; }
    
    .search-box-pill {
      display: flex;
      align-items: center;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 2px 12px;
      transition: all 0.15s ease;
    }
    .search-box-pill:focus-within {
      border-color: #1E5BF6;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(30, 91, 246, 0.15);
    }
    .form-control-pill {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      padding: 10px 8px;
      font-size: 0.85rem;
      color: #0F172A;
    }
    .icon-prefix {
      font-size: 15px;
      margin-right: 4px;
    }
    .country-badge {
      font-size: 12px;
      font-weight: 700;
      color: #1E5BF6;
      background: #EFF6FF;
      padding: 3px 8px;
      border-radius: 6px;
      margin-right: 6px;
    }
    .helper-text {
      display: block;
      font-size: 11px;
      color: #94A3B8;
      margin-top: 4px;
    }
    .verification-destination-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 12px;
    }
    .dest-icon {
      font-size: 24px;
    }
  `]
})
export class ForgotPasswordComponent {
  step = 1;
  resetMode: 'email' | 'mobile' = 'email';
  identifier = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  maskedDestination = '';

  constructor(private authService: AuthService, private router: Router) {}

  switchMode(mode: 'email' | 'mobile'): void {
    this.resetMode = mode;
    this.identifier = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  onRequestToken(): void {
    if (!this.identifier) {
      this.errorMessage = this.resetMode === 'email' 
        ? 'Please provide your registered email address.' 
        : 'Please enter your registered 10-digit mobile number.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    this.authService.forgotPassword(this.identifier, this.resetMode).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = res.data?.message || 'Verification code generated.';
          this.maskedDestination = res.data?.maskedDestination || this.identifier;
          if (res.data?.resetToken) {
            this.token = res.data.resetToken; // Auto-fills in dev mode for convenient testing
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
      identifier: this.identifier,
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
