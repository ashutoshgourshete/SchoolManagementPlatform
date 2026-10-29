using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssignments(
        [FromQuery] Guid? classSectionId,
        [FromQuery] Guid? courseOfferingId,
        CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetAssignmentsAsync(classSectionId, courseOfferingId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssignmentById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetAssignmentByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> CreateAssignment(
        [FromBody] CreateAssignmentDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _assignmentService.CreateAssignmentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetAssignmentById), new { id = result.Data!.Id }, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> DeleteAssignment(Guid id, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.DeleteAssignmentAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/submissions")]
    public async Task<IActionResult> SubmitAssignment(
        Guid id,
        [FromBody] SubmitAssignmentDto dto,
        CancellationToken cancellationToken)
    {
        dto.AssignmentId = id;
        var result = await _assignmentService.SubmitAssignmentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/submissions")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> GetAssignmentSubmissions(Guid id, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetAssignmentSubmissionsAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("submissions/grade")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Teacher")]
    public async Task<IActionResult> GradeSubmission(
        [FromBody] GradeSubmissionDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GradeSubmissionAsync(dto, null, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentSubmissions(Guid studentId, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetStudentSubmissionsAsync(studentId, cancellationToken);
        return Ok(result);
    }
}
