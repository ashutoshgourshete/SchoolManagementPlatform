using Microsoft.EntityFrameworkCore;
using SchoolManagement.Models.Entities;
using Xunit;

namespace SchoolManagement.Tests;

public class TenantIsolationTests
{
    [Fact]
    public async Task QueryFilters_ShouldIsolateData_BetweenDifferentTenants()
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
}
