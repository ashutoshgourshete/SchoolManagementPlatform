using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;

    public TenantsController(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    [HttpGet]
    [Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> GetAllTenants(CancellationToken cancellationToken)
    {
        var result = await _tenantService.GetAllTenantsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> GetTenantById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _tenantService.GetTenantByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "PlatformAdmin")]
    public async Task<IActionResult> UpdateTenantStatus(Guid id, [FromBody] TenantStatus status, CancellationToken cancellationToken)
    {
        var result = await _tenantService.UpdateTenantStatusAsync(id, status, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/institutions")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> GetInstitutions(Guid id, CancellationToken cancellationToken)
    {
        var result = await _tenantService.GetInstitutionsAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/institutions")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin")]
    public async Task<IActionResult> CreateInstitution(Guid id, [FromBody] CreateInstitutionDto dto, CancellationToken cancellationToken)
    {
        var result = await _tenantService.CreateInstitutionAsync(id, dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AcademicController : ControllerBase
{
    private readonly IAcademicService _academicService;

    public AcademicController(IAcademicService academicService)
    {
        _academicService = academicService;
    }

    // Academic Years
    [HttpGet("years")]
    public async Task<IActionResult> GetAcademicYears(CancellationToken cancellationToken)
    {
        var result = await _academicService.GetAcademicYearsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("years")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateAcademicYear([FromBody] CreateAcademicYearDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateAcademicYearAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("years/{id:guid}/set-current")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> SetCurrentAcademicYear(Guid id, CancellationToken cancellationToken)
    {
        var result = await _academicService.SetCurrentAcademicYearAsync(id, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // Departments
    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments(CancellationToken cancellationToken)
    {
        var result = await _academicService.GetDepartmentsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("departments")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateDepartmentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // College Programs
    [HttpGet("programs")]
    public async Task<IActionResult> GetPrograms(CancellationToken cancellationToken)
    {
        var result = await _academicService.GetProgramsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("programs")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateProgram([FromBody] CreateProgramDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateProgramAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    // Classes & Sections
    [HttpGet("classes")]
    public async Task<IActionResult> GetClasses([FromQuery] Guid? academicYearId, [FromQuery] Guid? institutionId, CancellationToken cancellationToken)
    {
        var result = await _academicService.GetClassesAsync(academicYearId, institutionId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("classes")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateClassAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("classes/{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> DeleteClass(Guid id, CancellationToken cancellationToken)
    {
        var result = await _academicService.DeleteClassAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("classes/{classId:guid}/sections")]
    public async Task<IActionResult> GetClassSections(Guid classId, CancellationToken cancellationToken)
    {
        var result = await _academicService.GetClassSectionsAsync(classId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("sections")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateSection([FromBody] CreateClassSectionDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateClassSectionAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("sections/{id:guid}")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> DeleteSection(Guid id, CancellationToken cancellationToken)
    {
        var result = await _academicService.DeleteClassSectionAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    // Subjects
    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects(CancellationToken cancellationToken)
    {
        var result = await _academicService.GetSubjectsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("subjects")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateSubjectAsync(dto, cancellationToken);
        return Ok(result);
    }

    // Course Offerings
    [HttpGet("course-offerings")]
    public async Task<IActionResult> GetCourseOfferings([FromQuery] Guid? academicYearId, [FromQuery] Guid? classSectionId, CancellationToken cancellationToken)
    {
        var result = await _academicService.GetCourseOfferingsAsync(academicYearId, classSectionId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("course-offerings")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Director,Principal,VicePrincipal,HeadOfDepartment")]
    public async Task<IActionResult> CreateCourseOffering([FromBody] CreateCourseOfferingDto dto, CancellationToken cancellationToken)
    {
        var result = await _academicService.CreateCourseOfferingAsync(dto, cancellationToken);
        return Ok(result);
    }
}
