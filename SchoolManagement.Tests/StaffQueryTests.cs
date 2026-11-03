using Microsoft.AspNetCore.Identity;
using Moq;
using SchoolManagement.Business.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.Entities;
using Xunit;

namespace SchoolManagement.Tests;

public class StaffQueryTests
{
    private static Mock<UserManager<ApplicationUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    [Fact]
    public async Task GetStaffAsync_ShouldExecuteWithoutError()
    {
        var dbName = Guid.NewGuid().ToString();
        var (context, tenantService) = TestDbContextFactory.Create(dbName);
        var mockUserManager = CreateMockUserManager();

        var staffService = new StaffService(context, mockUserManager.Object, tenantService);

        var filter = new PaginationFilter { PageIndex = 1, PageSize = 100 };
        var result = await staffService.GetStaffAsync(filter);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
    }
}
