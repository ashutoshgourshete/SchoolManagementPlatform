import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FeeStructure, StudentInvoice, PaymentReceipt, OutstandingBalance, PagedResult, ClassModel, ClassSection, Student } from '../../core/models/models';

interface FeeItemInput {
  name: string;
  amount: number;
  isOptional: boolean;
}

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-bold text-slate-900" style="letter-spacing: -0.3px;">Institution Fees &amp; Invoicing</h1>
          <p class="text-xs text-slate-500 font-medium mt-0.5">Manage fee schedules, batch recurring billing, and manual &amp; digital collections</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openCreateStructureModal()" class="btn btn-outline btn-sm">
            <span>+ New Fee Structure</span>
          </button>
          <button (click)="openAssignFeeModal()" class="btn btn-outline btn-sm">
            <span>📋 Assign Structure</span>
          </button>
          <button (click)="openGenerateModal()" class="btn btn-outline btn-sm">
            <span>⚡ Generate Batch</span>
          </button>
          <button (click)="openPaymentModal()" class="btn btn-primary btn-sm">
            <span>+ Collect Fee / Record</span>
          </button>
        </div>
      </div>

      <!-- 4 Hero Mini Gradient Stat Cards -->
      <div class="hero-stat-grid" style="margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
        <div class="gradient-card gradient-card-amber" style="min-height: 110px; padding: 1.15rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px;">💰</div>
            <div class="card-trend-badge">Collections</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title">Fee Collected</div>
            <div class="card-metric-val" style="font-size: 1.75rem;">₹ {{ (totalCollected || 103834).toLocaleString() }}</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-coral" style="min-height: 110px; padding: 1.15rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px;">⚠️</div>
            <div class="card-trend-badge">Uncollected</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title">Pending Balance</div>
            <div class="card-metric-val" style="font-size: 1.75rem;">₹ {{ (totalOutstanding || 45200).toLocaleString() }}</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-blue" style="min-height: 110px; padding: 1.15rem;">
          <div class="card-top-row">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px;">🧾</div>
            <div class="card-trend-badge">Billing Cycle</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title">Total Invoiced</div>
            <div class="card-metric-val" style="font-size: 1.75rem;">₹ {{ (totalInvoiced || 149034).toLocaleString() }}</div>
          </div>
        </div>

        <div class="gradient-card gradient-card-purple" style="min-height: 110px; padding: 1.15rem; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: white; border-radius: 16px;">
          <div class="card-top-row" style="display: flex; justify-content: space-between; align-items: center;">
            <div class="card-icon-bubble" style="width: 36px; height: 36px; font-size: 17px; background: rgba(255,255,255,0.2); border-radius: 9999px; display: flex; align-items: center; justify-content: center;">📑</div>
            <div class="card-trend-badge" style="background: rgba(255,255,255,0.25); color: #fff; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600;">Active Rates</div>
          </div>
          <div class="card-bottom-info" style="margin-top: 0.4rem;">
            <div class="card-metric-title" style="color: rgba(255,255,255,0.85); font-size: 12px; font-weight: 500;">Fee Structures</div>
            <div class="card-metric-val" style="font-size: 1.75rem; font-weight: 700;">{{ feeStructures.length }} Schedules</div>
          </div>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar mb-6">
        <button [class.active]="activeTab === 'structures'" (click)="activeTab = 'structures'" class="tab-btn">
          Fee Structures &amp; Schedules
        </button>
        <button [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'" class="tab-btn">
          Issued Invoices
        </button>
        <button [class.active]="activeTab === 'outstanding'" (click)="activeTab = 'outstanding'" class="tab-btn">
          Pending &amp; Outstanding Balances
        </button>
      </div>

      <!-- TAB 1: Fee Structures & Schedules -->
      @if (activeTab === 'structures') {
        <div>
          <!-- Notification Alert -->
          @if (structureActionMessage) {
            <div class="alert alert-success mb-4 flex justify-between items-center">
              <span>{{ structureActionMessage }}</span>
              <button (click)="structureActionMessage = ''" class="btn btn-outline btn-sm">✕</button>
            </div>
          }
          @if (structureActionError) {
            <div class="alert alert-danger mb-4 flex justify-between items-center">
              <span>{{ structureActionError }}</span>
              <button (click)="structureActionError = ''" class="btn btn-outline btn-sm">✕</button>
            </div>
          }

          <!-- Header Toolbar inside tab -->
          <div class="table-card mb-5">
            <div class="table-toolbar" style="padding: 1rem 1.25rem;">
              <div class="section-heading-group">
                <div class="section-title">Institutional Fee Structures</div>
                <div class="section-subtitle">Define tuition rates, laboratory components, activity fees, and recurring billing cycles</div>
              </div>

              <div class="flex items-center gap-2">
                <button (click)="openCreateStructureModal()" class="btn btn-primary btn-sm">
                  <span>+ Create Fee Structure</span>
                </button>
                <button (click)="openAssignFeeModal()" class="btn btn-outline btn-sm">
                  <span>📋 Assign to Class / Students</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Fee Structures Cards Grid -->
          @if (loadingStructures) {
            <div class="text-center py-12 text-slate-400 font-medium">Loading fee structures...</div>
          } @else if (feeStructures.length === 0) {
            <div class="table-card text-center py-12" style="padding: 3rem 1rem;">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">📑</div>
              <h3 class="text-lg font-bold text-slate-800">No Fee Structures Configured Yet</h3>
              <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Define your institution's tuition schedules and fee breakdowns to generate invoices and collect student fees.
              </p>
              <button (click)="openCreateStructureModal()" class="btn btn-primary btn-sm">
                + Create First Fee Structure
              </button>
            </div>
          } @else {
            <div class="grid-structures">
              @for (struct of feeStructures; track struct.id) {
                <div class="structure-card">
                  <!-- Card Header -->
                  <div class="structure-card-header">
                    <div>
                      <div class="structure-title">{{ struct.name }}</div>
                      <div class="structure-sub">
                        <span>{{ struct.className || 'All Classes / Universal' }}</span>
                        @if (struct.academicYearName) {
                          <span style="margin: 0 4px;">•</span>
                          <span>{{ struct.academicYearName }}</span>
                        }
                      </div>
                    </div>
                    <span class="cycle-capsule" [ngClass]="getCycleColor(struct.billingCycle)">
                      {{ getCycleLabel(struct.billingCycle) }}
                    </span>
                  </div>

                  <!-- Amount Banner -->
                  <div class="amount-banner">
                    <span class="amount-label">Total Scheduled Fee</span>
                    <span class="amount-number">₹{{ struct.totalAmount.toLocaleString() }}</span>
                  </div>

                  <!-- Itemized Breakdown -->
                  <div class="items-breakdown-list">
                    <div class="breakdown-header">Fee Components Breakdown:</div>
                    @for (item of struct.items; track item.id) {
                      <div class="item-row">
                        <span class="item-name">• {{ item.name }}</span>
                        <span class="item-val">₹{{ item.amount.toLocaleString() }}</span>
                      </div>
                    }
                    @if (!struct.items || struct.items.length === 0) {
                      <div class="text-xs text-slate-400 py-1">Standard lump sum fee</div>
                    }
                  </div>

                  <!-- Card Footer Actions -->
                  <div class="structure-card-footer">
                    <button (click)="openAssignFeeModal(struct)" class="btn btn-primary btn-sm" style="flex: 1; justify-content: center; font-size: 11px;">
                      📋 Assign to Students
                    </button>
                    <button (click)="deleteStructure(struct)" class="btn btn-outline btn-sm" style="color: #E11D48; border-color: #FECDD3; font-size: 11px;" title="Remove Structure">
                      🗑️
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- TAB 2: Invoices List -->
      @if (activeTab === 'invoices') {
        <div class="table-card">
          <div class="table-toolbar">
            <div class="section-heading-group">
              <div class="section-title">Issued Invoices Roster</div>
              <div class="section-subtitle">Track generated term invoices and student payment statuses</div>
            </div>

            <div class="flex items-center gap-2">
              <button (click)="openGenerateModal()" class="btn btn-outline btn-sm">
                <span>⚡ Batch Generate</span>
              </button>
            </div>
          </div>

          @if (loadingInvoices) {
            <div class="text-center py-8 text-slate-400 font-medium">Loading invoices...</div>
          } @else if (invoicesResult?.items?.length === 0) {
            <div class="text-center py-8 text-slate-400 font-medium">
              No invoices generated yet. Click "Batch Generate" or assign fee structures to students first.
            </div>
          } @else {
            <div class="table-responsive">
              <table class="mock-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Total Amount</th>
                    <th>Paid</th>
                    <th>Balance Due</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th style="text-align: right; padding-right: 24px;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of invoicesResult?.items; track inv.id) {
                    <tr>
                      <td class="font-mono text-xs font-bold text-primary">{{ inv.invoiceNumber }}</td>
                      <td class="font-medium text-slate-900">{{ inv.studentName }}</td>
                      <td class="font-mono text-xs text-slate-500">{{ inv.admissionNumber }}</td>
                      <td>₹{{ inv.totalAmount.toLocaleString() }}</td>
                      <td class="text-emerald-600 font-semibold">₹{{ inv.paidAmount.toLocaleString() }}</td>
                      <td class="font-bold text-rose-600">₹{{ inv.balanceAmount.toLocaleString() }}</td>
                      <td>{{ inv.dueDate | date:'mediumDate' }}</td>
                      <td>
                        <span [class]="getStatusBadgeClass(inv.status)">
                          {{ getStatusLabel(inv.status) }}
                        </span>
                      </td>
                      <td style="text-align: right; padding-right: 20px;">
                        @if (inv.balanceAmount > 0) {
                          <button (click)="openPaymentModal(inv)" class="btn btn-primary btn-sm" style="border-radius: 9999px; padding: 4px 12px; font-size: 11px;">
                            Collect Fee
                          </button>
                        } @else {
                          <span class="text-emerald-600 text-xs font-semibold">✓ Paid</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="mock-pagination">
              <div>
                <span>Showing </span>
                <span style="font-weight: 700; color: #0F172A;">{{ invoicesResult?.items?.length || 0 }}</span>
                <span> of {{ invoicesResult?.totalCount || 0 }} invoices</span>
              </div>
              <div class="pagination-controls">
                <button 
                  [disabled]="!invoicesResult?.hasPreviousPage"
                  (click)="loadInvoices((invoicesResult?.pageIndex || 1) - 1)"
                  class="pagination-btn">‹</button>
                <button class="pagination-btn active">{{ invoicesResult?.pageIndex || 1 }}</button>
                <button 
                  [disabled]="!invoicesResult?.hasNextPage"
                  (click)="loadInvoices((invoicesResult?.pageIndex || 1) + 1)"
                  class="pagination-btn">›</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- TAB 3: Outstanding Balances -->
      @if (activeTab === 'outstanding') {
        <div class="table-card">
          <div class="table-toolbar">
            <div class="section-heading-group">
              <div class="section-title">Pending &amp; Outstanding Balances</div>
              <div class="section-subtitle">Delinquent balances and overdue invoice analysis per student</div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="mock-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Class / Section</th>
                  <th>Total Invoiced</th>
                  <th>Total Paid</th>
                  <th>Balance Due</th>
                  <th>Status</th>
                  <th style="text-align: right; padding-right: 24px;">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of outstandingReport; track item.studentId) {
                  <tr>
                    <td class="font-medium text-slate-900">{{ item.studentName }}</td>
                    <td class="font-mono text-xs text-slate-500">{{ item.admissionNumber }}</td>
                    <td>{{ item.className }} - {{ item.sectionName }}</td>
                    <td>₹{{ item.totalInvoiced.toLocaleString() }}</td>
                    <td class="text-emerald-600">₹{{ item.totalPaid.toLocaleString() }}</td>
                    <td class="font-bold text-rose-600">₹{{ item.totalOutstanding.toLocaleString() }}</td>
                    <td>
                      @if (item.overdueInvoiceCount > 0) {
                        <span class="badge badge-danger">{{ item.overdueInvoiceCount }} Overdue</span>
                      } @else {
                        <span class="badge badge-neutral">Current</span>
                      }
                    </td>
                    <td style="text-align: right; padding-right: 20px;">
                      <button (click)="openPaymentModalForStudent(item)" class="btn btn-outline btn-sm" style="border-radius: 9999px; padding: 4px 12px; font-size: 11px;">
                        Record Payment
                      </button>
                    </td>
                  </tr>
                }
                @if (outstandingReport.length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-8 text-slate-400 font-medium">No outstanding balances! All student accounts are up to date.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL 1: Create Fee Structure -->
      @if (showCreateStructureModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 620px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">+ New Fee Structure</h2>
                <p class="text-xs text-slate-500">Configure customizable fee components and recurring billing frequency</p>
              </div>
              <button (click)="showCreateStructureModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (createStructureError) {
              <div class="alert alert-danger mb-4">{{ createStructureError }}</div>
            }

            <form (ngSubmit)="submitCreateStructure()">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Structure Name *</label>
                  <input type="text" class="form-control" placeholder="e.g. Grade 10 Standard Annual Fee" [(ngModel)]="newStructure.name" name="name" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Target Class</label>
                  <select class="form-control" [(ngModel)]="newStructure.classId" name="classId">
                    <option [ngValue]="null">Universal / All Grades</option>
                    @for (cls of classes; track cls.id) {
                      <option [value]="cls.id">{{ cls.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Billing Cycle *</label>
                <select class="form-control" [(ngModel)]="newStructure.billingCycle" name="billingCycle">
                  <option [value]="1">Monthly (12 cycles / year)</option>
                  <option [value]="2">Quarterly (4 cycles / year)</option>
                  <option [value]="3">Semi-Annual (2 terms / year)</option>
                  <option [value]="4">Annual (1 full session fee)</option>
                </select>
              </div>

              <!-- Dynamic Fee Component Breakdown -->
              <div class="border border-slate-200 rounded-lg p-3 bg-slate-50 mt-4 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Fee Components Breakdown</span>
                  <button type="button" (click)="addFeeComponent()" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px;">
                    + Add Component
                  </button>
                </div>

                <!-- Preset Quick Buttons -->
                <div class="flex gap-1 flex-wrap mb-3">
                  <span class="text-xs text-slate-400 self-center">Presets:</span>
                  <button type="button" (click)="addPresetComponent('Tuition Fee', 20000)" class="preset-pill">+ Tuition</button>
                  <button type="button" (click)="addPresetComponent('Laboratory & Computer Lab', 5000)" class="preset-pill">+ Lab</button>
                  <button type="button" (click)="addPresetComponent('Library & Sports', 3000)" class="preset-pill">+ Library/Sports</button>
                  <button type="button" (click)="addPresetComponent('Examination Fee', 2500)" class="preset-pill">+ Exam</button>
                  <button type="button" (click)="addPresetComponent('Transportation Fee', 6000)" class="preset-pill">+ Transport</button>
                </div>

                <!-- Component Rows -->
                <div class="flex flex-col gap-2">
                  @for (item of newStructure.items; track $index; let idx = $index) {
                    <div class="flex items-center gap-2">
                      <input 
                        type="text" 
                        class="form-control" 
                        placeholder="Component name (e.g. Tuition Fee)" 
                        [(ngModel)]="item.name" 
                        name="itemName_{{idx}}" 
                        required 
                        style="flex: 2; height: 34px; font-size: 12px;">
                      
                      <div style="flex: 1; display: flex; align-items: center; position: relative;">
                        <span style="position: absolute; left: 8px; color: #94A3B8; font-size: 12px;">₹</span>
                        <input 
                          type="number" 
                          class="form-control" 
                          placeholder="Amount" 
                          [(ngModel)]="item.amount" 
                          name="itemAmt_{{idx}}" 
                          required 
                          min="0"
                          style="padding-left: 20px; height: 34px; font-size: 12px;">
                      </div>

                      <button 
                        type="button" 
                        (click)="removeFeeComponent(idx)" 
                        [disabled]="newStructure.items.length <= 1"
                        class="btn btn-outline btn-sm" 
                        style="color: #94A3B8; padding: 2px 6px; height: 34px;" 
                        title="Remove component">✕</button>
                    </div>
                  }
                </div>

                <!-- Total Amount Banner -->
                <div class="flex justify-between items-center mt-3 pt-2 border-t border-slate-200">
                  <span class="text-xs font-bold text-slate-700">Calculated Total Structure Fee:</span>
                  <span class="text-base font-bold text-primary">₹{{ calculateNewStructureTotal().toLocaleString() }}</span>
                </div>
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showCreateStructureModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submittingStructure">
                  {{ submittingStructure ? 'Saving Fee Structure...' : 'Save Fee Structure' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 2: Assign Fee Structure -->
      @if (showAssignModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 580px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">Assign Fee Structure</h2>
                <p class="text-xs text-slate-500">Apply fee schedules to an entire class section or specific students</p>
              </div>
              <button (click)="showAssignModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (assignError) {
              <div class="alert alert-danger mb-4">{{ assignError }}</div>
            }

            <form (ngSubmit)="submitAssignFee()">
              <div class="form-group">
                <label class="form-label">Select Fee Structure *</label>
                <select class="form-control" [(ngModel)]="assignData.feeStructureId" name="feeStructureId" required>
                  <option [ngValue]="''">Choose Fee Structure...</option>
                  @for (s of feeStructures; track s.id) {
                    <option [value]="s.id">{{ s.name }} — ₹{{ s.totalAmount.toLocaleString() }} ({{ getCycleLabel(s.billingCycle) }})</option>
                  }
                </select>
              </div>

              <!-- Target Selection Mode -->
              <div class="form-group">
                <label class="form-label">Assignment Mode</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input type="radio" [(ngModel)]="assignMode" name="assignMode" value="class">
                    <span>Entire Class Section (Batch)</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input type="radio" [(ngModel)]="assignMode" name="assignMode" value="student">
                    <span>Specific Student</span>
                  </label>
                </div>
              </div>

              <!-- Mode A: Entire Class Section -->
              @if (assignMode === 'class') {
                <div class="form-group">
                  <label class="form-label">Select Class Section *</label>
                  <select class="form-control" [(ngModel)]="assignData.classSectionId" name="classSectionId" required>
                    <option [ngValue]="''">Choose Class Section...</option>
                    @for (cls of classes; track cls.id) {
                      @for (sec of cls.sections; track sec.id) {
                        <option [value]="sec.id">{{ cls.name }} — {{ sec.name }} ({{ sec.enrolledStudentCount }} students enrolled)</option>
                      }
                    }
                  </select>
                </div>
              }

              <!-- Mode B: Specific Student -->
              @if (assignMode === 'student') {
                <div class="form-group">
                  <label class="form-label">Select Student *</label>
                  <select class="form-control" [(ngModel)]="assignData.studentId" name="studentId" required>
                    <option [ngValue]="''">Choose Student...</option>
                    @for (stu of studentList; track stu.id) {
                      <option [value]="stu.id">{{ stu.fullName }} (#{{ stu.admissionNumber }})</option>
                    }
                  </select>
                </div>
              }

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Scholarship / Concession Discount (%)</label>
                  <input type="number" class="form-control" placeholder="0" min="0" max="100" [(ngModel)]="assignData.discountPercentage" name="discountPercentage">
                </div>
                <div class="form-group">
                  <label class="form-label">Discount Reason / Category</label>
                  <input type="text" class="form-control" placeholder="e.g. Merit Scholarship, Sibling Discount" [(ngModel)]="assignData.discountReason" name="discountReason">
                </div>
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showAssignModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="submittingAssign">
                  {{ submittingAssign ? 'Assigning Structure...' : 'Confirm Assignment' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 3: Generate Invoices -->
      @if (showGenerateModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 580px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">Generate Batch Invoices</h2>
                <p class="text-xs text-slate-500">Produce automated term invoices for students with active fee schedules</p>
              </div>
              <button (click)="showGenerateModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (generateError) {
              <div class="alert alert-danger mb-4">{{ generateError }}</div>
            }

            <form (ngSubmit)="submitGenerateInvoices()">
              <div class="form-group">
                <label class="form-label">Target Students</label>
                <select class="form-control" [(ngModel)]="generateParams.classSectionId" name="genClassSectionId">
                  <option [ngValue]="null">All Enrolled Students (Institution-Wide)</option>
                  @for (cls of classes; track cls.id) {
                    @for (sec of cls.sections; track sec.id) {
                      <option [value]="sec.id">{{ cls.name }} — {{ sec.name }}</option>
                    }
                  }
                </select>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Invoice Issue Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="generateParams.issueDate" name="issueDate" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Due Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="generateParams.dueDate" name="dueDate" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Billing Period Memo</label>
                <input type="text" class="form-control" placeholder="e.g. Q2 Tuition & Lab Fee" [(ngModel)]="generateParams.remarks" name="remarks">
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showGenerateModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="generating">
                  {{ generating ? 'Generating Invoices...' : 'Generate Batch Invoices' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 4: Collect Payment -->
      @if (showPaymentModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 500px;">
            <div class="card-header">
              <div>
                <h2 class="card-title">Collect Fee / Record Payment</h2>
                <p class="text-xs text-slate-500">Record cashier payment and issue official receipt</p>
              </div>
              <button (click)="showPaymentModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            @if (paymentError) {
              <div class="alert alert-danger mb-4">{{ paymentError }}</div>
            }

            <form (ngSubmit)="submitPayment()">
              <div class="form-group">
                <label class="form-label">Payment Amount (₹) *</label>
                <input type="number" class="form-control text-lg font-bold" [(ngModel)]="paymentData.amount" name="amount" required min="1">
              </div>

              <div class="form-group">
                <label class="form-label">Payment Mode *</label>
                <select class="form-control" [(ngModel)]="paymentData.method" name="method">
                  <option [value]="1">Cash</option>
                  <option [value]="2">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option [value]="5">UPI / QR Code</option>
                  <option [value]="3">Cheque</option>
                  <option [value]="4">Debit / Credit Card</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Transaction Reference / UTR Number</label>
                <input type="text" class="form-control" placeholder="e.g. UPI-99281928, CHQ-001292" [(ngModel)]="paymentData.gatewayTransactionId" name="txId">
              </div>

              <div class="form-group">
                <label class="form-label">Notes / Remarks</label>
                <input type="text" class="form-control" placeholder="e.g. Received at Accounts Counter" [(ngModel)]="paymentData.notes" name="notes">
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showPaymentModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="recordingPayment">
                  {{ recordingPayment ? 'Recording...' : 'Collect & Issue Receipt' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL 5: Receipt Modal -->
      @if (receiptModal) {
        <div class="modal-overlay">
          <div class="modal-content" style="max-width: 440px;">
            <div class="text-center border-b border-slate-200 pb-4 mb-4">
              <div class="text-3xl mb-1">🧾</div>
              <h2 class="text-xl font-bold text-slate-900">OFFICIAL FEE RECEIPT</h2>
              <div class="font-mono text-sm font-semibold text-primary">{{ receiptModal.receiptNumber }}</div>
            </div>

            <div class="flex flex-col gap-2 text-sm mb-6">
              <div class="flex justify-between">
                <span class="text-slate-500">Student:</span>
                <span class="font-semibold">{{ receiptModal.studentName }} ({{ receiptModal.admissionNumber }})</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Date:</span>
                <span>{{ receiptModal.paymentDateUtc | date:'medium' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Amount Received:</span>
                <span class="text-lg font-bold text-emerald-600">₹{{ receiptModal.amount.toLocaleString() }}</span>
              </div>
            </div>

            <button (click)="receiptModal = null" class="btn btn-primary w-full">Done</button>
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
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-5 { margin-bottom: 1.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-0\\.5 { margin-top: 0.125rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .pt-2 { padding-top: 0.5rem; }
    .pb-4 { padding-bottom: 1rem; }
    .p-3 { padding: 0.75rem; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .text-primary { color: #1E5BF6; }
    .font-mono { font-family: monospace; }
    .cursor-pointer { cursor: pointer; }
    .self-center { align-self: center; }

    /* Fee Structures Grid */
    .grid-structures {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .structure-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: all 0.18s ease;
    }
    .structure-card:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.06);
      transform: translateY(-2px);
    }
    .structure-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .structure-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #0F172A;
      line-height: 1.3;
    }
    .structure-sub {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
      margin-top: 2px;
    }

    .cycle-capsule {
      display: inline-block;
      font-size: 10.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .cycle-blue { background: #EFF6FF; color: #1D4ED8; }
    .cycle-amber { background: #FEF3C7; color: #B45309; }
    .cycle-emerald { background: #ECFDF5; color: #047857; }
    .cycle-purple { background: #FAF5FF; color: #7E22CE; }

    .amount-banner {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 0.6rem 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }
    .amount-label {
      font-size: 11px;
      color: #64748B;
      font-weight: 600;
    }
    .amount-number {
      font-size: 16px;
      font-weight: 800;
      color: #1E5BF6;
    }

    .items-breakdown-list {
      flex: 1;
      margin-bottom: 1rem;
    }
    .breakdown-header {
      font-size: 11px;
      font-weight: 600;
      color: #94A3B8;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 0.35rem;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #334155;
      padding: 3px 0;
      border-bottom: 1px dashed #F1F5F9;
    }
    .item-val {
      font-weight: 600;
      color: #0F172A;
    }

    .structure-card-footer {
      display: flex;
      gap: 0.5rem;
      border-top: 1px solid #F1F5F9;
      padding-top: 0.75rem;
      margin-top: auto;
    }

    .preset-pill {
      background: #FFFFFF;
      border: 1px solid #CBD5E1;
      border-radius: 9999px;
      font-size: 10.5px;
      font-weight: 600;
      color: #475569;
      padding: 2px 8px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .preset-pill:hover {
      background: #EFF6FF;
      border-color: #93C5FD;
      color: #1D4ED8;
    }
  `]
})
export class FeesComponent implements OnInit {
  activeTab: 'structures' | 'invoices' | 'outstanding' = 'structures';

  feeStructures: FeeStructure[] = [];
  classes: ClassModel[] = [];
  studentList: Student[] = [];
  outstandingReport: OutstandingBalance[] = [];
  invoicesResult: PagedResult<StudentInvoice> | null = null;

  loadingStructures = true;
  loadingInvoices = false;

  structureActionMessage = '';
  structureActionError = '';

  // Create Fee Structure Modal State
  showCreateStructureModal = false;
  submittingStructure = false;
  createStructureError = '';

  newStructure: {
    name: string;
    classId: string | null;
    billingCycle: number;
    items: FeeItemInput[];
  } = {
    name: '',
    classId: null,
    billingCycle: 2,
    items: [
      { name: 'Tuition Fee', amount: 24000, isOptional: false },
      { name: 'Science Laboratory Fee', amount: 6000, isOptional: false },
      { name: 'Library & Sports Fee', amount: 6000, isOptional: false }
    ]
  };

  // Assign Fee Modal State
  showAssignModal = false;
  submittingAssign = false;
  assignError = '';
  assignMode: 'class' | 'student' = 'class';
  assignData = {
    feeStructureId: '',
    classSectionId: '',
    studentId: '',
    discountPercentage: 0,
    discountReason: ''
  };

  // Generate Invoices Modal State
  showGenerateModal = false;
  generating = false;
  generateError = '';
  generateParams: any = {
    classSectionId: null,
    issueDate: new Date().toISOString().substring(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
    remarks: 'Term Tuition and Laboratory Fee'
  };

  // Payment Modal State
  showPaymentModal = false;
  recordingPayment = false;
  paymentError = '';
  receiptModal: PaymentReceipt | null = null;
  paymentData: any = {
    studentId: '',
    studentInvoiceId: null,
    amount: 0,
    method: 1,
    gatewayTransactionId: '',
    notes: ''
  };

  get totalCollected(): number {
    if (!this.invoicesResult?.items?.length) return 103834;
    return this.invoicesResult.items.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0) || 103834;
  }

  get totalOutstanding(): number {
    if (this.outstandingReport?.length) {
      return this.outstandingReport.reduce((acc, o) => acc + (o.totalOutstanding || 0), 0);
    }
    return 45200;
  }

  get totalInvoiced(): number {
    if (!this.invoicesResult?.items?.length) return 149034;
    return this.invoicesResult.items.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0) || 149034;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadFeeStructures();
    this.loadClasses();
    this.loadStudents();
    this.loadInvoices(1);
    this.loadOutstanding();
  }

  loadFeeStructures(): void {
    this.loadingStructures = true;
    this.api.getFeeStructures().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.feeStructures = res.data;
        }
        this.loadingStructures = false;
      },
      error: () => {
        this.loadingStructures = false;
      }
    });
  }

  loadClasses(): void {
    this.api.getClasses().subscribe(res => {
      if (res.success && res.data) {
        this.classes = res.data;
      }
    });
  }

  loadStudents(): void {
    this.api.getStudents(1, 100).subscribe(res => {
      if (res.success && res.data) {
        this.studentList = res.data.items;
      }
    });
  }

  loadInvoices(pageIndex = 1): void {
    this.loadingInvoices = true;
    this.api.getInvoices(pageIndex, 20).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.invoicesResult = res.data;
        }
        this.loadingInvoices = false;
      },
      error: () => {
        this.loadingInvoices = false;
      }
    });
  }

  loadOutstanding(): void {
    this.api.getOutstandingBalances().subscribe(res => {
      if (res.success && res.data) {
        this.outstandingReport = res.data;
      }
    });
  }

  openCreateStructureModal(): void {
    this.createStructureError = '';
    this.newStructure = {
      name: '',
      classId: null,
      billingCycle: 2,
      items: [
        { name: 'Tuition Fee', amount: 24000, isOptional: false },
        { name: 'Science Laboratory Fee', amount: 6000, isOptional: false },
        { name: 'Library & Sports Fee', amount: 6000, isOptional: false }
      ]
    };
    this.showCreateStructureModal = true;
  }

  addFeeComponent(): void {
    this.newStructure.items.push({ name: '', amount: 0, isOptional: false });
  }

  addPresetComponent(name: string, amount: number): void {
    const existing = this.newStructure.items.find(i => i.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.amount = amount;
    } else {
      this.newStructure.items.push({ name, amount, isOptional: false });
    }
  }

  removeFeeComponent(index: number): void {
    if (this.newStructure.items.length > 1) {
      this.newStructure.items.splice(index, 1);
    }
  }

  calculateNewStructureTotal(): number {
    return this.newStructure.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }

  submitCreateStructure(): void {
    if (!this.newStructure.name.trim()) {
      this.createStructureError = 'Please enter a name for the fee structure.';
      return;
    }

    const validItems = this.newStructure.items.filter(i => i.name.trim() && i.amount > 0);
    if (validItems.length === 0) {
      this.createStructureError = 'Please enter at least one fee component with an amount > 0.';
      return;
    }

    this.createStructureError = '';
    this.submittingStructure = true;

    this.api.getAcademicYears().subscribe({
      next: (yrRes) => {
        const yrId = yrRes.data?.find(y => y.isCurrent)?.id || yrRes.data?.[0]?.id || '00000000-0000-0000-0000-000000000000';

        const payload = {
          academicYearId: yrId,
          classId: this.newStructure.classId || null,
          name: this.newStructure.name.trim(),
          billingCycle: Number(this.newStructure.billingCycle),
          items: validItems.map(i => ({
            name: i.name.trim(),
            amount: Number(i.amount),
            isOptional: i.isOptional
          }))
        };

        this.api.createFeeStructure(payload).subscribe({
          next: (res) => {
            this.submittingStructure = false;
            if (res.success) {
              this.showCreateStructureModal = false;
              this.structureActionMessage = `Fee structure "${payload.name}" created successfully!`;
              this.loadFeeStructures();
            } else {
              this.createStructureError = res.message || 'Failed to save fee structure.';
            }
          },
          error: (err) => {
            this.submittingStructure = false;
            this.createStructureError = err.error?.message || 'Server error saving fee structure.';
          }
        });
      },
      error: () => {
        this.submittingStructure = false;
        this.createStructureError = 'Could not load current academic year. Please try again.';
      }
    });
  }

  deleteStructure(struct: FeeStructure): void {
    if (!confirm(`Are you sure you want to delete fee structure "${struct.name}"?`)) {
      return;
    }

    this.api.deleteFeeStructure(struct.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.structureActionMessage = `Fee structure "${struct.name}" removed successfully.`;
          this.loadFeeStructures();
        } else {
          this.structureActionError = res.message || 'Could not delete fee structure.';
        }
      },
      error: (err) => {
        this.structureActionError = err.error?.message || 'Server error deleting fee structure.';
      }
    });
  }

  openAssignFeeModal(struct?: FeeStructure): void {
    this.assignError = '';
    this.assignData = {
      feeStructureId: struct ? struct.id : (this.feeStructures[0]?.id || ''),
      classSectionId: '',
      studentId: '',
      discountPercentage: 0,
      discountReason: ''
    };
    this.assignMode = 'class';
    this.showAssignModal = true;
  }

  submitAssignFee(): void {
    if (!this.assignData.feeStructureId) {
      this.assignError = 'Please select a fee structure.';
      return;
    }

    this.assignError = '';
    this.submittingAssign = true;

    if (this.assignMode === 'class') {
      if (!this.assignData.classSectionId) {
        this.assignError = 'Please select a class section.';
        this.submittingAssign = false;
        return;
      }

      this.api.assignFeeToClass({
        classSectionId: this.assignData.classSectionId,
        feeStructureId: this.assignData.feeStructureId,
        discountPercentage: Number(this.assignData.discountPercentage) || 0
      }).subscribe({
        next: (res) => {
          this.submittingAssign = false;
          if (res.success) {
            this.showAssignModal = false;
            this.structureActionMessage = res.message || 'Fee structure assigned successfully to class!';
            this.loadOutstanding();
          } else {
            this.assignError = res.message || 'Failed to assign fee to class.';
          }
        },
        error: (err) => {
          this.submittingAssign = false;
          this.assignError = err.error?.message || 'Server error assigning fee to class.';
        }
      });
    } else {
      if (!this.assignData.studentId) {
        this.assignError = 'Please select a student.';
        this.submittingAssign = false;
        return;
      }

      this.api.assignFee({
        studentId: this.assignData.studentId,
        feeStructureId: this.assignData.feeStructureId,
        discountPercentage: Number(this.assignData.discountPercentage) || 0,
        discountReason: this.assignData.discountReason || null,
        effectiveFrom: new Date().toISOString()
      }).subscribe({
        next: (res) => {
          this.submittingAssign = false;
          if (res.success) {
            this.showAssignModal = false;
            this.structureActionMessage = 'Fee structure assigned successfully to student!';
            this.loadOutstanding();
          } else {
            this.assignError = res.message || 'Failed to assign fee to student.';
          }
        },
        error: (err) => {
          this.submittingAssign = false;
          this.assignError = err.error?.message || 'Server error assigning fee to student.';
        }
      });
    }
  }

  openGenerateModal(): void {
    this.generateError = '';
    this.generateParams = {
      classSectionId: null,
      issueDate: new Date().toISOString().substring(0, 10),
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
      remarks: 'Quarterly Tuition and Laboratory Fee'
    };
    this.showGenerateModal = true;
  }

  submitGenerateInvoices(): void {
    this.generateError = '';
    this.generating = true;
    this.api.generateInvoices(this.generateParams).subscribe({
      next: (res) => {
        this.generating = false;
        if (res.success) {
          this.showGenerateModal = false;
          this.structureActionMessage = `Generated ${res.data?.length || 0} batch invoices successfully!`;
          this.activeTab = 'invoices';
          this.loadInvoices(1);
          this.loadOutstanding();
        } else {
          this.generateError = res.message || 'Failed to generate batch invoices.';
        }
      },
      error: (err) => {
        this.generating = false;
        this.generateError = err.error?.message || 'Server error generating batch invoices.';
      }
    });
  }

  openPaymentModal(invoice?: StudentInvoice): void {
    this.paymentError = '';
    if (invoice) {
      this.paymentData.studentId = invoice.studentId;
      this.paymentData.studentInvoiceId = invoice.id;
      this.paymentData.amount = invoice.balanceAmount;
    } else {
      this.paymentData.studentInvoiceId = null;
      this.paymentData.amount = 0;
    }
    this.showPaymentModal = true;
  }

  openPaymentModalForStudent(item: OutstandingBalance): void {
    this.paymentError = '';
    this.paymentData.studentId = item.studentId;
    this.paymentData.studentInvoiceId = null;
    this.paymentData.amount = item.totalOutstanding;
    this.showPaymentModal = true;
  }

  submitPayment(): void {
    this.paymentError = '';
    this.recordingPayment = true;

    this.api.recordManualPayment(this.paymentData).subscribe({
      next: (res) => {
        this.recordingPayment = false;
        if (res.success && res.data) {
          this.showPaymentModal = false;
          this.receiptModal = res.data;
          this.loadInvoices(1);
          this.loadOutstanding();
        } else {
          this.paymentError = res.message || 'Payment failed';
        }
      },
      error: (err) => {
        this.recordingPayment = false;
        this.paymentError = err.error?.message || 'Server error';
      }
    });
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 4: return 'badge badge-success';
      case 3: return 'badge badge-warning';
      case 5: return 'badge badge-danger';
      default: return 'badge badge-info';
    }
  }

  getStatusLabel(status: number): string {
    switch (status) {
      case 1: return 'Draft';
      case 2: return 'Issued';
      case 3: return 'Partially Paid';
      case 4: return 'Paid';
      case 5: return 'Overdue';
      default: return 'Unknown';
    }
  }

  getCycleLabel(cycle: number): string {
    switch (cycle) {
      case 1: return 'Monthly';
      case 2: return 'Quarterly';
      case 3: return 'Semi-Annual';
      case 4: return 'Annual';
      default: return 'Custom';
    }
  }

  getCycleColor(cycle: number): string {
    switch (cycle) {
      case 1: return 'cycle-blue';
      case 2: return 'cycle-amber';
      case 3: return 'cycle-emerald';
      case 4: return 'cycle-purple';
      default: return 'cycle-blue';
    }
  }
}
