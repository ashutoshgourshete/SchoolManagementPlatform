import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  Assignment,
  AssignmentSubmission,
  CourseOffering,
  Student
} from '../../core/models/models';

@Component({
  selector: 'app-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Homework & Online Assignments</h1>
          <p class="text-sm text-slate-500">Teacher worksheets, student submissions portal, deadline tracking, and grading</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openCreateModal()" class="btn btn-primary">
            + New Assignment
          </button>
        </div>
      </div>

      <!-- Role / View Switcher -->
      <div class="card mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <label class="text-xs font-bold text-slate-600 uppercase">View Mode:</label>
            <div class="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <button 
                (click)="switchViewMode('teacher')" 
                [class.bg-white]="viewMode === 'teacher'"
                [class.shadow-sm]="viewMode === 'teacher'"
                [class.font-bold]="viewMode === 'teacher'"
                class="px-3.5 py-1.5 rounded-md transition-all text-slate-700">
                👨‍🏫 Teacher Assignment Hub
              </button>
              <button 
                (click)="switchViewMode('student')" 
                [class.bg-white]="viewMode === 'student'"
                [class.shadow-sm]="viewMode === 'student'"
                [class.font-bold]="viewMode === 'student'"
                class="px-3.5 py-1.5 rounded-md transition-all text-slate-700">
                👨‍🎓 Student Upload Portal
              </button>
            </div>
          </div>

          <!-- Student Selector (When in Student Mode) -->
          @if (viewMode === 'student') {
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-slate-600">Simulate Student:</label>
              <select [(ngModel)]="selectedStudentId" (change)="loadStudentSubmissions()" class="form-control text-xs w-60">
                <option value="">Select Student...</option>
                @for (s of students; track s.id) {
                  <option [value]="s.id">{{ s.fullName }} ({{ s.admissionNumber }})</option>
                }
              </select>
            </div>
          }
        </div>
      </div>

      <!-- MAIN TEACHER VIEW -->
      @if (viewMode === 'teacher') {
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">All Course Assignments</h2>
            <span class="text-xs text-slate-500">Sorted by Due Date</span>
          </div>

          @if (loading) {
            <div class="text-center py-12 text-slate-500">Loading assignments...</div>
          } @else if (assignments.length === 0) {
            <div class="text-center py-12 text-slate-500">No assignments created yet. Click "+ New Assignment" to publish homework.</div>
          } @else {
            <div class="table-responsive">
              <table class="data-table text-xs">
                <thead>
                  <tr>
                    <th>Title & Description</th>
                    <th>Subject & Class</th>
                    <th>Teacher</th>
                    <th>Max Points</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                    <th>Attachment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of assignments; track a.id) {
                    <tr>
                      <td>
                        <div class="font-bold text-slate-900">{{ a.title }}</div>
                        <div class="text-slate-500 text-[11px] truncate max-w-xs">{{ a.description }}</div>
                      </td>
                      <td>
                        <div class="font-semibold text-indigo-700">{{ a.subjectName }}</div>
                        <div class="text-[11px] text-slate-500">{{ a.className }}-{{ a.sectionName }}</div>
                      </td>
                      <td>{{ a.teacherName || 'Faculty' }}</td>
                      <td class="font-bold">{{ a.maxPoints }} pts</td>
                      <td>
                        <div [class.text-rose-600]="isPastDue(a.dueDateUtc)" class="font-medium">
                          {{ formatDate(a.dueDateUtc) }}
                        </div>
                        <div class="text-[10px] text-slate-400">
                          {{ isPastDue(a.dueDateUtc) ? 'Expired' : 'Active' }}
                        </div>
                      </td>
                      <td>
                        <span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                          {{ a.totalSubmissions }} submitted
                        </span>
                        <div class="text-[10px] text-emerald-600 mt-0.5">{{ a.gradedSubmissions }} graded</div>
                      </td>
                      <td>
                        @if (a.attachmentUrl) {
                          <a [href]="a.attachmentUrl" target="_blank" class="text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
                            📎 {{ a.attachmentFileName || 'Worksheet' }}
                          </a>
                        } @else {
                          <span class="text-slate-400 italic">None</span>
                        }
                      </td>
                      <td>
                        <div class="flex items-center gap-2">
                          <button (click)="openReviewModal(a)" class="btn btn-outline btn-sm">
                            Review Submissions
                          </button>
                          <button (click)="deleteAssignment(a.id)" class="text-rose-500 hover:text-rose-700 text-xs px-2 py-1">
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- STUDENT PORTAL VIEW -->
      @if (viewMode === 'student') {
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Available Assignments & Homework</h2>
            <span class="text-xs text-slate-500">Submit homework and view graded feedback</span>
          </div>

          @if (!selectedStudentId) {
            <div class="text-center py-12 text-slate-500">
              Please select a student above to access the assignment submission portal.
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (a of assignments; track a.id) {
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <span class="text-[11px] font-bold text-indigo-700 uppercase">{{ a.subjectName }} ({{ a.className }}-{{ a.sectionName }})</span>
                        <h3 class="font-bold text-sm text-slate-900 mt-0.5">{{ a.title }}</h3>
                      </div>
                      <span class="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {{ a.maxPoints }} Pts
                      </span>
                    </div>

                    <p class="text-xs text-slate-600 mb-3">{{ a.description }}</p>

                    @if (a.attachmentUrl) {
                      <div class="mb-3">
                        <a [href]="a.attachmentUrl" target="_blank" class="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
                          📄 Download Worksheet: {{ a.attachmentFileName || 'Attachment' }}
                        </a>
                      </div>
                    }

                    <div class="text-[11px] text-slate-500 mb-3 flex items-center justify-between">
                      <span>Due: <strong [class.text-rose-600]="isPastDue(a.dueDateUtc)">{{ formatDate(a.dueDateUtc) }}</strong></span>
                      @if (getStudentSubmissionFor(a.id); as sub) {
                        <span 
                          [class.bg-emerald-100]="sub.status === 1 || sub.status === 3"
                          [class.text-emerald-800]="sub.status === 1 || sub.status === 3"
                          [class.bg-amber-100]="sub.status === 2"
                          [class.text-amber-800]="sub.status === 2"
                          class="px-2 py-0.5 rounded text-[10px] font-bold">
                          {{ sub.status === 3 ? 'Graded: ' + sub.obtainedPoints + '/' + a.maxPoints : sub.statusName }}
                        </span>
                      } @else {
                        <span class="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">Not Submitted</span>
                      }
                    </div>

                    <!-- Teacher feedback note if graded -->
                    @if (getStudentSubmissionFor(a.id)?.teacherFeedback; as feedback) {
                      <div class="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-900 mb-3">
                        <div class="font-bold text-[10px] text-indigo-700 uppercase">Teacher Feedback:</div>
                        <div>{{ feedback }}</div>
                      </div>
                    }
                  </div>

                  <div class="pt-2 border-t border-slate-200 flex justify-end">
                    <button (click)="openSubmitModal(a)" class="btn btn-primary btn-sm">
                      {{ getStudentSubmissionFor(a.id) ? 'Resubmit Homework' : 'Submit Homework' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- MODAL: CREATE ASSIGNMENT (TEACHER) -->
      @if (showCreateModal) {
        <div class="modal-overlay">
          <div class="modal-content max-w-lg">
            <div class="card-header">
              <h2 class="card-title">Create & Publish New Assignment</h2>
              <button (click)="showCreateModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (createError) {
              <div class="alert alert-danger mb-4">{{ createError }}</div>
            }

            <form (ngSubmit)="submitCreateAssignment()">
              <div class="form-group mb-3">
                <label class="form-label">Course Offering (Subject & Class) *</label>
                <select [(ngModel)]="newAssignment.courseOfferingId" name="courseOfferingId" class="form-control" required>
                  <option value="">Select Course Offering...</option>
                  @for (co of offerings; track co.id) {
                    <option [value]="co.id">{{ co.subjectName }} ({{ co.className }}-{{ co.sectionName }}) — {{ co.teacherName || 'Faculty' }}</option>
                  }
                </select>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Assignment Title *</label>
                <input type="text" [(ngModel)]="newAssignment.title" name="title" placeholder="e.g. Chapter 4 Calculus Problem Set" class="form-control" required>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">Detailed Instructions / Description *</label>
                <textarea [(ngModel)]="newAssignment.description" name="description" rows="3" placeholder="Provide problem numbers, instructions, formatting guidelines..." class="form-control" required></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Max Score / Points *</label>
                  <input type="number" [(ngModel)]="newAssignment.maxPoints" name="maxPoints" class="form-control" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Submission Due Date *</label>
                  <input type="datetime-local" [(ngModel)]="dueDateInput" name="dueDate" class="form-control" required>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="form-group">
                  <label class="form-label">Attachment File Name</label>
                  <input type="text" [(ngModel)]="newAssignment.attachmentFileName" name="attachmentFileName" placeholder="e.g. Worksheet-04.pdf" class="form-control">
                </div>

                <div class="form-group">
                  <label class="form-label">Attachment Document URL</label>
                  <input type="url" [(ngModel)]="newAssignment.attachmentUrl" name="attachmentUrl" placeholder="https://..." class="form-control">
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" (click)="showCreateModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" [disabled]="submitting" class="btn btn-primary">
                  {{ submitting ? 'Publishing...' : 'Publish Assignment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: SUBMIT ASSIGNMENT (STUDENT) -->
      @if (showSubmitModal && selectedAssignment) {
        <div class="modal-overlay">
          <div class="modal-content max-w-md">
            <div class="card-header">
              <div>
                <h2 class="card-title">Submit Homework</h2>
                <span class="text-xs text-slate-500">{{ selectedAssignment.title }} (Max: {{ selectedAssignment.maxPoints }} pts)</span>
              </div>
              <button (click)="showSubmitModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (submitError) {
              <div class="alert alert-danger mb-4">{{ submitError }}</div>
            }

            <form (ngSubmit)="sendStudentSubmission()">
              <div class="form-group mb-3">
                <label class="form-label">Written Remarks / Answers</label>
                <textarea [(ngModel)]="submissionForm.submissionText" name="submissionText" rows="3" placeholder="Type answers or submission notes..." class="form-control"></textarea>
              </div>

              <div class="form-group mb-3">
                <label class="form-label">File / Homework Name</label>
                <input type="text" [(ngModel)]="submissionForm.fileName" name="fileName" placeholder="e.g. Aarav_Physics_Solutions.pdf" class="form-control">
              </div>

              <div class="form-group mb-4">
                <label class="form-label">Document / Cloud Storage URL</label>
                <input type="url" [(ngModel)]="submissionForm.fileUrl" name="fileUrl" placeholder="https://drive.google.com/... or cloud link" class="form-control">
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" (click)="showSubmitModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" [disabled]="submitting" class="btn btn-primary">
                  {{ submitting ? 'Submitting...' : 'Upload & Submit' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL: REVIEW SUBMISSIONS & GRADING (TEACHER) -->
      @if (showReviewModal && reviewingAssignment) {
        <div class="modal-overlay">
          <div class="modal-content max-w-3xl">
            <div class="card-header">
              <div>
                <h2 class="card-title">Student Submissions: {{ reviewingAssignment.title }}</h2>
                <span class="text-xs text-slate-500">{{ reviewingAssignment.subjectName }} | Max Score: {{ reviewingAssignment.maxPoints }} Pts</span>
              </div>
              <button (click)="showReviewModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (loadingSubmissions) {
              <div class="text-center py-8 text-slate-500">Loading student submissions...</div>
            } @else if (currentSubmissions.length === 0) {
              <div class="text-center py-8 text-slate-500">No students have submitted this homework yet.</div>
            } @else {
              <div class="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                @for (sub of currentSubmissions; track sub.id) {
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <span class="font-bold text-sm text-slate-900">{{ sub.studentName }}</span>
                        <span class="text-xs text-slate-500 ml-2">({{ sub.admissionNumber }})</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span 
                          [class.bg-emerald-100]="sub.status === 1 || sub.status === 3"
                          [class.text-emerald-800]="sub.status === 1 || sub.status === 3"
                          [class.bg-amber-100]="sub.status === 2"
                          [class.text-amber-800]="sub.status === 2"
                          class="px-2 py-0.5 rounded text-[10px] font-bold">
                          {{ sub.statusName }}
                        </span>
                        <span class="text-[11px] text-slate-400">
                          Submitted: {{ formatDate(sub.submittedAtUtc) }}
                        </span>
                      </div>
                    </div>

                    @if (sub.submissionText) {
                      <div class="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 mb-2">
                        {{ sub.submissionText }}
                      </div>
                    }

                    @if (sub.fileUrl) {
                      <div class="mb-3">
                        <a [href]="sub.fileUrl" target="_blank" class="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
                          📥 Download Submission: {{ sub.fileName || 'Attached Document' }}
                        </a>
                      </div>
                    }

                    <!-- Grading Form -->
                    <div class="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3">
                      <div class="w-32">
                        <label class="text-[10px] font-bold text-slate-600 block mb-1">Score (Max {{ reviewingAssignment.maxPoints }})</label>
                        <input 
                          type="number" 
                          [(ngModel)]="sub.obtainedPoints" 
                          [max]="reviewingAssignment.maxPoints"
                          min="0"
                          class="form-control text-xs" 
                          placeholder="e.g. 45">
                      </div>

                      <div class="flex-1">
                        <label class="text-[10px] font-bold text-slate-600 block mb-1">Teacher Feedback</label>
                        <input 
                          type="text" 
                          [(ngModel)]="sub.teacherFeedback" 
                          class="form-control text-xs" 
                          placeholder="Feedback remarks...">
                      </div>

                      <button (click)="saveGrade(sub)" class="btn btn-primary btn-sm">
                        Save Grade
                      </button>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="flex justify-end pt-3 border-t border-slate-200 mt-4">
              <button (click)="showReviewModal = false" class="btn btn-outline btn-sm">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AssignmentsComponent implements OnInit {
  viewMode: 'teacher' | 'student' = 'teacher';
  loading = false;
  submitting = false;
  loadingSubmissions = false;

  assignments: Assignment[] = [];
  offerings: CourseOffering[] = [];
  students: Student[] = [];

  selectedStudentId = '';
  studentSubmissions: AssignmentSubmission[] = [];

  showCreateModal = false;
  createError: string | null = null;
  dueDateInput = '';

  newAssignment = {
    courseOfferingId: '',
    title: '',
    description: '',
    maxPoints: 100,
    dueDateUtc: '',
    attachmentUrl: '',
    attachmentFileName: ''
  };

  showSubmitModal = false;
  selectedAssignment: Assignment | null = null;
  submitError: string | null = null;
  submissionForm = {
    submissionText: '',
    fileUrl: '',
    fileName: ''
  };

  showReviewModal = false;
  reviewingAssignment: Assignment | null = null;
  currentSubmissions: AssignmentSubmission[] = [];

  constructor(
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    this.dueDateInput = nextWeek.toISOString().slice(0, 16);

    this.loadAssignments();
    this.loadOfferings();
    this.loadStudents();
  }

  switchViewMode(mode: 'teacher' | 'student'): void {
    this.viewMode = mode;
    if (mode === 'student' && this.selectedStudentId) {
      this.loadStudentSubmissions();
    }
  }

  loadAssignments(): void {
    this.loading = true;
    this.api.getAssignments().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.assignments = res.data;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadOfferings(): void {
    this.api.getCourseOfferings().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.offerings = res.data;
        }
      }
    });
  }

  loadStudents(): void {
    this.api.getStudents(1, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.students = res.data.items;
          if (this.students.length > 0) {
            this.selectedStudentId = this.students[0].id;
          }
        }
      }
    });
  }

  loadStudentSubmissions(): void {
    if (!this.selectedStudentId) return;
    this.api.getStudentSubmissions(this.selectedStudentId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.studentSubmissions = res.data;
        }
      }
    });
  }

  getStudentSubmissionFor(assignmentId: string): AssignmentSubmission | undefined {
    return this.studentSubmissions.find(s => s.assignmentId === assignmentId);
  }

  openCreateModal(): void {
    this.createError = null;
    this.showCreateModal = true;
  }

  submitCreateAssignment(): void {
    this.submitting = true;
    this.createError = null;
    this.newAssignment.dueDateUtc = new Date(this.dueDateInput).toISOString();

    this.api.createAssignment(this.newAssignment).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.showCreateModal = false;
          this.loadAssignments();
          this.newAssignment = {
            courseOfferingId: '',
            title: '',
            description: '',
            maxPoints: 100,
            dueDateUtc: '',
            attachmentUrl: '',
            attachmentFileName: ''
          };
        } else {
          this.createError = res.message;
        }
      },
      error: (err) => {
        this.submitting = false;
        this.createError = err.error?.message || 'Failed to create assignment.';
      }
    });
  }

  deleteAssignment(id: string): void {
    if (!confirm('Are you sure you want to delete this assignment and all submissions?')) return;
    this.api.deleteAssignment(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAssignments();
        }
      }
    });
  }

  openSubmitModal(assignment: Assignment): void {
    this.selectedAssignment = assignment;
    this.submitError = null;
    this.submissionForm = {
      submissionText: '',
      fileUrl: '',
      fileName: ''
    };
    this.showSubmitModal = true;
  }

  sendStudentSubmission(): void {
    if (!this.selectedAssignment || !this.selectedStudentId) return;
    this.submitting = true;
    this.submitError = null;

    this.api.submitAssignment(this.selectedAssignment.id, {
      studentId: this.selectedStudentId,
      submissionText: this.submissionForm.submissionText,
      fileUrl: this.submissionForm.fileUrl,
      fileName: this.submissionForm.fileName
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.showSubmitModal = false;
          this.loadStudentSubmissions();
          this.loadAssignments();
        } else {
          this.submitError = res.message;
        }
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err.error?.message || 'Failed to submit assignment.';
      }
    });
  }

  openReviewModal(assignment: Assignment): void {
    this.reviewingAssignment = assignment;
    this.showReviewModal = true;
    this.loadingSubmissions = true;

    this.api.getAssignmentSubmissions(assignment.id).subscribe({
      next: (res) => {
        this.loadingSubmissions = false;
        if (res.success && res.data) {
          this.currentSubmissions = res.data;
        }
      },
      error: () => {
        this.loadingSubmissions = false;
      }
    });
  }

  saveGrade(submission: AssignmentSubmission): void {
    if (submission.obtainedPoints === undefined || submission.obtainedPoints === null) {
      alert('Please enter obtained points.');
      return;
    }

    this.api.gradeSubmission({
      submissionId: submission.id,
      obtainedPoints: submission.obtainedPoints,
      teacherFeedback: submission.teacherFeedback,
      status: 3 // Graded
    }).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Grade saved successfully!');
          submission.status = 3;
          submission.statusName = 'Graded';
          this.loadAssignments();
        } else {
          alert(res.message);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to save grade.');
      }
    });
  }

  isPastDue(dueDateUtc: string): boolean {
    return new Date() > new Date(dueDateUtc);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
