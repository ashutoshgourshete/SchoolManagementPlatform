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
      <div class="sidebar-brand">
        <div class="brand-logo">🎓</div>
        <div>
          <div class="brand-title">EduManage Cloud</div>
          <div class="brand-subtitle">{{ authService.tenantName() }}</div>
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

        <a routerLink="/attendance" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📅</span>
          <span>Daily Attendance</span>
        </a>

        <a routerLink="/examinations" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">📝</span>
          <span>Exams & Results</span>
        </a>

        <a routerLink="/fees" routerLinkActive="active" class="nav-item">
          <span class="nav-icon">💳</span>
          <span>Fees & Invoices</span>
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
        <div class="text-xs text-slate-400">v1.0.0 • Multi-Tenant SaaS</div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-brand {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid #1e293b;
    }
    .brand-logo {
      font-size: 1.75rem;
    }
    .brand-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
    }
    .brand-subtitle {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      color: #cbd5e1;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.15s ease-in-out;
    }
    .nav-item:hover {
      background-color: #1e293b;
      color: #fff;
    }
    .nav-item.active {
      background-color: var(--primary);
      color: #fff;
      font-weight: 600;
    }
    .nav-icon {
      font-size: 1.1rem;
    }
    .sidebar-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #1e293b;
    }
  `]
})
export class SidebarComponent {
  constructor(public authService: AuthService) {}
}
