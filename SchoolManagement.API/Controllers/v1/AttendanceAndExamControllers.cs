using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAttendance(
        [FromQuery] Guid classSectionId,
        [FromQuery] DateTime date,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetAttendanceAsync(classSectionId, date, cancellationToken);
        return Ok(result);
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> SaveBulkAttendance([FromBody] BulkAttendanceDto dto, CancellationToken cancellationToken)
    {
        var result = await _attendanceService.SaveBulkAttendanceAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}/summary")]
    public async Task<IActionResult> GetStudentAttendanceSummary(
        Guid studentId,
        [FromQuery] Guid academicYearId,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetStudentAttendanceSummaryAsync(studentId, academicYearId, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ExaminationsController : ControllerBase
{
    private readonly IExaminationService _examinationService;

    public ExaminationsController(IExaminationService examinationService)
    {
        _examinationService = examinationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetExams([FromQuery] Guid? courseOfferingId, CancellationToken cancellationToken)
    {
        var result = await _examinationService.GetExamsAsync(courseOfferingId, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamDto dto, CancellationToken cancellationToken)
    {
        var result = await _examinationService.CreateExamAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{examId:guid}/results")]
    public async Task<IActionResult> GetExamResults(Guid examId, CancellationToken cancellationToken)
    {
        var result = await _examinationService.GetExamResultsAsync(examId, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("results/bulk")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> SubmitBulkExamResults([FromBody] BulkExamResultDto dto, CancellationToken cancellationToken)
    {
        var result = await _examinationService.SubmitBulkExamResultsAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("report-card")]
    public async Task<IActionResult> GetStudentReportCard(
        [FromQuery] Guid studentId,
        [FromQuery] Guid academicYearId,
        CancellationToken cancellationToken)
    {
        var result = await _examinationService.GetStudentReportCardAsync(studentId, academicYearId, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}
