import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AcademicYear, ClassModel, ClassSection, Department, Program, Subject, Staff } from '../../core/models/models';

@Component({
  selector: 'app-academics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Page Title & Institution Switcher Bar -->
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">
            Academics &amp; Class Architecture
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Configure school grades, college programs, curriculum, and class section capacities
          </p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Role Badge -->
          <div class="role-badge-pill" [ngClass]="getRoleBadgeClass()">
            <span>{{ getRoleEmoji() }}</span>
            <span>Role: {{ getRoleDisplayName() }}</span>
          </div>

          <!-- Institution Filter / Selector -->
          <div class="institution-filter-box">
            <span style="font-size: 14px;">🏫</span>
            <select 
              class="institution-select"
              [ngModel]="selectedInstitutionId"
              (ngModelChange)="onInstitutionFilterChange($event)">
              <option [value]="''">All Linked Institutions</option>
              @for (inst of availableInstitutions; track inst.institutionId) {
                <option [value]="inst.institutionId">{{ inst.name }} ({{ inst.code }})</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Non-admin informational banner -->
      @if (!isLeadershipOrAdmin) {
        <div class="read-only-banner mb-4">
          <span>👁️</span>
          <span>
            <strong>View-Only Faculty / Student Mode:</strong> You are viewing academic rosters and class schedules for 
            <strong>{{ getActiveInstitutionName() }}</strong>. Administrative privileges (Director, Principal, or Admin) are required to create or alter classes.
          </span>
        </div>
      }

      <!-- Notification Alerts -->
      @if (actionMessage) {
        <div class="alert alert-success mb-4 flex justify-between items-center">
          <span>{{ actionMessage }}</span>
          <button (click)="actionMessage = ''" class="btn btn-outline btn-sm">✕</button>
        </div>
      }
      @if (actionError) {
        <div class="alert alert-danger mb-4 flex justify-between items-center">
          <span>{{ actionError }}</span>
          <button (click)="actionError = ''" class="btn btn-outline btn-sm">✕</button>
        </div>
      }

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
        <button [class.active]="activeTab === 'profile'" (click)="activeTab = 'profile'; initProfileForm()" class="modern-tab-btn">
          <span>🏛️</span>
          <span>School Logo &amp; Profile</span>
        </button>
      </div>

      <!-- TAB 1: Classes & Sections -->
      @if (activeTab === 'classes') {
        <div [class]="isLeadershipOrAdmin ? 'grid grid-cols-2 gap-6' : 'grid-single-col'">
          <!-- Left Column: Classes Roster -->
          <div class="card">
            <div class="card-header flex justify-between items-center">
              <div>
                <h2 class="card-title">Configured Classes &amp; Sections</h2>
                <p class="text-xs text-slate-500">Showing classes for {{ getActiveInstitutionName() }}</p>
              </div>
              <span class="badge badge-neutral text-xs">{{ filteredClasses.length }} Classes</span>
            </div>

            @if (loadingClasses) {
              <div class="text-center py-8 text-slate-400 font-medium">Loading classes for selected institution...</div>
            } @else if (filteredClasses.length === 0) {
              <div class="text-center py-8 text-slate-400 font-medium">
                No classes found for the selected institution.
                @if (isLeadershipOrAdmin) {
                  <div>Use the form on the right to create your first class.</div>
                }
              </div>
            } @else {
              <div class="flex flex-col gap-4">
                @for (cls of filteredClasses; track cls.id) {
                  <div class="border border-slate-200 rounded-lg p-4 bg-slate-50 transition-all hover:border-slate-300">
                    <div class="flex items-center justify-between mb-2">
                      <div>
                        <span class="font-bold text-slate-900 text-sm">{{ cls.name }}</span>
                        <span class="font-mono text-xs text-primary font-semibold ml-2">#{{ cls.code }}</span>
                        @if (cls.academicYearName) {
                          <span class="text-xs text-slate-500 ml-2">({{ cls.academicYearName }})</span>
                        }
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="badge badge-info text-xs">{{ cls.sections.length }} Sections</span>
                        @if (isLeadershipOrAdmin) {
                          <button (click)="openAddSectionModal(cls)" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px;" title="Add Section to Class">
                            + Section
                          </button>
                          <button (click)="deleteClass(cls)" class="btn btn-outline btn-sm" style="color: #E11D48; border-color: #FECDD3; font-size: 11px; padding: 2px 6px;" title="Delete Class">
                            🗑️
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Sections List -->
                    <div class="flex flex-wrap gap-2 mt-3">
                      @for (sec of cls.sections; track sec.id) {
                        <div class="bg-white border border-slate-200 px-3 py-2 rounded-md text-xs flex items-center justify-between gap-3" style="min-width: 180px;">
                          <div>
                            <div class="font-bold text-slate-800">Section {{ sec.name }}</div>
                            <div class="text-slate-500" style="font-size: 11px;">
                              <span>Cap: {{ sec.capacity }}</span> &bull; 
                              <span>Enrolled: <strong>{{ sec.enrolledStudentCount || 0 }}</strong></span>
                            </div>
                            <div class="text-slate-400" style="font-size: 10.5px;">
                              {{ sec.roomNumber || 'Room TBD' }}
                              @if (sec.classTeacherName) {
                                &bull; <span class="text-slate-600 font-medium">👨‍🏫 {{ sec.classTeacherName }}</span>
                              }
                            </div>
                          </div>
                          @if (isLeadershipOrAdmin) {
                            <button (click)="deleteSection(sec, cls)" class="text-rose-500 hover:text-rose-700 text-xs" title="Remove Section">✕</button>
                          }
                        </div>
                      }
                      @if (cls.sections.length === 0) {
                        <div class="text-xs text-slate-400 py-1">No sections created yet. Click "+ Section" above to add.</div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Right Column: Add Class Form (Admin & Leadership Only) -->
          @if (isLeadershipOrAdmin) {
            <div class="card">
              <div class="card-header">
                <div>
                  <h2 class="card-title">+ Add New Class</h2>
                  <p class="text-xs text-slate-500">Create a grade or semester class for the selected institution</p>
                </div>
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

                <div class="form-group">
                  <label class="form-label">Target Institution *</label>
                  <select class="form-control" [(ngModel)]="newClass.institutionId" name="classInstitutionId" required>
                    @for (inst of availableInstitutions; track inst.institutionId) {
                      <option [value]="inst.institutionId">{{ inst.name }} ({{ inst.code }})</option>
                    }
                  </select>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Class Name *</label>
                    <input type="text" class="form-control" placeholder="e.g. Grade 10, Grade 11" [(ngModel)]="newClass.name" name="className" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Code *</label>
                    <input type="text" class="form-control" placeholder="e.g. GR-10" [(ngModel)]="newClass.code" name="classCode" required>
                  </div>
                </div>

                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Department (Optional)</label>
                    <select class="form-control" [(ngModel)]="newClass.departmentId" name="departmentId">
                      <option [ngValue]="null">None / General</option>
                      @for (dept of departments; track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">College Program (Optional)</label>
                    <select class="form-control" [(ngModel)]="newClass.programId" name="programId">
                      <option [ngValue]="null">None / Standard School</option>
                      @for (prog of programs; track prog.id) {
                        <option [value]="prog.id">{{ prog.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Initial Section -->
                <div class="border border-slate-200 rounded-lg p-3 bg-slate-50 mt-3 mb-3">
                  <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Initial Section</span>
                  <div class="form-grid-2 mt-2">
                    <div class="form-group mb-0">
                      <label class="form-label" style="font-size: 11px;">Section Name</label>
                      <input type="text" class="form-control" placeholder="e.g. Section A" [(ngModel)]="newClass.initialSectionName" name="initSecName">
                    </div>
                    <div class="form-group mb-0">
                      <label class="form-label" style="font-size: 11px;">Capacity</label>
                      <input type="number" class="form-control" placeholder="40" [(ngModel)]="newClass.initialSectionCapacity" name="initSecCap">
                    </div>
                  </div>
                </div>

                <button type="submit" class="btn btn-primary w-full mt-2" [disabled]="submittingClass">
                  {{ submittingClass ? 'Creating Class...' : 'Create Class' }}
                </button>
              </form>
            </div>
          }
        </div>
      }

      <!-- TAB 2: Academic Years -->
      @if (activeTab === 'years') {
        <div [class]="isLeadershipOrAdmin ? 'grid grid-cols-2 gap-6' : 'grid-single-col'">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Academic Years &amp; Terms</h2>
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

          @if (isLeadershipOrAdmin) {
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">+ Create Academic Year</h2>
              </div>
              <form (ngSubmit)="createYear()">
                <div class="form-group">
                  <label class="form-label">Year Name *</label>
                  <input type="text" class="form-control" placeholder="e.g. 2026-2027" [(ngModel)]="newYear.name" name="yearName" required>
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
          }
        </div>
      }

      <!-- TAB 3: College Programs & Departments -->
      @if (activeTab === 'programs') {
        <div [class]="isLeadershipOrAdmin ? 'grid grid-cols-2 gap-6' : 'grid-single-col'">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">College Degree Programs &amp; Departments</h2>
            </div>
            <div class="flex flex-col gap-3">
              @for (prog of programs; track prog.id) {
                <div class="border border-slate-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">{{ prog.name }}</span>
                    <span class="badge badge-info">{{ prog.degreeType || 'Degree' }}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1">Code: {{ prog.code }} &bull; Total Semesters: {{ prog.totalSemesters }}</div>
                </div>
              }
            </div>
          </div>

          @if (isLeadershipOrAdmin) {
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
          }
        </div>
      }

      <!-- TAB 4: Subjects -->
      @if (activeTab === 'subjects') {
        <div [class]="isLeadershipOrAdmin ? 'grid grid-cols-2 gap-6' : 'grid-single-col'">
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

          @if (isLeadershipOrAdmin) {
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">+ Add New Subject</h2>
              </div>
              <form (ngSubmit)="createSubject()">
                <div class="form-group">
                  <label class="form-label">Subject Name *</label>
                  <input type="text" class="form-control" placeholder="e.g. Advanced Mathematics" [(ngModel)]="newSubject.name" name="subName" required>
                </div>
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Subject Code *</label>
                    <input type="text" class="form-control" placeholder="e.g. MATH-10" [(ngModel)]="newSubject.code" name="subCode" required>
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
          }
        </div>
      }

      <!-- TAB 5: School Logo & Profile Settings -->
      @if (activeTab === 'profile') {
        <div class="card" style="max-width: 820px; margin: 0 auto;">
          <div class="card-header border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
            <div>
              <h2 class="card-title text-xl font-bold text-slate-900">Institution &amp; School Branding</h2>
              <p class="text-sm text-slate-500">Configure your official school logo, emblem, contact profile, and display identity</p>
            </div>
            @if (profileForm.logoUrl) {
              <img [src]="profileForm.logoUrl" alt="Current Logo" class="brand-logo-img" style="width: 52px; height: 52px; border-radius: 12px;" />
            }
          </div>

          @if (profileActionSuccess) {
            <div class="alert alert-success mb-6">{{ profileActionSuccess }}</div>
          }
          @if (profileActionError) {
            <div class="alert alert-danger mb-6">{{ profileActionError }}</div>
          }

          <form (ngSubmit)="saveInstitutionProfile()" class="flex flex-col gap-5">
            <!-- Logo Preview & Input -->
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <label class="block text-sm font-bold text-slate-900 mb-2">School / College Logo (URL or Sample Emblem)</label>
              <div class="flex gap-4 items-center mb-4">
                <div class="h-16 w-16 rounded-xl border-2 border-dashed border-indigo-300 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                  @if (profileForm.logoUrl) {
                    <img [src]="profileForm.logoUrl" alt="Preview" class="h-full w-full object-cover" />
                  } @else {
                    <span style="font-size: 28px;">🏫</span>
                  }
                </div>
                <div class="flex-1">
                  <input 
                    type="url" 
                    class="form-control font-mono text-sm" 
                    [(ngModel)]="profileForm.logoUrl" 
                    name="logoUrl" 
                    placeholder="https://images.unsplash.com/... or https://your-school.edu/logo.png" />
                  <p class="text-xs text-slate-500 mt-1">This custom logo will automatically appear in your sidebar, header, fee receipts, and official transcripts.</p>
                </div>
              </div>

              <!-- Quick Presets -->
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold text-slate-600">Sample School Logos:</span>
                <button type="button" (click)="setPresetLogo('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80')" class="btn btn-outline btn-xs" style="font-size: 11px;">🎓 Academic Crest</button>
                <button type="button" (click)="setPresetLogo('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=128&auto=format&fit=crop&q=80')" class="btn btn-outline btn-xs" style="font-size: 11px;">🏛️ University Seal</button>
                <button type="button" (click)="setPresetLogo('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=128&auto=format&fit=crop&q=80')" class="btn btn-outline btn-xs" style="font-size: 11px;">📚 Modern School</button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Institution / School Name *</label>
                <input type="text" class="form-control" [(ngModel)]="profileForm.name" name="name" required />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Institution Type</label>
                <select class="form-control" [(ngModel)]="profileForm.type" name="type">
                  <option [value]="1">K-12 Primary/Secondary School</option>
                  <option [value]="2">Degree College / University</option>
                  <option [value]="3">Combined School &amp; Junior College</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Contact Email</label>
                <input type="email" class="form-control" [(ngModel)]="profileForm.contactEmail" name="contactEmail" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input type="text" class="form-control" [(ngModel)]="profileForm.contactPhone" name="contactPhone" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Official Website</label>
                <input type="url" class="form-control" [(ngModel)]="profileForm.website" name="website" placeholder="https://..." />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Campus Address</label>
                <input type="text" class="form-control" [(ngModel)]="profileForm.address" name="address" />
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
              <button type="submit" class="btn btn-primary px-6" [disabled]="savingProfile">
                {{ savingProfile ? 'Saving Logo & Profile...' : '💾 Save Logo & School Profile' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- MODAL: Add Section to Class -->
      @if (showSectionModal && targetClassForSection) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 500px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">+ Add Section to {{ targetClassForSection.name }}</h2>
                <p class="text-xs text-slate-500">Configure new classroom cohort, capacity, and assigned faculty</p>
              </div>
              <button (click)="showSectionModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (sectionModalError) {
              <div class="alert alert-danger mb-4">{{ sectionModalError }}</div>
            }

            <form (ngSubmit)="submitSection()">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Section Name *</label>
                  <input type="text" class="form-control" placeholder="e.g. Section B" [(ngModel)]="newSection.name" name="secName" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Capacity (Seats) *</label>
                  <input type="number" class="form-control" placeholder="40" [(ngModel)]="newSection.capacity" name="secCap" required min="1">
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Room Number</label>
                  <input type="text" class="form-control" placeholder="e.g. Room 204" [(ngModel)]="newSection.roomNumber" name="secRoom">
                </div>
                <div class="form-group">
                  <label class="form-label">Class Teacher</label>
                  <select class="form-control" [(ngModel)]="newSection.classTeacherId" name="secTeacher">
                    <option [ngValue]="null">Select Faculty Teacher...</option>
                    @for (staff of staffList; track staff.id) {
                      <option [value]="staff.id">{{ staff.fullName }} ({{ staff.designation }})</option>
                    }
                  </select>
                </div>
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showSectionModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submittingSection">
                  {{ submittingSection ? 'Adding Section...' : 'Add Section' }}
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
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-0 { margin-bottom: 0; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-6 { margin-top: 1.5rem; }
    .ml-2 { margin-left: 0.5rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .gap-6 { gap: 1.5rem; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-single-col { display: block; }
    @media (max-width: 900px) {
      .grid-cols-2 { grid-template-columns: 1fr; }
    }
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .text-primary { color: #1E5BF6; }
    .font-mono { font-family: monospace; }

    /* Institution Filter Box */
    .institution-filter-box {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 9999px;
      padding: 4px 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .institution-select {
      border: none;
      outline: none;
      font-size: 12px;
      font-weight: 600;
      color: #0F172A;
      background: transparent;
      cursor: pointer;
    }

    /* Role Badge */
    .role-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .role-admin { background: #FAF5FF; color: #7E22CE; border: 1px solid #E9D5FF; }
    .role-leadership { background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; }
    .role-faculty { background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; }
    .role-student { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }

    /* Read Only Banner */
    .read-only-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-left: 4px solid #3B82F6;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12px;
      color: #334155;
    }
  `]
})
export class AcademicsComponent implements OnInit {
  activeTab: 'classes' | 'years' | 'programs' | 'subjects' | 'profile' = 'classes';

  // School Profile & Logo State
  profileForm: any = {
    id: '',
    name: '',
    type: 1,
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    logoUrl: ''
  };
  savingProfile = false;
  profileActionSuccess = '';
  profileActionError = '';

  classes: ClassModel[] = [];
  filteredClasses: ClassModel[] = [];
  academicYears: AcademicYear[] = [];
  programs: Program[] = [];
  departments: Department[] = [];
  subjects: Subject[] = [];
  staffList: Staff[] = [];

  selectedInstitutionId = '';
  availableInstitutions: any[] = [];

  loadingClasses = false;
  submittingClass = false;
  actionMessage = '';
  actionError = '';

  // Section Modal State
  showSectionModal = false;
  targetClassForSection: ClassModel | null = null;
  submittingSection = false;
  sectionModalError = '';
  newSection = {
    name: 'Section B',
    capacity: 40,
    roomNumber: '',
    classTeacherId: null
  };

  newClass: any = {
    academicYearId: '',
    institutionId: '',
    name: '',
    code: '',
    departmentId: null,
    programId: null,
    initialSectionName: 'Section A',
    initialSectionCapacity: 40
  };

  newYear: any = { name: '', startDate: '2026-06-01', endDate: '2027-05-31', isCurrent: false };
  newProgram: any = { name: '', code: '', totalSemesters: 8, degreeType: 'Bachelor of Technology' };
  newSubject: any = { name: '', code: '', credits: 4, isElective: false };

  get isLeadershipOrAdmin(): boolean {
    const role = this.authService.userRole();
    if (!role) return false;
    const r = typeof role === 'string' ? role.toLowerCase() : Number(role);
    // PlatformAdmin = 1, InstitutionAdmin = 2, Director = 7, Principal = 8, VicePrincipal = 9, HeadOfDepartment = 10
    if (r === 1 || r === 2 || r === 7 || r === 8 || r === 9 || r === 10) return true;
    if (typeof r === 'string') {
      return r.includes('admin') || r.includes('director') || r.includes('principal') || r.includes('head');
    }
    return false;
  }

  constructor(
    private api: ApiService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentInstId = this.authService.getSelectedInstitutionId();
    this.selectedInstitutionId = currentInstId || '';
    this.newClass.institutionId = this.selectedInstitutionId;

    this.availableInstitutions = this.authService.currentUser()?.availableInstitutions || [];
    if (!this.selectedInstitutionId && this.availableInstitutions.length > 0) {
      this.selectedInstitutionId = this.availableInstitutions[0].institutionId;
      this.newClass.institutionId = this.selectedInstitutionId;
    }

    this.loadAll();
    this.loadStaffList();
    this.initProfileForm();
  }

  initProfileForm(): void {
    const user = this.authService.currentUser();
    const instId = this.selectedInstitutionId || this.authService.getSelectedInstitutionId();
    const inst = user?.availableInstitutions.find(i => i.institutionId === instId);
    this.profileForm = {
      id: instId || '',
      name: inst?.name || this.authService.institutionName(),
      type: inst?.type || 1,
      contactEmail: user?.email || '',
      contactPhone: '',
      address: '',
      website: '',
      logoUrl: inst?.logoUrl || this.authService.institutionLogoUrl() || ''
    };
    this.profileActionSuccess = '';
    this.profileActionError = '';
  }

  setPresetLogo(url: string): void {
    this.profileForm.logoUrl = url;
  }

  saveInstitutionProfile(): void {
    if (!this.profileForm.id) {
      this.profileActionError = 'No institution selected.';
      return;
    }
    this.savingProfile = true;
    this.profileActionSuccess = '';
    this.profileActionError = '';

    this.api.updateInstitution(this.profileForm.id, {
      name: this.profileForm.name,
      type: Number(this.profileForm.type),
      contactEmail: this.profileForm.contactEmail,
      contactPhone: this.profileForm.contactPhone,
      address: this.profileForm.address,
      website: this.profileForm.website,
      logoUrl: this.profileForm.logoUrl
    }).subscribe({
      next: (res) => {
        this.savingProfile = false;
        if (res.success) {
          this.profileActionSuccess = 'School logo and profile updated successfully!';
          if (this.profileForm.logoUrl) {
            this.authService.updateCurrentInstitutionLogo(this.profileForm.logoUrl);
          }
        } else {
          this.profileActionError = res.message || 'Failed to update profile.';
        }
      },
      error: (err) => {
        this.savingProfile = false;
        this.profileActionError = err.error?.message || 'Server error while updating profile.';
      }
    });
  }

  onInstitutionFilterChange(newInstId: string): void {
    this.selectedInstitutionId = newInstId;
    this.newClass.institutionId = newInstId;
    this.loadClasses();
  }

  getActiveInstitutionName(): string {
    if (this.selectedInstitutionId) {
      const found = this.availableInstitutions.find(i => i.institutionId === this.selectedInstitutionId);
      if (found) return found.name;
    }
    return this.authService.institutionName();
  }

  getRoleDisplayName(): string {
    const role = this.authService.userRole();
    if (!role) return 'Faculty Member';
    const num = Number(role);
    switch (num) {
      case 1: return 'Platform Admin';
      case 2: return 'Institution Admin';
      case 7: return 'Director';
      case 8: return 'Principal';
      case 9: return 'Vice Principal';
      case 10: return 'Head of Dept (HOD)';
      case 3: return 'Faculty Teacher';
      case 4: return 'Accountant';
      case 5: return 'Student';
      case 6: return 'Parent';
      default: return String(role);
    }
  }

  getRoleEmoji(): string {
    const role = this.authService.userRole();
    const num = Number(role);
    switch (num) {
      case 1: return '🏢';
      case 2: return '🏛️';
      case 7: return '👑';
      case 8: return '🏛️';
      case 9: return '🎖️';
      case 10: return '📚';
      case 3: return '👨‍🏫';
      case 4: return '💼';
      case 5: return '🎓';
      case 6: return '👨‍👩‍👧';
      default: return '👤';
    }
  }

  getRoleBadgeClass(): string {
    const num = Number(this.authService.userRole());
    if (num === 1 || num === 2 || num === 7) return 'role-admin';
    if (num === 8 || num === 9 || num === 10) return 'role-leadership';
    if (num === 3) return 'role-faculty';
    return 'role-student';
  }

  loadAll(): void {
    this.loadAcademicYears();
    this.loadClasses();
    this.loadPrograms();
    this.loadDepartments();
    this.loadSubjects();
  }

  loadAcademicYears(): void {
    this.api.getAcademicYears().subscribe(res => {
      if (res.success && res.data) {
        this.academicYears = res.data;
        if (this.academicYears.length > 0 && !this.newClass.academicYearId) {
          const current = this.academicYears.find(y => y.isCurrent) || this.academicYears[0];
          this.newClass.academicYearId = current.id;
        }
      }
    });
  }

  loadClasses(): void {
    this.loadingClasses = true;
    this.api.getClasses(undefined, this.selectedInstitutionId || undefined).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.classes = res.data;
          this.filterClasses();
        }
        this.loadingClasses = false;
      },
      error: () => {
        this.loadingClasses = false;
      }
    });
  }

  filterClasses(): void {
    if (this.selectedInstitutionId) {
      this.filteredClasses = this.classes.filter(c => !c.institutionId || c.institutionId === this.selectedInstitutionId);
    } else {
      this.filteredClasses = this.classes;
    }
  }

  loadPrograms(): void {
    this.api.getPrograms().subscribe(res => {
      if (res.success && res.data) this.programs = res.data;
    });
  }

  loadDepartments(): void {
    this.api.getDepartments().subscribe(res => {
      if (res.success && res.data) this.departments = res.data;
    });
  }

  loadSubjects(): void {
    this.api.getSubjects().subscribe(res => {
      if (res.success && res.data) this.subjects = res.data;
    });
  }

  loadStaffList(): void {
    this.api.getStaff(1, 100).subscribe(res => {
      if (res.success && res.data) {
        this.staffList = res.data.items;
      }
    });
  }

  createClass(): void {
    if (!this.newClass.name.trim() || !this.newClass.code.trim()) {
      this.actionError = 'Class name and code are required.';
      return;
    }

    this.actionError = '';
    this.submittingClass = true;

    const payload = {
      academicYearId: this.newClass.academicYearId,
      institutionId: this.newClass.institutionId || this.selectedInstitutionId || null,
      name: this.newClass.name.trim(),
      code: this.newClass.code.trim(),
      departmentId: this.newClass.departmentId || null,
      programId: this.newClass.programId || null
    };

    this.api.createClass(payload).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const createdClass = res.data;

          // If an initial section name was specified, create Section A
          if (this.newClass.initialSectionName) {
            this.api.createSection({
              classId: createdClass.id,
              name: this.newClass.initialSectionName,
              capacity: Number(this.newClass.initialSectionCapacity) || 40
            }).subscribe(() => {
              this.submittingClass = false;
              this.actionMessage = `Class "${payload.name}" and initial section created successfully for ${this.getActiveInstitutionName()}!`;
              this.newClass.name = '';
              this.newClass.code = '';
              this.loadClasses();
            });
          } else {
            this.submittingClass = false;
            this.actionMessage = `Class "${payload.name}" created successfully for ${this.getActiveInstitutionName()}!`;
            this.newClass.name = '';
            this.newClass.code = '';
            this.loadClasses();
          }
        } else {
          this.submittingClass = false;
          this.actionError = res.message || 'Failed to create class.';
        }
      },
      error: (err) => {
        this.submittingClass = false;
        this.actionError = err.error?.message || 'Server error creating class.';
      }
    });
  }

  deleteClass(cls: ClassModel): void {
    if (!confirm(`Are you sure you want to delete class "${cls.name}" and all its sections?`)) {
      return;
    }

    this.api.deleteClass(cls.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.actionMessage = `Class "${cls.name}" removed successfully.`;
          this.loadClasses();
        } else {
          this.actionError = res.message || 'Could not delete class.';
        }
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Server error deleting class.';
      }
    });
  }

  openAddSectionModal(cls: ClassModel): void {
    this.targetClassForSection = cls;
    const nextChar = String.fromCharCode(65 + (cls.sections?.length || 0));
    this.newSection = {
      name: `Section ${nextChar}`,
      capacity: 40,
      roomNumber: '',
      classTeacherId: null
    };
    this.sectionModalError = '';
    this.showSectionModal = true;
  }

  submitSection(): void {
    if (!this.targetClassForSection) return;
    if (!this.newSection.name.trim()) {
      this.sectionModalError = 'Please enter a section name.';
      return;
    }

    this.sectionModalError = '';
    this.submittingSection = true;

    this.api.createSection({
      classId: this.targetClassForSection.id,
      name: this.newSection.name.trim(),
      capacity: Number(this.newSection.capacity) || 40,
      roomNumber: this.newSection.roomNumber ? this.newSection.roomNumber.trim() : null,
      classTeacherId: this.newSection.classTeacherId || null
    }).subscribe({
      next: (res) => {
        this.submittingSection = false;
        if (res.success) {
          this.showSectionModal = false;
          this.actionMessage = `Section "${this.newSection.name}" added to ${this.targetClassForSection?.name}!`;
          this.loadClasses();
        } else {
          this.sectionModalError = res.message || 'Failed to add section.';
        }
      },
      error: (err) => {
        this.submittingSection = false;
        this.sectionModalError = err.error?.message || 'Server error adding section.';
      }
    });
  }

  deleteSection(sec: ClassSection, cls: ClassModel): void {
    if (!confirm(`Delete section "${sec.name}" from ${cls.name}?`)) {
      return;
    }

    this.api.deleteSection(sec.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.actionMessage = `Section "${sec.name}" removed from ${cls.name}.`;
          this.loadClasses();
        } else {
          this.actionError = res.message || 'Could not delete section.';
        }
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Server error deleting section.';
      }
    });
  }

  createYear(): void {
    this.api.createAcademicYear(this.newYear).subscribe(res => {
      if (res.success) {
        this.actionMessage = `Academic year "${this.newYear.name}" created!`;
        this.newYear.name = '';
        this.loadAcademicYears();
      }
    });
  }

  createProgram(): void {
    this.api.createProgram(this.newProgram).subscribe(res => {
      if (res.success) {
        this.actionMessage = `Program "${this.newProgram.name}" created!`;
        this.newProgram.name = '';
        this.loadPrograms();
      }
    });
  }

  createSubject(): void {
    this.api.createSubject(this.newSubject).subscribe(res => {
      if (res.success) {
        this.actionMessage = `Subject "${this.newSubject.name}" created!`;
        this.newSubject.name = '';
        this.loadSubjects();
      }
    });
  }
}
