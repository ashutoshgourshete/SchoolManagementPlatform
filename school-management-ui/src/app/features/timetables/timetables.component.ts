import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import {
  ClassModel,
  ClassSection,
  CourseOffering,
  WeeklyTimetable,
  TimetableSlot,
  ConflictDetectionResult,
  Staff
} from '../../core/models/models';

@Component({
  selector: 'app-timetables',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Timetable & Scheduling Engine</h1>
          <p class="text-sm text-slate-500">Course offering slots, room allocation, and automated teacher collision detection</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openScheduleModal()" class="btn btn-primary">
            + Schedule Period Slot
          </button>
        </div>
      </div>

      <!-- View Selector & Filter Bar -->
      <div class="card mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <label class="text-xs font-bold text-slate-600 uppercase">View Mode:</label>
            <div style="display: inline-flex; background: #F1F5F9; padding: 4px; border-radius: 9999px; border: 1px solid #CBD5E1; gap: 4px;">
              <button 
                type="button"
                (click)="switchViewMode('class')" 
                [style.background]="viewMode === 'class' ? '#1E5BF6' : 'transparent'"
                [style.color]="viewMode === 'class' ? '#FFFFFF' : '#475569'"
                [style.font-weight]="viewMode === 'class' ? '700' : '600'"
                [style.box-shadow]="viewMode === 'class' ? '0 4px 12px rgba(30, 91, 246, 0.3)' : 'none'"
                style="border: none; padding: 6px 18px; border-radius: 9999px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                🏫 Class Section Grid
              </button>
              <button 
                type="button"
                (click)="switchViewMode('teacher')" 
                [style.background]="viewMode === 'teacher' ? '#1E5BF6' : 'transparent'"
                [style.color]="viewMode === 'teacher' ? '#FFFFFF' : '#475569'"
                [style.font-weight]="viewMode === 'teacher' ? '700' : '600'"
                [style.box-shadow]="viewMode === 'teacher' ? '0 4px 12px rgba(30, 91, 246, 0.3)' : 'none'"
                style="border: none; padding: 6px 18px; border-radius: 9999px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
                👨‍🏫 Teacher Schedule
              </button>
            </div>
          </div>

          <!-- Class & Section Selector -->
          @if (viewMode === 'class') {
            <div class="flex items-center gap-3">
              <select [(ngModel)]="selectedClassId" (change)="onClassChange()" class="form-control text-xs w-48">
                <option value="">Select Class...</option>
                @for (c of classes; track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>

              <select [(ngModel)]="selectedSectionId" (change)="loadClassTimetable()" [disabled]="!availableSections.length" class="form-control text-xs w-48">
                <option value="">Select Section...</option>
                @for (s of availableSections; track s.id) {
                  <option [value]="s.id">{{ formatSecName(s.name) }} (Room: {{ s.roomNumber || 'N/A' }})</option>
                }
              </select>
            </div>
          }

          <!-- Teacher Selector -->
          @if (viewMode === 'teacher') {
            <div class="flex items-center gap-3">
              <select [(ngModel)]="selectedTeacherId" (change)="loadTeacherTimetable()" class="form-control text-xs w-64">
                <option value="">Select Teacher...</option>
                @for (t of teachers; track t.id) {
                  <option [value]="t.id">{{ t.fullName }} ({{ t.designation || 'Staff' }})</option>
                }
              </select>
            </div>
          }
        </div>
      </div>

      <!-- Weekly Schedule Grid -->
      <div class="card">
        @if (loading) {
          <div class="text-center py-12 text-slate-500">Loading timetable schedule...</div>
        } @else if (!weeklySchedule || !weeklySchedule.days || weeklySchedule.days.length === 0) {
          <div class="text-center py-12 text-slate-500">
            Please select a class section or teacher above to view the schedule.
          </div>
        } @else {
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 class="text-lg font-bold text-slate-900">
                @if (viewMode === 'class') {
                  {{ weeklySchedule.className }} - Section {{ weeklySchedule.sectionName }} Weekly Timetable
                } @else {
                  Teacher Schedule: {{ selectedTeacherName }}
                }
              </h2>
              <span class="text-xs text-slate-500">6-Day Academic Schedule (Monday – Saturday)</span>
            </div>
          </div>

          <!-- Day-by-Day Columns / Schedule Table -->
          <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            @for (day of weeklySchedule.days; track day.dayOfWeek) {
              <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[350px]">
                <div class="font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 mb-3 border-b border-slate-200 flex items-center justify-between">
                  <span>{{ day.dayName }}</span>
                  <span class="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                    {{ day.slots.length }}
                  </span>
                </div>

                @if (day.slots.length === 0) {
                  <div class="text-[11px] text-slate-400 italic text-center py-8">No periods scheduled</div>
                } @else {
                  <div class="space-y-2.5">
                    @for (slot of day.slots; track slot.id) {
                      <div class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm relative group hover:border-indigo-400 transition-all">
                        <div class="flex justify-between items-start mb-1">
                          <span class="font-bold text-xs text-indigo-700">{{ slot.subjectName }}</span>
                          <button 
                            (click)="deleteSlot(slot.id)" 
                            title="Delete Slot"
                            class="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 text-xs transition-opacity">
                            ✕
                          </button>
                        </div>
                        
                        <div class="text-[11px] font-mono font-medium text-slate-600 mb-1.5">
                          ⏱ {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
                        </div>

                        <div class="flex flex-wrap gap-1 text-[10px]">
                          @if (slot.roomNumber) {
                            <span class="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              🚪 {{ slot.roomNumber }}
                            </span>
                          }
                          @if (slot.teacherName && viewMode === 'class') {
                            <span class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                              👤 {{ slot.teacherName }}
                            </span>
                          }
                          @if (viewMode === 'teacher') {
                            <span class="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                              🏫 {{ slot.className }}-{{ slot.sectionName }}
                            </span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Schedule Slot Modal with Real-Time Conflict Detector -->
      @if (showScheduleModal) {
        <div class="modal-overlay">
          <div class="modal-content max-w-lg">
            <div class="card-header">
              <h2 class="card-title">Schedule New Period Slot</h2>
              <button (click)="closeScheduleModal()" class="btn btn-outline btn-sm">✕</button>
            </div>

            <!-- Collision Alert Banner -->
            @if (conflictResult?.hasConflict) {
              <div class="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 mb-4 space-y-1">
                <div class="font-bold flex items-center gap-1.5">
                  <span>⚠️ Scheduling Collisions Detected:</span>
                </div>
                @if (conflictResult?.teacherConflict) {
                  <div>• {{ conflictResult?.teacherConflictDetails }}</div>
                }
                @if (conflictResult?.roomConflict) {
                  <div>• {{ conflictResult?.roomConflictDetails }}</div>
                }
                @if (conflictResult?.classSectionConflict) {
                  <div>• {{ conflictResult?.classSectionConflictDetails }}</div>
                }
              </div>
            } @else if (conflictResult && !conflictResult.hasConflict && newSlot.courseOfferingId) {
              <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 mb-4 font-semibold flex items-center gap-1.5">
                <span>✓ Slot is clear: No teacher or room collisions detected!</span>
              </div>
            }

            @if (modalError) {
              <div class="alert alert-danger mb-4">{{ modalError }}</div>
            }

            <form (ngSubmit)="submitSlot()">
              <div class="form-group mb-3">
                <label class="form-label">Course Offering (Subject + Section + Teacher) *</label>
                <select 
                  [(ngModel)]="newSlot.courseOfferingId" 
                  name="courseOfferingId" 
                  (change)="checkConflicts()" 
                  class="form-control" 
                  required>
                  <option value="">Select Course Offering...</option>
                  @for (co of offerings; track co.id) {
                    <option [value]="co.id">
                      {{ co.subjectName }} ({{ co.className }}-{{ co.sectionName }}) — {{ co.teacherName || 'No Teacher Assigned' }}
                    </option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Day of Week *</label>
                  <select 
                    [(ngModel)]="newSlot.dayOfWeek" 
                    name="dayOfWeek" 
                    (change)="checkConflicts()" 
                    class="form-control" 
                    required>
                    <option [value]="1">Monday</option>
                    <option [value]="2">Tuesday</option>
                    <option [value]="3">Wednesday</option>
                    <option [value]="4">Thursday</option>
                    <option [value]="5">Friday</option>
                    <option [value]="6">Saturday</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Room Number</label>
                  <input 
                    type="text" 
                    [(ngModel)]="newSlot.roomNumber" 
                    name="roomNumber" 
                    (blur)="checkConflicts()"
                    placeholder="e.g. Room-101 / Lab-A" 
                    class="form-control">
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="form-group">
                  <label class="form-label">Start Time *</label>
                  <input 
                    type="time" 
                    [(ngModel)]="startTimeInput" 
                    name="startTime" 
                    (change)="onTimeChange()" 
                    class="form-control" 
                    required>
                </div>

                <div class="form-group">
                  <label class="form-label">End Time *</label>
                  <input 
                    type="time" 
                    [(ngModel)]="endTimeInput" 
                    name="endTime" 
                    (change)="onTimeChange()" 
                    class="form-control" 
                    required>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" (click)="closeScheduleModal()" class="btn btn-outline">Cancel</button>
                <button 
                  type="submit" 
                  [disabled]="conflictResult?.hasConflict || submitting" 
                  class="btn btn-primary">
                  {{ submitting ? 'Scheduling...' : 'Save Period Slot' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class TimetablesComponent implements OnInit {
  viewMode: 'class' | 'teacher' = 'class';
  loading = false;
  submitting = false;
  modalError: string | null = null;
  showScheduleModal = false;

  classes: ClassModel[] = [];
  teachers: Staff[] = [];
  offerings: CourseOffering[] = [];
  availableSections: ClassSection[] = [];

  selectedClassId = '';
  selectedSectionId = '';
  selectedTeacherId = '';
  selectedTeacherName = '';

  weeklySchedule: WeeklyTimetable | null = null;

  startTimeInput = '09:00';
  endTimeInput = '09:50';

  newSlot = {
    courseOfferingId: '',
    dayOfWeek: 1,
    startTime: '09:00:00',
    endTime: '09:50:00',
    roomNumber: ''
  };

  conflictResult: ConflictDetectionResult | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.api.getClasses().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.classes = res.data;
          if (this.classes.length > 0) {
            this.selectedClassId = this.classes[0].id;
            this.onClassChange();
          }
        }
      }
    });

    this.api.getStaff(1, 100).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.teachers = res.data.items;
        }
      }
    });

    this.api.getCourseOfferings().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.offerings = res.data;
        }
      }
    });
  }

  switchViewMode(mode: 'class' | 'teacher'): void {
    this.viewMode = mode;
    this.weeklySchedule = null;
    if (mode === 'class' && this.selectedSectionId) {
      this.loadClassTimetable();
    } else if (mode === 'teacher' && this.selectedTeacherId) {
      this.loadTeacherTimetable();
    }
  }

  onClassChange(): void {
    const selected = this.classes.find(c => c.id === this.selectedClassId);
    this.availableSections = selected?.sections || [];
    if (this.availableSections.length > 0) {
      this.selectedSectionId = this.availableSections[0].id;
      this.loadClassTimetable();
    } else {
      this.selectedSectionId = '';
      this.weeklySchedule = null;
    }
  }

  loadClassTimetable(): void {
    if (!this.selectedSectionId) return;
    this.loading = true;
    this.api.getClassSectionWeeklyTimetable(this.selectedSectionId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.weeklySchedule = res.data;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadTeacherTimetable(): void {
    if (!this.selectedTeacherId) return;
    this.loading = true;
    const teacher = this.teachers.find(t => t.id === this.selectedTeacherId);
    this.selectedTeacherName = teacher?.fullName || '';

    this.api.getTeacherWeeklyTimetable(this.selectedTeacherId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.weeklySchedule = {
            classSectionId: '',
            className: 'Teacher',
            sectionName: this.selectedTeacherName,
            days: res.data.days
          };
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openScheduleModalForDay(day: number): void {
    this.newSlot.dayOfWeek = day;
    this.openScheduleModal();
  }

  openScheduleModal(): void {
    this.modalError = null;
    this.conflictResult = null;
    this.showScheduleModal = true;
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.conflictResult = null;
  }

  onTimeChange(): void {
    this.newSlot.startTime = this.startTimeInput.length === 5 ? `${this.startTimeInput}:00` : this.startTimeInput;
    this.newSlot.endTime = this.endTimeInput.length === 5 ? `${this.endTimeInput}:00` : this.endTimeInput;
    this.checkConflicts();
  }

  checkConflicts(): void {
    if (!this.newSlot.courseOfferingId) return;
    this.api.detectTimetableConflicts({
      courseOfferingId: this.newSlot.courseOfferingId,
      dayOfWeek: Number(this.newSlot.dayOfWeek),
      startTime: this.newSlot.startTime,
      endTime: this.newSlot.endTime,
      roomNumber: this.newSlot.roomNumber || undefined
    }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.conflictResult = res.data;
        }
      }
    });
  }

  submitSlot(): void {
    if (this.conflictResult?.hasConflict) return;
    this.submitting = true;
    this.modalError = null;

    this.api.scheduleTimetableSlot({
      courseOfferingId: this.newSlot.courseOfferingId,
      dayOfWeek: Number(this.newSlot.dayOfWeek),
      startTime: this.newSlot.startTime,
      endTime: this.newSlot.endTime,
      roomNumber: this.newSlot.roomNumber || undefined
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.closeScheduleModal();
          if (this.viewMode === 'class') this.loadClassTimetable();
          else this.loadTeacherTimetable();
        } else {
          this.modalError = res.message;
        }
      },
      error: (err) => {
        this.submitting = false;
        this.modalError = err.error?.message || 'Failed to schedule slot.';
      }
    });
  }

  deleteSlot(slotId: string): void {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    this.api.deleteTimetableSlot(slotId).subscribe({
      next: (res) => {
        if (res.success) {
          if (this.viewMode === 'class') this.loadClassTimetable();
          else this.loadTeacherTimetable();
        }
      }
    });
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }
}
