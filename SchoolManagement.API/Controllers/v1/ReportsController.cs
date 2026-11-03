using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;

    public ReportsController(IReportsService reportsService)
    {
        _reportsService = reportsService;
    }

    [HttpGet("enrollment")]
    public async Task<IActionResult> GetEnrollmentReport([FromQuery] Guid? academicYearId, CancellationToken cancellationToken)
    {
        var result = await _reportsService.GetEnrollmentDemographicsReportAsync(academicYearId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendanceReport(
        [FromQuery] Guid? classSectionId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var result = await _reportsService.GetAttendanceAnalyticsReportAsync(classSectionId, startDate, endDate, cancellationToken);
        return Ok(result);
    }

    [HttpGet("financial")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Accountant,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> GetFinancialReport(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var result = await _reportsService.GetFinancialCollectionReportAsync(startDate, endDate, cancellationToken);
        return Ok(result);
    }

    [HttpGet("executive")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> GetExecutiveReport(CancellationToken cancellationToken)
    {
        var result = await _reportsService.GetExecutiveSummaryReportAsync(cancellationToken);
        return Ok(result);
    }
}
