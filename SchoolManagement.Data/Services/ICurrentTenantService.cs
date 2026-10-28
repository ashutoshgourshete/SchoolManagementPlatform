namespace SchoolManagement.Data.Services;

public interface ICurrentTenantService
{
    Guid? TenantId { get; set; }
    Guid? InstitutionId { get; set; }
    Guid? UserId { get; set; }
    bool IsPlatformAdmin { get; set; }
}

public class CurrentTenantService : ICurrentTenantService
{
    public Guid? TenantId { get; set; }
    public Guid? InstitutionId { get; set; }
    public Guid? UserId { get; set; }
    public bool IsPlatformAdmin { get; set; } = false;
}
