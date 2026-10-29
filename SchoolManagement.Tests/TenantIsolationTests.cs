using Microsoft.EntityFrameworkCore;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;
using Xunit;

namespace SchoolManagement.Tests;

public class TenantIsolationTests
{
    [Fact]
    public async Task QueryFilters_ShouldIsolateStudentData_BetweenDifferentTenants()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        // 1. Seed data for both tenants using admin context
        var (seedContext, _) = TestDbContextFactory.Create(dbName);

        await seedContext.Students.AddRangeAsync(
            new Student
            {
                TenantId = tenantA,
                AdmissionNumber = "STU-A-01",
                FirstName = "Alice",
                LastName = "TenantA"
            },
            new Student
            {
                TenantId = tenantB,
                AdmissionNumber = "STU-B-01",
                FirstName = "Bob",
                LastName = "TenantB"
            }
        );
        await seedContext.SaveChangesAsync();

        // 2. Query as Tenant A
        var (contextA, _) = TestDbContextFactory.Create(dbName, tenantId: tenantA);
        var studentsA = await contextA.Students.ToListAsync();

        Assert.Single(studentsA);
        Assert.Equal("Alice", studentsA[0].FirstName);
        Assert.Equal(tenantA, studentsA[0].TenantId);

        // 3. Query as Tenant B
        var (contextB, _) = TestDbContextFactory.Create(dbName, tenantId: tenantB);
        var studentsB = await contextB.Students.ToListAsync();

