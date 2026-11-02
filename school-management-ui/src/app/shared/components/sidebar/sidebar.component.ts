import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-royal">
      <!-- Brand Logo Header with Institution / School Logo Support -->
      <div class="sidebar-brand-box">
        @if (authService.institutionLogoUrl() && !logoFailed) {
          <img 
            [src]="authService.institutionLogoUrl()" 
            alt="Institution Logo" 
            class="brand-logo-img" 
            (error)="logoFailed = true" />
        } @else {
          <div class="brand-emblem">🎓</div>
        }
        <div style="overflow: hidden;">
          <div class="brand-heading-text" [title]="authService.institutionName()">
            {{ authService.institutionName() || 'EduManage' }}
          </div>
          <div class="brand-tagline-text" [title]="authService.tenantName()">
            {{ authService.tenantName() || 'Cloud SaaS Platform' }}
          </div>
        </div>
      </div>

      <!-- Navigation Menu with Capsule Pills -->
      <nav class="sidebar-nav-container">
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📊</span>
          <span>Dashboard</span>
        </a>

        @if (authService.currentUser()?.role === 1 || authService.currentUser()?.role === 'PlatformAdmin') {
          <a routerLink="/platform-admin" routerLinkActive="active" class="nav-link-pill">
            <span class="nav-link-icon">🏢</span>
            <span>Platform SaaS Admin</span>
          </a>
        }

        <a routerLink="/students" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">👨‍🎓</span>
          <span>Students Directory</span>
        </a>

        <a routerLink="/staff" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">👨‍🏫</span>
          <span>Faculty & Staff</span>
        </a>

        <a routerLink="/academics" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📚</span>
          <span>Academics & Classes</span>
        </a>

        <a routerLink="/timetables" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">⏱</span>
          <span>Timetable & Slots</span>
        </a>

        <a routerLink="/attendance" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📅</span>
          <span>Daily Attendance</span>
        </a>

        <a routerLink="/examinations" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📝</span>
          <span>Exams & Marks</span>
        </a>

        <a routerLink="/assignments" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📂</span>
          <span>Assignments</span>
        </a>

        <a routerLink="/fees" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">💳</span>
          <span>Fees & Invoices</span>
        </a>

        <a routerLink="/reports" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📈</span>
          <span>Executive Reports</span>
        </a>

        <a routerLink="/announcements" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">📢</span>
          <span>Announcements</span>
        </a>

        <a routerLink="/subscriptions" routerLinkActive="active" class="nav-link-pill">
          <span class="nav-link-icon">⚙️</span>
          <span>Subscription Plan</span>
        </a>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar-footer-box">
        <a href="javascript:void(0)" class="help-pill-btn">
          <span>❓</span>
          <span>Get Help & Docs</span>
        </a>
        <div style="font-size: 11px; text-align: center; color: rgba(255,255,255,0.6);">
          v1.0.0 • Multi-Tenant SaaS
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  logoFailed = false;
  constructor(public authService: AuthService) {}
}
