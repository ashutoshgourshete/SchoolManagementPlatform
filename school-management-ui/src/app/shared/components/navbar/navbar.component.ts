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
      padding: 0 32px;
      background: #FFFFFF;
      border-bottom: 1px solid #E2E8F0;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
      width: 100%;
      box-sizing: border-box;
      flex-wrap: nowrap;
    }
    .inst-pill-container {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 10px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
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
      font-family: inherit;
    }
    .user-section-group {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .user-avatar-bubble {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1E5BF6 0%, #3B82F6 100%);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 2px 6px rgba(30, 91, 246, 0.3);
      flex-shrink: 0;
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
      letter-spacing: 0.2px;
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
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-signout-nav:hover {
      background: #FEF2F2;
      color: #EF4444;
      border-color: #FECACA;
      transform: translateY(-1px);
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
        <div class="user-avatar-bubble">
          {{ getUserInitials() }}
        </div>
        <div class="user-profile-meta">
          <div class="user-fullname">{{ authService.currentUser()?.fullName || 'Administrator' }}</div>
          <div class="user-role-badge">{{ getRoleDisplayName() }}</div>
        </div>
        <button (click)="logout()" class="btn-signout-nav" title="Sign out of system">
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </header>
  `
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  getUserInitials(): string {
    const name = this.authService.currentUser()?.fullName || 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getRoleDisplayName(): string {
    const role = this.authService.currentUser()?.role;
    const r = role !== undefined && role !== null ? String(role).trim().toLowerCase() : '';
    if (r === '1' || r === 'platformadmin') return 'Platform Admin';
    if (r === '2' || r === 'institutionadmin') return 'Institution Admin';
    if (r === '3' || r === 'teacher') return 'Faculty Teacher';
    if (r === '4' || r === 'accountant') return 'Accountant';
    if (r === '5' || r === 'student') return 'Student';
    if (r === '6' || r === 'parent') return 'Parent';
    if (r === '7' || r === 'director') return 'Director';
    if (r === '8' || r === 'principal') return 'Principal';
    if (r === '9' || r === 'viceprincipal') return 'Vice Principal';
    if (r === '10' || r === 'headofdepartment') return 'HOD';
    return 'Institution Admin';
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
