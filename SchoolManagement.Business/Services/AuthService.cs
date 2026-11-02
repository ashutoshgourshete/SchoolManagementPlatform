using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Business.Security;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userManager = userManager;
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !user.IsActive)
        {
            return ApiResponse<LoginResponseDto>.Fail("Invalid email or password.");
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            return ApiResponse<LoginResponseDto>.Fail("Invalid email or password.");
        }

        var roles = await _userManager.GetRolesAsync(user);

        // Fetch memberships ignoring query filters for cross-tenant login resolution
        var tenantMemberships = await _context.TenantMemberships
            .IgnoreQueryFilters()
            .Include(tm => tm.Tenant)
            .Where(tm => tm.UserId == user.Id && tm.IsActive && !tm.IsDeleted)
            .ToListAsync(cancellationToken);

        var institutionMemberships = await _context.InstitutionMemberships
            .IgnoreQueryFilters()
            .Include(im => im.Institution)
            .Where(im => im.UserId == user.Id && im.IsActive && !im.IsDeleted)
            .ToListAsync(cancellationToken);

        var primaryTenant = tenantMemberships.FirstOrDefault()?.Tenant;
        var primaryInstitution = institutionMemberships.FirstOrDefault()?.Institution;

        var availableInstitutions = institutionMemberships.Select(im => new InstitutionSummaryDto
        {
            InstitutionId = im.InstitutionId,
            Name = im.Institution?.Name ?? string.Empty,
            Code = im.Institution?.Code ?? string.Empty,
            Type = im.Institution?.Type ?? InstitutionType.School,
            Role = im.Role,
            LogoUrl = im.Institution?.LogoUrl
        }).ToList();

        var primaryRole = user.PrimaryRole;
        if (roles.Contains(UserRoleType.PlatformAdmin.ToString()))
        {
            primaryRole = UserRoleType.PlatformAdmin;
        }

        var (token, expiration) = _jwtTokenGenerator.GenerateToken(
            user,
            roles,
            primaryTenant?.Id,
            primaryInstitution?.Id);

        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var response = new LoginResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = expiration,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Role = primaryRole,
            TenantId = primaryTenant?.Id,
            TenantName = primaryTenant?.Name,
            TenantLogoUrl = primaryTenant?.LogoUrl,
            InstitutionId = primaryInstitution?.Id,
            InstitutionName = primaryInstitution?.Name,
            InstitutionLogoUrl = primaryInstitution?.LogoUrl,
            AvailableInstitutions = availableInstitutions
        };

        return ApiResponse<LoginResponseDto>.Ok(response, "Login successful");
    }

    public async Task<ApiResponse<LoginResponseDto>> RegisterTenantAsync(RegisterTenantRequestDto request, CancellationToken cancellationToken = default)
    {
        // 1. Check for duplicate tenant code or admin email
        var existingTenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Code == request.TenantCode.Trim().ToUpperInvariant(), cancellationToken);

        if (existingTenant != null)
        {
            return ApiResponse<LoginResponseDto>.Fail($"Tenant code '{request.TenantCode}' is already registered.");
        }

        var existingUser = await _userManager.FindByEmailAsync(request.AdminEmail);
        if (existingUser != null)
        {
            return ApiResponse<LoginResponseDto>.Fail($"An account with email '{request.AdminEmail}' already exists.");
        }

        // 2. Create Tenant
        var tenant = new Tenant
        {
            Name = request.OrganizationName,
            Code = request.TenantCode.Trim().ToUpperInvariant(),
            LogoUrl = request.LogoUrl,
            ContactEmail = request.AdminEmail,
            ContactPhone = request.ContactPhone,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "INR" : request.CurrencyCode,
            Status = TenantStatus.Active,
            IsTrial = true,
            TrialEndsAtUtc = DateTime.UtcNow.AddDays(30)
        };
        await _context.Tenants.AddAsync(tenant, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // 3. Attach Subscription Plan
        var plan = request.SelectedPlanId.HasValue
            ? await _context.PlatformPlans.FindAsync(new object[] { request.SelectedPlanId.Value }, cancellationToken)
            : await _context.PlatformPlans.FirstOrDefaultAsync(p => p.Tier == SubscriptionPlanTier.Standard, cancellationToken);

        if (plan != null)
        {
            var subscription = new TenantSubscription
            {
                TenantId = tenant.Id,
                PlatformPlanId = plan.Id,
                BillingCycle = BillingCycle.Monthly,
                Status = "Active",
                StartDateUtc = DateTime.UtcNow,
                CurrentPeriodEndUtc = DateTime.UtcNow.AddDays(30)
            };
            await _context.TenantSubscriptions.AddAsync(subscription, cancellationToken);
        }

        // 4. Create Initial Institution & Campus
        var institution = new Institution
        {
            TenantId = tenant.Id,
            Name = request.InstitutionName,
            Code = $"{tenant.Code}-MAIN",
            Type = request.InstitutionType,
            ContactEmail = request.AdminEmail,
            ContactPhone = request.ContactPhone,
            LogoUrl = request.LogoUrl,
            IsActive = true
        };
        await _context.Institutions.AddAsync(institution, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var campus = new Campus
        {
            TenantId = tenant.Id,
            InstitutionId = institution.Id,
            Name = "Main Campus",
            ContactPhone = request.ContactPhone,
            IsMainCampus = true
        };
        await _context.Campuses.AddAsync(campus, cancellationToken);

        // 5. Create Default Academic Year
        var currentYear = DateTime.UtcNow.Year;
        var academicYear = new AcademicYear
        {
            TenantId = tenant.Id,
            InstitutionId = institution.Id,
            Name = $"{currentYear}-{currentYear + 1}",
            StartDate = new DateTime(currentYear, 6, 1),
            EndDate = new DateTime(currentYear + 1, 5, 31),
            IsCurrent = true
        };
        await _context.AcademicYears.AddAsync(academicYear, cancellationToken);

        // 6. Create Admin User
        var adminUser = new ApplicationUser
        {
            UserName = request.AdminEmail,
            Email = request.AdminEmail,
            FirstName = request.AdminFirstName,
            LastName = request.AdminLastName,
            PhoneNumber = request.ContactPhone,
            EmailConfirmed = true,
            PrimaryRole = UserRoleType.InstitutionAdmin,
            IsActive = true
        };

        var userCreateResult = await _userManager.CreateAsync(adminUser, request.Password);
        if (!userCreateResult.Succeeded)
        {
            return ApiResponse<LoginResponseDto>.Fail(
                "Failed to create admin user.",
                userCreateResult.Errors.Select(e => e.Description).ToList());
        }

        await _userManager.AddToRoleAsync(adminUser, UserRoleType.InstitutionAdmin.ToString());

        // 7. Create Memberships
        await _context.TenantMemberships.AddAsync(new TenantMembership
        {
            TenantId = tenant.Id,
            UserId = adminUser.Id,
            Role = UserRoleType.InstitutionAdmin,
            IsActive = true
        }, cancellationToken);

        await _context.InstitutionMemberships.AddAsync(new InstitutionMembership
        {
            TenantId = tenant.Id,
            InstitutionId = institution.Id,
            UserId = adminUser.Id,
            Role = UserRoleType.InstitutionAdmin,
            IsActive = true
        }, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        // 8. Generate JWT & Response
        var roles = new List<string> { UserRoleType.InstitutionAdmin.ToString() };
        var (token, expiration) = _jwtTokenGenerator.GenerateToken(adminUser, roles, tenant.Id, institution.Id);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        adminUser.RefreshToken = refreshToken;
        adminUser.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(adminUser);

        var response = new LoginResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Expiration = expiration,
            UserId = adminUser.Id,
            FullName = adminUser.FullName,
            Email = adminUser.Email,
            Role = UserRoleType.InstitutionAdmin,
            TenantId = tenant.Id,
            TenantName = tenant.Name,
            TenantLogoUrl = tenant.LogoUrl,
            InstitutionId = institution.Id,
            InstitutionName = institution.Name,
            InstitutionLogoUrl = institution.LogoUrl,
            AvailableInstitutions = new List<InstitutionSummaryDto>
            {
                new()
                {
                    InstitutionId = institution.Id,
                    Name = institution.Name,
                    Code = institution.Code,
                    Type = institution.Type,
                    Role = UserRoleType.InstitutionAdmin,
                    LogoUrl = institution.LogoUrl
                }
            }
        };

        return ApiResponse<LoginResponseDto>.Ok(response, "Tenant registered successfully");
    }

    public async Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.Users.FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken, cancellationToken);
        if (user == null || user.RefreshTokenExpiryTimeUtc <= DateTime.UtcNow)
        {
            return ApiResponse<LoginResponseDto>.Fail("Invalid or expired refresh token.");
        }

        var roles = await _userManager.GetRolesAsync(user);

        var tenantMembership = await _context.TenantMemberships
            .IgnoreQueryFilters()
            .Include(tm => tm.Tenant)
            .FirstOrDefaultAsync(tm => tm.UserId == user.Id && tm.IsActive, cancellationToken);

        var institutionMembership = await _context.InstitutionMemberships
            .IgnoreQueryFilters()
            .Include(im => im.Institution)
            .FirstOrDefaultAsync(im => im.UserId == user.Id && im.IsActive, cancellationToken);

        var (token, expiration) = _jwtTokenGenerator.GenerateToken(
            user,
            roles,
            tenantMembership?.TenantId,
            institutionMembership?.InstitutionId);

        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTimeUtc = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var response = new LoginResponseDto
        {
            Token = token,
            RefreshToken = newRefreshToken,
            Expiration = expiration,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Role = user.PrimaryRole,
            TenantId = tenantMembership?.TenantId,
            TenantName = tenantMembership?.Tenant?.Name,
            InstitutionId = institutionMembership?.InstitutionId,
            InstitutionName = institutionMembership?.Institution?.Name
        };

        return ApiResponse<LoginResponseDto>.Ok(response, "Token refreshed successfully");
    }

    public async Task<ApiResponse<ForgotPasswordResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var rawIdentifier = !string.IsNullOrWhiteSpace(request.Identifier) ? request.Identifier.Trim() : (request.Email?.Trim() ?? string.Empty);
        if (string.IsNullOrWhiteSpace(rawIdentifier))
        {
            return ApiResponse<ForgotPasswordResponseDto>.Fail("Please provide a registered email or mobile number.");
        }

        var isEmail = request.Method == ForgotPasswordMethod.Email || rawIdentifier.Contains('@');
        ApplicationUser? user = null;

        if (isEmail)
        {
            user = await _userManager.FindByEmailAsync(rawIdentifier);
            if (user == null)
            {
                var guardian = await _context.Guardians
                    .Include(g => g.User)
                    .FirstOrDefaultAsync(g => g.Email.ToLower() == rawIdentifier.ToLower(), cancellationToken);
                user = guardian?.User;
            }
            if (user == null)
            {
                var staff = await _context.StaffMembers
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Email.ToLower() == rawIdentifier.ToLower(), cancellationToken);
                user = staff?.User;
            }
        }
        else
        {
            // Clean phone digits for matching
            var phoneDigits = new string(rawIdentifier.Where(char.IsDigit).ToArray());
            if (phoneDigits.Length >= 10)
            {
                phoneDigits = phoneDigits.Substring(phoneDigits.Length - 10);
            }

            user = await _context.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber != null && u.PhoneNumber.Contains(phoneDigits), cancellationToken);

            if (user == null)
            {
                var guardian = await _context.Guardians
                    .Include(g => g.User)
                    .FirstOrDefaultAsync(g => g.Phone.Contains(phoneDigits), cancellationToken);
                user = guardian?.User;
            }

            if (user == null)
            {
                var staff = await _context.StaffMembers
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Phone.Contains(phoneDigits), cancellationToken);
                user = staff?.User;
            }
        }

        if (user == null || !user.IsActive)
        {
            // For security, do not reveal whether user exists
            return ApiResponse<ForgotPasswordResponseDto>.Ok(new ForgotPasswordResponseDto
            {
                Message = isEmail 
                    ? "If an account with that email exists, password reset instructions have been generated."
                    : "If an account with that mobile number exists, an OTP has been dispatched."
            });
        }

        // Generate Identity reset token
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        string channel;
        string recipient;
        string masked;

        if (isEmail)
        {
            channel = "Email";
            recipient = user.Email ?? rawIdentifier;
            masked = MaskEmail(recipient);

            await _context.NotificationLogs.AddAsync(new NotificationLog
            {
                Recipient = recipient,
                Channel = channel,
                Subject = "Password Reset Request",
                Message = $"Your password reset token is: {token}",
                Status = "Sent",
                SentAtUtc = DateTime.UtcNow
            }, cancellationToken);
        }
        else
        {
            channel = "SMS";
            recipient = user.PhoneNumber ?? rawIdentifier;
            masked = MaskPhone(recipient);

            await _context.NotificationLogs.AddAsync(new NotificationLog
            {
                Recipient = recipient,
                Channel = channel,
                Subject = "Password Reset Token / OTP",
                Message = $"Your EduManage reset verification code is: {token}",
                Status = "Sent",
                SentAtUtc = DateTime.UtcNow
            }, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<ForgotPasswordResponseDto>.Ok(new ForgotPasswordResponseDto
        {
            Message = $"Verification instructions dispatched to {masked}.",
            ResetToken = token, // Provided for easy development / demo testing
            MaskedDestination = masked,
            ResolvedEmail = user.Email
        });
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default)
    {
        var rawIdentifier = !string.IsNullOrWhiteSpace(request.Identifier) ? request.Identifier.Trim() : (request.Email?.Trim() ?? string.Empty);
        if (string.IsNullOrWhiteSpace(rawIdentifier))
        {
            return ApiResponse<bool>.Fail("Invalid password reset request: missing identifier.");
        }

        var isEmail = rawIdentifier.Contains('@');
        ApplicationUser? user = null;

        if (isEmail)
        {
            user = await _userManager.FindByEmailAsync(rawIdentifier);
            if (user == null)
            {
                var guardian = await _context.Guardians
                    .Include(g => g.User)
                    .FirstOrDefaultAsync(g => g.Email.ToLower() == rawIdentifier.ToLower(), cancellationToken);
                user = guardian?.User;
            }
        }
        else
        {
            var phoneDigits = new string(rawIdentifier.Where(char.IsDigit).ToArray());
            if (phoneDigits.Length >= 10)
            {
                phoneDigits = phoneDigits.Substring(phoneDigits.Length - 10);
            }

            user = await _context.Users
                .FirstOrDefaultAsync(u => u.PhoneNumber != null && u.PhoneNumber.Contains(phoneDigits), cancellationToken);

            if (user == null)
            {
                var guardian = await _context.Guardians
                    .Include(g => g.User)
                    .FirstOrDefaultAsync(g => g.Phone.Contains(phoneDigits), cancellationToken);
                user = guardian?.User;
            }
        }

        if (user == null)
        {
            return ApiResponse<bool>.Fail("Invalid password reset request: user not found.");
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return ApiResponse<bool>.Fail("Password reset failed. The token may be expired or invalid.", result.Errors.Select(e => e.Description).ToList());
        }

        return ApiResponse<bool>.Ok(true, "Password has been reset successfully. You can now log in with your new password.");
    }

    private static string MaskEmail(string email)
    {
        var parts = email.Split('@');
        if (parts.Length != 2) return email;
        var name = parts[0];
        var domain = parts[1];
        if (name.Length <= 2) return $"{name[0]}*@{domain}";
        return $"{name[0]}***{name[^1]}@{domain}";
    }

    private static string MaskPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 4) return phone;
        var last4 = digits.Substring(digits.Length - 4);
        return $"******{last4}";
    }
}
