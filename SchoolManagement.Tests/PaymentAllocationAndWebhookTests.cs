using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SchoolManagement.Business.Services;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;
using Xunit;

namespace SchoolManagement.Tests;

public class PaymentAllocationAndWebhookTests
{
    [Fact]
    public async Task RecordPayment_ShouldAllocateAcrossInvoice_AndTransitionStatus()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var institutionId = Guid.NewGuid();

        var (context, tenantService) = TestDbContextFactory.Create(dbName, tenantId, institutionId);
        var feeService = new FeeManagementService(context, tenantService);

        var student = new Student
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AdmissionNumber = "STU-PAY-01",
            FirstName = "Sneha",
            LastName = "Reddy"
        };
        await context.Students.AddAsync(student);

        var invoice = new StudentInvoice
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Student = student,
            InvoiceNumber = "INV-2026-TEST",
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(10),
            PeriodStart = DateTime.UtcNow,
            PeriodEnd = DateTime.UtcNow.AddMonths(1),
            SubTotal = 5000m,
            TotalAmount = 5000m,
            PaidAmount = 0m,
            Status = InvoiceStatus.Issued
        };
        await context.StudentInvoices.AddAsync(invoice);
        await context.SaveChangesAsync();

        // 1. Partial payment of ₹2,000
        var partPayResult = await feeService.RecordPaymentAsync(new RecordPaymentDto
        {
            StudentId = student.Id,
            StudentInvoiceId = invoice.Id,
            Amount = 2000m,
            Method = PaymentMethod.Cash
        });

        Assert.True(partPayResult.Success);
        Assert.NotNull(partPayResult.Data);

        var updatedInv = await context.StudentInvoices.FindAsync(invoice.Id);
        Assert.NotNull(updatedInv);
        Assert.Equal(2000m, updatedInv.PaidAmount);
        Assert.Equal(3000m, updatedInv.BalanceAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, updatedInv.Status);

        // 2. Remaining payment of ₹3,000
        var fullPayResult = await feeService.RecordPaymentAsync(new RecordPaymentDto
        {
            StudentId = student.Id,
            StudentInvoiceId = invoice.Id,
            Amount = 3000m,
            Method = PaymentMethod.BankTransfer
        });

        Assert.True(fullPayResult.Success);
        Assert.Equal(5000m, updatedInv.PaidAmount);
        Assert.Equal(0m, updatedInv.BalanceAmount);
        Assert.Equal(InvoiceStatus.Paid, updatedInv.Status);
    }

    [Fact]
    public async Task Webhook_ShouldBeIdempotent_AndIgnoreDuplicates()
    {
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = TestDbContextFactory.Create(dbName);

        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["PaymentGateways:AllowUnsignedWebhooksInDev"] = "true"
        }).Build();

        var gatewayService = new PaymentGatewayService(context, config, tenantService, NullLogger<PaymentGatewayService>.Instance);

        var webhookDto = new PaymentWebhookDto
        {
            Provider = "Razorpay",
            EventId = "evt_sample_unique_12345",
            EventType = "payment.captured",
            Payload = "{\"event\": \"payment.captured\"}",
            Signature = "dummy"
        };

        // First attempt: should succeed and create event record
        var result1 = await gatewayService.ProcessWebhookAsync(webhookDto);
        Assert.True(result1.Success);

        // Second attempt with same EventId: should detect duplicate and return success without error
        var result2 = await gatewayService.ProcessWebhookAsync(webhookDto);
        Assert.True(result2.Success);
        Assert.Contains("duplicate", result2.Message.ToLower());
    }
}
