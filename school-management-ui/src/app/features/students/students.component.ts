import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Student, ClassModel, PagedResult } from '../../core/models/models';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Students & Admissions</h1>
          <p class="text-sm text-slate-500">Manage student profiles, enrollments, and guardians</p>
        </div>
        <button (click)="openAdmissionModal()" class="btn btn-primary">
          + Admit New Student
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card mb-4">
        <div class="flex items-center gap-4">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search by name, admission no, or roll no..."
            [(ngModel)]="searchTerm" 
            (keyup.enter)="loadStudents(1)">
          
          <button (click)="loadStudents(1)" class="btn btn-outline">
            Search
          </button>
        </div>
      </div>

      <!-- Students Table -->
      <div class="card">
        @if (loading) {
          <div class="text-center py-8 text-slate-500">Loading student directory...</div>
        } @else if (pagedResult?.items?.length === 0) {
          <div class="text-center py-8 text-slate-500">No students found matching your criteria.</div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Gender</th>
                  <th>Primary Guardian</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (student of pagedResult?.items; track student.id) {
                  <tr>
                    <td class="font-mono font-semibold text-xs text-primary">{{ student.admissionNumber }}</td>
                    <td class="font-medium text-slate-900">
                      {{ student.fullName }}
                      @if (student.rollNumber) {
                        <span class="text-xs text-slate-400 ml-1">(Roll: {{ student.rollNumber }})</span>
                      }
                    </td>
                    <td>
                      @if (student.currentClassName) {
                        <span class="badge badge-info">{{ student.currentClassName }} - {{ student.currentSectionName }}</span>
                      } @else {
                        <span class="text-xs text-slate-400">Unassigned</span>
                      }
                    </td>
                    <td>{{ student.gender === 1 ? 'Male' : (student.gender === 2 ? 'Female' : 'Other') }}</td>
                    <td>
                      @if (student.guardians.length > 0) {
                        <span>{{ student.guardians[0].fullName }}</span>
                      } @else {
                        <span class="text-xs text-slate-400">N/A</span>
                      }
                    </td>
                    <td>{{ student.emergencyContactPhone || 'N/A' }}</td>
                    <td>
                      <span [class]="student.isActive ? 'badge badge-success' : 'badge badge-neutral'">
                        {{ student.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button (click)="deleteStudent(student.id)" class="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between mt-4 text-sm text-slate-600">
            <span>Showing {{ pagedResult?.items?.length || 0 }} of {{ pagedResult?.totalCount || 0 }} students</span>
            <div class="flex gap-2">
              <button 
                [disabled]="!pagedResult?.hasPreviousPage" 
                (click)="loadStudents((pagedResult?.pageIndex || 1) - 1)" 
                class="btn btn-outline btn-sm">
                Previous
              </button>
              <button 
                [disabled]="!pagedResult?.hasNextPage" 
                (click)="loadStudents((pagedResult?.pageIndex || 1) + 1)" 
                class="btn btn-outline btn-sm">
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Admission Modal -->
      @if (showModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="card-header">
              <h2 class="card-title">New Student Admission</h2>
              <button (click)="showModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (modalError) {
              <div class="alert alert-danger mb-4">{{ modalError }}</div>
            }

            <form (ngSubmit)="submitAdmission()">
              <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Student Information</h3>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Admission Number *</label>
                  <input type="text" class="form-control" placeholder="e.g. ADM-2026-002" [(ngModel)]="newStudent.admissionNumber" name="admissionNumber" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Roll Number</label>
                  <input type="text" class="form-control" placeholder="e.g. 102" [(ngModel)]="newStudent.rollNumber" name="rollNumber">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">First Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newStudent.firstName" name="firstName" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name *</label>
                  <input type="text" class="form-control" [(ngModel)]="newStudent.lastName" name="lastName" required>
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Date of Birth *</label>
                  <input type="date" class="form-control" [(ngModel)]="newStudent.dateOfBirth" name="dateOfBirth" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <select class="form-control" [(ngModel)]="newStudent.gender" name="gender">
                    <option [value]="1">Male</option>
                    <option [value]="2">Female</option>
                    <option [value]="3">Other</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Blood Group</label>
                  <input type="text" class="form-control" placeholder="e.g. O+" [(ngModel)]="newStudent.bloodGroup" name="bloodGroup">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Emergency Contact Phone</label>
                <input type="text" class="form-control" placeholder="+91 9876543210" [(ngModel)]="newStudent.emergencyContactPhone" name="emergencyContactPhone">
              </div>

              <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 mt-4">Class Enrollment</h3>
              <div class="form-group">
                <label class="form-label">Class Section</label>
                <select class="form-control" [(ngModel)]="newStudent.classSectionId" name="classSectionId">
                  <option [ngValue]="null">Select Section...</option>
                  @for (cls of classes; track cls.id) {
                    @for (sec of cls.sections; track sec.id) {
                      <option [value]="sec.id">{{ cls.name }} - {{ sec.name }} (Room: {{ sec.roomNumber || 'TBD' }})</option>
                    }
                  }
                </select>
              </div>

              <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 mt-4">Guardian Details</h3>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Guardian First Name</label>
                  <input type="text" class="form-control" [(ngModel)]="newStudent.guardian.firstName" name="gFirstName">
                </div>
                <div class="form-group">
                  <label class="form-label">Guardian Last Name</label>
                  <input type="text" class="form-control" [(ngModel)]="newStudent.guardian.lastName" name="gLastName">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Guardian Email</label>
                  <input type="email" class="form-control" [(ngModel)]="newStudent.guardian.email" name="gEmail">
                </div>
                <div class="form-group">
                  <label class="form-label">Guardian Phone</label>
                  <input type="text" class="form-control" [(ngModel)]="newStudent.guardian.phone" name="gPhone">
                </div>
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting">
                  {{ submitting ? 'Admitting...' : 'Complete Admission' }}
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
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .text-center { text-align: center; }
    .text-primary { color: var(--primary); }
    .font-mono { font-family: monospace; }
  `]
})
export class StudentsComponent implements OnInit {
  pagedResult: PagedResult<Student> | null = null;
  classes: ClassModel[] = [];
  searchTerm = '';
  loading = true;
  showModal = false;
  submitting = false;
  modalError = '';

  newStudent: any = {
    admissionNumber: '',
    rollNumber: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '2012-05-15',
    gender: 1,
    bloodGroup: '',
    emergencyContactPhone: '',
    classSectionId: null,
    guardian: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      relationship: 1,
      isPrimaryContact: true
    }
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStudents(1);
    this.api.getClasses().subscribe(res => {
      if (res.success && res.data) {
        this.classes = res.data;
      }
    });
  }

  loadStudents(pageIndex: number): void {
    this.loading = true;
    this.api.getStudents(pageIndex, 10, this.searchTerm).subscribe({
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

  openAdmissionModal(): void {
    this.modalError = '';
    this.showModal = true;
  }

  submitAdmission(): void {
    this.modalError = '';
    this.submitting = true;

    this.api.createStudent(this.newStudent).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.showModal = false;
          this.loadStudents(1);
        } else {
          this.modalError = res.message || 'Failed to admit student';
        }
      },
      error: (err) => {
        this.submitting = false;
        this.modalError = err.error?.message || 'Server error occurred';
      }
    });
  }

  deleteStudent(id: string): void {
    if (confirm('Are you sure you want to remove this student record?')) {
      this.api.deleteStudent(id).subscribe(res => {
        if (res.success) {
          this.loadStudents(this.pagedResult?.pageIndex || 1);
        }
      });
    }
  }
}
