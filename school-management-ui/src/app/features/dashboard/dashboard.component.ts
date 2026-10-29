import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardAnalytics, Student } from '../../core/models/models';

interface StudentApprovalRow {
  id: string;
  name: string;
  avatarColor: string;
  phone: string;
  guardianName: string;
  guardianRole: string;
  grade: string;
  gradeColor: string;
  teacherName: string;
  teacherInitials: string;
  status: 'Pending...' | 'Active';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div>
      <!-- Top Title Bar -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">
            Overview &amp; Student Approvement
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            {{ authService.institutionName() || 'Institution Campus' }} • Academic Session 2026-2027
          </p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/students" class="btn btn-outline btn-sm">
            <span>+ Admit Student</span>
          </a>
          <a routerLink="/fees" class="btn btn-primary btn-sm">
            <span>+ Collect Fee</span>
          </a>
        </div>
      </div>

      <!-- 3 Hero Gradient Stat Cards (Coral, Amber, Electric Blue) -->
      <div class="hero-stat-grid">
        <!-- Coral / Red Stat Card -->
        <div class="gradient-card gradient-card-coral">
          <div class="card-top-row">
            <div class="card-icon-bubble">
              <span>👥</span>
            </div>
            <div class="card-trend-badge">
              <span>+5</span>
              <span>↑</span>
            </div>
          </div>
          <div class="card-bottom-info">
            <div class="card-metric-title">Total Members</div>
            <div class="card-metric-val">{{ (analytics?.totalStudents || 65) }} Members</div>
          </div>
        </div>

        <!-- Amber / Golden Orange Stat Card -->
        <div class="gradient-card gradient-card-amber">
          <div class="card-top-row">
            <div class="card-icon-bubble">
              <span>💰</span>
            </div>
            <div class="card-trend-badge">
              <span>+ ₹45,381</span>
            </div>
          </div>
          <div class="card-bottom-info">
            <div class="card-metric-title">Fee Collections</div>
            <div class="card-metric-val">₹ {{ (analytics?.totalFeeCollectedThisMonth || 103834).toLocaleString() }}</div>
          </div>
        </div>

        <!-- Electric Indigo / Blue Stat Card with Wave Sparkline -->
        <div class="gradient-card gradient-card-blue">
          <div class="card-top-row">
            <div class="card-icon-bubble">
              <span>📈</span>
            </div>
            <div class="card-trend-badge">
              <span>+4.5% Active</span>
            </div>
          </div>
          <div class="card-bottom-info">
            <!-- Sparkline Curve SVG -->
            <svg viewBox="0 0 100 25" style="width: 100%; height: 28px; opacity: 0.75; margin-bottom: 4px;" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M 0 18 Q 20 8 35 15 T 70 8 T 100 4" />
            </svg>
            <div class="card-metric-title">Average Attendance</div>
            <div class="card-metric-val">{{ analytics?.averageAttendanceRate || 78 }}%</div>
          </div>
        </div>
      </div>

      <!-- Centerpiece: Student Approvement & Directory Table -->
      <div class="table-card">
        <div class="table-toolbar">
          <div class="section-heading-group">
            <div class="section-title">Student Approvement</div>
            <div class="section-subtitle">Review new admissions, assign sections, and verify records</div>
          </div>
          <div class="flex items-center gap-3">
            <div class="search-pill-box" style="width: 220px;">
              <span style="color: #94A3B8; font-size: 13px;">🔍</span>
              <input 
                type="text" 
                class="search-pill-input" 
                placeholder="Filter roster..."
                [(ngModel)]="filterQuery"
                (input)="filterStudents()">
            </div>
            <button class="btn btn-outline btn-sm" style="border-radius: 9999px; gap: 6px;">
              <span>⚡</span>
              <span>Filter</span>
            </button>
          </div>
        </div>

        <!-- Notification Toast when Action Clicked -->
        @if (actionToast) {
          <div class="alert alert-success" style="padding: 8px 16px; font-size: 13px; font-weight: 600;">
            {{ actionToast }}
          </div>
        }

