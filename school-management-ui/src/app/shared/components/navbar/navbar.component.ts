import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .top-navbar-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 28px;
      background: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      width: 100%;
      box-sizing: border-box;
    }
    .inst-pill-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 10px;
    }
    .inst-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inst-dropdown {
      border: none;
      background: transparent;
      font-size: 13px;
      font-weight: 700;
      color: #1E293B;
      outline: none;
      cursor: pointer;
    }
    .user-section-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-profile-meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .user-fullname {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.2;
    }
    .user-role-badge {
      font-size: 11px;
      font-weight: 700;
      color: #1E5BF6;
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      padding: 2px 10px;
      border-radius: 9999px;
      display: inline-block;
      margin-top: 3px;
    }
    .btn-signout-nav {
      padding: 7px 16px;
      border: 1px solid #CBD5E1;
      background: #FFFFFF;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .btn-signout-nav:hover {
      background: #FEF2F2;
      color: #EF4444;
      border-color: #FECACA;
    }
  `],
  template: `
    <header class="top-navbar-bar">
      <!-- Left: Active Institution Selector -->
      <div class="inst-pill-container">
        @if (getLogo()) {
          <img [src]="getLogo()" alt="Logo" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;" />
        } @else {
          <span class="inst-label">🏫</span>
        }
        <span class="inst-label">Institution:</span>
        <select 
          class="inst-dropdown"
          [value]="authService.getSelectedInstitutionId()"
          (change)="onInstitutionChange($event)">
          @for (inst of authService.currentUser()?.availableInstitutions; track inst.institutionId) {
            <option [value]="inst.institutionId">{{ inst.name }} ({{ inst.code }})</option>
          }
        </select>
      </div>

      <!-- Right: User Info & Sign out -->
      <div class="user-section-group">
        <div class="user-profile-meta">
          <div class="user-fullname">{{ authService.currentUser()?.fullName }}</div>
          <div class="user-role-badge">{{ getRoleDisplayName() }}</div>
        </div>
        <button (click)="logout()" class="btn-signout-nav">
          Sign out
        </button>
      </div>
    </header>
  `
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  getRoleDisplayName(): string {
    const role = this.authService.currentUser()?.role;
    if (role === 1 || role === 'PlatformAdmin') return 'Platform Admin';
    if (role === 2 || role === 'InstitutionAdmin') return 'Institution Admin';
    if (role === 3 || role === 'Teacher') return 'Faculty Teacher';
    if (role === 4 || role === 'Accountant') return 'Accountant';
    if (role === 5 || role === 'Student') return 'Student';
    if (role === 6 || role === 'Parent') return 'Parent';
    if (role === 7 || role === 'Director') return 'Director';
    if (role === 8 || role === 'Principal') return 'Principal';
    if (role === 9 || role === 'VicePrincipal') return 'Vice Principal';
    if (role === 10 || role === 'HeadOfDepartment') return 'HOD';
    return String(role || 'User');
  }

  onInstitutionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.authService.switchInstitution(target.value);
    }
  }

  getLogo(): string | null {
    return localStorage.getItem('institution_custom_logo') || null;
  }

  logout(): void {
    this.authService.logout();
  }
}