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
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Teachers & Staff Directory</h1>
          <p class="text-sm text-slate-500">Manage institutional educators, administrators, and non-teaching personnel</p>
        </div>
        <button (click)="openStaffModal()" class="btn btn-primary">
          + Add New Staff Member
        </button>
      </div>

      <!-- Staff Table -->
      <div class="card">
        @if (loading) {
          <div class="text-center py-8 text-slate-500">Loading staff directory...</div>
        } @else if (pagedResult?.items?.length === 0) {
          <div class="text-center py-8 text-slate-500">No staff members found.</div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Employee Code</th>
                  <th>Full Name</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (staff of pagedResult?.items; track staff.id) {
                  <tr>
                    <td class="font-mono font-semibold text-xs text-primary">{{ staff.employeeCode }}</td>
                    <td class="font-medium text-slate-900">{{ staff.fullName }}</td>
                    <td>
                      <span class="badge badge-info">{{ staff.designation }}</span>
                    </td>
                    <td>{{ staff.departmentName || 'General Administration' }}</td>
                    <td>{{ staff.email }}</td>
                    <td>{{ staff.phone }}</td>
                    <td>{{ staff.joiningDate | date:'mediumDate' }}</td>
                    <td>
                      <span [class]="staff.isActive ? 'badge badge-success' : 'badge badge-neutral'">
                        {{ staff.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
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
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-6 { margin-top: 1.5rem; }
    .text-center { text-align: center; }
    .text-primary { color: var(--primary); }
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
    this.api.getStaff(pageIndex, 10).subscribe({
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
