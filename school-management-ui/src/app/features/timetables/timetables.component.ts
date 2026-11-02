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
    <div>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Timetable & Scheduling Engine</h1>
          <p class="text-sm text-slate-500">Course offering slots, room allocation, and automated teacher collision detection</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="openScheduleModal()" class="btn btn-primary" style="background-color: #1E5BF6; color: white; border: none; border-radius: 8px; padding: 10px 20px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(30, 91, 246, 0.3);">
            + Schedule Period Slot
          </button>
        </div>
      </div>

      <!-- View Selector & Filter Bar -->
      <div class="card mb-6" style="background: white; border-radius: 12px; padding: 16px 20px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <span style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">View Mode:</span>
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
              <select [(ngModel)]="selectedClassId" (change)="onClassChange()" class="form-control" style="padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 180px;">
                <option value="">Select Class...</option>
                @for (c of classes; track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>

              <select [(ngModel)]="selectedSectionId" (change)="loadClassTimetable()" [disabled]="!availableSections.length" class="form-control" style="padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 220px;">
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
              <select [(ngModel)]="selectedTeacherId" (change)="loadTeacherTimetable()" class="form-control" style="padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 240px;">
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
      <div class="card" style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        @if (loading) {
          <div class="text-center py-12 text-slate-500" style="text-align: center; padding: 48px; color: #64748B;">
            Loading timetable schedule...
          </div>
        } @else if (!weeklySchedule || !weeklySchedule.days || weeklySchedule.days.length === 0) {
          <div style="text-align: center; padding: 48px 20px;">
            <div style="font-size: 36px; margin-bottom: 12px;">📅</div>
            <h3 style="font-size: 16px; font-weight: 700; color: #1E293B; margin-bottom: 6px;">Select a Class and Section above</h3>
            <p style="font-size: 13px; color: #64748B;">Please choose your class and section to view the weekly schedule</p>
          </div>
        } @else {
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6" style="border-bottom: 1px solid #E2E8F0; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0 0 4px 0;">
                @if (viewMode === 'class') {
                  {{ weeklySchedule.className }} – {{ formatSecName(weeklySchedule.sectionName) }} Weekly Timetable
                } @else {
                  Teacher Schedule: {{ selectedTeacherName }}
                }
              </h2>
              <span style="font-size: 12px; color: #64748B;">6-Day Academic Schedule (Monday – Saturday)</span>
            </div>
            <button (click)="openScheduleModal()" style="background-color: #1E5BF6; color: white; border: none; border-radius: 6px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(30,91,246,0.25);">
              + Schedule Period
            </button>
          </div>

          <!-- Day-by-Day Columns / Schedule Table -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px;">
            @for (day of weeklySchedule.days; track day.dayOfWeek) {
              <div style="background: #F8FAFC; border-radius: 10px; padding: 14px; border: 1px solid #E2E8F0; min-height: 320px; display: flex; flex-direction: column;">
                <div style="font-weight: 700; font-size: 12px; text-transform: uppercase; color: #334155; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ day.dayName }}</span>
                  <span style="font-size: 10px; background: #E2E8F0; color: #334155; padding: 2px 8px; border-radius: 12px; font-weight: 700;">
                    {{ day.slots.length }}
                  </span>
                </div>

                @if (day.slots.length === 0) {
                  <div style="font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 10px;">
                    <span style="font-style: italic;">No periods scheduled</span>
                    <button type="button" (click)="openScheduleModalForDay(day.dayOfWeek)" style="font-size: 11px; padding: 5px 12px; background: #EEF2FF; color: #1E5BF6; border: 1px dashed #93C5FD; border-radius: 6px; cursor: pointer; font-weight: 700;">
                      + Add Period
                    </button>
                  </div>
                } @else {
                  <div style="display: flex; flex-direction: column; gap: 10px;">
                    @for (slot of day.slots; track slot.id) {
                      <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                          <span style="font-weight: 700; font-size: 13px; color: #1E5BF6;">{{ slot.subjectName }}</span>
                          <button 
                            (click)="deleteSlot(slot.id)" 
                            title="Delete Slot"
                            style="border: none; background: none; color: #F43F5E; cursor: pointer; font-size: 12px;">
                            ✕
                          </button>
                        </div>
                        
                        <div style="font-size: 11px; font-family: monospace; font-weight: 600; color: #475569; margin-bottom: 6px;">
                          ⏱ {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
                        </div>

                        <div style="display: flex; flex-wrap: gap: 4px; font-size: 10px;">
                          @if (slot.roomNumber) {
                            <span style="background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                              🚪 {{ slot.roomNumber }}
                            </span>
                          }
                          @if (slot.teacherName && viewMode === 'class') {
                            <span style="background: #EEF2FF; color: #4338CA; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
                              👤 {{ slot.teacherName }}
                            </span>
                          }
                          @if (viewMode === 'teacher') {
                            <span style="background: #ECFDF5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600;">
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
        <div style="position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px);">
          <div style="background: white; border-radius: 12px; padding: 24px; width: 100%; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">
              <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin: 0;">Schedule New Period Slot</h2>
              <button (click)="closeScheduleModal()" style="border: none; background: none; font-size: 20px; cursor: pointer; color: #94A3B8;">✕</button>
            </div>

            <!-- Collision Alert Banner -->
            @if (conflictResult?.hasConflict) {
              <div style="padding: 12px; background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 8px; font-size: 12px; color: #9F1239; margin-bottom: 16px;">
                <div style="font-weight: 700; margin-bottom: 4px;">⚠️ Scheduling Collisions Detected:</div>
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
              <div style="padding: 10px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; font-size: 12px; color: #065F46; margin-bottom: 16px; font-weight: 600;">
                ✓ Slot is clear: No teacher or room collisions detected!
              </div>
            }

            @if (modalError) {
              <div style="padding: 10px; background: #FEF2F2; color: #991B1B; border-radius: 6px; font-size: 13px; margin-bottom: 14px; border: 1px solid #FECACA;">
                {{ modalError }}
              </div>
            }

            <form (ngSubmit)="submitSlot()">
              <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; text-transform: uppercase;">Course Offering (Subject + Section + Teacher) *</label>
                <select 
                  [(ngModel)]="newSlot.courseOfferingId" 
                  name="courseOfferingId" 
                  (change)="checkConflicts()" 
                  required
                  style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
                  <option value="">Select Course Offering...</option>
                  @for (co of offerings; track co.id) {
                    <option [value]="co.id">
                      {{ co.subjectName }} ({{ co.className }}-{{ co.sectionName }}) — {{ co.teacherName || 'No Teacher Assigned' }}
                    </option>
                  }
                </select>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; text-transform: uppercase;">Day of Week *</label>
                  <select 
                    [(ngModel)]="newSlot.dayOfWeek" 
                    name="dayOfWeek" 
                    (change)="checkConflicts()" 
                    required
                    style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
                    <option [value]="1">Monday</option>
                    <option [value]="2">Tuesday</option>
                    <option [value]="3">Wednesday</option>
                    <option [value]="4">Thursday</option>
                    <option [value]="5">Friday</option>
                    <option [value]="6">Saturday</option>
                  </select>
                </div>

                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; text-transform: uppercase;">Room Number</label>
                  <input 
                    type="text" 
                    [(ngModel)]="newSlot.roomNumber" 
                    name="roomNumber" 
                    (blur)="checkConflicts()"
                    placeholder="e.g. Room-101 / Lab-A" 
                    style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px;">
                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; text-transform: uppercase;">Start Time *</label>
                  <input 
                    type="time" 
                    [(ngModel)]="startTimeInput" 
                    name="startTime" 
                    (change)="onTimeChange()" 
                    required
                    style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
                </div>

                <div>
                  <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px; text-transform: uppercase;">End Time *</label>
                  <input 
                    type="time" 
                    [(ngModel)]="endTimeInput" 
                    name="endTime" 
                    (change)="onTimeChange()" 
                    required
                    style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; box-sizing: border-box;">
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #E2E8F0; padding-top: 14px;">
                <button type="button" (click)="closeScheduleModal()" style="padding: 8px 16px; border: 1px solid #CBD5E1; background: white; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: #475569;">Cancel</button>
                <button 
                  type="submit" 
                  [disabled]="conflictResult?.hasConflict || submitting" 
                  style="padding: 8px 20px; background: #1E5BF6; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(30, 91, 246, 0.3);">
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

  formatSecName(name: string): string {
    if (!name) return '';
    const cleaned = name.replace(/^(section\s*)+/gi, '').trim();
    return `Section ${cleaned || name}`;
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
        if (res.success && res.data && res.data.days && res.data.days.length > 0) {
          this.weeklySchedule = res.data;
        } else {
          this.initEmptyWeeklySchedule();
        }
      },
      error: () => {
        this.loading = false;
        this.initEmptyWeeklySchedule();
      }
    });
  }

  initEmptyWeeklySchedule(): void {
    const selectedClass = this.classes.find(c => c.id === this.selectedClassId);
    const selectedSection = this.availableSections.find(s => s.id === this.selectedSectionId);
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.weeklySchedule = {
      classSectionId: this.selectedSectionId,
      className: selectedClass?.name || 'Class',
      sectionName: selectedSection?.name || 'Section',
      days: dayNames.map((name, idx) => ({
        dayOfWeek: idx + 1,
        dayName: name,
        slots: []
      }))
    };
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

  openScheduleModal(): void {
    this.modalError = null;
    this.conflictResult = null;
    this.showScheduleModal = true;
  }

  openScheduleModalForDay(day: number): void {
    this.newSlot.dayOfWeek = day;
    this.openScheduleModal();
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