        Assert.Single(studentsB);
        Assert.Equal("Bob", studentsB[0].FirstName);
        Assert.Equal(tenantB, studentsB[0].TenantId);
    }

    [Fact]
    public async Task QueryFilters_ShouldIsolateFinancialInvoices_BetweenTenants()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        var (seedContext, _) = TestDbContextFactory.Create(dbName);

        var stuA = new Student { TenantId = tenantA, AdmissionNumber = "STU-A-FIN", FirstName = "AliceFin", LastName = "TenantA" };
        var stuB = new Student { TenantId = tenantB, AdmissionNumber = "STU-B-FIN", FirstName = "BobFin", LastName = "TenantB" };
        await seedContext.Students.AddRangeAsync(stuA, stuB);

        var invA = new StudentInvoice
        {
            TenantId = tenantA,
            Student = stuA,
            InvoiceNumber = "INV-A-1001",
            TotalAmount = 25000m,
            PaidAmount = 0m,
            Status = InvoiceStatus.Issued,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30)
        };
        var invB = new StudentInvoice
        {
            TenantId = tenantB,
            Student = stuB,
            InvoiceNumber = "INV-B-2001",
            TotalAmount = 45000m,
            PaidAmount = 0m,
            Status = InvoiceStatus.Issued,
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30)
        };
        await seedContext.StudentInvoices.AddRangeAsync(invA, invB);
        await seedContext.SaveChangesAsync();

        // Tenant A must only see its own invoice
        var (contextA, _) = TestDbContextFactory.Create(dbName, tenantId: tenantA);
        var invoicesA = await contextA.StudentInvoices.ToListAsync();
        Assert.Single(invoicesA);
        Assert.Equal("INV-A-1001", invoicesA[0].InvoiceNumber);
        Assert.Equal(25000m, invoicesA[0].TotalAmount);
        Assert.Equal(25000m, invoicesA[0].BalanceAmount);

        // Tenant B must only see its own invoice
        var (contextB, _) = TestDbContextFactory.Create(dbName, tenantId: tenantB);
        var invoicesB = await contextB.StudentInvoices.ToListAsync();
        Assert.Single(invoicesB);
        Assert.Equal("INV-B-2001", invoicesB[0].InvoiceNumber);
        Assert.Equal(45000m, invoicesB[0].TotalAmount);
        Assert.Equal(45000m, invoicesB[0].BalanceAmount);
    }

    [Fact]
    public async Task QueryFilters_ShouldIsolateAssignments_BetweenTenants()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        var (seedContext, _) = TestDbContextFactory.Create(dbName);

        var yearA = new AcademicYear { TenantId = tenantA, Name = "2026-A", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        var yearB = new AcademicYear { TenantId = tenantB, Name = "2026-B", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1) };
        var subA = new Subject { TenantId = tenantA, Name = "Math A", Code = "M-A" };
        var subB = new Subject { TenantId = tenantB, Name = "Math B", Code = "M-B" };
        var classA = new Class { TenantId = tenantA, Name = "Gr 10 A", AcademicYear = yearA };
        var classB = new Class { TenantId = tenantB, Name = "Gr 10 B", AcademicYear = yearB };
        var secA = new ClassSection { TenantId = tenantA, Class = classA, Name = "A" };
        var secB = new ClassSection { TenantId = tenantB, Class = classB, Name = "B" };
        var offA = new CourseOffering { TenantId = tenantA, AcademicYear = yearA, Subject = subA, ClassSection = secA };
        var offB = new CourseOffering { TenantId = tenantB, AcademicYear = yearB, Subject = subB, ClassSection = secB };

        await seedContext.CourseOfferings.AddRangeAsync(offA, offB);

        var assignA = new Assignment { TenantId = tenantA, CourseOffering = offA, Title = "Algebra HW A", MaxPoints = 100m, DueDateUtc = DateTime.UtcNow.AddDays(5) };
        var assignB = new Assignment { TenantId = tenantB, CourseOffering = offB, Title = "Geometry HW B", MaxPoints = 100m, DueDateUtc = DateTime.UtcNow.AddDays(5) };

        await seedContext.Assignments.AddRangeAsync(assignA, assignB);
        await seedContext.SaveChangesAsync();

        // Tenant A must not see assignB
        var (contextA, _) = TestDbContextFactory.Create(dbName, tenantId: tenantA);
        var assignmentsA = await contextA.Assignments.ToListAsync();
        Assert.Single(assignmentsA);
        Assert.Equal("Algebra HW A", assignmentsA[0].Title);

        // Tenant B must not see assignA
        var (contextB, _) = TestDbContextFactory.Create(dbName, tenantId: tenantB);
        var assignmentsB = await contextB.Assignments.ToListAsync();
        Assert.Single(assignmentsB);
        Assert.Equal("Geometry HW B", assignmentsB[0].Title);
    }

    [Fact]
    public async Task PlatformAdmin_ShouldHaveCrossTenantVisibility()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        var (seedContext, _) = TestDbContextFactory.Create(dbName);
        await seedContext.Students.AddRangeAsync(
            new Student { TenantId = tenantA, AdmissionNumber = "STU-ADM-A", FirstName = "AliceCross" },
            new Student { TenantId = tenantB, AdmissionNumber = "STU-ADM-B", FirstName = "BobCross" }
        );
        await seedContext.SaveChangesAsync();

        // Create PlatformAdmin context with IsPlatformAdmin = true
        var (adminContext, _) = TestDbContextFactory.Create(dbName, isPlatformAdmin: true);
        var allStudents = await adminContext.Students.ToListAsync();

        // Superadmin must see both tenants' records
        Assert.Equal(2, allStudents.Count);
        Assert.Contains(allStudents, s => s.TenantId == tenantA);
        Assert.Contains(allStudents, s => s.TenantId == tenantB);
    }

    [Fact]
    public async Task SoftDeletedRecords_ShouldBeHidden_FromStandardTenantQueries()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();

        var (seedContext, _) = TestDbContextFactory.Create(dbName, tenantId: tenantId);
        var studentActive = new Student { TenantId = tenantId, AdmissionNumber = "STU-ACT", FirstName = "ActiveStudent", IsDeleted = false };
        var studentDeleted = new Student { TenantId = tenantId, AdmissionNumber = "STU-DEL", FirstName = "DeletedStudent", IsDeleted = true };
        await seedContext.Students.AddRangeAsync(studentActive, studentDeleted);
        await seedContext.SaveChangesAsync();

        // Standard tenant query should only return active record
        var (context, _) = TestDbContextFactory.Create(dbName, tenantId: tenantId);
        var visibleStudents = await context.Students.ToListAsync();

        Assert.Single(visibleStudents);
        Assert.Equal("ActiveStudent", visibleStudents[0].FirstName);

        // IgnoreQueryFilters should still uncover the soft-deleted record for historical audit
        var allRecordsIncludingDeleted = await context.Students.IgnoreQueryFilters().Where(s => s.TenantId == tenantId).ToListAsync();
        Assert.Equal(2, allRecordsIncludingDeleted.Count);
    }
}
