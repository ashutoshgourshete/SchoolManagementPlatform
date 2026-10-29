import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ExecutiveSummaryReport,
  FinancialCollectionReport,
  AttendanceAnalyticsReport,
  EnrollmentDemographicsReport,
  PaymentReceipt
} from '../../core/models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Essential Institutional Reports</h1>
          <p class="text-sm text-slate-500">Official reporting center: Financial collections, receipts, attendance defaulters, and enrollment stats</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="printReport()" class="btn btn-outline">
            🖨 Print / Export PDF
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="card mb-6">
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button 
            (click)="activeTab = 'executive'" 
            [class.bg-indigo-600]="activeTab === 'executive'"
            [class.text-white]="activeTab === 'executive'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:bg-slate-100">
            📊 Executive Summary
          </button>
          <button 
            (click)="activeTab = 'financial'" 
            [class.bg-indigo-600]="activeTab === 'financial'"
            [class.text-white]="activeTab === 'financial'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:bg-slate-100">
            💳 Fees, Defaulters & Receipts
          </button>
          <button 
            (click)="activeTab = 'attendance'" 
            [class.bg-indigo-600]="activeTab === 'attendance'"
            [class.text-white]="activeTab === 'attendance'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:bg-slate-100">
            📅 Attendance Analytics (< 75% Flag)
          </button>
          <button 
            (click)="activeTab = 'enrollment'" 
            [class.bg-indigo-600]="activeTab === 'enrollment'"
            [class.text-white]="activeTab === 'enrollment'"
            class="px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:bg-slate-100">
            👨‍🎓 Enrollment & Demographics
          </button>
        </div>
      </div>

      <!-- TAB 1: EXECUTIVE SUMMARY -->
      @if (activeTab === 'executive') {
        @if (loading) {
          <div class="card text-center py-12 text-slate-500">Generating executive report...</div>
        } @else if (executive) {
          <div class="space-y-6">
            <!-- Key Metric Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Total Enrolled</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">{{ executive.enrollment.totalStudents }}</div>
                <div class="text-xs text-slate-500 mt-1">{{ executive.enrollment.totalMale }} Boys | {{ executive.enrollment.totalFemale }} Girls</div>
              </div>

              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Overall Attendance</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-1">{{ executive.attendance.overallAttendanceRate }}%</div>
                <div class="text-xs text-rose-500 mt-1 font-semibold">{{ executive.attendance.criticalDefaultersCount }} students below 75%</div>
              </div>

              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Fee Collection Rate</span>
                <div class="text-2xl font-extrabold text-indigo-600 mt-1">{{ executive.financials.collectionEfficiencyRate }}%</div>
                <div class="text-xs text-slate-500 mt-1">₹{{ executive.financials.totalCollectedAmount | number }} of ₹{{ executive.financials.totalInvoicedAmount | number }}</div>
              </div>

              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Pending Dues</span>
                <div class="text-2xl font-extrabold text-rose-600 mt-1">₹{{ executive.financials.totalOutstandingAmount | number }}</div>
                <div class="text-xs text-slate-500 mt-1">Outstanding institutional receivables</div>
              </div>
            </div>

            <!-- Summary Table Preview -->
            <div class="card">
              <h2 class="card-title mb-4">Class-wise Strength & Occupancy</h2>
              <div class="table-responsive">
                <table class="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Class & Section</th>
                      <th>Capacity</th>
                      <th>Enrolled</th>
                      <th>Male</th>
                      <th>Female</th>
                      <th>Occupancy Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of executive.enrollment.classStats; track c.classSectionId) {
                      <tr>
                        <td class="font-bold">{{ c.className }} - Section {{ c.sectionName }}</td>
                        <td>{{ c.capacity }}</td>
                        <td class="font-bold text-indigo-700">{{ c.totalEnrolled }}</td>
                        <td>{{ c.maleCount }}</td>
                        <td>{{ c.femaleCount }}</td>
                        <td>
                          <span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {{ c.occupancyRate }}%
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }

      <!-- TAB 2: FINANCIALS, DEFAULTERS & RECEIPTS -->
      @if (activeTab === 'financial') {
        @if (financials) {
          <div class="space-y-6">
            <!-- Financial Highlights -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="card bg-emerald-50 border-emerald-200">
                <span class="text-xs font-bold text-emerald-800 uppercase">Total Collected</span>
                <div class="text-2xl font-extrabold text-emerald-700 mt-1">₹{{ financials.totalCollectedAmount | number }}</div>
                <span class="text-xs text-emerald-600">Successfully realized fees</span>
              </div>
              <div class="card bg-rose-50 border-rose-200">
                <span class="text-xs font-bold text-rose-800 uppercase">Total Outstanding Balances</span>
                <div class="text-2xl font-extrabold text-rose-700 mt-1">₹{{ financials.totalOutstandingAmount | number }}</div>
                <span class="text-xs text-rose-600">Pending parent payments</span>
              </div>
              <div class="card bg-slate-50 border-slate-200">
                <span class="text-xs font-bold text-slate-700 uppercase">Collection Efficiency</span>
                <div class="text-2xl font-extrabold text-indigo-600 mt-1">{{ financials.collectionEfficiencyRate }}%</div>
                <span class="text-xs text-slate-500">Collected vs Invoiced</span>
              </div>
            </div>

            <!-- Payment Method Breakdown -->
            <div class="card">
              <h2 class="card-title mb-4">Collection Breakdown by Payment Mode</h2>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                @for (m of financials.methodBreakdown; track m.method) {
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <span class="font-bold text-slate-700 uppercase">{{ m.method }}</span>
                    <div class="text-lg font-extrabold text-slate-900 mt-1">₹{{ m.totalAmount | number }}</div>
                    <span class="text-[11px] text-slate-500">{{ m.transactionCount }} transactions</span>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Official Payment Receipts -->
            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Recent Fee Receipts (Click to View & Print)</h2>
              </div>
              <div class="table-responsive">
                <table class="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date</th>
                      <th>Student Name</th>
                      <th>Admission No</th>
                      <th>Invoice #</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of financials.recentReceipts; track r.paymentId) {
                      <tr>
                        <td class="font-mono font-bold text-indigo-600">{{ r.receiptNumber }}</td>
                        <td>{{ formatDate(r.paymentDateUtc) }}</td>
                        <td class="font-bold text-slate-900">{{ r.studentName }}</td>
                        <td>{{ r.admissionNumber }}</td>
                        <td class="font-mono text-slate-500">{{ r.invoiceNumber || 'Direct' }}</td>
                        <td class="font-bold text-emerald-600">₹{{ r.amount | number }}</td>
                        <td><span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{{ r.method }}</span></td>
                        <td>
                          <button (click)="openReceiptModal(r)" class="btn btn-outline btn-sm">
                            📄 View Receipt
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }

      <!-- TAB 3: ATTENDANCE ANALYTICS & DEFAULTERS -->
      @if (activeTab === 'attendance') {
        @if (attendance) {
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Average Attendance Rate</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-1">{{ attendance.overallAttendanceRate }}%</div>
              </div>
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Evaluated Students</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">{{ attendance.totalStudentsEvaluated }}</div>
              </div>
              <div class="card bg-rose-50 border-rose-200">
                <span class="text-xs font-bold text-rose-800 uppercase">Critical Defaulters (< 75%)</span>
                <div class="text-2xl font-extrabold text-rose-600 mt-1">{{ attendance.criticalDefaultersCount }}</div>
                <span class="text-xs text-rose-500">Requires guardian notification</span>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h2 class="card-title">Student Attendance Roster & Defaulters</h2>
                <span class="text-xs text-slate-500">Sorted from lowest attendance percentage</span>
              </div>
              <div class="table-responsive">
                <table class="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Admission No</th>
                      <th>Student Name</th>
                      <th>Class & Section</th>
                      <th>Guardian Phone</th>
                      <th>Total Sessions</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Attendance %</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of attendance.records; track item.studentId) {
                      <tr [class.bg-rose-50]="item.isCriticalDefaulter">
                        <td class="font-mono font-medium">{{ item.admissionNumber }}</td>
                        <td class="font-bold text-slate-900">{{ item.studentName }}</td>
                        <td>{{ item.className }}-{{ item.sectionName }}</td>
                        <td>{{ item.guardianPhone || 'N/A' }}</td>
                        <td>{{ item.totalSessions }}</td>
                        <td class="text-emerald-600 font-semibold">{{ item.presentCount }}</td>
                        <td class="text-rose-600 font-semibold">{{ item.absentCount }}</td>
                        <td class="font-bold text-sm" [class.text-rose-600]="item.isCriticalDefaulter" [class.text-emerald-700]="!item.isCriticalDefaulter">
                          {{ item.attendancePercentage }}%
                        </td>
                        <td>
                          @if (item.isCriticalDefaulter) {
                            <span class="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              ⚠️ Defaulter (<75%)
                            </span>
                          } @else {
                            <span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                              Good Standing
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }

      <!-- TAB 4: ENROLLMENT & DEMOGRAPHICS -->
      @if (activeTab === 'enrollment') {
        @if (enrollment) {
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Total Students</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">{{ enrollment.totalStudents }}</div>
              </div>
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Active Classes</span>
                <div class="text-2xl font-extrabold text-indigo-600 mt-1">{{ enrollment.totalClasses }}</div>
              </div>
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Class Sections</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">{{ enrollment.totalSections }}</div>
              </div>
              <div class="card">
                <span class="text-xs font-bold text-slate-500 uppercase">Classroom Occupancy</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-1">{{ enrollment.overallOccupancyRate }}%</div>
              </div>
            </div>

            <div class="card">
              <h2 class="card-title mb-4">Detailed Section Roster & Capacity Metrics</h2>
              <div class="table-responsive">
                <table class="data-table text-xs">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Section</th>
                      <th>Capacity</th>
                      <th>Total Enrolled</th>
                      <th>Boys (Male)</th>
                      <th>Girls (Female)</th>
                      <th>Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of enrollment.classStats; track row.classSectionId) {
                      <tr>
                        <td class="font-bold text-slate-900">{{ row.className }}</td>
                        <td class="font-semibold text-indigo-700">Section {{ row.sectionName }}</td>
                        <td>{{ row.capacity }} seats</td>
                        <td class="font-bold">{{ row.totalEnrolled }}</td>
                        <td>{{ row.maleCount }}</td>
                        <td>{{ row.femaleCount }}</td>
                        <td>
                          <span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {{ row.occupancyRate }}%
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }

      <!-- MODAL: PRINTABLE OFFICIAL FEE RECEIPT -->
      @if (showReceiptModal && selectedReceipt) {
        <div class="modal-overlay">
          <div class="modal-content max-w-xl bg-white text-slate-900 p-8 border border-slate-300 shadow-2xl rounded-2xl">
            <!-- Official Header -->
            <div class="text-center pb-4 border-b-2 border-slate-800 mb-6">
              <h2 class="text-xl font-extrabold uppercase tracking-wider text-slate-900">EduManage International Academy</h2>
              <p class="text-xs text-slate-500">Official Institutional Fee Receipt</p>
            </div>

            <!-- Receipt Meta -->
            <div class="grid grid-cols-2 text-xs mb-6 gap-2">
              <div>
                <span class="text-slate-500 block">Receipt Number:</span>
                <span class="font-mono font-bold text-slate-900 text-sm">{{ selectedReceipt.receiptNumber }}</span>
              </div>
              <div class="text-right">
                <span class="text-slate-500 block">Date of Payment:</span>
                <span class="font-bold text-slate-900">{{ formatDate(selectedReceipt.paymentDateUtc) }}</span>
              </div>
            </div>

            <!-- Student Meta Box -->
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs mb-6 grid grid-cols-2 gap-3">
              <div>
                <span class="text-slate-500 block text-[11px]">Student Full Name:</span>
                <span class="font-bold text-slate-900 text-sm">{{ selectedReceipt.studentName }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Admission Number:</span>
                <span class="font-bold text-slate-900">{{ selectedReceipt.admissionNumber }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Payment Method:</span>
                <span class="font-semibold text-slate-800">{{ selectedReceipt.method }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[11px]">Invoice Reference:</span>
                <span class="font-mono text-slate-800">{{ selectedReceipt.invoiceNumber || 'Tuition Dues' }}</span>
              </div>
            </div>

            <!-- Payment Total -->
            <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center mb-8">
              <div>
                <span class="text-xs text-emerald-800 font-bold uppercase">Total Amount Received</span>
                <div class="text-xs text-emerald-700">Status: Completed (Payment Verified)</div>
              </div>
              <div class="text-2xl font-black text-emerald-700">
                ₹{{ selectedReceipt.amount | number }}
              </div>
            </div>

            <!-- Footer Signatures -->
            <div class="flex justify-between items-end text-xs text-slate-500 pt-6 border-t border-slate-200">
              <div>
                <span>Cashier / Verified By:</span>
                <div class="font-bold text-slate-800 mt-1">{{ selectedReceipt.collectedBy || 'Accounts Officer' }}</div>
              </div>
              <div class="text-right">
                <div class="w-32 border-b border-slate-400 mb-1"></div>
                <span>Authorized Signatory</span>
              </div>
            </div>

            <!-- Modal Action Buttons (Hidden on Print) -->
            <div class="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
              <button (click)="showReceiptModal = false" class="btn btn-outline btn-sm">Close</button>
              <button (click)="printReceipt()" class="btn btn-primary btn-sm">🖨 Print Receipt</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
  activeTab: 'executive' | 'financial' | 'attendance' | 'enrollment' = 'executive';
  loading = false;

  executive: ExecutiveSummaryReport | null = null;
  financials: FinancialCollectionReport | null = null;
  attendance: AttendanceAnalyticsReport | null = null;
  enrollment: EnrollmentDemographicsReport | null = null;

  showReceiptModal = false;
  selectedReceipt: PaymentReceipt | null = null;

  constructor(
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAllReports();
  }

  loadAllReports(): void {
    this.loading = true;
    this.api.getExecutiveReport().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          this.executive = res.data;
          this.financials = res.data.financials;
          this.attendance = res.data.attendance;
          this.enrollment = res.data.enrollment;
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openReceiptModal(receipt: PaymentReceipt): void {
    this.selectedReceipt = receipt;
    this.showReceiptModal = true;
  }

  printReport(): void {
    window.print();
  }

  printReceipt(): void {
    window.print();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
