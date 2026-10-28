using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.DTOs;

public class PlatformPlanDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public SubscriptionPlanTier Tier { get; set; }
    public string? Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public int MaxStudents { get; set; }
    public int MaxInstitutions { get; set; }
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; }
}

public class TenantSubscriptionDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public Guid PlatformPlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public BillingCycle BillingCycle { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartDateUtc { get; set; }
    public DateTime CurrentPeriodEndUtc { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
}

public class SubscribePlanDto
{
    public Guid PlatformPlanId { get; set; }
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
}

public class PlatformInvoiceDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public InvoiceStatus Status { get; set; }
    public DateTime DueDateUtc { get; set; }
    public DateTime? PaidAtUtc { get; set; }
}

public class DashboardAnalyticsDto
{
    public int TotalStudents { get; set; }
    public int ActiveStudents { get; set; }
    public int TotalStaff { get; set; }
    public int TotalClasses { get; set; }
    public decimal TotalFeeCollectedThisMonth { get; set; }
    public decimal TotalOutstandingFees { get; set; }
    public double AverageAttendanceRate { get; set; }
    public List<MonthlyFeeCollectionDto> RecentCollections { get; set; } = new();
    public List<ClassAttendanceStatDto> ClassAttendance { get; set; } = new();
}

public class MonthlyFeeCollectionDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class ClassAttendanceStatDto
{
    public string ClassName { get; set; } = string.Empty;
    public double AttendanceRate { get; set; }
}

public class PlatformAdminDashboardDto
{
    public int TotalTenants { get; set; }
    public int ActiveTenants { get; set; }
    public int TotalInstitutions { get; set; }
    public int TotalPlatformStudents { get; set; }
    public decimal MonthlyRecurringRevenue { get; set; }
    public decimal AnnualRecurringRevenue { get; set; }
    public List<TenantSubscriptionSummaryDto> RecentSubscriptions { get; set; } = new();
}

public class TenantSubscriptionSummaryDto
{
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ExpiryDateUtc { get; set; }
}
