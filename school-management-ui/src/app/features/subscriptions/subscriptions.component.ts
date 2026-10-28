import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PlatformPlan, TenantSubscription } from '../../core/models/models';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">SaaS Platform Subscription</h1>
          <p class="text-sm text-slate-500">Manage tenant license, platform billing tier, and capacity limits</p>
        </div>
      </div>

      <!-- Current Subscription Banner -->
      @if (currentSub) {
        <div class="card bg-slate-900 text-white mb-8 border-none">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Current Active Plan</div>
              <div class="text-2xl font-bold">{{ currentSub.planName }}</div>
              <div class="text-sm text-slate-300 mt-1">
                Renewing on {{ currentSub.currentPeriodEndUtc | date:'mediumDate' }} • 
                {{ currentSub.billingCycle === 4 ? 'Annual Billing' : 'Monthly Billing' }}
              </div>
            </div>
            <span class="badge badge-success text-sm py-1.5 px-4 font-bold">
              {{ currentSub.status }}
            </span>
          </div>
        </div>
      }

      <div class="text-center mb-8">
        <h2 class="text-xl font-bold text-slate-900">Choose Your Institution Tier</h2>
        <p class="text-sm text-slate-500 mt-1">Scale effortlessly as your student enrollment and campus network expands</p>
      </div>

      <!-- Plan Cards Grid -->
      <div class="grid grid-cols-3 gap-6">
        @for (plan of plans; track plan.id) {
          <div class="plan-card" [class.highlight]="plan.tier === 2">
            @if (plan.tier === 2) {
              <div class="badge-popular">MOST POPULAR</div>
            }

            <div class="text-center pb-6 border-b border-slate-200">
              <h3 class="text-lg font-bold text-slate-900 mb-1">{{ plan.name }}</h3>
              <p class="text-xs text-slate-500 mb-4">{{ plan.description }}</p>
              <div class="text-3xl font-extrabold text-slate-900">
                ₹{{ plan.monthlyPrice.toLocaleString() }}
                <span class="text-sm font-medium text-slate-500">/ month</span>
              </div>
              <div class="text-xs text-emerald-600 font-semibold mt-1">
                or ₹{{ plan.annualPrice.toLocaleString() }} / year (Save 17%)
              </div>
            </div>

            <div class="py-6 flex flex-col gap-3 text-sm text-slate-700 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-emerald-500 font-bold">✓</span>
                <span>Up to <strong>{{ plan.maxStudents.toLocaleString() }}</strong> enrolled students</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-500 font-bold">✓</span>
                <span>Up to <strong>{{ plan.maxInstitutions }}</strong> campus / institutions</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-500 font-bold">✓</span>
                <span>Attendance, Exams & Report Cards</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-emerald-500 font-bold">✓</span>
                <span>Automated Fee Invoicing & Tracking</span>
              </div>
              @if (plan.tier >= 2) {
                <div class="flex items-center gap-2">
                  <span class="text-emerald-500 font-bold">✓</span>
                  <span>Online Payment Gateway & Webhooks</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-emerald-500 font-bold">✓</span>
                  <span>College Programs, Semesters & Credits</span>
                </div>
              }
              @if (plan.tier >= 3) {
                <div class="flex items-center gap-2">
                  <span class="text-emerald-500 font-bold">✓</span>
                  <span>Multi-Campus Centralised Hierarchy</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-emerald-500 font-bold">✓</span>
                  <span>Dedicated Financial Audit Trail</span>
                </div>
              }
            </div>

            <button 
              (click)="selectPlan(plan)" 
              [class]="currentSub?.platformPlanId === plan.id ? 'btn btn-outline w-full' : 'btn btn-primary w-full'"
              [disabled]="currentSub?.platformPlanId === plan.id || subscribing">
              {{ currentSub?.platformPlanId === plan.id ? 'Current Plan' : 'Select Plan' }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-1 { margin-top: 0.25rem; }
    .pb-6 { padding-bottom: 1.5rem; }
    .py-6 { padding: 1.5rem 0; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-6 { gap: 1.5rem; }
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 900px) {
      .grid-cols-3 { grid-template-columns: 1fr; }
    }
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .plan-card {
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid var(--slate-200);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .plan-card.highlight {
      border: 2px solid var(--primary);
      box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.15);
    }
    .badge-popular {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background-color: var(--primary);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }
  `]
})
export class SubscriptionsComponent implements OnInit {
  plans: PlatformPlan[] = [];
  currentSub: TenantSubscription | null = null;
  subscribing = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getPlatformPlans().subscribe(res => {
      if (res.success && res.data) this.plans = res.data;
    });

    this.api.getCurrentSubscription().subscribe(res => {
      if (res.success && res.data) this.currentSub = res.data;
    });
  }

  selectPlan(plan: PlatformPlan): void {
    if (confirm(`Confirm subscription switch to ${plan.name} at ₹${plan.monthlyPrice.toLocaleString()}/month?`)) {
      this.subscribing = true;
      this.api.subscribePlan({ platformPlanId: plan.id, billingCycle: 1 }).subscribe({
        next: (res) => {
          this.subscribing = false;
          if (res.success && res.data) {
            this.currentSub = res.data;
            alert('Subscription upgraded successfully!');
          }
        },
        error: () => {
          this.subscribing = false;
        }
      });
    }
  }
}
