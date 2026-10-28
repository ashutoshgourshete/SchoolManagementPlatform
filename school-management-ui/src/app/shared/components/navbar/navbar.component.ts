import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-navbar">
      <div class="flex items-center gap-4">
        <span class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Institution:</span>
        <select 
          class="form-control text-sm font-medium border-slate-300 py-1 px-3 rounded-md"
          [value]="authService.getSelectedInstitutionId()"
          (change)="onInstitutionChange($event)">
          @for (inst of authService.currentUser()?.availableInstitutions; track inst.institutionId) {
            <option [value]="inst.institutionId">{{ inst.name }} ({{ inst.code }})</option>
          }
        </select>
      </div>

      <div class="flex items-center gap-6">
        <div class="text-right">
          <div class="text-sm font-semibold text-slate-800">{{ authService.currentUser()?.fullName }}</div>
          <div class="text-xs text-slate-500 capitalize">{{ authService.currentUser()?.role }}</div>
        </div>
        <button (click)="logout()" class="btn btn-outline btn-sm">
          Sign out
        </button>
      </div>
    </header>
  `,
  styles: [`
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .text-right { text-align: right; }
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
}
