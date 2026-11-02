import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardAnalytics } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header with Quick Action & Logo Update -->
      <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-900">Institution Dashboard</h1>
            <span class="badge badge-success text-xs">Live Session</span>
          </div>
          <p class="text-sm text-slate-500 mt-1">
            🏫 {{ authService.institutionName() }} • Overview, Attendance Health & Financial Telemetry
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="openLogoModal()" class="btn btn-outline btn-sm" style="box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            📷 Update Logo
          </button>
          <a routerLink="/students" class="btn btn-outline btn-sm">
            + Admit Student
          </a>
          <a routerLink="/fees" class="btn btn-primary btn-sm">
            + Collect Fee
          </a>
        </div>
      </div>

      <!-- KPI Stat Grid (6 Metric Cards) -->
      <div class="stat-grid">
        <!-- 1. Enrolled Students -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-2">
            <span class="stat-label">Total Enrolled</span>
            <div style="width: 40px; height: 40px; border-radius: 12px; background: #EFF6FF; color: #1E5BF6; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              👨‍🎓
            </div>
          </div>
          <div class="stat-value">{{ analytics?.totalStudents || 0 }}</div>
          <div class="flex items-center gap-2 mt-2">
            <span style="font-size: 11px; font-weight: 700; color: #10B981; background: #ECFDF5; padding: 2px 8px; border-radius: 9999px;">
              {{ analytics?.activeStudents || 0 }} Active
            </span>
            <span class="text-xs text-slate-400">Current Academic Term</span>
          </div>
        </div>

        <!-- 2. Teaching & Admin Staff -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-2">
            <span class="stat-label">Faculty & Staff</span>
            <div style="width: 40px; height: 40px; border-radius: 12px; background: #F3E8FF; color: #7E22CE; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              👨‍🏫
            </div>
          </div>
          <div class="stat-value">{{ analytics?.totalStaff || 0 }}</div>
          <div class="flex items-center gap-2 mt-2">
            <span style="font-size: 11px; font-weight: 700; color: #7E22CE; background: #F3E8FF; padding: 2px 8px; border-radius: 9999px;">
              Faculty
            </span>
            <span class="text-xs text-slate-400">Teaching & Admin Team</span>
          </div>
        </div>

        <!-- 3. Fee Collected This Month -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-2">
            <span class="stat-label">Fee Collected (Month)</span>
            <div style="width: 40px; height: 40px; border-radius: 12px; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              💳
            </div>
          </div>
          <div class="stat-value text-emerald-600">₹{{ analytics?.totalFeeCollectedThisMonth?.toLocaleString() || 0 }}</div>
          <div class="flex items-center gap-2 mt-2">
            <span style="font-size: 11px; font-weight: 700; color: #059669; background: #ECFDF5; padding: 2px 8px; border-radius: 9999px;">
              ✓ Reconciled
            </span>
            <span class="text-xs text-slate-400">Cash & Bank Collection</span>
          </div>
        </div>

        <!-- 4. Pending Outstanding Balance -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-2">
            <span class="stat-label">Pending Dues</span>
            <div style="width: 40px; height: 40px; border-radius: 12px; background: #FFF1F2; color: #E11D48; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              ⚠️
            </div>
          </div>
          <div class="stat-value text-rose-600">₹{{ analytics?.totalOutstandingFees?.toLocaleString() || 0 }}</div>
          <div class="flex items-center gap-2 mt-2">
            <span style="font-size: 11px; font-weight: 700; color: #E11D48; background: #FFF1F2; padding: 2px 8px; border-radius: 9999px;">
              Receivables
            </span>
            <span class="text-xs text-slate-400">Uncollected student invoices</span>
          </div>
        </div>

        <!-- 5. 30-Day Attendance Rate -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-2">
            <span class="stat-label">Overall Attendance</span>
            <div style="width: 40px; height: 40px; border-radius: 12px; background: #EEF2FF; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              📈
            </div>
          </div>
          <div class="stat-value text-indigo-600">{{ analytics?.averageAttendanceRate || 0 }}%</div>
          <div class="flex items-center gap-2 mt-2">
            <span style="font-size: 11px; font-weight: 700; color: #4F46E5; background: #EEF2FF; padding: 2px 8px; border-radius: 9999px;">
              30-Day Rate
            </span>
            <span class="text-xs text-slate-400">Average across sections</span>
          </div>
        </div>

        <!-- 6. Total Active Classes -->
        <div class="stat-card">
          <div class="flex items-center justify-between mb-2">
            <span class="stat-label">Active Classes</span>
            <div style="width: 40px; height: 40px; border-radius: 12px; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              🏫
            </div>
          </div>
          <div class="stat-value">{{ analytics?.totalClasses || 0 }}</div>
          <div class="flex items-center gap-2 mt-2">
            <span style="font-size: 11px; font-weight: 700; color: #D97706; background: #FEF3C7; padding: 2px 8px; border-radius: 9999px;">
              Grades & Divs
            </span>
            <span class="text-xs text-slate-400">Scheduled in session</span>
          </div>
        </div>
      </div>

      <!-- Two-Column Operational Row -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Monthly Collections Bar Breakdown -->
        <div class="card" style="box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <div class="card-header">
            <div>
              <h2 class="card-title">Monthly Fee Collection Trend</h2>
              <span class="text-xs text-slate-500">6-Month historical inflow breakdown</span>
            </div>
            <span class="badge badge-info text-xs">Analytics</span>
          </div>

          <div class="flex flex-col gap-4 mt-2">
            @if (!analytics?.recentCollections?.length) {
              <div class="text-center py-8 text-slate-400 text-sm">
                No fee collection records found for recent months.
              </div>
            } @else {
              @for (item of analytics?.recentCollections; track item.month) {
                <div>
                  <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                    <span>{{ item.month }}</span>
                    <span class="text-slate-900 font-bold">₹{{ item.amount.toLocaleString() }}</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div class="bg-primary h-2.5 rounded-full" [style.width.%]="getBarPercentage(item.amount)" style="transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); background: linear-gradient(90deg, #1E5BF6 0%, #3B82F6 100%);"></div>
                  </div>
                </div>
              }
            }
          </div>
        </div>

        <!-- Quick Access Portals -->
        <div class="card" style="box-shadow: 0 2px 10px rgba(0,0,0,0.03);">
          <div class="card-header">
            <div>
              <h2 class="card-title">Quick Action Hub</h2>
              <span class="text-xs text-slate-500">Fast workflows for institution administrators</span>
            </div>
            <span class="badge badge-neutral text-xs">Shortcuts</span>
          </div>

          <div class="grid grid-cols-2 gap-3 mt-2">
            <a routerLink="/attendance" class="quick-btn">
              <span class="quick-icon" style="background: #EFF6FF; color: #1E5BF6;">📅</span>
              <div>
                <div class="font-bold text-slate-800 text-sm">Daily Attendance</div>
                <div class="text-xs text-slate-500">Record roll calls per section</div>
              </div>
            </a>

            <a routerLink="/timetables" class="quick-btn">
              <span class="quick-icon" style="background: #EEF2FF; color: #4F46E5;">⏱</span>
              <div>
                <div class="font-bold text-slate-800 text-sm">Timetable Engine</div>
                <div class="text-xs text-slate-500">Class schedules & room slots</div>
              </div>
            </a>

            <a routerLink="/examinations" class="quick-btn">
              <span class="quick-icon" style="background: #FEF3C7; color: #D97706;">📝</span>
              <div>
                <div class="font-bold text-slate-800 text-sm">Exams & Marks</div>
                <div class="text-xs text-slate-500">Grading & student report cards</div>
              </div>
            </a>

            <a routerLink="/fees" class="quick-btn">
              <span class="quick-icon" style="background: #ECFDF5; color: #059669;">💳</span>
              <div>
                <div class="font-bold text-slate-800 text-sm">Fees & Receipts</div>
                <div class="text-xs text-slate-500">Collect dues & print receipts</div>
              </div>
            </a>

            <a routerLink="/reports" class="quick-btn">
              <span class="quick-icon" style="background: #F3E8FF; color: #7E22CE;">📊</span>
              <div>
                <div class="font-bold text-slate-800 text-sm">Essential Reports</div>
                <div class="text-xs text-slate-500">Defaulters & revenue audits</div>
              </div>
            </a>

            <a routerLink="/announcements" class="quick-btn">
              <span class="quick-icon" style="background: #FFF1F2; color: #E11D48;">📢</span>
              <div>
                <div class="font-bold text-slate-800 text-sm">Announcements</div>
                <div class="text-xs text-slate-500">Alert parents, staff, or students</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- Update Logo Modal Dialog -->
      @if (showLogoModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 480px;">
            <div class="card-header" style="margin-bottom: 1rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0;">📷 Update Institution Logo</h3>
                <span style="font-size: 12px; color: #64748B;">Enter your official logo image URL or asset path</span>
              </div>
              <button (click)="closeLogoModal()" style="border: none; background: transparent; font-size: 18px; cursor: pointer; color: #94A3B8;">✕</button>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label" style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; display: block;">
                Logo Image URL or Local Path *
              </label>
              <input 
                type="text" 
                class="form-control" 
                [(ngModel)]="logoUrlInput" 
                placeholder="https://example.com/logo.png or assets/logo.png"
                style="padding: 10px 14px; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 13px; width: 100%; box-sizing: border-box;">
              <p style="font-size: 11px; color: #64748B; margin-top: 6px;">
                💡 Tip: You can paste any online image URL or place an image in <code style="background: #F1F5F9; padding: 2px 4px; border-radius: 4px;">src/assets/logo.png</code>
              </p>
            </div>

            @if (logoUrlInput) {
              <div style="text-align: center; margin-bottom: 18px; padding: 14px; background: #F8FAFC; border-radius: 12px; border: 1px dashed #CBD5E1;">
                <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 8px;">Logo Preview</div>
                <img [src]="logoUrlInput" alt="Logo Preview" style="max-height: 60px; max-width: 160px; object-fit: contain; margin: 0 auto; display: block;" (error)="onImgError($event)">
              </div>
            }

            @if (logoMessage) {
              <div class="alert alert-success" style="font-size: 12px; padding: 8px 12px; margin-bottom: 14px;">
                {{ logoMessage }}
              </div>
            }

            <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button (click)="closeLogoModal()" class="btn btn-outline btn-sm">
                Cancel
              </button>
              <button (click)="saveLogo()" class="btn btn-primary btn-sm" [disabled]="!logoUrlInput.trim()">
                Save Logo
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quick-btn {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.95rem 1rem;
      background: #FFFFFF;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .quick-btn:hover {
      background-color: #F8FAFC;
      border-color: #93C5FD;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(30, 91, 246, 0.08);
    }
    .quick-icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
  `]
})
export class DashboardComponent implements OnInit {
  analytics: DashboardAnalytics | null = null;
  loading = true;
  showLogoModal = false;
  logoUrlInput = '';
  logoMessage = '';

  constructor(private api: ApiService, public authService: AuthService) {}

  ngOnInit(): void {
    this.api.getInstitutionDashboard().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.analytics = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    const currentLogo = localStorage.getItem('institution_custom_logo');
    if (currentLogo) {
      this.logoUrlInput = currentLogo;
    }
  }

  getBarPercentage(amount: number): number {
    if (!this.analytics?.recentCollections?.length) return 0;
    const max = Math.max(...this.analytics.recentCollections.map(c => c.amount), 1);
    return Math.min(100, Math.round((amount / max) * 100));
  }

  openLogoModal(): void {
    this.showLogoModal = true;
    this.logoMessage = '';
  }

  closeLogoModal(): void {
    this.showLogoModal = false;
  }

  saveLogo(): void {
    if (!this.logoUrlInput.trim()) return;
    localStorage.setItem('institution_custom_logo', this.logoUrlInput.trim());
    this.logoMessage = 'Logo saved successfully! It will now appear on your Navbar and Sidebar.';
    setTimeout(() => {
      this.closeLogoModal();
      window.location.reload();
    }, 1200);
  }

  onImgError(event: any): void {
    event.target.style.display = 'none';
  }
}
