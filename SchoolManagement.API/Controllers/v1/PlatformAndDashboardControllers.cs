using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionBillingService _subscriptionService;

    public SubscriptionsController(ISubscriptionBillingService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    [HttpGet("plans")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPlans(CancellationToken cancellationToken)
    {
        var result = await _subscriptionService.GetPlansAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("current")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> GetCurrentSubscription(CancellationToken cancellationToken)
    {
        var result = await _subscriptionService.GetCurrentSubscriptionAsync(cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("subscribe")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> Subscribe([FromBody] SubscribePlanDto dto, CancellationToken cancellationToken)
    {
        var result = await _subscriptionService.SubscribeAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("platform-invoices")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> GetPlatformInvoices(CancellationToken cancellationToken)
    {
        var result = await _subscriptionService.GetPlatformInvoicesAsync(cancellationToken);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("institution")]
    public async Task<IActionResult> GetInstitutionDashboard(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetInstitutionDashboardAnalyticsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("platform")]
    [Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> GetPlatformAdminDashboard(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetPlatformAdminDashboardAsync(cancellationToken);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;

    public AnnouncementsController(IAnnouncementService announcementService)
    {
        _announcementService = announcementService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnnouncements([FromQuery] string? audience, CancellationToken cancellationToken)
    {
        var result = await _announcementService.GetAnnouncementsAsync(audience, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> CreateAnnouncement([FromBody] CreateAnnouncementDto dto, CancellationToken cancellationToken)
    {
        var result = await _announcementService.CreateAnnouncementAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
