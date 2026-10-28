using Microsoft.EntityFrameworkCore;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;

namespace SchoolManagement.Tests;

public static class TestDbContextFactory
{
    public static (ApplicationDbContext Context, CurrentTenantService TenantService) Create(string dbName, Guid? tenantId = null, Guid? institutionId = null)
    {
        var tenantService = new CurrentTenantService
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            IsPlatformAdmin = false
        };

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new ApplicationDbContext(options, tenantService);
        return (context, tenantService);
    }
}