        <div class="table-responsive">
          <table class="mock-table">
            <thead>
              <tr>
                <th>Student Info</th>
                <th>Grade</th>
                <th>Teacher</th>
                <th>Status</th>
                <th style="text-align: right; padding-right: 24px;">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (st of displayedStudents; track st.id) {
                <tr>
                  <!-- Student Info Column with Photo Avatar & Blue Phone Icon -->
                  <td>
                    <div class="student-meta-cell">
                      <div class="avatar-circle" [ngClass]="st.avatarColor">
                        {{ getInitials(st.name) }}
                      </div>
                      <div>
                        <div class="student-name-text">{{ st.name }}</div>
                        <div class="phone-meta-text">
                          <span class="phone-icon-blue">📞</span>
                          <span>{{ st.guardianRole }}: {{ st.guardianName }} • {{ st.phone }}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Grade Column with Soft Pastel Capsule -->
                  <td>
                    <span class="grade-capsule" [ngClass]="st.gradeColor">
                      {{ st.grade }}
                    </span>
                  </td>

                  <!-- Teacher Column with Small Avatar -->
                  <td>
                    <div class="teacher-meta-cell">
                      <div class="teacher-avatar-sm">
                        {{ st.teacherInitials }}
                      </div>
                      <span class="teacher-name-text">{{ st.teacherName }}</span>
                    </div>
                  </td>

                  <!-- Status Column with Amber/Green Capsule -->
                  <td>
                    <span class="status-capsule" [ngClass]="st.status === 'Pending...' ? 'status-pending' : 'status-active'">
                      <span class="status-dot"></span>
                      <span>{{ st.status }}</span>
                    </span>
                  </td>

                  <!-- Actions Column (APPROVE & REJECT Pills) -->
                  <td style="text-align: right; padding-right: 20px;">
                    <div class="flex items-center justify-end gap-2">
                      @if (st.status === 'Pending...') {
                        <button (click)="approveStudent(st)" class="btn-approve-pill">
                          Approve
                        </button>
                        <button (click)="rejectStudent(st)" class="btn-reject-pill">
                          Reject
                        </button>
                      } @else {
                        <span style="font-size: 12px; font-weight: 700; color: #10B981;">✓ Approved</span>
                        <a [routerLink]="['/students']" class="btn-reject-pill" style="color: #1E5BF6;">View</a>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mock Pagination Bar matching Laptop Mockup -->
        <div class="mock-pagination">
          <div>
            <span>Rows per page: </span>
            <span style="font-weight: 700; color: #0F172A;">10 ▾</span>
            <span style="margin-left: 12px;">1-10 of {{ totalRecords }}</span>
          </div>
          <div class="pagination-controls">
            <button class="pagination-btn">‹</button>
            <button class="pagination-btn active">1</button>
            <button class="pagination-btn">2</button>
            <button class="pagination-btn">3</button>
            <button class="pagination-btn">4</button>
            <button class="pagination-btn">5</button>
            <span>...</span>
            <button class="pagination-btn">39</button>
            <button class="pagination-btn">›</button>
          </div>
        </div>
      </div>

      <!-- Bottom Operational Grid: Monthly Fee Trends & Quick Centers -->
      <div class="grid grid-cols-2 gap-5 mt-5">
        <!-- Monthly Collections Bar Chart -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <h2 class="card-title">Monthly Collection Trend</h2>
            <span class="text-xs text-slate-500 font-semibold">Last 6 Months</span>
          </div>

          <div class="flex flex-col gap-3.5">
            @for (item of analytics?.recentCollections; track item.month) {
              <div>
                <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>{{ item.month }}</span>
                  <span style="color: #1E5BF6;">₹{{ item.amount.toLocaleString() }}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div class="bg-primary h-2 rounded-full" [style.width.%]="getBarPercentage(item.amount)"></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Quick Access Action Hub -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <h2 class="card-title">Quick Operational Hub</h2>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <a routerLink="/attendance" class="quick-btn">
              <span class="text-2xl">📅</span>
              <div>
                <div class="font-bold text-slate-800 text-xs">Daily Attendance</div>
                <div class="text-xs text-slate-400">Class roll call</div>
              </div>
            </a>

            <a routerLink="/examinations" class="quick-btn">
              <span class="text-2xl">📝</span>
              <div>
                <div class="font-bold text-slate-800 text-xs">Exam Marks</div>
                <div class="text-xs text-slate-400">Grade entry</div>
              </div>
            </a>

            <a routerLink="/fees" class="quick-btn">
              <span class="text-2xl">💳</span>
              <div>
                <div class="font-bold text-slate-800 text-xs">Fee Invoicing</div>
                <div class="text-xs text-slate-400">Receipts & ledger</div>
              </div>
            </a>

            <a routerLink="/announcements" class="quick-btn">
              <span class="text-2xl">📢</span>
              <div>
                <div class="font-bold text-slate-800 text-xs">Announcements</div>
                <div class="text-xs text-slate-400">Broadcast notice</div>
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
    .justify-end { justify-content: flex-end; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mt-5 { margin-top: 1.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-5 { gap: 1.25rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 900px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
    .w-full { width: 100%; }
    .h-2 { height: 0.5rem; }
    .bg-slate-100 { background-color: #F1F5F9; }
    .bg-primary { background: linear-gradient(90deg, #1E5BF6 0%, #3B82F6 100%); }
    .rounded-full { border-radius: 9999px; }
    .overflow-hidden { overflow: hidden; }
    .quick-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      text-decoration: none;
      transition: all 0.15s ease;
      background: #FAFCFF;
    }
    .quick-btn:hover {
      background: #FFFFFF;
      border-color: #1E5BF6;
      box-shadow: 0 4px 12px rgba(30, 91, 246, 0.08);
      transform: translateY(-1px);
    }
  `]
})
export class DashboardComponent implements OnInit {
  analytics: DashboardAnalytics | null = null;
  loading = true;
  filterQuery = '';
  actionToast = '';
  totalRecords = 375;

  // Master approval directory matching the mock-up aesthetic
  approvalStudents: StudentApprovalRow[] = [
    {
      id: '1',
      name: 'Jeremy Palmer',
      avatarColor: 'avatar-circle-coral',
      phone: '(555) 234-5678',
      guardianName: 'Jeremy Palmer Sr.',
      guardianRole: 'Dad',
      grade: '1st Grade',
      gradeColor: 'grade-purple',
      teacherName: 'Mrs. Palmer',
      teacherInitials: 'MP',
      status: 'Pending...'
    },
    {
      id: '2',
      name: 'Alice Cooper',
      avatarColor: 'avatar-circle-amber',
      phone: '(555) 987-6543',
      guardianName: 'Sarah Cooper',
      guardianRole: 'Mom',
      grade: '2nd Grade',
      gradeColor: 'grade-emerald',
      teacherName: 'Mrs. Peterson',
      teacherInitials: 'RP',
      status: 'Pending...'
    },
    {
      id: '3',
      name: 'Ethan Hunt',
      avatarColor: 'avatar-circle-emerald',
      phone: '(555) 432-1098',
      guardianName: 'David Hunt',
      guardianRole: 'Dad',
      grade: '5th Grade',
      gradeColor: 'grade-amber',
      teacherName: 'Mr. Vance',
      teacherInitials: 'TV',
      status: 'Pending...'
    },
    {
      id: '4',
      name: 'Sophia Martinez',
      avatarColor: 'avatar-circle-purple',
      phone: '(555) 345-6789',
      guardianName: 'Elena Martinez',
      guardianRole: 'Mom',
      grade: '3rd Grade',
      gradeColor: 'grade-blue',
      teacherName: 'Mrs. Jenkins',
      teacherInitials: 'LJ',
      status: 'Active'
    },
    {
      id: '5',
      name: 'Lucas Anderson',
      avatarColor: 'avatar-circle-coral',
      phone: '(555) 876-5432',
      guardianName: 'Mark Anderson',
      guardianRole: 'Dad',
      grade: '1st Grade',
      gradeColor: 'grade-purple',
      teacherName: 'Mrs. Palmer',
      teacherInitials: 'MP',
      status: 'Active'
    }
  ];

  displayedStudents: StudentApprovalRow[] = [];

  constructor(private api: ApiService, public authService: AuthService) {
    this.displayedStudents = [...this.approvalStudents];
  }

  ngOnInit(): void {
    this.displayedStudents = [...this.approvalStudents];

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

    // Also fetch live students from API if available to merge
    this.api.getStudents(1, 10).subscribe({
      next: (res) => {
        if (res.success && res.data?.items?.length) {
          this.totalRecords = res.data.totalCount || 375;
          // Enrich items with live data
          const apiRows: StudentApprovalRow[] = res.data.items.slice(0, 5).map((s: Student, idx: number) => {
            const colors = ['avatar-circle-coral', 'avatar-circle-amber', 'avatar-circle-emerald', 'avatar-circle-purple'];
            const gradeColors = ['grade-purple', 'grade-blue', 'grade-emerald', 'grade-amber'];
            const guardian = s.guardians && s.guardians.length > 0 ? s.guardians[0] : null;
            return {
              id: s.id,
              name: s.fullName,
              avatarColor: colors[idx % colors.length],
              phone: s.emergencyContactPhone || guardian?.phone || '(555) 302-8921',
              guardianName: guardian ? guardian.fullName : 'Parent / Guardian',
              guardianRole: guardian?.relationship === 1 ? 'Father' : (guardian?.relationship === 2 ? 'Mother' : 'Guardian'),
              grade: s.currentClassName || '1st Grade',
              gradeColor: gradeColors[idx % gradeColors.length],
              teacherName: 'Mrs. Palmer',
              teacherInitials: 'MP',
              status: s.isActive ? 'Active' : 'Pending...'
            };
          });

          if (apiRows.length > 0) {
            this.approvalStudents = apiRows;
            this.filterStudents();
          }
        }
      },
      error: () => {
        // Keep fallback mock students matching mockup
      }
    });
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  filterStudents(): void {
    if (!this.filterQuery) {
      this.displayedStudents = [...this.approvalStudents];
      return;
    }
    const q = this.filterQuery.toLowerCase();
    this.displayedStudents = this.approvalStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q) ||
      s.teacherName.toLowerCase().includes(q)
    );
  }

  approveStudent(st: StudentApprovalRow): void {
    st.status = 'Active';
    this.actionToast = `🎉 Approved enrollment for ${st.name}! Student is now active in ${st.grade}.`;
    setTimeout(() => {
      this.actionToast = '';
    }, 4000);
  }

  rejectStudent(st: StudentApprovalRow): void {
    this.displayedStudents = this.displayedStudents.filter(s => s.id !== st.id);
    this.actionToast = `Enrollment application for ${st.name} was rejected.`;
    setTimeout(() => {
      this.actionToast = '';
    }, 4000);
  }

  getBarPercentage(amount: number): number {
    if (!this.analytics?.recentCollections?.length) return 0;
    const max = Math.max(...this.analytics.recentCollections.map(c => c.amount), 1);
    return Math.min(100, Math.round((amount / max) * 100));
  }
}
