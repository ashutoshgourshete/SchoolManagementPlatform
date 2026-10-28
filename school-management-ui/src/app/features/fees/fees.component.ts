import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FeeStructure, StudentInvoice, PaymentReceipt, OutstandingBalance, PagedResult } from '../../core/models/models';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Institution Fees & Invoicing</h1>
          <p class="text-sm text-slate-500">Manage fee schedules, batch recurring billing, and manual & digital collections</p>
        </div>
        <div class="flex gap-3">
          <button (click)="openGenerateModal()" class="btn btn-outline">
            ⚡ Generate Batch Invoices
          </button>
          <button (click)="openPaymentModal()" class="btn btn-primary">
            + Collect Fee / Record Payment
          </button>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar mb-6">
        <button [class.active]="activeTab === 'invoices'" (click)="activeTab = 'invoices'" class="tab-btn">
          Issued Invoices
        </button>
        <button [class.active]="activeTab === 'outstanding'" (click)="activeTab = 'outstanding'" class="tab-btn">
          Pending & Outstanding Balances
        </button>
        <button [class.active]="activeTab === 'structures'" (click)="activeTab = 'structures'" class="tab-btn">
          Fee Structures & Schedules
        </button>
      </div>

      <!-- TAB 1: Invoices List -->
      @if (activeTab === 'invoices') {
        <div class="card">
          @if (loadingInvoices) {
            <div class="text-center py-8 text-slate-500">Loading invoices...</div>
          } @else if (invoicesResult?.items?.length === 0) {
            <div class="text-center py-8 text-slate-500">No invoices generated yet. Click "Generate Batch Invoices" above.</div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
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
                    <th>Action</th>
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
                      <td>
                        @if (inv.balanceAmount > 0) {
                          <button (click)="openPaymentModal(inv)" class="btn btn-primary btn-sm">
                            Collect
                          </button>
                        } @else {
                          <span class="text-xs text-emerald-600 font-semibold">✓ Settled</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- TAB 2: Outstanding Balances -->
      @if (activeTab === 'outstanding') {
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Student Outstanding Balances Aging</h2>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>Total Billed</th>
                  <th>Total Paid</th>
                  <th>Outstanding Balance</th>
                  <th>Overdue Bills</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                @for (item of outstandingReport; track item.studentId) {
                  <tr>
                    <td class="font-mono text-xs">{{ item.admissionNumber }}</td>
                    <td class="font-medium">{{ item.studentName }}</td>
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
                    <td>
                      <button (click)="openPaymentModalForStudent(item)" class="btn btn-outline btn-sm">
                        Record Payment
                      </button>
                    </td>
                  </tr>
                }
                @if (outstandingReport.length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-6 text-slate-500">No outstanding dues! All student fees are up-to-date.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 3: Fee Structures -->
      @if (activeTab === 'structures') {
        <div class="grid grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Configured Fee Schedules</h2>
            </div>
            <div class="flex flex-col gap-4">
              @for (struct of feeStructures; track struct.id) {
                <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">{{ struct.name }}</span>
                    <span class="text-base font-bold text-primary">₹{{ struct.totalAmount.toLocaleString() }}</span>
                  </div>
                  <div class="text-xs text-slate-500 mt-1">Cycle: {{ getCycleLabel(struct.billingCycle) }}</div>

                  <div class="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-1">
                    @for (item of struct.items; track item.id) {
                      <div class="flex justify-between text-xs text-slate-600">
                        <span>• {{ item.name }}</span>
                        <span>₹{{ item.amount.toLocaleString() }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Add Fee Structure Form -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">+ New Fee Structure</h2>
            </div>
            <form (ngSubmit)="createStructure()">
              <div class="form-group">
                <label class="form-label">Structure Name *</label>
                <input type="text" class="form-control" placeholder="e.g. Grade 10 Standard Annual Fee" [(ngModel)]="newStructure.name" name="sName" required>
              </div>

              <div class="form-group">
                <label class="form-label">Billing Cycle</label>
                <select class="form-control" [(ngModel)]="newStructure.billingCycle" name="sCycle">
                  <option [value]="1">Monthly</option>
                  <option [value]="2">Quarterly</option>
                  <option [value]="3">Semi-Annual</option>
                  <option [value]="4">Annual</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Tuition Fee Component (₹) *</label>
                <input type="number" class="form-control" [(ngModel)]="newStructure.tuition" name="tuition" required>
              </div>

              <div class="form-group">
                <label class="form-label">Laboratory & Library Component (₹)</label>
                <input type="number" class="form-control" [(ngModel)]="newStructure.lab" name="lab">
              </div>

              <button type="submit" class="btn btn-primary w-full mt-4">Save Fee Structure</button>
            </form>
          </div>
        </div>
      }

      <!-- Generate Invoices Modal -->
      @if (showGenerateModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="card-header">
              <h2 class="card-title">Generate Batch Invoices</h2>
              <button (click)="showGenerateModal = false" class="btn btn-outline btn-sm">✕</button>
            </div>

            <p class="text-sm text-slate-600 mb-4">
              This will generate term invoices for all enrolled students based on their assigned fee structure and scholarship discounts.
            </p>

            <form (ngSubmit)="submitGenerateInvoices()">
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
                  {{ generating ? 'Generating Invoices...' : 'Generate Invoices' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Collect Payment Modal -->
      @if (showPaymentModal) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="card-header">
              <h2 class="card-title">Collect Fee / Record Payment</h2>
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
                  <option [value]="4">Card POS</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Transaction / Cheque Reference</label>
                <input type="text" class="form-control" placeholder="e.g. UTR / Ref Number" [(ngModel)]="paymentData.gatewayTransactionId" name="ref">
              </div>

              <div class="form-group">
                <label class="form-label">Internal Receipt Notes</label>
                <input type="text" class="form-control" placeholder="e.g. Paid in full by father" [(ngModel)]="paymentData.notes" name="notes">
              </div>

              <div class="flex justify-between items-center mt-6">
                <button type="button" (click)="showPaymentModal = false" class="btn btn-outline">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="recordingPayment">
                  {{ recordingPayment ? 'Recording...' : 'Record Payment & Issue Receipt' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Payment Receipt Modal -->
      @if (receiptModal) {
        <div class="modal-overlay">
          <div class="modal-content p-8">
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
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .pb-4 { padding-bottom: 1rem; }
    .pt-3 { padding-top: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-8 { padding: 2rem; }
    .gap-1 { gap: 0.25rem; }
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
    .text-center { text-align: center; }
    .tab-bar { display: flex; border-bottom: 2px solid var(--slate-200); gap: 1rem; }
    .tab-btn { padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 600; color: var(--slate-600); background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .font-mono { font-family: monospace; }
  `]
})
export class FeesComponent implements OnInit {
  activeTab: 'invoices' | 'outstanding' | 'structures' = 'invoices';

  invoicesResult: PagedResult<StudentInvoice> | null = null;
  outstandingReport: OutstandingBalance[] = [];
  feeStructures: FeeStructure[] = [];

  loadingInvoices = true;
  showGenerateModal = false;
  generating = false;

  showPaymentModal = false;
  recordingPayment = false;
  paymentError = '';
  receiptModal: PaymentReceipt | null = null;

  generateParams: any = {
    issueDate: new Date().toISOString().substring(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().substring(0, 10),
    remarks: 'Term Tuition and Laboratory Fee'
  };

  paymentData: any = {
    studentId: '',
    studentInvoiceId: null,
    amount: 0,
    method: 1,
    gatewayTransactionId: '',
    notes: ''
  };

  newStructure: any = {
    name: '',
    billingCycle: 2,
    tuition: 6000,
    lab: 2000
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.api.getOutstandingBalances().subscribe(res => {
      if (res.success && res.data) this.outstandingReport = res.data;
    });
    this.api.getFeeStructures().subscribe(res => {
      if (res.success && res.data) this.feeStructures = res.data;
    });
  }

  loadInvoices(): void {
    this.loadingInvoices = true;
    this.api.getInvoices(1, 20).subscribe({
      next: (res) => {
        if (res.success && res.data) this.invoicesResult = res.data;
        this.loadingInvoices = false;
      },
      error: () => {
        this.loadingInvoices = false;
      }
    });
  }

  openGenerateModal(): void {
    this.showGenerateModal = true;
  }

  submitGenerateInvoices(): void {
    this.generating = true;
    this.api.generateInvoices(this.generateParams).subscribe({
      next: (res) => {
        this.generating = false;
        if (res.success) {
          this.showGenerateModal = false;
          this.loadInvoices();
          this.api.getOutstandingBalances().subscribe(r => {
            if (r.success && r.data) this.outstandingReport = r.data;
          });
        }
      },
      error: () => {
        this.generating = false;
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
          this.loadInvoices();
          this.api.getOutstandingBalances().subscribe(r => {
            if (r.success && r.data) this.outstandingReport = r.data;
          });
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

  createStructure(): void {
    this.api.getAcademicYears().subscribe(yrRes => {
      const yrId = yrRes.data?.find(y => y.isCurrent)?.id || yrRes.data?.[0]?.id;
      if (!yrId) return;

      const payload = {
        academicYearId: yrId,
        name: this.newStructure.name,
        billingCycle: Number(this.newStructure.billingCycle),
        items: [
          { name: 'Tuition Fee', amount: this.newStructure.tuition },
          { name: 'Lab & Activity Fee', amount: this.newStructure.lab }
        ]
      };

      this.api.createFeeStructure(payload).subscribe(res => {
        if (res.success) {
          this.api.getFeeStructures().subscribe(sRes => {
            if (sRes.success && sRes.data) this.feeStructures = sRes.data;
          });
        }
      });
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
}
