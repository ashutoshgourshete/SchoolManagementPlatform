using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.DTOs;

public class FeeStructureDto
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public Guid? ClassId { get; set; }
    public string? ClassName { get; set; }
    public Guid? ProgramId { get; set; }
    public string? ProgramName { get; set; }
    public string Name { get; set; } = string.Empty;
    public BillingCycle BillingCycle { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsActive { get; set; }
    public List<FeeStructureItemDto> Items { get; set; } = new();
}

public class FeeStructureItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsOptional { get; set; }
}

public class CreateFeeStructureDto
{
    public Guid AcademicYearId { get; set; }
    public Guid? ClassId { get; set; }
    public Guid? ProgramId { get; set; }
    public string Name { get; set; } = string.Empty;
    public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
    public List<CreateFeeStructureItemDto> Items { get; set; } = new();
}

public class CreateFeeStructureItemDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsOptional { get; set; } = false;
}

public class StudentFeeAssignmentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public Guid FeeStructureId { get; set; }
    public string FeeStructureName { get; set; } = string.Empty;
    public decimal TotalStructureAmount { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? DiscountReason { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
}

public class AssignFeeDto
{
    public Guid StudentId { get; set; }
    public Guid FeeStructureId { get; set; }
    public decimal DiscountPercentage { get; set; } = 0m;
    public decimal DiscountAmount { get; set; } = 0m;
    public string? DiscountReason { get; set; }
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
    public DateTime? EffectiveTo { get; set; }
}

public class StudentInvoiceDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public InvoiceStatus Status { get; set; }
    public string? Remarks { get; set; }
    public List<InvoiceLineDto> Lines { get; set; } = new();
}

public class InvoiceLineDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal UnitAmount { get; set; }
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
}

public class GenerateInvoiceDto
{
    public Guid? ClassSectionId { get; set; } // If null, can be specific student
    public Guid? StudentId { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(15);
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public string? Remarks { get; set; }
}

public class RecordPaymentDto
{
    public Guid StudentId { get; set; }
    public Guid? StudentInvoiceId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Cash;
    public string? GatewayTransactionId { get; set; }
    public string? Notes { get; set; }
}

public class PaymentReceiptDto
{
    public Guid PaymentId { get; set; }
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime PaymentDateUtc { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? InvoiceNumber { get; set; }
    public decimal Amount { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Notes { get; set; }
    public string? CollectedBy { get; set; }
}

public class OutstandingBalanceReportDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public decimal TotalInvoiced { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalOutstanding { get; set; }
    public int OverdueInvoiceCount { get; set; }
}

public class InitiateOnlinePaymentDto
{
    public Guid StudentInvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string GatewayProvider { get; set; } = "Razorpay"; // or "Stripe"
}

public class OnlinePaymentInitiationResultDto
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string ProviderKey { get; set; } = string.Empty;
    public string GatewayProvider { get; set; } = string.Empty;
}

public class PaymentWebhookDto
{
    public string Provider { get; set; } = string.Empty;
    public string EventId { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
}
