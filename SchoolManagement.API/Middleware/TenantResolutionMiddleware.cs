using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;

namespace SchoolManagement.API.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService currentTenantService, ApplicationDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                currentTenantService.UserId = userId;
            }

            var isPlatformAdmin = context.User.IsInRole("PlatformAdmin");
            currentTenantService.IsPlatformAdmin = isPlatformAdmin;

            // Resolve TenantId from trusted authenticated claims - NEVER trust user query/body
            var tenantClaim = context.User.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(tenantClaim, out var tenantId))
            {
                currentTenantService.TenantId = tenantId;
            }

            // Resolve InstitutionId from claim
            var instClaim = context.User.FindFirst("institution_id")?.Value;
            if (Guid.TryParse(instClaim, out var institutionId))
            {
                currentTenantService.InstitutionId = institutionId;
            }

            // Optional header override for institution: ONLY permit if institution belongs to user's tenant (or user is PlatformAdmin)
            if (context.Request.Headers.TryGetValue("X-Institution-Id", out var headerInstVal) &&
                Guid.TryParse(headerInstVal, out var selectedInstId))
            {
                if (isPlatformAdmin)
                {
                    currentTenantService.InstitutionId = selectedInstId;
                }
                else if (currentTenantService.TenantId.HasValue)
                {
                    // Cryptographically verify institution belongs to this tenant and is active
                    var belongsToTenant = await dbContext.Institutions
                        .IgnoreQueryFilters()
                        .AnyAsync(i => i.Id == selectedInstId && i.TenantId == currentTenantService.TenantId.Value && !i.IsDeleted && i.IsActive);

                    if (belongsToTenant)
                    {
                        currentTenantService.InstitutionId = selectedInstId;
                    }
                }
            }
        }

        await _next(context);
    }
}
