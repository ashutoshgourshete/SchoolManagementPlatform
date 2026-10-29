import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AcademicYear, ClassModel, Department, Program, Subject } from '../../core/models/models';

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">Academics &amp; Class Architecture</h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">Configure school grades, college programs, curriculum, and class section capacities</p>
        </div>
      </div>

      <!-- Tab Navigation with Rounded Capsules -->
      <div class="modern-tab-bar mb-6">
        <button [class.active]="activeTab === 'classes'" (click)="activeTab = 'classes'" class="modern-tab-btn">
          <span>🏫</span>
          <span>Classes &amp; Sections</span>
        </button>
        <button [class.active]="activeTab === 'years'" (click)="activeTab = 'years'" class="modern-tab-btn">
          <span>📅</span>
          <span>Academic Sessions</span>
        </button>
        <button [class.active]="activeTab === 'programs'" (click)="activeTab = 'programs'" class="modern-tab-btn">
          <span>🎓</span>
          <span>College Programs &amp; Departments</span>
        </button>
        <button [class.active]="activeTab === 'subjects'" (click)="activeTab = 'subjects'" class="modern-tab-btn">
          <span>📖</span>
          <span>Subjects &amp; Credits</span>
        </button>
      </div>

      <!-- TAB 1: Classes & Sections -->
      @if (activeTab === 'classes') {
        <div class="grid grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Classes & Sections</h2>
            </div>
            <div class="flex flex-col gap-4">
              @for (cls of classes; track cls.id) {
                <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-slate-900">{{ cls.name }} ({{ cls.code }})</span>
                    <span class="badge badge-neutral text-xs">{{ cls.sections.length }} Sections</span>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-2">
                    @for (sec of cls.sections; track sec.id) {
                      <div class="bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs flex items-center gap-2">
                        <span class="font-bold text-primary">{{ sec.name }}</span>
                        <span class="text-slate-500">Cap: {{ sec.capacity }}</span>
                        <span class="text-slate-400">({{ sec.roomNumber || 'Room TBD' }})</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Add Class Form -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">+ Add New Class</h2>
            </div>
            <form (ngSubmit)="createClass()">
              <div class="form-group">
                <label class="form-label">Academic Session *</label>
                <select class="form-control" [(ngModel)]="newClass.academicYearId" name="academicYearId" required>
                  @for (yr of academicYears; track yr.id) {
                    <option [value]="yr.id">{{ yr.name }} {{ yr.isCurrent ? '(Current)' : '' }}</option>
                  }
                </select>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Class Name *</label>
                  <input type="text" class="form-control" placeholder="e.g. Grade 11, Semester 3" [(ngModel)]="newClass.name" name="className" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Code *</label>
                  <input type="text" class="form-control" placeholder="e.g. GR-11" [(ngModel)]="newClass.code" name="classCode" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-full mt-2">Create Class</button>
            </form>
          </div>
        </div>
      }

      <!-- TAB 2: Academic Years -->
      @if (activeTab === 'years') {
        <div class="grid grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Academic Years</h2>
            </div>
            <div class="flex flex-col gap-3">
              @for (yr of academicYears; track yr.id) {
                <div class="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div class="font-bold text-slate-900">{{ yr.name }}</div>
                    <div class="text-xs text-slate-500">{{ yr.startDate | date:'mediumDate' }} - {{ yr.endDate | date:'mediumDate' }}</div>
                  </div>
                  @if (yr.isCurrent) {
                    <span class="badge badge-success">Current Active Session</span>
                  }
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">+ Create Academic Year</h2>
            </div>
            <form (ngSubmit)="createYear()">
              <div class="form-group">
                <label class="form-label">Year Name *</label>
                <input type="text" class="form-control" placeholder="e.g. 2027-2028" [(ngModel)]="newYear.name" name="yearName" required>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Start Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="newYear.startDate" name="startDate" required>
                </div>
                <div class="form-group">
                  <label class="form-label">End Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="newYear.endDate" name="endDate" required>
                </div>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" [(ngModel)]="newYear.isCurrent" name="isCurrent"> Set as current active year
                </label>
              </div>
              <button type="submit" class="btn btn-primary w-full">Save Academic Year</button>
            </form>
          </div>
        </div>
      }

      <!-- TAB 3: College Programs & Departments -->
      @if (activeTab === 'programs') {
        <div class="grid grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">College Degree Programs</h2>
            </div>
            <div class="flex flex-col gap-3">
              @for (prog of programs; track prog.id) {
                <div class="border border-slate-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">{{ prog.name }}</span>
                    <span class="badge badge-info">{{ prog.degreeType || 'Degree' }}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1">Code: {{ prog.code }} • Total Semesters: {{ prog.totalSemesters }}</div>
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">+ Create College Program</h2>
            </div>
            <form (ngSubmit)="createProgram()">
              <div class="form-group">
                <label class="form-label">Program Name *</label>
                <input type="text" class="form-control" placeholder="e.g. B.Sc in Information Technology" [(ngModel)]="newProgram.name" name="progName" required>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Program Code *</label>
                  <input type="text" class="form-control" placeholder="e.g. BSC-IT" [(ngModel)]="newProgram.code" name="progCode" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Total Semesters</label>
                  <input type="number" class="form-control" [(ngModel)]="newProgram.totalSemesters" name="totalSemesters">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Degree Type</label>
                <input type="text" class="form-control" placeholder="e.g. Bachelor of Science" [(ngModel)]="newProgram.degreeType" name="degreeType">
              </div>
              <button type="submit" class="btn btn-primary w-full">Save Degree Program</button>
            </form>
          </div>
        </div>
      }

      <!-- TAB 4: Subjects -->
      @if (activeTab === 'subjects') {
        <div class="grid grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Subject Directory</h2>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Subject Name</th>
                    <th>Credits</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sub of subjects; track sub.id) {
                    <tr>
                      <td class="font-mono text-xs font-semibold text-primary">{{ sub.code }}</td>
                      <td class="font-medium text-slate-900">{{ sub.name }}</td>
                      <td>{{ sub.credits }}</td>
                      <td>
                        <span [class]="sub.isElective ? 'badge badge-warning' : 'badge badge-neutral'">
                          {{ sub.isElective ? 'Elective' : 'Core' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">+ Add New Subject</h2>
            </div>
            <form (ngSubmit)="createSubject()">
              <div class="form-group">
                <label class="form-label">Subject Name *</label>
                <input type="text" class="form-control" placeholder="e.g. Data Structures & Algorithms" [(ngModel)]="newSubject.name" name="subName" required>
              </div>
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Subject Code *</label>
                  <input type="text" class="form-control" placeholder="e.g. CS-201" [(ngModel)]="newSubject.code" name="subCode" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Credit Units</label>
                  <input type="number" class="form-control" [(ngModel)]="newSubject.credits" name="credits">
                </div>
              </div>
              <div class="form-group">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" [(ngModel)]="newSubject.isElective" name="isElective"> Elective Subject
                </label>
              </div>
              <button type="submit" class="btn btn-primary w-full">Save Subject</button>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 900px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
    .w-full { width: 100%; }
    .tab-bar {
      display: flex;
      border-bottom: 2px solid var(--slate-200);
      gap: 1rem;
    }
    .tab-btn {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--slate-600);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }
    .font-mono { font-family: monospace; }
  `]
})
export class AcademicsComponent implements OnInit {
  activeTab: 'classes' | 'years' | 'programs' | 'subjects' = 'classes';

  classes: ClassModel[] = [];
  academicYears: AcademicYear[] = [];
  programs: Program[] = [];
  departments: Department[] = [];
  subjects: Subject[] = [];

  newClass: any = { academicYearId: '', name: '', code: '' };
  newYear: any = { name: '', startDate: '2026-06-01', endDate: '2027-05-31', isCurrent: false };
  newProgram: any = { name: '', code: '', totalSemesters: 8, degreeType: 'Bachelor of Technology' };
  newSubject: any = { name: '', code: '', credits: 4, isElective: false };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.api.getAcademicYears().subscribe(res => {
      if (res.success && res.data) {
        this.academicYears = res.data;
        if (this.academicYears.length > 0) {
          this.newClass.academicYearId = this.academicYears[0].id;
        }
      }
    });

    this.api.getClasses().subscribe(res => {
      if (res.success && res.data) this.classes = res.data;
    });

    this.api.getPrograms().subscribe(res => {
      if (res.success && res.data) this.programs = res.data;
    });

    this.api.getSubjects().subscribe(res => {
      if (res.success && res.data) this.subjects = res.data;
    });
  }

  createClass(): void {
    this.api.createClass(this.newClass).subscribe(res => {
      if (res.success) {
        this.newClass.name = '';
        this.newClass.code = '';
        this.loadAll();
      }
    });
  }

  createYear(): void {
    this.api.createAcademicYear(this.newYear).subscribe(res => {
      if (res.success) {
        this.newYear.name = '';
        this.loadAll();
      }
    });
  }

  createProgram(): void {
    this.api.createProgram(this.newProgram).subscribe(res => {
      if (res.success) {
        this.newProgram.name = '';
        this.newProgram.code = '';
        this.loadAll();
      }
    });
  }

  createSubject(): void {
    this.api.createSubject(this.newSubject).subscribe(res => {
      if (res.success) {
        this.newSubject.name = '';
        this.newSubject.code = '';
        this.loadAll();
      }
    });
  }
}
