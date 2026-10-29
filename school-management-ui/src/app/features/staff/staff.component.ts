import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Staff, Department, PagedResult } from '../../core/models/models';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Top Title Bar -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">
            Faculty &amp; Staff Directory
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Manage certified educators, departmental faculty, and institutional personnel
          </p>
        </div>
        <div class="flex gap-2">
          <button (click)="openStaffModal()" class="btn btn-primary btn-sm">
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      <!-- 3 Hero Mini Gradient Stat Cards -->
      <div class="hero-stat-grid" style="margin-bottom: 1.5rem;">
        <div class="gradient-card gradient-card-blue" style="min-height: 120px; padding: 1.25rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 38px; height: 38px; font-size: 18px;">👨‍🏫</div>
            <div class="card-trend-badge">Active Faculty</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.5rem;">
            <div class="card-metric-title">Total Staff Members</div>
            <div class="card-metric-val" style="font-size: 1.85rem;">{{ pagedResult?.totalCount || 18 }} Personnel</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-coral" style="min-height: 120px; padding: 1.25rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 38px; height: 38px; font-size: 18px;">📚</div>
            <div class="card-trend-badge">Teaching Staff</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.5rem;">
            <div class="card-metric-title">Active Class Teachers</div>
            <div class="card-metric-val" style="font-size: 1.85rem;">{{ getTeacherCount() }} Instructors</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-amber" style="min-height: 120px; padding: 1.25rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 38px; height: 38px; font-size: 18px;">🏢</div>
            <div class="card-trend-badge">Departments</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.5rem;">
            <div class="card-metric-title">Academic Departments</div>
            <div class="card-metric-val" style="font-size: 1.85rem;">{{ departments.length || 4 }} Branches</div>
          </div>
        </div>
      </div>

      <!-- Staff Directory Table Card -->
      <div class="table-card">
        <div class="table-toolbar">
          <div class="section-heading-group">
            <div class="section-title">Faculty Roster</div>
            <div class="section-subtitle">Directory of professors, teachers, and administrative personnel</div>
          </div>

          <div class="flex items-center gap-3">
            <div class="search-pill-box" style="width: 250px;">
              <span style="color: #94A3B8; font-size: 13px;">🔍</span>
              <input 
                type="text" 
                class="search-pill-input" 
                placeholder="Search by name, code, email..."
                [(ngModel)]="searchTerm"
                (keyup.enter)="loadStaff(1)">
            </div>

            <select 
              class="form-control" 
              style="width: 170px; border-radius: 9999px; padding: 6px 12px; font-size: 12px; height: 36px;"
              [(ngModel)]="selectedDepartmentId"
              (change)="loadStaff(1)">
              <option [ngValue]="null">All Departments</option>
              @for (dept of departments; track dept.id) {
                <option [value]="dept.id">{{ dept.name }}</option>
              }
            </select>
          </div>
        </div>

        @if (loading) {
          <div class="text-center py-8 text-slate-400 font-medium">Loading faculty directory...</div>
        } @else if (pagedResult?.items?.length === 0) {
          <div class="text-center py-8 text-slate-400 font-medium">No staff members found matching your search.</div>
        } @else {
          <div class="table-responsive">
            <table class="mock-table">
              <thead>
                <tr>
                  <th>Employee Info</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Contact Details</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th style="text-align: right; padding-right: 24px;">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (staff of pagedResult?.items; track staff.id; let idx = $index) {
                  <tr>
                    <!-- Staff Avatar & Name -->
                    <td>
                      <div class="student-meta-cell">
                        <div class="avatar-circle" [ngClass]="getAvatarColorClass(idx)">
                          {{ getInitials(staff.fullName) }}
                        </div>
                        <div>
                          <div class="student-name-text">{{ staff.fullName }}</div>
                          <div class="phone-meta-text">
                            <span class="font-mono text-primary font-bold" style="font-size: 11px;">#{{ staff.employeeCode }}</span>
                            <span style="margin: 0 4px;">•</span>
                            <span>{{ staff.qualification || 'Certified Faculty' }}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <!-- Designation Capsule -->
                    <td>
                      <span class="grade-capsule" [ngClass]="getDesignationColor(staff.designation)">
                        {{ staff.designation }}
                      </span>
                    </td>

                    <!-- Department -->
                    <td>
                      <span class="font-semibold text-slate-700" style="font-size: 12.5px;">
                        {{ staff.departmentName || 'General Administration' }}
                      </span>
                    </td>

                    <!-- Contact with Blue Phone & Email -->
                    <td>
                      <div class="flex flex-col" style="gap: 2px;">
                        <div class="phone-meta-text">
                          <span class="phone-icon-blue">📞</span>
                          <span>{{ staff.phone }}</span>
                        </div>
                        <div class="phone-meta-text" style="color: #64748B;">
                          <span>✉️</span>
                          <span>{{ staff.email }}</span>
                        </div>
                      </div>
                    </td>

                    <!-- Joining Date -->
                    <td>
                      <span style="font-size: 12px; color: #64748B; font-weight: 500;">
                        {{ staff.joiningDate | date:'mediumDate' }}
                      </span>
                    </td>

                    <!-- Status Capsule -->
                    <td>
                      <span class="status-capsule" [ngClass]="staff.isActive ? 'status-active' : 'status-pending'">
                        <span class="status-dot"></span>
                        <span>{{ staff.isActive ? 'Active' : 'On Leave' }}</span>
                      </span>
                    </td>

                    <!-- Actions -->
                    <td style="text-align: right; padding-right: 20px;">
                      <button class="btn btn-outline btn-sm" style="border-radius: 9999px; padding: 4px 12px; font-size: 11px;">
                        Profile
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="mock-pagination">
            <div>
              <span>Showing </span>
              <span style="font-weight: 700; color: #0F172A;">{{ pagedResult?.items?.length || 0 }}</span>
              <span> of {{ pagedResult?.totalCount || 0 }} personnel</span>
            </div>
            <div class="pagination-controls">
              <button 
                [disabled]="!pagedResult?.hasPreviousPage"
                (click)="loadStaff((pagedResult?.pageIndex || 1) - 1)"
                class="pagination-btn">‹</button>
              <button class="pagination-btn active">{{ pagedResult?.pageIndex || 1 }}</button>
              <button 
                [disabled]="!pagedResult?.hasNextPage"
                (click)="loadStaff((pagedResult?.pageIndex || 1) + 1)"
                class="pagination-btn">›</button>
            </div>
          </div>
        }
      </div>

      <!-- Add Staff Modal -->
      @if (showModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="card-header">
              <h2 class="card-title">Add Staff Member</h2>
              <button (click)="showModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (modalError) {
              <div class="alert alert-danger mb-4">{{ modalError }}</div>
            }

            <form (ngSubmit)="submitStaff()">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Employee Code *</label>
                  <input type="text" class="form-control" placeholder="e.g. EMP-002" [(ngModel)]="newStaff.employeeCode" name="employeeCode" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Designation *</label>
                  <input type="text" class="form-control" placeholder="e.g. Assistant Professor, Teacher" [(ngModel)]="newStaff.designation" name="designation" required>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newStaff.firstName" name="firstName" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newStaff.lastName" name="lastName" required>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Official Email *</label>
                  <input type="email" class="form-control" [(ngModel)]="newStaff.email" name="email" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Phone Number *</label>
                  <input type="text" class="form-control" [(ngModel)]="newStaff.phone" name="phone" required>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Department</label>
                  <select class="form-control" [(ngModel)]="newStaff.departmentId" name="departmentId">
                    <option [ngValue]="null">Select Department...</option>
                    @for (dept of departments; track dept.id) {
                      <option [value]="dept.id">{{ dept.name }} ({{ dept.code }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">System Role</label>
                  <select class="form-control" [(ngModel)]="newStaff.role" name="role">
                    <option [value]="3">Teacher / Faculty</option>
                    <option [value]="4">Accountant</option>
                    <option [value]="2">Institution Administrator</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Highest Qualification</label>
                <input type="text" class="form-control" placeholder="e.g. Ph.D, M.Tech, M.Sc B.Ed" [(ngModel)]="newStaff.qualification" name="qualification">
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting">
                  {{ submitting ? 'Adding Staff...' : 'Add Staff Member' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mt-6 { margin-top: 1.5rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .text-center { text-align: center; }
    .text-primary { color: #1E5BF6; }
    .font-mono { font-family: monospace; }
  `]
})
export class StaffComponent implements OnInit {
  pagedResult: PagedResult<Staff> | null = null;
  departments: Department[] = [];
  loading = true;
  showModal = false;
  submitting = false;
  modalError = '';
  searchTerm = '';
  selectedDepartmentId: string | null = null;

  newStaff: any = {
    employeeCode: '',
    designation: 'Teacher',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: null,
    role: 3,
    qualification: '',
    joiningDate: new Date().toISOString()
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStaff(1);
    this.api.getDepartments().subscribe(res => {
      if (res.success && res.data) {
        this.departments = res.data;
      }
    });
  }

  loadStaff(pageIndex: number): void {
    this.loading = true;
    this.api.getStaff(pageIndex, 10, this.searchTerm).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pagedResult = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getTeacherCount(): number {
    return this.pagedResult?.items?.filter(s => s.designation.toLowerCase().includes('teacher') || s.designation.toLowerCase().includes('professor')).length || 12;
  }

  getInitials(name: string): string {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getAvatarColorClass(idx: number): string {
    const classes = ['avatar-circle-purple', 'avatar-circle-coral', 'avatar-circle-amber', 'avatar-circle-emerald'];
    return classes[idx % classes.length];
  }

  getDesignationColor(designation: string): string {
    const des = (designation || '').toLowerCase();
    if (des.includes('head') || des.includes('principal') || des.includes('dean')) return 'grade-purple';
    if (des.includes('professor')) return 'grade-blue';
    if (des.includes('accountant') || des.includes('admin')) return 'grade-amber';
    return 'grade-emerald';
  }

  openStaffModal(): void {
    this.modalError = '';
    this.showModal = true;
  }

  submitStaff(): void {
    this.modalError = '';
    this.submitting = true;

    this.api.createStaff(this.newStaff).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.showModal = false;
          this.loadStaff(1);
        } else {
          this.modalError = res.message || 'Failed to add staff';
        }
      },
      error: (err) => {
        this.submitting = false;
        this.modalError = err.error?.message || 'Server error';
      }
    });
  }
}
