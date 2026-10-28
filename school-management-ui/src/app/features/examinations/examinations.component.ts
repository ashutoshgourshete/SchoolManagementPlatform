import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Exam, ExamResult, StudentReportCard, Student } from '../../core/models/models';

@Component({
  selector: 'app-examinations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Examinations & Report Cards</h1>
          <p class="text-sm text-slate-500">Schedule assessments, record grades, and generate student performance transcripts</p>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar mb-6">
        <button [class.active]="activeTab === 'exams'" (click)="activeTab = 'exams'" class="tab-btn">
          Exam Schedule
        </button>
        <button [class.active]="activeTab === 'report'" (click)="activeTab = 'report'" class="tab-btn">
          Generate Student Report Card
        </button>
      </div>

      <!-- TAB 1: Exams List & Enter Marks -->
      @if (activeTab === 'exams') {
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Scheduled Examinations</h2>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Class & Section</th>
                  <th>Date</th>
                  <th>Max Marks</th>
                  <th>Passing Marks</th>
                  <th>Graded Students</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (exam of exams; track exam.id) {
                  <tr>
                    <td class="font-bold text-slate-900">{{ exam.name }}</td>
                    <td class="text-primary font-medium">{{ exam.subjectName }}</td>
                    <td>{{ exam.className }} - {{ exam.sectionName }}</td>
                    <td>{{ exam.examDate | date:'mediumDate' }}</td>
                    <td>{{ exam.maxMarks }}</td>
                    <td>{{ exam.passingMarks }}</td>
                    <td>
                      <span class="badge badge-neutral">{{ exam.resultsCount }} entered</span>
                    </td>
                    <td>
                      <button (click)="openEnterMarksModal(exam)" class="btn btn-outline btn-sm">
                        Enter / Edit Marks
                      </button>
                    </td>
                  </tr>
                }
                @if (exams.length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-6 text-slate-500">No scheduled exams found.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: Student Report Card -->
      @if (activeTab === 'report') {
        <div class="card mb-6">
          <div class="card-header">
            <h2 class="card-title">Select Student to Generate Report Card</h2>
          </div>
          <div class="form-grid-2 items-end">
            <div class="form-group mb-0">
              <label class="form-label">Student *</label>
              <select class="form-control" [(ngModel)]="selectedStudentId">
                <option value="">Select Student...</option>
                @for (s of students; track s.id) {
                  <option [value]="s.id">{{ s.fullName }} ({{ s.admissionNumber }})</option>
                }
              </select>
            </div>
            <div>
              <button (click)="generateReportCard()" class="btn btn-primary" [disabled]="!selectedStudentId || loadingReport">
                {{ loadingReport ? 'Generating...' : 'View Transcript / Report Card' }}
              </button>
            </div>
          </div>
        </div>

        @if (reportCard) {
          <div class="card bg-white p-8 border-2 border-slate-300">
            <!-- Institutional Header -->
            <div class="text-center border-b border-slate-200 pb-6 mb-6">
              <h2 class="text-2xl font-bold text-slate-900">ACADEMIC PERFORMANCE REPORT CARD</h2>
              <p class="text-sm text-slate-500">Session: {{ reportCard.academicYear }}</p>
            </div>

            <!-- Student Bio Meta -->
            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg mb-6 text-sm">
              <div><span class="font-semibold text-slate-600">Student Name:</span> {{ reportCard.studentName }}</div>
              <div><span class="font-semibold text-slate-600">Admission No:</span> {{ reportCard.admissionNumber }}</div>
              <div><span class="font-semibold text-slate-600">Class:</span> {{ reportCard.className }}</div>
              <div><span class="font-semibold text-slate-600">Section:</span> {{ reportCard.sectionName }}</div>
            </div>

            <!-- Marks Table -->
            <table class="data-table mb-6">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Assessment</th>
                  <th>Marks Obtained</th>
                  <th>Max Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (item of reportCard.subjectResults; track item.subjectName) {
                  <tr>
                    <td class="font-semibold">{{ item.subjectName }}</td>
                    <td>{{ item.examName }}</td>
                    <td class="font-bold">{{ item.isAbsent ? 'AB' : item.marksObtained }}</td>
                    <td>{{ item.maxMarks }}</td>
                    <td>
                      <span class="font-bold text-primary">{{ item.grade || 'N/A' }}</span>
                    </td>
                    <td>
                      <span [class]="item.marksObtained >= 35 ? 'badge badge-success' : 'badge badge-danger'">
                        {{ item.marksObtained >= 35 ? 'Pass' : 'Needs Improvement' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Overall Summary Banner -->
            <div class="flex items-center justify-between bg-primary-light p-4 rounded-lg border border-blue-200">
              <div>
                <div class="text-xs font-semibold text-slate-500 uppercase">Total Marks Obtained</div>
                <div class="text-xl font-bold text-slate-900">{{ reportCard.totalMarksObtained }} / {{ reportCard.totalMaxMarks }}</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 uppercase">Overall Percentage</div>
                <div class="text-xl font-bold text-primary">{{ reportCard.percentage }}%</div>
              </div>
              <div>
                <div class="text-xs font-semibold text-slate-500 uppercase">Cumulative Grade</div>
                <div class="text-xl font-bold text-emerald-600">{{ reportCard.overallGrade }}</div>
              </div>
            </div>
          </div>
        }
      }

      <!-- Enter Marks Modal -->
      @if (showMarksModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 700px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">Enter Marks: {{ activeExam?.name }}</h2>
                <div class="text-xs text-slate-500">{{ activeExam?.subjectName }} • Max Marks: {{ activeExam?.maxMarks }}</div>
              </div>
              <button (click)="showMarksModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            <table class="data-table mb-4">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Marks (Max {{ activeExam?.maxMarks }})</th>
                  <th>Absent</th>
                </tr>
              </thead>
              <tbody>
                @for (res of currentResults; track res.studentId) {
                  <tr>
                    <td class="font-mono text-xs">{{ res.admissionNumber }}</td>
                    <td class="font-medium">{{ res.studentName }}</td>
                    <td>
                      <input 
                        type="number" 
                        class="form-control text-sm py-1 w-24" 
                        [(ngModel)]="res.marksObtained" 
                        [disabled]="res.isAbsent"
                        min="0" 
                        [max]="activeExam?.maxMarks || 100">
                    </td>
                    <td>
                      <label class="flex items-center gap-1 text-xs">
                        <input type="checkbox" [(ngModel)]="res.isAbsent"> Absent
                      </label>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="flex justify-between items-center mt-6">
              <button (click)="showMarksModal = false" class="btn btn-outline">Cancel</button>
              <button (click)="saveMarks()" class="btn btn-primary" [disabled]="savingMarks">
                {{ savingMarks ? 'Saving...' : 'Save All Results' }}
              </button>
            </div>
          </div>
        </div>
      }
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
    .mt-6 { margin-top: 1.5rem; }
    .pb-6 { padding-bottom: 1.5rem; }
    .p-4 { padding: 1rem; }
    .p-8 { padding: 2rem; }
    .gap-1 { gap: 0.25rem; }
    .gap-4 { gap: 1rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .w-24 { width: 6rem; }
    .text-center { text-align: center; }
    .tab-bar { display: flex; border-bottom: 2px solid var(--slate-200); gap: 1rem; }
    .tab-btn { padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--slate-600); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .bg-primary-light { background-color: var(--primary-light); }
    .font-mono { font-family: monospace; }
  `]
})
export class ExaminationsComponent implements OnInit {
  activeTab: 'exams' | 'report' = 'exams';
  exams: Exam[] = [];
  students: Student[] = [];
  selectedStudentId = '';
  reportCard: StudentReportCard | null = null;
  loadingReport = false;

  showMarksModal = false;
  activeExam: Exam | null = null;
  currentResults: ExamResult[] = [];
  savingMarks = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getExams().subscribe(res => {
      if (res.success && res.data) this.exams = res.data;
    });

    this.api.getStudents(1, 100).subscribe(res => {
      if (res.success && res.data) {
        this.students = res.data.items;
        if (this.students.length > 0) {
          this.selectedStudentId = this.students[0].id;
        }
      }
    });
  }

  openEnterMarksModal(exam: Exam): void {
    this.activeExam = exam;
    this.api.getExamResults(exam.id).subscribe(res => {
      if (res.success && res.data) {
        this.currentResults = res.data;
        this.showMarksModal = true;
      }
    });
  }

  saveMarks(): void {
    if (!this.activeExam) return;
    this.savingMarks = true;

    const payload = {
      examId: this.activeExam.id,
      results: this.currentResults.map(r => ({
        examId: this.activeExam!.id,
        studentId: r.studentId,
        marksObtained: r.marksObtained,
        isAbsent: r.isAbsent,
        remarks: r.remarks
      }))
    };

    this.api.submitBulkExamResults(payload).subscribe({
      next: (res) => {
        this.savingMarks = false;
        if (res.success) {
          this.showMarksModal = false;
          this.api.getExams().subscribe(exRes => {
            if (exRes.success && exRes.data) this.exams = exRes.data;
          });
        }
      },
      error: () => {
        this.savingMarks = false;
      }
    });
  }

  generateReportCard(): void {
    if (!this.selectedStudentId) return;
    this.loadingReport = true;
    this.reportCard = null;

    this.api.getAcademicYears().subscribe(yearsRes => {
      const currentYear = yearsRes.data?.find(y => y.isCurrent) || yearsRes.data?.[0];
      if (currentYear) {
        this.api.getStudentReportCard(this.selectedStudentId, currentYear.id).subscribe({
          next: (res) => {
            this.loadingReport = false;
            if (res.success && res.data) {
              this.reportCard = res.data;
            }
          },
          error: () => {
            this.loadingReport = false;
          }
        });
      } else {
        this.loadingReport = false;
      }
    });
  }
}
