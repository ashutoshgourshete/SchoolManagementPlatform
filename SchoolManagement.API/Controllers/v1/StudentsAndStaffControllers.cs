using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStudents(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? classId = null,
        [FromQuery] Guid? classSectionId = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new PaginationFilter
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            SearchTerm = search
        };

        var result = await _studentService.GetStudentsAsync(filter, classSectionId, classId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStudentById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _studentService.GetStudentByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> CreateStudent([FromBody] CreateStudentDto dto, CancellationToken cancellationToken)
    {
        var result = await _studentService.CreateStudentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetStudentById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> UpdateStudent(Guid id, [FromBody] UpdateStudentDto dto, CancellationToken cancellationToken)
    {
        var result = await _studentService.UpdateStudentAsync(id, dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> DeleteStudent(Guid id, CancellationToken cancellationToken)
    {
        var result = await _studentService.DeleteStudentAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("enroll")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> EnrollStudent([FromBody] CreateEnrollmentDto dto, CancellationToken cancellationToken)
    {
        var result = await _studentService.EnrollStudentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly IStaffService _staffService;

    public StaffController(IStaffService staffService)
    {
        _staffService = staffService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStaff(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? departmentId = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new PaginationFilter
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            SearchTerm = search
        };

        var result = await _staffService.GetStaffAsync(filter, departmentId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStaffById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _staffService.GetStaffByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto, CancellationToken cancellationToken)
    {
        var result = await _staffService.CreateStaffAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetStaffById), new { id = result.Data!.Id }, result);
    }
}
