import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-platform-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Platform SaaS Provider Admin</h1>
          <p class="text-sm text-slate-500">Global SaaS telemetry, recurring revenue (MRR/ARR), and tenant provisioning</p>
        </div>
      </div>

      <!-- SaaS Health KPIs -->
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-label">Total Registered Tenants</span>
          <span class="stat-value">{{ data?.totalTenants || 0 }}</span>
          <span class="text-xs text-slate-500">{{ data?.activeTenants || 0 }} active institutions</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Total Student Seats Across SaaS</span>
          <span class="stat-value text-indigo-600">{{ data?.totalPlatformStudents || 0 }}</span>
          <span class="text-xs text-slate-500">Platform-wide active population</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Monthly Recurring Revenue (MRR)</span>
          <span class="stat-value text-emerald-600">₹{{ data?.monthlyRecurringRevenue?.toLocaleString() || 0 }}</span>
          <span class="text-xs text-emerald-600 font-medium">Billed platform subscriptions</span>
        </div>

        <div class="stat-card">
          <span class="stat-label">Annual Recurring Revenue (ARR)</span>
          <span class="stat-value text-emerald-600">₹{{ data?.annualRecurringRevenue?.toLocaleString() || 0 }}</span>
          <span class="text-xs text-slate-500">Annualized SaaS projection</span>
        </div>
      </div>

      <!-- Recent Subscriptions Table -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Tenant Subscriptions</h2>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tenant Organization</th>
                <th>Plan Tier</th>
                <th>Status</th>
                <th>Next Billing Date</th>
              </tr>
            </thead>
            <tbody>
              @for (sub of data?.recentSubscriptions; track sub.tenantId) {
                <tr>
                  <td class="font-bold text-slate-900">{{ sub.tenantName }}</td>
                  <td>
                    <span class="badge badge-info">{{ sub.planName }}</span>
                  </td>
                  <td>
                    <span class="badge badge-success">{{ sub.status }}</span>
                  </td>
                  <td>{{ sub.expiryDateUtc | date:'mediumDate' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-6 { margin-bottom: 1.5rem; }
    .text-emerald-600 { color: #059669; }
    .text-indigo-600 { color: #4f46e5; }
  `]
})
export class PlatformAdminComponent implements OnInit {
  data: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getPlatformAdminDashboard().subscribe(res => {
      if (res.success && res.data) this.data = res.data;
    });
  }
}
