import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardAnalytics } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Institution Dashboard</h1>
          <p class="text-sm text-slate-500">{{ authService.institutionName() }} • Overview and Academic Health</p>
        </div>
        <div class="flex gap-3">
          <a routerLink="/students" class="btn btn-outline btn-sm">+ Admit Student</a>
          <a routerLink="/fees" class="btn btn-primary btn-sm">+ Collect Fee</a>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">Total Enrolled Students</span>
          <span class="stat-value">{{ analytics?.totalStudents || 0 }}</span>
          <span class="text-xs text-slate-500">{{ analytics?.activeStudents || 0 }} active this session</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Teaching & Admin Staff</span>
          <span class="stat-value">{{ analytics?.totalStaff || 0 }}</span>
          <span class="text-xs text-slate-500">Active faculty & personnel</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Fee Collected This Month</span>
          <span class="stat-value text-emerald-600">₹{{ analytics?.totalFeeCollectedThisMonth?.toLocaleString() || 0 }}</span>
          <span class="text-xs text-emerald-600 font-medium">Reconciled in system</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Pending Outstanding Balance</span>
          <span class="stat-value text-rose-600">₹{{ analytics?.totalOutstandingFees?.toLocaleString() || 0 }}</span>
          <span class="text-xs text-rose-600 font-medium">Uncollected student invoices</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">30-Day Attendance Rate</span>
          <span class="stat-value text-indigo-600">{{ analytics?.averageAttendanceRate || 0 }}%</span>
          <span class="text-xs text-slate-500">Class average across sections</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Total Active Classes</span>
          <span class="stat-value">{{ analytics?.totalClasses || 0 }}</span>
          <span class="text-xs text-slate-500">School grades & college batches</span>
        </div>
      </div>

      <!-- Two-Column Operational Row -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Monthly Collections Bar Breakdown -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Monthly Fee Collection Trend</h2>
            <span class="text-xs text-slate-500">Last 6 Months</span>
          </div>

          <div class="flex flex-col gap-4">
            @for (item of analytics?.recentCollections; track item.month) {
              <div>
                <div class="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>{{ item.month }}</span>
                  <span>₹{{ item.amount.toLocaleString() }}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-primary h-2 rounded-full" [style.width.%]="getBarPercentage(item.amount)"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Access Portals -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Quick Action Center</h2>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <a routerLink="/attendance" class="quick-btn">
              <span class="text-2xl">📅</span>
              <div>
                <div class="font-semibold text-slate-800 text-sm">Mark Daily Attendance</div>
                <div class="text-xs text-slate-500">Record roll calls per section</div>
              </div>
            </a>

            <a routerLink="/examinations" class="quick-btn">
              <span class="text-2xl">📝</span>
              <div>
                <div class="font-semibold text-slate-800 text-sm">Exam Schedules & Marks</div>
                <div class="text-xs text-slate-500">Enter marks & print report cards</div>
              </div>
            </a>

            <a routerLink="/fees" class="quick-btn">
              <span class="text-2xl">💳</span>
              <div>
                <div class="font-semibold text-slate-800 text-sm">Fee Collection & Receipts</div>
                <div class="text-xs text-slate-500">Issue invoices & collect cash/bank</div>
              </div>
            </a>

            <a routerLink="/announcements" class="quick-btn">
              <span class="text-2xl">📢</span>
              <div>
                <div class="font-semibold text-slate-800 text-sm">Broadcast Announcement</div>
                <div class="text-xs text-slate-500">Alert parents, staff, or students</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-6 { margin-bottom: 1.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 900px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
    .w-full { width: 100%; }
    .h-2 { height: 0.5rem; }
    .bg-slate-100 { background-color: var(--slate-100); }
    .bg-primary { background-color: var(--primary); }
    .rounded-full { border-radius: 9999px; }
    .overflow-hidden { overflow: hidden; }
    .quick-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      border: 1px solid var(--slate-200);
      border-radius: 10px;
      text-decoration: none;
      transition: all 0.15s;
    }
    .quick-btn:hover {
      background-color: var(--slate-50);
      border-color: var(--primary);
    }
    .text-emerald-600 { color: #059669; }
    .text-rose-600 { color: #e11d48; }
    .text-indigo-600 { color: #4f46e5; }
  `]
})
export class DashboardComponent implements OnInit {
  analytics: DashboardAnalytics | null = null;
  loading = true;

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
  }

  getBarPercentage(amount: number): number {
    if (!this.analytics?.recentCollections?.length) return 0;
    const max = Math.max(...this.analytics.recentCollections.map(c => c.amount), 1);
    return Math.min(100, Math.round((amount / max) * 100));
  }
}
