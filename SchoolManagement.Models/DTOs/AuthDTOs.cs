using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.DTOs;

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRoleType Role { get; set; }
    public Guid? TenantId { get; set; }
    public string? TenantName { get; set; }
    public Guid? InstitutionId { get; set; }
    public string? InstitutionName { get; set; }
    public List<InstitutionSummaryDto> AvailableInstitutions { get; set; } = new();
}

public class InstitutionSummaryDto
{
    public Guid InstitutionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public InstitutionType Type { get; set; }
    public UserRoleType Role { get; set; }
}

public class RegisterTenantRequestDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string TenantCode { get; set; } = string.Empty;
    public string InstitutionName { get; set; } = string.Empty;
    public InstitutionType InstitutionType { get; set; } = InstitutionType.School;
    public string AdminFirstName { get; set; } = string.Empty;
    public string AdminLastName { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ContactPhone { get; set; } = string.Empty;
    public string CurrencyCode { get; set; } = "INR";
    public Guid? SelectedPlanId { get; set; }
}

public class ForgotPasswordRequestDto
{
    public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordResponseDto
{
    public string Message { get; set; } = string.Empty;
    public string? ResetToken { get; set; }
}

public class ResetPasswordRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequestDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class RefreshTokenRequestDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class UserDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public UserRoleType PrimaryRole { get; set; }
    public bool IsActive { get; set; }
}
