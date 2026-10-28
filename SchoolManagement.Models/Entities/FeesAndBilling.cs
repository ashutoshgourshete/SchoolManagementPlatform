using SchoolManagement.Models.Common;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.Entities;

public class FeeStructure : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid? ClassId { get; set; }
    public Class? Class { get; set; }

    public Guid? ProgramId { get; set; }
    public Program? Program { get; set; }

    public string Name { get; set; } = string.Empty; // e.g. "Grade 10 General Fee", "B.Tech Sem 1 Fee"
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
    public decimal TotalAmount { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<FeeStructureItem> Items { get; set; } = new List<FeeStructureItem>();
    public ICollection<StudentFeeAssignment> Assignments { get; set; } = new List<StudentFeeAssignment>();
}

public class FeeStructureItem : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid FeeStructureId { get; set; }
    public FeeStructure FeeStructure { get; set; } = null!;

    public string Name { get; set; } = string.Empty; // Tuition, Lab, Library, Sports, Exam, Transport
    public decimal Amount { get; set; }
    public bool IsOptional { get; set; } = false;
}

public class StudentFeeAssignment : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid FeeStructureId { get; set; }
    public FeeStructure FeeStructure { get; set; } = null!;

    public decimal DiscountPercentage { get; set; } = 0m;
    public decimal DiscountAmount { get; set; } = 0m;
    public string? DiscountReason { get; set; }
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
}

public class StudentInvoice : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public string InvoiceNumber { get; set; } = string.Empty; // e.g. INV-2026-0001
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount => Math.Max(0, TotalAmount - PaidAmount);
    public string CurrencyCode { get; set; } = "INR";
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Issued;
    public string? Remarks { get; set; }

    public ICollection<InvoiceLine> Lines { get; set; } = new List<InvoiceLine>();
    public ICollection<PaymentAllocation> Allocations { get; set; } = new List<PaymentAllocation>();
}

public class InvoiceLine : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentInvoiceId { get; set; }
    public StudentInvoice StudentInvoice { get; set; } = null!;

    public string Description { get; set; } = string.Empty;
    public decimal UnitAmount { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal TotalAmount { get; set; }
}

public class Payment : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid? StudentInvoiceId { get; set; }
    public StudentInvoice? StudentInvoice { get; set; }

    public string ReceiptNumber { get; set; } = string.Empty; // e.g. RCT-2026-0001
    public DateTime PaymentDateUtc { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public PaymentStatus Status { get; set; } = PaymentStatus.Completed;
    public string CurrencyCode { get; set; } = "INR";

    public string? GatewayName { get; set; } // "Stripe", "Razorpay", "Manual"
    public string? GatewayTransactionId { get; set; }
    public string? GatewayOrderId { get; set; }
    public string? Notes { get; set; }
    public Guid? CollectedByUserId { get; set; }

    public ICollection<PaymentAllocation> Allocations { get; set; } = new List<PaymentAllocation>();
    public ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}

public class PaymentAllocation : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;

    public Guid StudentInvoiceId { get; set; }
    public StudentInvoice StudentInvoice { get; set; } = null!;

    public decimal Amount { get; set; }
}

public class Refund : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;

    public string RefundNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public DateTime ProcessedAtUtc { get; set; } = DateTime.UtcNow;
    public string? GatewayRefundId { get; set; }
}

public class PaymentWebhookEvent : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public string ProviderName { get; set; } = string.Empty; // "Razorpay", "Stripe"
    public string EventId { get; set; } = string.Empty; // Provider event id for deduplication
    public string EventType { get; set; } = string.Empty;
    public string RawPayload { get; set; } = string.Empty;
    public DateTime ReceivedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAtUtc { get; set; }
    public bool IsSuccess { get; set; } = false;
    public string? ErrorMessage { get; set; }
}
