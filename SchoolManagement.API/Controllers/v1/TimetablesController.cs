using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class TimetablesController : ControllerBase
{
    private readonly ITimetableService _timetableService;
    private readonly IAcademicService _academicService;

    public TimetablesController(
        ITimetableService timetableService,
        IAcademicService academicService)
    {
        _timetableService = timetableService;
        _academicService = academicService;
    }

    [HttpGet("course-offerings")]
    public async Task<IActionResult> GetCourseOfferings(
        [FromQuery] Guid? academicYearId,
        [FromQuery] Guid? classSectionId,
        CancellationToken cancellationToken)
    {
        var result = await _academicService.GetCourseOfferingsAsync(academicYearId, classSectionId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("course-offerings")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> CreateCourseOffering(
        [FromBody] CreateCourseOfferingDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateCourseOfferingAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("detect-conflicts")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> DetectConflicts(
        [FromBody] ScheduleSlotDto dto,
        [FromQuery] Guid? excludeSlotId,
        CancellationToken cancellationToken)
    {
        var result = await _timetableService.DetectConflictsAsync(dto, excludeSlotId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("slots")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> ScheduleSlot(
        [FromBody] ScheduleSlotDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _timetableService.ScheduleSlotAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("class-sections/{classSectionId:guid}")]
    public async Task<IActionResult> GetClassSectionWeeklyTimetable(
        Guid classSectionId,
        CancellationToken cancellationToken)
    {
        var result = await _timetableService.GetClassSectionWeeklyTimetableAsync(classSectionId, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("teachers/{teacherId:guid}")]
    public async Task<IActionResult> GetTeacherWeeklyTimetable(
        Guid teacherId,
        CancellationToken cancellationToken)
    {
        var result = await _timetableService.GetTeacherWeeklyTimetableAsync(teacherId, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("rooms/{roomNumber}")]
    public async Task<IActionResult> GetRoomSchedule(
        string roomNumber,
        [FromQuery] DayOfWeek? dayOfWeek,
        CancellationToken cancellationToken)
    {
        var result = await _timetableService.GetRoomScheduleAsync(roomNumber, dayOfWeek, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("slots/{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> DeleteSlot(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _timetableService.DeleteSlotAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }
}
