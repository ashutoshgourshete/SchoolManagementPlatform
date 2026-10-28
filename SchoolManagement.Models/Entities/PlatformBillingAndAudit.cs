using SchoolManagement.Models.Common;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.Entities;

public class PlatformPlan : BaseEntity
{
    public string Name { get; set; } = string.Empty; // Starter, Standard, Enterprise
    public string Code { get; set; } = string.Empty;
    public SubscriptionPlanTier Tier { get; set; } = SubscriptionPlanTier.Starter;
    public string? Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal AnnualPrice { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public int MaxStudents { get; set; } = 500;
    public int MaxInstitutions { get; set; } = 1;
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<TenantSubscription> Subscriptions { get; set; } = new List<TenantSubscription>();
}

public class TenantSubscription : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid PlatformPlanId { get; set; }
    public PlatformPlan PlatformPlan { get; set; } = null!;

    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
    public string Status { get; set; } = "Active"; // Active, PastDue, Canceled, Trialing
    public DateTime StartDateUtc { get; set; } = DateTime.UtcNow;
    public DateTime CurrentPeriodEndUtc { get; set; } = DateTime.UtcNow.AddMonths(1);
    public bool CancelAtPeriodEnd { get; set; } = false;

    public string? ExternalSubscriptionId { get; set; }
    public string? ExternalCustomerId { get; set; }

    public ICollection<PlatformInvoice> Invoices { get; set; } = new List<PlatformInvoice>();
}

public class PlatformInvoice : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid TenantSubscriptionId { get; set; }
    public TenantSubscription TenantSubscription { get; set; } = null!;

    public string InvoiceNumber { get; set; } = string.Empty; // e.g. PLT-2026-0001
    public decimal TotalAmount { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Issued;
    public DateTime DueDateUtc { get; set; }
    public DateTime? PaidAtUtc { get; set; }

    public ICollection<PlatformPayment> Payments { get; set; } = new List<PlatformPayment>();
}

public class PlatformPayment : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid PlatformInvoiceId { get; set; }
    public PlatformInvoice PlatformInvoice { get; set; } = null!;

    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public PaymentMethod Method { get; set; } = PaymentMethod.BankTransfer;
    public PaymentStatus Status { get; set; } = PaymentStatus.Completed;
    public string? TransactionId { get; set; }
    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
}

public class AuditLog : BaseEntity
{
    public Guid? TenantId { get; set; }
    public Guid? InstitutionId { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Action { get; set; } = string.Empty; // Create, Update, Delete, Login, Payment
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}

public class NotificationLog : BaseEntity
{
    public Guid? TenantId { get; set; }
    public Guid? InstitutionId { get; set; }
    public string Recipient { get; set; } = string.Empty;
    public string Channel { get; set; } = "Email"; // Email, SMS, Webhook
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Sent"; // Sent, Failed
    public string? ErrorMessage { get; set; }
    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
}

public class SystemSetting : BaseEntity
{
    public Guid? TenantId { get; set; }
    public Guid? InstitutionId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Category { get; set; } = "General"; // General, Billing, Email, PaymentGateway
}
