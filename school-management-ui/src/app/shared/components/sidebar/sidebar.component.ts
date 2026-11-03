import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand" (click)="authService.openLogoModal()" style="cursor: pointer;" title="Click to upload or change institution logo">
        @if (getLogo()) {
          <img [src]="getLogo()" alt="Logo" style="width: 38px; height: 38px; object-fit: contain; border-radius: 10px; background: white; padding: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" />
        } @else {
          <div class="brand-logo" style="width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 20px;">🎓</div>
        }
        <div style="flex: 1; min-width: 0;">
          <div class="brand-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ authService.institutionName() || 'EduManage Cloud' }}</div>
          <div class="brand-subtitle" style="display: flex; align-items: center; gap: 4px;">
            <span>{{ authService.tenantName() }}</span>
            <span style="font-size: 10px; color: #38BDF8;" title="Change logo">📷</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Dashboard</span>
        </a>

        @if (authService.currentUser()?.role === 1 || authService.currentUser()?.role === 'PlatformAdmin') {
          <a routerLink="/platform-admin" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏢</span>
            <span>Platform SaaS Admin</span>
          </a>
        }

        <a routerLink="/students" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">👨‍🎓</span>
          <span>Students & Admissions</span>
        </a>

        <a routerLink="/staff" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">👨‍🏫</span>
          <span>Teachers & Staff</span>
        </a>

        <a routerLink="/academics" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📚</span>
          <span>Academics & Classes</span>
        </a>

        <a routerLink="/timetables" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">⏱</span>
          <span>Timetable & Scheduling</span>
        </a>

        <a routerLink="/attendance" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📅</span>
          <span>Daily Attendance</span>
        </a>

        <a routerLink="/examinations" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📝</span>
          <span>Exams & Results</span>
        </a>

        <a routerLink="/assignments" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📂</span>
          <span>Homework & Assignments</span>
        </a>

        <a routerLink="/fees" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">💳</span>
          <span>Fees & Invoices</span>
        </a>

        <a routerLink="/reports" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Essential Reports</span>
        </a>

        <a routerLink="/announcements" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📢</span>
          <span>Announcements</span>
        </a>

        <a routerLink="/subscriptions" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span>SaaS Subscription</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="text-xs" style="color: #64748B; font-weight: 600;">v1.0.1 • Multi-Tenant SaaS</div>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      flex-shrink: 0;
    }
    .sidebar {
      width: 255px;
      height: 100vh;
      background: linear-gradient(180deg, #0F172A 0%, #172033 100%);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      color: #FFFFFF;
      box-shadow: 2px 0 16px rgba(0, 0, 0, 0.08);
      position: sticky;
      top: 0;
      overflow-y: auto;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
    }
    .sidebar-brand {
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      transition: background-color 0.15s ease;
    }
    .sidebar-brand:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .brand-logo {
      font-size: 1.85rem;
    }
    .brand-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: -0.2px;
    }
    .brand-subtitle {
      font-size: 0.725rem;
      font-weight: 600;
      color: #94A3B8;
      margin-top: 1px;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1.1rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.65rem 0.95rem;
      color: #94A3B8;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      border-radius: 10px;
      transition: all 0.15s ease-in-out;
    }
    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.06);
      color: #FFFFFF;
      transform: translateX(2px);
    }
    .nav-item.active {
      background: linear-gradient(135deg, #1E5BF6 0%, #2563EB 100%);
      color: #FFFFFF;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(30, 91, 246, 0.35);
    }
    .nav-icon {
      font-size: 1.15rem;
    }
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
  `]
})
export class SidebarComponent {
  constructor(public authService: AuthService) {}

  getLogo(): string | null {
    return this.authService.getEffectiveLogo();
  }
}
