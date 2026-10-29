using Microsoft.AspNetCore.Identity;
using Moq;
using SchoolManagement.Business.Security;
using SchoolManagement.Business.Services;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using Xunit;

namespace SchoolManagement.Tests;

public class AuthServiceTests
{
    private static Mock<UserManager<ApplicationUser>> CreateMockUserManager()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        return new Mock<UserManager<ApplicationUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    [Fact]
    public async Task ForgotPassword_ShouldGenerateToken_WhenUserExists()
    {
        var dbName = Guid.NewGuid().ToString();
        var (context, _) = TestDbContextFactory.Create(dbName);
        var mockUserManager = CreateMockUserManager();
        var mockJwtGenerator = new Mock<IJwtTokenGenerator>();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "teacher@apexacademy.edu",
            UserName = "teacher@apexacademy.edu",
            IsActive = true
        };

        mockUserManager.Setup(m => m.FindByEmailAsync("teacher@apexacademy.edu"))
            .ReturnsAsync(testUser);

        mockUserManager.Setup(m => m.GeneratePasswordResetTokenAsync(testUser))
            .ReturnsAsync("sample-secure-reset-token-xyz");

        var authService = new AuthService(mockUserManager.Object, context, mockJwtGenerator.Object);

        var result = await authService.ForgotPasswordAsync(new ForgotPasswordRequestDto
        {
            Email = "teacher@apexacademy.edu"
        });

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("sample-secure-reset-token-xyz", result.Data.ResetToken);
        Assert.Contains("instructions", result.Data.Message);
    }

    [Fact]
    public async Task ResetPassword_ShouldSucceed_WithValidToken()
    {
        var dbName = Guid.NewGuid().ToString();
        var (context, _) = TestDbContextFactory.Create(dbName);
        var mockUserManager = CreateMockUserManager();
        var mockJwtGenerator = new Mock<IJwtTokenGenerator>();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = "teacher@apexacademy.edu",
            UserName = "teacher@apexacademy.edu",
            IsActive = true
        };

        mockUserManager.Setup(m => m.FindByEmailAsync("teacher@apexacademy.edu"))
            .ReturnsAsync(testUser);

        mockUserManager.Setup(m => m.ResetPasswordAsync(testUser, "valid-token", "NewPassword@123"))
            .ReturnsAsync(IdentityResult.Success);

        var authService = new AuthService(mockUserManager.Object, context, mockJwtGenerator.Object);

        var result = await authService.ResetPasswordAsync(new ResetPasswordRequestDto
        {
            Email = "teacher@apexacademy.edu",
            Token = "valid-token",
            NewPassword = "NewPassword@123"
        });

        Assert.True(result.Success);
        Assert.True(result.Data);
        Assert.Contains("successfully", result.Message);
    }
}
