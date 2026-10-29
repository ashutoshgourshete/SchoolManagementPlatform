using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Services;
using SchoolManagement.Data;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;
using Xunit;

namespace SchoolManagement.Tests;

public class EssentialReportsTests
{
    private async Task<(ApplicationDbContext Context, Guid TenantId, Guid InstitutionId, AcademicYear Year, ClassSection Section)> SetupTestDataAsync()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var institutionId = Guid.NewGuid();

        var (context, _) = TestDbContextFactory.Create(dbName, tenantId, institutionId);

        var year = new AcademicYear
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Name = "2026-2027",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddYears(1),
            IsCurrent = true
        };
        await context.AcademicYears.AddAsync(year);

        var class10 = new Class
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYear = year,
            Name = "Grade 10"
        };
        await context.Classes.AddAsync(class10);

        var section = new ClassSection
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Class = class10,
            Name = "A",
            Capacity = 50
        };
        await context.ClassSections.AddAsync(section);

        // Add 2 boys and 1 girl
        var boy1 = new Student { TenantId = tenantId, InstitutionId = institutionId, AdmissionNumber = "B-01", FirstName = "Aarav", LastName = "Kumar", Gender = Gender.Male, IsActive = true };
        var boy2 = new Student { TenantId = tenantId, InstitutionId = institutionId, AdmissionNumber = "B-02", FirstName = "Rohan", LastName = "Joshi", Gender = Gender.Male, IsActive = true };
        var girl1 = new Student { TenantId = tenantId, InstitutionId = institutionId, AdmissionNumber = "G-01", FirstName = "Diya", LastName = "Patel", Gender = Gender.Female, IsActive = true };
        await context.Students.AddRangeAsync(boy1, boy2, girl1);

        var e1 = new Enrollment { Student = boy1, ClassSection = section, AcademicYear = year, IsActive = true };
        var e2 = new Enrollment { Student = boy2, ClassSection = section, AcademicYear = year, IsActive = true };
        var e3 = new Enrollment { Student = girl1, ClassSection = section, AcademicYear = year, IsActive = true };
        await context.Enrollments.AddRangeAsync(e1, e2, e3);

        await context.SaveChangesAsync();

        return (context, tenantId, institutionId, year, section);
    }

    [Fact]
    public async Task EnrollmentDemographicsReport_ShouldComputeGenderRatioAndOccupancyAccurately()
    {
        var (context, _, _, year, _) = await SetupTestDataAsync();
        var reportsService = new ReportsService(context);

        var result = await reportsService.GetEnrollmentDemographicsReportAsync(year.Id);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(3, result.Data.TotalStudents);
        Assert.Equal(2, result.Data.TotalMale);
        Assert.Equal(1, result.Data.TotalFemale);
        Assert.Equal(1, result.Data.TotalSections);
        Assert.Equal(6.0m, result.Data.OverallOccupancyRate); // 3 out of 50 = 6.0%
    }

    [Fact]
    public async Task AttendanceAnalyticsReport_ShouldIdentifyDefaultersBelow75Percent()
    {
        var (context, tenantId, institutionId, year, section) = await SetupTestDataAsync();
        var reportsService = new ReportsService(context);

        var students = await context.Students.ToListAsync();
        var s1 = students[0]; // will have 100% attendance (4 out of 4)
        var s2 = students[1]; // will have 50% attendance (2 out of 4, defaulter)

        for (int i = 0; i < 4; i++)
        {
            var date = DateTime.UtcNow.Date.AddDays(-i);
            // S1 present every day
            await context.AttendanceRecords.AddAsync(new AttendanceRecord
            {
                TenantId = tenantId,
                InstitutionId = institutionId,
                StudentId = s1.Id,
                ClassSectionId = section.Id,
                Date = date,
                Status = AttendanceStatus.Present
            });

            // S2 present on 2 days, absent on 2 days
            await context.AttendanceRecords.AddAsync(new AttendanceRecord
            {
                TenantId = tenantId,
                InstitutionId = institutionId,
                StudentId = s2.Id,
                ClassSectionId = section.Id,
                Date = date,
                Status = i < 2 ? AttendanceStatus.Present : AttendanceStatus.Absent
            });
        }
        await context.SaveChangesAsync();

        var result = await reportsService.GetAttendanceAnalyticsReportAsync(section.Id);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(2, result.Data.TotalStudentsEvaluated);
        Assert.Equal(1, result.Data.CriticalDefaultersCount); // S2 is below 75%
        var s2Report = result.Data.Records.First(r => r.StudentId == s2.Id);
        Assert.Equal(50.0m, s2Report.AttendancePercentage);
        Assert.True(s2Report.IsCriticalDefaulter);
    }

    [Fact]
    public async Task FinancialCollectionReport_ShouldCalculateTotalInvoicedAndCollectedAccurately()
    {
        var (context, tenantId, institutionId, _, _) = await SetupTestDataAsync();
        var reportsService = new ReportsService(context);

        var student = await context.Students.FirstAsync();

        // 1. Create Invoice of 10,000 with 6,000 paid, 4,000 balance
        var invoice = new StudentInvoice
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            StudentId = student.Id,
            InvoiceNumber = "INV-REP-01",
            TotalAmount = 10000m,
            PaidAmount = 6000m,
            Status = InvoiceStatus.PartiallyPaid,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(15)
        };
        await context.StudentInvoices.AddAsync(invoice);

        // 2. Create Payment of 6,000 via OnlineUPI
        var payment = new Payment
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            StudentId = student.Id,
            StudentInvoice = invoice,
            ReceiptNumber = "RCT-REP-01",
            Amount = 6000m,
            Method = PaymentMethod.OnlineUPI,
            Status = PaymentStatus.Completed,
            PaymentDateUtc = DateTime.UtcNow
        };
        await context.Payments.AddAsync(payment);
        await context.SaveChangesAsync();

        var result = await reportsService.GetFinancialCollectionReportAsync();

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal(10000m, result.Data.TotalInvoicedAmount);
        Assert.Equal(6000m, result.Data.TotalCollectedAmount);
        Assert.Equal(4000m, result.Data.TotalOutstandingAmount);
        Assert.Equal(60.0m, result.Data.CollectionEfficiencyRate); // 6,000 / 10,000 = 60.0%
        Assert.Single(result.Data.MethodBreakdown);
        Assert.Equal("OnlineUPI", result.Data.MethodBreakdown[0].Method);
        Assert.Equal(6000m, result.Data.MethodBreakdown[0].TotalAmount);
    }
}
