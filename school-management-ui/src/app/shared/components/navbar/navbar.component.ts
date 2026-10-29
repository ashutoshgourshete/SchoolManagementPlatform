import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="workspace-header">
      <!-- Left: Institution Selector Pill -->
      <div class="flex items-center gap-3">
        <div class="institution-pill-selector">
          <span style="font-size: 16px;">🏫</span>
          <select 
            class="institution-select-field"
            [value]="authService.getSelectedInstitutionId()"
            (change)="onInstitutionChange($event)">
            @for (inst of authService.currentUser()?.availableInstitutions; track inst.institutionId) {
              <option [value]="inst.institutionId">{{ inst.name }} ({{ inst.code }})</option>
            }
          </select>
          <span style="font-size: 11px; color: #94A3B8;">▾</span>
        </div>

        <div class="search-pill-box">
          <span style="color: #94A3B8; font-size: 14px;">🔍</span>
          <input 
            type="text" 
            class="search-pill-input" 
            placeholder="Search students, staff, classes...">
        </div>
      </div>

      <!-- Right: Notifications & User Profile Chip -->
      <div class="flex items-center gap-4">
        <button class="notification-bell-btn" title="Notifications">
          <span>🔔</span>
          <span class="bell-badge-dot"></span>
        </button>

        <div class="user-profile-chip">
          <div class="user-avatar-circle">
            {{ getUserInitials() }}
          </div>
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.3px;">
              HI, {{ getFirstName() }}!
            </div>
            <div style="font-size: 10px; color: #64748B; font-weight: 600; text-transform: capitalize;">
              {{ authService.currentUser()?.role || 'Staff Member' }}
            </div>
          </div>
        </div>

        <button (click)="logout()" class="btn btn-outline btn-sm" style="border-radius: 9999px; padding: 5px 14px; font-size: 12px;">
          Log out
        </button>
      </div>
    </header>
  `,
  styles: [`
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  onInstitutionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target.value) {
      this.authService.switchInstitution(target.value);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getFirstName(): string {
    const fullName = this.authService.currentUser()?.fullName || 'User';
    return fullName.split(' ')[0];
  }

  getUserInitials(): string {
    const fullName = this.authService.currentUser()?.fullName || 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
}
