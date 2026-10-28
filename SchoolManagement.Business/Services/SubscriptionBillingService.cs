using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class SubscriptionBillingService : ISubscriptionBillingService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public SubscriptionBillingService(ApplicationDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<List<PlatformPlanDto>>> GetPlansAsync(CancellationToken cancellationToken = default)
    {
        var plans = await _context.PlatformPlans
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderBy(p => p.MonthlyPrice)
            .Select(p => new PlatformPlanDto
            {
                Id = p.Id,
                Name = p.Name,
                Code = p.Code,
                Tier = p.Tier,
                Description = p.Description,
                MonthlyPrice = p.MonthlyPrice,
                AnnualPrice = p.AnnualPrice,
                CurrencyCode = p.CurrencyCode,
                MaxStudents = p.MaxStudents,
                MaxInstitutions = p.MaxInstitutions,
                FeaturesJson = p.FeaturesJson,
                IsActive = p.IsActive
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<PlatformPlanDto>>.Ok(plans);
    }

    public async Task<ApiResponse<TenantSubscriptionDto>> GetCurrentSubscriptionAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentTenantService.TenantId.HasValue)
        {
            return ApiResponse<TenantSubscriptionDto>.Fail("No tenant context available.");
        }

        var tenantId = _currentTenantService.TenantId.Value;

        var sub = await _context.TenantSubscriptions
            .IgnoreQueryFilters()
            .Include(s => s.Tenant)
            .Include(s => s.PlatformPlan)
            .Where(s => s.TenantId == tenantId && !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (sub == null) return ApiResponse<TenantSubscriptionDto>.Fail("No subscription found");

        return ApiResponse<TenantSubscriptionDto>.Ok(new TenantSubscriptionDto
        {
            Id = sub.Id,
            TenantId = sub.TenantId,
            TenantName = sub.Tenant.Name,
            PlatformPlanId = sub.PlatformPlanId,
            PlanName = sub.PlatformPlan.Name,
            BillingCycle = sub.BillingCycle,
            Status = sub.Status,
            StartDateUtc = sub.StartDateUtc,
            CurrentPeriodEndUtc = sub.CurrentPeriodEndUtc,
            CancelAtPeriodEnd = sub.CancelAtPeriodEnd
        });
    }

    public async Task<ApiResponse<TenantSubscriptionDto>> SubscribeAsync(SubscribePlanDto dto, CancellationToken cancellationToken = default)
    {
        if (!_currentTenantService.TenantId.HasValue)
        {
            return ApiResponse<TenantSubscriptionDto>.Fail("No tenant context available.");
        }

        var tenantId = _currentTenantService.TenantId.Value;
        var plan = await _context.PlatformPlans.FindAsync(new object[] { dto.PlatformPlanId }, cancellationToken);
        if (plan == null) return ApiResponse<TenantSubscriptionDto>.Fail("Platform plan not found");

        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);
        if (tenant == null) return ApiResponse<TenantSubscriptionDto>.Fail("Tenant not found");

        // Deactivate previous subscriptions
        var existingSubs = await _context.TenantSubscriptions
            .IgnoreQueryFilters()
            .Where(s => s.TenantId == tenantId && !s.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var ex in existingSubs)
        {
            ex.Status = "Superseded";
        }

        var periodDuration = dto.BillingCycle == BillingCycle.Annual ? TimeSpan.FromDays(365) : TimeSpan.FromDays(30);

        var sub = new TenantSubscription
        {
            TenantId = tenantId,
            PlatformPlanId = plan.Id,
            BillingCycle = dto.BillingCycle,
            Status = "Active",
            StartDateUtc = DateTime.UtcNow,
            CurrentPeriodEndUtc = DateTime.UtcNow.Add(periodDuration)
        };

        await _context.TenantSubscriptions.AddAsync(sub, cancellationToken);

        // Generate platform invoice
        var amount = dto.BillingCycle == BillingCycle.Annual ? plan.AnnualPrice : plan.MonthlyPrice;
        var count = await _context.PlatformInvoices.CountAsync(cancellationToken) + 1;
        var invoiceNumber = $"PLT-{DateTime.UtcNow.Year}-{count:D4}";

        var invoice = new PlatformInvoice
        {
            TenantId = tenantId,
            TenantSubscription = sub,
            InvoiceNumber = invoiceNumber,
            TotalAmount = amount,
            CurrencyCode = plan.CurrencyCode,
            Status = InvoiceStatus.Paid,
            DueDateUtc = DateTime.UtcNow,
            PaidAtUtc = DateTime.UtcNow
        };

        invoice.Payments.Add(new PlatformPayment
        {
            TenantId = tenantId,
            Amount = amount,
            CurrencyCode = plan.CurrencyCode,
            Method = PaymentMethod.BankTransfer,
            Status = PaymentStatus.Completed,
            TransactionId = $"PLT_TXN_{Guid.NewGuid():N}".Substring(0, 16),
            PaidAtUtc = DateTime.UtcNow
        });

        await _context.PlatformInvoices.AddAsync(invoice, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<TenantSubscriptionDto>.Ok(new TenantSubscriptionDto
        {
            Id = sub.Id,
            TenantId = sub.TenantId,
            TenantName = tenant.Name,
            PlatformPlanId = plan.Id,
            PlanName = plan.Name,
            BillingCycle = sub.BillingCycle,
            Status = sub.Status,
            StartDateUtc = sub.StartDateUtc,
            CurrentPeriodEndUtc = sub.CurrentPeriodEndUtc,
            CancelAtPeriodEnd = sub.CancelAtPeriodEnd
        }, "Subscription updated successfully");
    }

    public async Task<ApiResponse<List<PlatformInvoiceDto>>> GetPlatformInvoicesAsync(CancellationToken cancellationToken = default)
    {
        var query = _context.PlatformInvoices
            .Include(i => i.Tenant)
            .AsQueryable();

        if (!_currentTenantService.IsPlatformAdmin && _currentTenantService.TenantId.HasValue)
        {
            query = query.Where(i => i.TenantId == _currentTenantService.TenantId.Value);
        }

        var invoices = await query
            .OrderByDescending(i => i.DueDateUtc)
            .Select(i => new PlatformInvoiceDto
            {
                Id = i.Id,
                TenantId = i.TenantId,
                TenantName = i.Tenant.Name,
                InvoiceNumber = i.InvoiceNumber,
                TotalAmount = i.TotalAmount,
                CurrencyCode = i.CurrencyCode,
                Status = i.Status,
                DueDateUtc = i.DueDateUtc,
                PaidAtUtc = i.PaidAtUtc
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<PlatformInvoiceDto>>.Ok(invoices);
    }
}
