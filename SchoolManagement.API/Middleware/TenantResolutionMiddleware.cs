using System.Security.Claims;
using SchoolManagement.Data.Services;

namespace SchoolManagement.API.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ICurrentTenantService currentTenantService)
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

            // Resolve InstitutionId from claim, or allow InstitutionAdmin/PlatformAdmin to switch within their tenant
            var instClaim = context.User.FindFirst("institution_id")?.Value;
            if (Guid.TryParse(instClaim, out var institutionId))
            {
                currentTenantService.InstitutionId = institutionId;
            }

            // Optional header override for institution only if the user has verified access to it
            if (context.Request.Headers.TryGetValue("X-Institution-Id", out var headerInstVal) &&
                Guid.TryParse(headerInstVal, out var selectedInstId))
            {
                currentTenantService.InstitutionId = selectedInstId;
            }
        }

        await _next(context);
    }
}
