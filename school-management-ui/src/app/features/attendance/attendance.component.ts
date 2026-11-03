import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AttendanceRecord, ClassModel } from '../../core/models/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">Daily Attendance Register</h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">Record and track real-time classroom student presence</p>
        </div>
      </div>

      <!-- Section & Date Selector -->
      <div class="card mb-6">
        <div class="form-grid-3 items-end">
          <div class="form-group mb-0">
            <label class="form-label">Select Class & Section *</label>
            <select class="form-control" [(ngModel)]="selectedSectionId" (change)="loadAttendance()">
              @for (cls of classes; track cls.id) {
                @for (sec of cls.sections; track sec.id) {
                  <option [value]="sec.id">{{ cls.name }} - Section {{ sec.name }}</option>
                }
              }
            </select>
          </div>

          <div class="form-group mb-0">
            <label class="form-label">Attendance Date *</label>
            <input type="date" class="form-control" [(ngModel)]="selectedDate" (change)="loadAttendance()">
          </div>

          <div class="flex gap-2">
            <button (click)="markAll(1)" class="btn btn-outline btn-sm">Mark All Present</button>
            <button (click)="saveAttendance()" class="btn btn-primary" [disabled]="saving || records.length === 0">
              {{ saving ? 'Saving...' : 'Save Attendance' }}
            </button>
          </div>
        </div>
      </div>

      @if (saveSuccess) {
        <div class="alert alert-success mb-4">
          ✓ Attendance successfully saved for {{ selectedDate }}.
        </div>
      }

      <!-- Attendance Sheet -->
      <div class="card">
        @if (loading) {
          <div class="text-center py-8 text-slate-500">Loading student attendance roster...</div>
        } @else if (records.length === 0) {
          <div class="text-center py-8 text-slate-500">No students found enrolled in this section.</div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Attendance Status</th>
                  <th>Remarks / Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (r of records; track r.studentId) {
                  <tr>
                    <td class="font-bold text-slate-700">{{ r.rollNumber || '-' }}</td>
                    <td class="font-medium text-slate-900">{{ r.studentName }}</td>
                    <td class="font-mono text-xs text-slate-500">{{ r.admissionNumber }}</td>
                    <td>
                      <div class="flex gap-2">
                        <button 
                          type="button" 
                          (click)="r.status = 1" 
                          [class]="r.status === 1 ? 'status-btn active-p' : 'status-btn'">
                          P (Present)
                        </button>
                        <button 
                          type="button" 
                          (click)="r.status = 2" 
                          [class]="r.status === 2 ? 'status-btn active-a' : 'status-btn'">
                          A (Absent)
                        </button>
                        <button 
                          type="button" 
                          (click)="r.status = 3" 
                          [class]="r.status === 3 ? 'status-btn active-l' : 'status-btn'">
                          L (Late)
                        </button>
                        <button 
                          type="button" 
                          (click)="r.status = 4" 
                          [class]="r.status === 4 ? 'status-btn active-e' : 'status-btn'">
                          E (Excused)
                        </button>
                      </div>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        class="form-control text-xs py-1" 
                        placeholder="Optional remarks..."
                        [(ngModel)]="r.remarks">
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .items-center { align-items: center; }
    .items-end { align-items: flex-end; }
    .justify-between { justify-content: space-between; }
    .mb-0 { margin-bottom: 0; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .gap-2 { gap: 0.5rem; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .status-btn {
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid var(--slate-300);
      background-color: #fff;
      cursor: pointer;
    }
    .active-p { background-color: #dcfce7; border-color: #16a34a; color: #16a34a; }
    .active-a { background-color: #fee2e2; border-color: #dc2626; color: #dc2626; }
    .active-l { background-color: #fef9c3; border-color: #ca8a04; color: #ca8a04; }
    .active-e { background-color: #e0f2fe; border-color: #0284c7; color: #0284c7; }
  `]
})
export class AttendanceComponent implements OnInit {
  classes: ClassModel[] = [];
  selectedSectionId = '';
  selectedDate = new Date().toISOString().substring(0, 10);
  records: AttendanceRecord[] = [];
  loading = false;
  saving = false;
  saveSuccess = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClasses().subscribe(res => {
      if (res.success && res.data) {
        this.classes = res.data;
        for (const cls of this.classes) {
          if (cls.sections.length > 0) {
            this.selectedSectionId = cls.sections[0].id;
            break;
          }
        }
        if (this.selectedSectionId) {
          this.loadAttendance();
        }
      }
    });
  }

  loadAttendance(): void {
    if (!this.selectedSectionId) return;
    this.loading = true;
    this.saveSuccess = false;

    this.api.getAttendance(this.selectedSectionId, this.selectedDate).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.records = res.data;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  markAll(status: number): void {
    for (const r of this.records) {
      r.status = status;
    }
  }

  saveAttendance(): void {
    this.saving = true;
    this.saveSuccess = false;

    const payload = {
      classSectionId: this.selectedSectionId,
      date: this.selectedDate,
      records: this.records.map(r => ({
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks
      }))
    };

    this.api.saveBulkAttendance(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.saveSuccess = true;
        }
      },
      error: () => {
        this.saving = false;
      }
    });
  }
}
