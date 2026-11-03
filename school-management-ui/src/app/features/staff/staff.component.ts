import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Staff, Department, PagedResult, StaffHierarchyNode } from '../../core/models/models';

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
            Faculty &amp; Staff Hierarchy
          </h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">
            Manage organizational chain of command: Director &rarr; Principal &rarr; Vice Principal &rarr; HOD &rarr; Faculty
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- View Switcher -->
          <div class="view-toggle-capsule">
            <button 
              type="button" 
              class="view-toggle-btn" 
              [class.active]="activeTab === 'roster'"
              (click)="activeTab = 'roster'">
              <span>📋 Roster Table</span>
            </button>
            <button 
              type="button" 
              class="view-toggle-btn" 
              [class.active]="activeTab === 'tree'"
              (click)="switchViewToTree()">
              <span>🌳 Hierarchy Tree</span>
            </button>
          </div>

          <button (click)="openStaffModal()" class="btn btn-primary btn-sm">
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      <!-- 4 Hero Mini Gradient Stat Cards -->
      <div class="hero-stat-grid" style="margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
        <div class="gradient-card gradient-card-blue" style="min-height: 110px; padding: 1.15rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px;">👥</div>
            <div class="card-trend-badge">Personnel</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title">Total Staff Members</div>
            <div class="card-metric-val" style="font-size: 1.75rem;">{{ pagedResult?.totalCount || staffList.length || 0 }} Staff</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-purple" style="min-height: 110px; padding: 1.15rem; background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%); color: white; border-radius: 16px;">
          <div class="card-top-row" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px; background: rgba(255,255,255,0.2); border-radius: 9999px; display: flex; align-items: center; justify-content: center;">👑</div>
            <div class="card-trend-badge" style="background: rgba(255,255,255,0.25); color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Leadership</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title" style="color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 500;">Directors &amp; Principals</div>
            <div class="card-metric-val" style="font-size: 1.75rem; font-weight: 700;">{{ getLeadershipCount() }} Leaders</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-coral" style="min-height: 110px; padding: 1.15rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px;">📚</div>
            <div class="card-trend-badge">Teaching Staff</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title">Active Class Teachers</div>
            <div class="card-metric-val" style="font-size: 1.75rem;">{{ getTeacherCount() }} Instructors</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-amber" style="min-height: 110px; padding: 1.15rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px;">🏢</div>
            <div class="card-trend-badge">Departments</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title">Academic Departments</div>
            <div class="card-metric-val" style="font-size: 1.75rem;">{{ departments.length || 4 }} Branches</div>
          </div>
        </div>
      </div>

      <!-- TAB 1: Roster Table Card -->
      @if (activeTab === 'roster') {
        <div class="table-card">
          <div class="table-toolbar">
            <div class="section-heading-group">
              <div class="section-title">Faculty Roster &amp; Reporting Lines</div>
              <div class="section-subtitle">Hierarchical directory of executive directors, principals, HODs, and faculty educators</div>
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
                    <th>Hierarchy Designation</th>
                    <th>Reporting Supervisor</th>
                    <th>Department</th>
                    <th>Contact Details</th>
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

                      <!-- Designation Capsule with Level Indicator -->
                      <td>
                        <div class="flex flex-col gap-1 items-start">
                          <span class="grade-capsule" [ngClass]="getDesignationColor(staff.designation)">
                            {{ getDesignationEmoji(staff.designation) }} {{ staff.designation }}
                          </span>
                          @if (staff.subordinatesCount && staff.subordinatesCount > 0) {
                            <span class="subordinate-badge">
                              👥 {{ staff.subordinatesCount }} direct report{{ staff.subordinatesCount > 1 ? 's' : '' }}
                            </span>
                          }
                        </div>
                      </td>

                      <!-- Reporting To Pill -->
                      <td>
                        @if (staff.reportsToName) {
                          <div class="reporting-pill">
                            <span class="reporting-arrow">↳</span>
                            <div>
                              <div class="font-bold text-slate-800" style="font-size: 11.5px;">{{ staff.reportsToName }}</div>
                              <div class="text-slate-500" style="font-size: 10.5px;">{{ staff.reportsToDesignation || 'Supervisor' }}</div>
                            </div>
                          </div>
                        } @else {
                          <span class="top-level-pill">
                            👑 Top-Level Executive
                          </span>
                        }
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

                      <!-- Status Capsule -->
                      <td>
                        <span class="status-capsule" [ngClass]="staff.isActive ? 'status-active' : 'status-pending'">
                          <span class="status-dot"></span>
                          <span>{{ staff.isActive ? 'Active' : 'On Leave' }}</span>
                        </span>
                      </td>

                      <!-- Actions -->
                      <td style="text-align: right; padding-right: 20px;">
                        <button (click)="viewStaffDetails(staff)" class="btn btn-outline btn-sm" style="border-radius: 9999px; padding: 4px 12px; font-size: 11px;">
                          Hierarchy
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
      }

      <!-- TAB 2: Tree Organogram View -->
      @if (activeTab === 'tree') {
        <div class="table-card" style="padding: 1.5rem;">
          <!-- Hierarchy Chain Indicator -->
          <div class="hierarchy-flow-banner mb-5">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h2 class="text-lg font-bold text-slate-900" style="margin: 0;">Institutional Chain of Command</h2>
                <p class="text-xs text-slate-500 mt-0.5">Formal reporting structure governing administrative oversight, academics, and instructional delivery</p>
              </div>
              <button (click)="loadHierarchy()" class="btn btn-outline btn-sm" style="border-radius: 9999px; font-size: 11px;">
                🔄 Refresh Hierarchy Tree
              </button>
            </div>

            <!-- Flow sequence ribbon -->
            <div class="flow-step-bar">
              <div class="flow-node flow-node-dir">
                <span class="node-emoji">👑</span>
                <span class="node-label">Level 1: Director</span>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-node flow-node-prn">
                <span class="node-emoji">🏛️</span>
                <span class="node-label">Level 2: Principal</span>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-node flow-node-vpr">
                <span class="node-emoji">🎖️</span>
                <span class="node-label">Level 3: Vice Principal</span>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-node flow-node-hod">
                <span class="node-emoji">📚</span>
                <span class="node-label">Level 4: Head of Dept</span>
              </div>
              <div class="flow-arrow">&rarr;</div>
              <div class="flow-node flow-node-tch">
                <span class="node-emoji">👨‍🏫</span>
                <span class="node-label">Level 5: Faculty Educator</span>
              </div>
            </div>
          </div>

          @if (loadingHierarchy) {
            <div class="text-center py-12 text-slate-400 font-medium">Loading organizational tree...</div>
          } @else if (hierarchyRoots.length === 0) {
            <div class="text-center py-12 text-slate-400 font-medium">
              No staff hierarchy records found. Please seed staff or add staff members with reporting managers.
            </div>
          } @else {
            <div class="organogram-container">
              @for (root of hierarchyRoots; track root.id) {
                <div class="tree-root-branch">
                  <!-- Level 1: Director / Top Node -->
                  <div class="tree-card card-director">
                    <div class="tree-card-badge">👑 Tier 1 &bull; Executive Directorate</div>
                    <div class="tree-card-body">
                      <div class="avatar-circle avatar-circle-purple" style="width: 44px; height: 44px; font-size: 15px;">
                        {{ getInitials(root.fullName) }}
                      </div>
                      <div style="flex: 1;">
                        <div class="tree-name">{{ root.fullName }}</div>
                        <div class="tree-role">{{ root.designation }} &bull; <span class="font-mono text-xs">#{{ root.employeeCode }}</span></div>
                        <div class="tree-meta">
                          <span>✉️ {{ root.email }}</span>
                          <span style="margin: 0 4px;">•</span>
                          <span>📞 {{ root.phone }}</span>
                        </div>
                      </div>
                      @if (root.directReports && root.directReports.length > 0) {
                        <div class="reports-count-pill">{{ root.directReports.length }} direct subordinates</div>
                      }
                    </div>
                  </div>

                  <!-- Direct Reports of Level 1 (Level 2: Principals) -->
                  @if (root.directReports && root.directReports.length > 0) {
                    <div class="tree-children-container">
                      @for (sub1 of root.directReports; track sub1.id) {
                        <div class="tree-branch-item">
                          <div class="tree-line-connector"></div>
                          <div class="tree-card card-principal">
                            <div class="tree-card-badge" style="background: #E0E7FF; color: #3730A3;">🏛️ Tier 2 &bull; Campus Principal</div>
                            <div class="tree-card-body">
                              <div class="avatar-circle avatar-circle-blue" style="width: 40px; height: 40px; font-size: 14px;">
                                {{ getInitials(sub1.fullName) }}
                              </div>
                              <div style="flex: 1;">
                                <div class="tree-name">{{ sub1.fullName }}</div>
                                <div class="tree-role">{{ sub1.designation }} &bull; <span class="font-mono text-xs">#{{ sub1.employeeCode }}</span></div>
                                <div class="tree-meta">
                                  <span>✉️ {{ sub1.email }}</span>
                                  <span style="margin: 0 4px;">•</span>
                                  <span>📞 {{ sub1.phone }}</span>
                                </div>
                              </div>
                              @if (sub1.directReports && sub1.directReports.length > 0) {
                                <div class="reports-count-pill">{{ sub1.directReports.length }} direct subordinates</div>
                              }
                            </div>
                          </div>

                          <!-- Direct Reports of Level 2 (Level 3: Vice Principals) -->
                          @if (sub1.directReports && sub1.directReports.length > 0) {
                            <div class="tree-children-container">
                              @for (sub2 of sub1.directReports; track sub2.id) {
                                <div class="tree-branch-item">
                                  <div class="tree-line-connector"></div>
                                  <div class="tree-card card-vice-principal">
                                    <div class="tree-card-badge" style="background: #FEF3C7; color: #92400E;">🎖️ Tier 3 &bull; Vice Principal / Dean</div>
                                    <div class="tree-card-body">
                                      <div class="avatar-circle avatar-circle-amber" style="width: 38px; height: 38px; font-size: 13px;">
                                        {{ getInitials(sub2.fullName) }}
                                      </div>
                                      <div style="flex: 1;">
                                        <div class="tree-name">{{ sub2.fullName }}</div>
                                        <div class="tree-role">{{ sub2.designation }} &bull; <span class="font-mono text-xs">#{{ sub2.employeeCode }}</span></div>
                                        <div class="tree-meta">
                                          <span>✉️ {{ sub2.email }}</span>
                                        </div>
                                      </div>
                                      @if (sub2.directReports && sub2.directReports.length > 0) {
                                        <div class="reports-count-pill">{{ sub2.directReports.length }} reporting HODs/Teachers</div>
                                      }
                                    </div>
                                  </div>

                                  <!-- Direct Reports of Level 3 (Level 4: HODs) -->
                                  @if (sub2.directReports && sub2.directReports.length > 0) {
                                    <div class="tree-children-container">
                                      @for (sub3 of sub2.directReports; track sub3.id) {
                                        <div class="tree-branch-item">
                                          <div class="tree-line-connector"></div>
                                          <div class="tree-card card-hod">
                                            <div class="tree-card-badge" style="background: #D1FAE5; color: #065F46;">📚 Tier 4 &bull; Head of Department</div>
                                            <div class="tree-card-body">
                                              <div class="avatar-circle avatar-circle-emerald" style="width: 36px; height: 36px; font-size: 12px;">
                                                {{ getInitials(sub3.fullName) }}
                                              </div>
                                              <div style="flex: 1;">
                                                <div class="tree-name">{{ sub3.fullName }}</div>
                                                <div class="tree-role">{{ sub3.designation }} &bull; <span class="text-slate-500">{{ sub3.departmentName || 'Academic' }}</span></div>
                                              </div>
                                              @if (sub3.directReports && sub3.directReports.length > 0) {
                                                <div class="reports-count-pill">{{ sub3.directReports.length }} Faculty members</div>
                                              }
                                            </div>
                                          </div>

                                          <!-- Direct Reports of Level 4 (Level 5: Teachers & Faculty) -->
                                          @if (sub3.directReports && sub3.directReports.length > 0) {
                                            <div class="tree-children-container">
                                              <div class="grid-teachers">
                                                @for (sub4 of sub3.directReports; track sub4.id) {
                                                  <div class="tree-card card-teacher">
                                                    <div class="tree-card-badge" style="background: #F1F5F9; color: #475569;">👨‍🏫 Tier 5 &bull; Faculty Educator</div>
                                                    <div class="tree-card-body" style="padding: 10px 14px;">
                                                      <div class="avatar-circle avatar-circle-coral" style="width: 32px; height: 32px; font-size: 11px;">
                                                        {{ getInitials(sub4.fullName) }}
                                                      </div>
                                                      <div style="flex: 1; min-width: 0;">
                                                        <div class="tree-name" style="font-size: 13px;">{{ sub4.fullName }}</div>
                                                        <div class="tree-role" style="font-size: 11px;">{{ sub4.designation }}</div>
                                                        <div class="phone-meta-text" style="font-size: 10px;">{{ sub4.email }}</div>
                                                      </div>
                                                    </div>
                                                  </div>
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
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Add Staff Modal -->
      @if (showModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 620px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">Add Staff Member</h2>
                <p class="text-xs text-slate-500 font-medium">Assign organizational hierarchy designation and reporting supervisor</p>
              </div>
              <button (click)="showModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (modalError) {
              <div class="alert alert-danger mb-4">{{ modalError }}</div>
            }

            <form (ngSubmit)="submitStaff()">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Employee Code *</label>
                  <input type="text" class="form-control" placeholder="e.g. EMP-002, DIR-002" [(ngModel)]="newStaff.employeeCode" name="employeeCode" required>
                </div>
                <div class="form-group">
                  <label class="form-label">System Role *</label>
                  <select class="form-control" [(ngModel)]="newStaff.role" (change)="onRoleChange()" name="role">
                    <option [ngValue]="7">👑 Director (Executive Directorate)</option>
                    <option [ngValue]="8">🏛️ Principal (Head of Institution)</option>
                    <option [ngValue]="9">🎖️ Vice Principal (Operations / Dean)</option>
                    <option [ngValue]="10">📚 Head of Department (HOD)</option>
                    <option [ngValue]="3">👨‍🏫 Teacher / Faculty Educator</option>
                    <option [ngValue]="4">💼 Accountant / Finance</option>
                    <option [ngValue]="2">🏢 Institution Administrator</option>
                  </select>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Designation Title *</label>
                  <input type="text" class="form-control" placeholder="e.g. Director, Principal, Mathematics Teacher" [(ngModel)]="newStaff.designation" name="designation" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Reports To (Supervisor)</label>
                  <select class="form-control" [(ngModel)]="newStaff.reportsToStaffId" name="reportsToStaffId">
                    <option [ngValue]="null">None (Top-Level Executive / Director)</option>
                    @for (sup of supervisorList; track sup.id) {
                      <option [value]="sup.id">
                        {{ sup.fullName }} ({{ sup.designation }})
                      </option>
                    }
                  </select>
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
                    <option [ngValue]="null">General Administration / Cross-Dept</option>
                    @for (dept of departments; track dept.id) {
                      <option [value]="dept.id">{{ dept.name }} ({{ dept.code }})</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Highest Qualification</label>
                  <input type="text" class="form-control" placeholder="e.g. Ph.D, M.Tech, M.Sc, B.Ed" [(ngModel)]="newStaff.qualification" name="qualification">
                </div>
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submitting">
                  {{ submitting ? 'Saving Staff...' : 'Add Staff Member' }}
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
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-6 { margin-top: 1.5rem; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .text-center { text-align: center; }
    .text-primary { color: #1E5BF6; }
    .font-mono { font-family: monospace; }

    /* View Switcher Capsule */
    .view-toggle-capsule {
      display: inline-flex;
      background: #F1F5F9;
      padding: 3px;
      border-radius: 9999px;
      border: 1px solid #E2E8F0;
    }
    .view-toggle-btn {
      padding: 6px 14px;
      border-radius: 9999px;
      border: none;
      background: transparent;
      color: #64748B;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .view-toggle-btn.active {
      background: #FFFFFF;
      color: #0F172A;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    /* Reporting Line Pills */
    .reporting-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #EFF6FF;
      border: 1px solid #DBEAFE;
      border-radius: 8px;
      padding: 4px 10px;
    }
    .reporting-arrow {
      color: #1E5BF6;
      font-size: 13px;
      font-weight: 800;
    }
    .top-level-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #FAF5FF;
      border: 1px solid #E9D5FF;
      color: #7E22CE;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 8px;
    }
    .subordinate-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      color: #047857;
      background: #ECFDF5;
      padding: 2px 6px;
      border-radius: 6px;
      border: 1px solid #D1FAE5;
    }

    /* Flow Ribbon Banner */
    .hierarchy-flow-banner {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .flow-step-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .flow-node {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .flow-node-dir { background: #FAF5FF; color: #7E22CE; border: 1px solid #E9D5FF; }
    .flow-node-prn { background: #EEF2FF; color: #3730A3; border: 1px solid #C7D2FE; }
    .flow-node-vpr { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
    .flow-node-hod { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .flow-node-tch { background: #F1F5F9; color: #334155; border: 1px solid #CBD5E1; }
    .flow-arrow { color: #94A3B8; font-weight: 800; font-size: 13px; }

    /* Organogram Tree Styles */
    .organogram-container {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 0.5rem 0;
    }
    .tree-root-branch {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .tree-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      overflow: hidden;
      max-width: 600px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .tree-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0,0,0,0.06);
    }
    .card-director { border-left: 4px solid #7E22CE; }
    .card-principal { border-left: 4px solid #3730A3; }
    .card-vice-principal { border-left: 4px solid #D97706; }
    .card-hod { border-left: 4px solid #059669; }
    .card-teacher { border-left: 4px solid #2563EB; max-width: 100%; }

    .tree-card-badge {
      background: #FAF5FF;
      color: #7E22CE;
      font-size: 10.5px;
      font-weight: 700;
      padding: 4px 12px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      border-bottom: 1px solid #F1F5F9;
    }
    .tree-card-body {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }
    .tree-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
    }
    .tree-role {
      font-size: 12px;
      color: #64748B;
      font-weight: 500;
    }
    .tree-meta {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 2px;
    }
    .reports-count-pill {
      background: #F1F5F9;
      color: #334155;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 9999px;
      white-space: nowrap;
    }

    .tree-children-container {
      margin-left: 2rem;
      padding-left: 1.25rem;
      border-left: 2px dashed #CBD5E1;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .tree-branch-item {
      position: relative;
    }
    .tree-line-connector {
      position: absolute;
      left: -1.25rem;
      top: 24px;
      width: 1.25rem;
      height: 2px;
      border-top: 2px dashed #CBD5E1;
    }
    .grid-teachers {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
  `]
})
export class StaffComponent implements OnInit {
  activeTab: 'roster' | 'tree' = 'roster';
  pagedResult: PagedResult<Staff> | null = null;
  staffList: Staff[] = [];
  supervisorList: Staff[] = [];
  hierarchyRoots: StaffHierarchyNode[] = [];
  departments: Department[] = [];
  loading = true;
  loadingHierarchy = false;
  showModal = false;
  submitting = false;
  modalError = '';
  searchTerm = '';
  selectedDepartmentId: string | null = null;

  newStaff: any = {
    employeeCode: '',
    designation: 'Senior Teacher',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: null,
    role: 3,
    reportsToStaffId: null,
    qualification: '',
    joiningDate: new Date().toISOString()
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStaff(1);
    this.loadSupervisors();
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
          this.staffList = res.data.items;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadSupervisors(): void {
    this.api.getStaff(1, 100).subscribe(res => {
      if (res.success && res.data) {
        this.supervisorList = res.data.items;
      }
    });
  }

  switchViewToTree(): void {
    this.activeTab = 'tree';
    if (this.hierarchyRoots.length === 0) {
      this.loadHierarchy();
    }
  }

  loadHierarchy(): void {
    this.loadingHierarchy = true;
    this.api.getStaffHierarchy().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.hierarchyRoots = res.data;
        }
        this.loadingHierarchy = false;
      },
      error: () => {
        this.loadingHierarchy = false;
      }
    });
  }

  onRoleChange(): void {
    const role = Number(this.newStaff.role);
    switch (role) {
      case 7:
        this.newStaff.designation = 'Director';
        this.newStaff.reportsToStaffId = null;
        break;
      case 8:
        this.newStaff.designation = 'Principal';
        break;
      case 9:
        this.newStaff.designation = 'Vice Principal';
        break;
      case 10:
        this.newStaff.designation = 'Head of Department';
        break;
      case 3:
        this.newStaff.designation = 'Teacher';
        break;
      case 4:
        this.newStaff.designation = 'Chief Accountant';
        break;
      case 2:
        this.newStaff.designation = 'Institution Administrator';
        break;
    }
  }

  getLeadershipCount(): number {
    return this.staffList.filter(s => {
      const d = (s.designation || '').toLowerCase();
      return d.includes('director') || d.includes('principal') || d.includes('dean');
    }).length || 2;
  }

  getTeacherCount(): number {
    return this.pagedResult?.items?.filter(s => {
      const d = (s.designation || '').toLowerCase();
      return d.includes('teacher') || d.includes('professor') || d.includes('faculty');
    }).length || 12;
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

  getDesignationEmoji(designation: string): string {
    const des = (designation || '').toLowerCase();
    if (des.includes('director')) return '👑';
    if (des.includes('vice') && des.includes('principal')) return '🎖️';
    if (des.includes('principal')) return '🏛️';
    if (des.includes('head') || des.includes('hod')) return '📚';
    if (des.includes('accountant') || des.includes('finance')) return '💼';
    return '👨‍🏫';
  }

  getDesignationColor(designation: string): string {
    const des = (designation || '').toLowerCase();
    if (des.includes('director')) return 'grade-purple';
    if (des.includes('vice') && des.includes('principal')) return 'grade-amber';
    if (des.includes('principal') || des.includes('dean')) return 'grade-blue';
    if (des.includes('head') || des.includes('hod')) return 'grade-emerald';
    if (des.includes('accountant') || des.includes('admin')) return 'grade-amber';
    return 'grade-coral';
  }

  openStaffModal(): void {
    this.modalError = '';
    this.loadSupervisors();
    this.showModal = true;
  }

  viewStaffDetails(staff: Staff): void {
    this.activeTab = 'tree';
    this.loadHierarchy();
  }

  submitStaff(): void {
    this.modalError = '';

    if (!this.newStaff.employeeCode?.trim()) {
      this.modalError = 'Employee Code is required.';
      return;
    }
    if (!this.newStaff.firstName?.trim()) {
      this.modalError = 'First Name is required.';
      return;
    }
    if (!this.newStaff.lastName?.trim()) {
      this.modalError = 'Last Name is required.';
      return;
    }
    if (!this.newStaff.email?.trim()) {
      this.modalError = 'Official Email is required.';
      return;
    }

    this.submitting = true;

    const payload = {
      employeeCode: this.newStaff.employeeCode.trim(),
      firstName: this.newStaff.firstName.trim(),
      lastName: this.newStaff.lastName.trim(),
      designation: this.newStaff.designation?.trim() || 'Senior Teacher',
      email: this.newStaff.email.trim(),
      phone: this.newStaff.phone?.trim() || '',
      role: Number(this.newStaff.role) || 3,
      qualification: this.newStaff.qualification?.trim() || '',
      departmentId: (this.newStaff.departmentId && this.newStaff.departmentId !== 'null' && this.newStaff.departmentId !== '') ? this.newStaff.departmentId : null,
      reportsToStaffId: (this.newStaff.reportsToStaffId && this.newStaff.reportsToStaffId !== 'null' && this.newStaff.reportsToStaffId !== '') ? this.newStaff.reportsToStaffId : null,
      joiningDate: this.newStaff.joiningDate || new Date().toISOString()
    };

    this.api.createStaff(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.showModal = false;
          this.loadStaff(1);
          this.loadSupervisors();
          if (this.activeTab === 'tree') {
            this.loadHierarchy();
          }
          this.newStaff = {
            employeeCode: '',
            designation: 'Senior Teacher',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            departmentId: null,
            role: 3,
            reportsToStaffId: null,
            qualification: '',
            joiningDate: new Date().toISOString()
          };
        } else {
          this.modalError = res.message || 'Failed to add staff';
        }
      },
      error: (err) => {
        this.submitting = false;
        let msg = err.error?.message;
        if (!msg && err.error?.errors) {
          const errs = err.error.errors;
          msg = Object.keys(errs).map(k => errs[k].join(', ')).join('; ');
        }
        this.modalError = msg || err.message || 'Server error occurred while adding staff';
      }
    });
  }
}
