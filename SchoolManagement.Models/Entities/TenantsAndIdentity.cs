using Microsoft.AspNetCore.Identity;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Domain { get; set; }
    public TenantStatus Status { get; set; } = TenantStatus.Active;
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string CurrencyCode { get; set; } = "INR";
    public string TimeZone { get; set; } = "India Standard Time";
    public bool IsTrial { get; set; } = false;
    public DateTime? TrialEndsAtUtc { get; set; }

    public ICollection<Institution> Institutions { get; set; } = new List<Institution>();
    public ICollection<TenantMembership> Memberships { get; set; } = new List<TenantMembership>();
    public ICollection<TenantSubscription> Subscriptions { get; set; } = new List<TenantSubscription>();
}

public class Institution : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public InstitutionType Type { get; set; } = InstitutionType.School;
    public string ContactEmail { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public string? Address { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Campus> Campuses { get; set; } = new List<Campus>();
    public ICollection<InstitutionMembership> Memberships { get; set; } = new List<InstitutionMembership>();
    public ICollection<AcademicYear> AcademicYears { get; set; } = new List<AcademicYear>();
    public ICollection<Department> Departments { get; set; } = new List<Department>();
    public ICollection<Program> Programs { get; set; } = new List<Program>();
    public ICollection<Class> Classes { get; set; } = new List<Class>();
    public ICollection<Staff> StaffMembers { get; set; } = new List<Staff>();
    public ICollection<Student> Students { get; set; } = new List<Student>();
}

public class Campus : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsMainCampus { get; set; } = false;
}

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public UserRoleType PrimaryRole { get; set; } = UserRoleType.Teacher;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTimeUtc { get; set; }

    public ICollection<TenantMembership> TenantMemberships { get; set; } = new List<TenantMembership>();
    public ICollection<InstitutionMembership> InstitutionMemberships { get; set; } = new List<InstitutionMembership>();
}

public class TenantMembership : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public UserRoleType Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
}

public class InstitutionMembership : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public UserRoleType Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
}
