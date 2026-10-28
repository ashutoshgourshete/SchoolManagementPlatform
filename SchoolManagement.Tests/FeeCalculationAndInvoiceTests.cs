using SchoolManagement.Business.Services;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;
using Xunit;

namespace SchoolManagement.Tests;

public class FeeCalculationAndInvoiceTests
{
    [Fact]
    public async Task GenerateInvoices_ShouldApplyScholarshipDiscountsCorrectly()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var institutionId = Guid.NewGuid();

        var (context, tenantService) = TestDbContextFactory.Create(dbName, tenantId, institutionId);
        var feeService = new FeeManagementService(context, tenantService);

        // 1. Create Academic Year and Student
        var academicYear = new AcademicYear
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Name = "2026-2027",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddYears(1),
            IsCurrent = true
        };
        await context.AcademicYears.AddAsync(academicYear);

        var student = new Student
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AdmissionNumber = "STU-FEE-01",
            FirstName = "Rahul",
            LastName = "Sharma",
            IsActive = true
        };
        await context.Students.AddAsync(student);

        // 2. Create Fee Structure: ₹5,000 Tuition + ₹1,000 Lab = ₹6,000
        var structureDto = new CreateFeeStructureDto
        {
            AcademicYearId = academicYear.Id,
            Name = "Grade 10 General",
            BillingCycle = BillingCycle.Monthly,
            Items = new List<CreateFeeStructureItemDto>
            {
                new() { Name = "Tuition", Amount = 5000m },
                new() { Name = "Lab", Amount = 1000m }
            }
        };
        var structureResult = await feeService.CreateFeeStructureAsync(structureDto);
        Assert.True(structureResult.Success);
        Assert.Equal(6000m, structureResult.Data!.TotalAmount);

        // 3. Assign Fee to Student with 10% discount (= ₹600 discount)
        var assignResult = await feeService.AssignFeeToStudentAsync(new AssignFeeDto
        {
            StudentId = student.Id,
            FeeStructureId = structureResult.Data.Id,
            DiscountPercentage = 10m,
            DiscountReason = "Merit Scholarship"
        });
        Assert.True(assignResult.Success);

        // 4. Generate Invoice
        var generateResult = await feeService.GenerateInvoicesAsync(new GenerateInvoiceDto
        {
            StudentId = student.Id,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(15),
            PeriodStart = DateTime.UtcNow,
            PeriodEnd = DateTime.UtcNow.AddMonths(1)
        });

        Assert.True(generateResult.Success);
        Assert.Single(generateResult.Data!);

        var generatedInvoice = generateResult.Data![0];
        Assert.Equal(6000m, generatedInvoice.SubTotal);
        Assert.Equal(600m, generatedInvoice.DiscountAmount);
        Assert.Equal(5400m, generatedInvoice.TotalAmount); // 6000 - 600 = 5400
        Assert.Equal(5400m, generatedInvoice.BalanceAmount);
        Assert.Equal(InvoiceStatus.Issued, generatedInvoice.Status);
    }
}
