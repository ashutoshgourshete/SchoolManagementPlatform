using SchoolManagement.Data.Services;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;

namespace SchoolManagement.Business.Services;

public class AcademicService : IAcademicService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public AcademicService(ApplicationDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<List<AcademicYearDto>>> GetAcademicYearsAsync(CancellationToken cancellationToken = default)
    {
        var years = await _context.AcademicYears
            .OrderByDescending(ay => ay.StartDate)
            .Select(ay => new AcademicYearDto
            {
                Id = ay.Id,
                Name = ay.Name,
                StartDate = ay.StartDate,
                EndDate = ay.EndDate,
                IsCurrent = ay.IsCurrent
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AcademicYearDto>>.Ok(years);
    }

    public async Task<ApiResponse<AcademicYearDto>> CreateAcademicYearAsync(CreateAcademicYearDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.IsCurrent)
        {
            var existingCurrent = await _context.AcademicYears.Where(ay => ay.IsCurrent).ToListAsync(cancellationToken);
            foreach (var item in existingCurrent)
            {
                item.IsCurrent = false;
            }
        }

        var year = new AcademicYear
        {
            Name = dto.Name,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsCurrent = dto.IsCurrent
        };

        await _context.AcademicYears.AddAsync(year, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AcademicYearDto>.Ok(new AcademicYearDto
        {
            Id = year.Id,
            Name = year.Name,
            StartDate = year.StartDate,
            EndDate = year.EndDate,
            IsCurrent = year.IsCurrent
        }, "Academic year created successfully");
    }

    public async Task<ApiResponse<AcademicYearDto>> SetCurrentAcademicYearAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var target = await _context.AcademicYears.FindAsync(new object[] { id }, cancellationToken);
        if (target == null) return ApiResponse<AcademicYearDto>.Fail("Academic year not found");

        var allYears = await _context.AcademicYears.ToListAsync(cancellationToken);
        foreach (var yr in allYears)
        {
            yr.IsCurrent = (yr.Id == id);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AcademicYearDto>.Ok(new AcademicYearDto
        {
            Id = target.Id,
            Name = target.Name,
            StartDate = target.StartDate,
            EndDate = target.EndDate,
            IsCurrent = target.IsCurrent
        }, "Current academic year updated");
    }

    public async Task<ApiResponse<List<DepartmentDto>>> GetDepartmentsAsync(CancellationToken cancellationToken = default)
    {
        var depts = await _context.Departments
            .Include(d => d.HeadOfDepartment)
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                Code = d.Code,
                Description = d.Description,
                HeadOfDepartmentId = d.HeadOfDepartmentId,
                HeadOfDepartmentName = d.HeadOfDepartment != null ? d.HeadOfDepartment.FullName : null
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<DepartmentDto>>.Ok(depts);
    }

    public async Task<ApiResponse<DepartmentDto>> CreateDepartmentAsync(CreateDepartmentDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await _context.Departments.AnyAsync(d => d.Code == dto.Code, cancellationToken);
        if (exists) return ApiResponse<DepartmentDto>.Fail($"Department code '{dto.Code}' already exists");

        var dept = new Department
        {
            Name = dto.Name,
            Code = dto.Code,
            Description = dto.Description,
            HeadOfDepartmentId = dto.HeadOfDepartmentId
        };

        await _context.Departments.AddAsync(dept, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto
        {
            Id = dept.Id,
            Name = dept.Name,
            Code = dept.Code,
            Description = dept.Description,
            HeadOfDepartmentId = dept.HeadOfDepartmentId
        }, "Department created successfully");
    }

    public async Task<ApiResponse<List<ProgramDto>>> GetProgramsAsync(CancellationToken cancellationToken = default)
    {
        var programs = await _context.Programs
            .Include(p => p.Department)
            .OrderBy(p => p.Name)
            .Select(p => new ProgramDto
            {
                Id = p.Id,
                DepartmentId = p.DepartmentId,
                DepartmentName = p.Department != null ? p.Department.Name : null,
                Name = p.Name,
                Code = p.Code,
                TotalSemesters = p.TotalSemesters,
                DegreeType = p.DegreeType
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ProgramDto>>.Ok(programs);
    }

    public async Task<ApiResponse<ProgramDto>> CreateProgramAsync(CreateProgramDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await _context.Programs.AnyAsync(p => p.Code == dto.Code, cancellationToken);
        if (exists) return ApiResponse<ProgramDto>.Fail($"Program code '{dto.Code}' already exists");

        var prog = new Program
        {
            DepartmentId = dto.DepartmentId,
            Name = dto.Name,
            Code = dto.Code,
            TotalSemesters = dto.TotalSemesters,
            DegreeType = dto.DegreeType
        };

        await _context.Programs.AddAsync(prog, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<ProgramDto>.Ok(new ProgramDto
        {
            Id = prog.Id,
            DepartmentId = prog.DepartmentId,
            Name = prog.Name,
            Code = prog.Code,
            TotalSemesters = prog.TotalSemesters,
            DegreeType = prog.DegreeType
        }, "Program created successfully");
    }

    public async Task<ApiResponse<List<ClassDto>>> GetClassesAsync(Guid? academicYearId = null, Guid? institutionId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Classes
            .Include(c => c.AcademicYear)
            .Include(c => c.Department)
            .Include(c => c.Program)
            .Include(c => c.Sections)
                .ThenInclude(s => s.ClassTeacher)
            .AsQueryable();

        if (academicYearId.HasValue)
        {
            query = query.Where(c => c.AcademicYearId == academicYearId.Value);
        }

        if (institutionId.HasValue && institutionId.Value != Guid.Empty)
        {
            query = query.Where(c => c.InstitutionId == institutionId.Value);
        }

        var classes = await query
            .OrderBy(c => c.Name)
            .Select(c => new ClassDto
            {
                Id = c.Id,
                AcademicYearId = c.AcademicYearId,
                AcademicYearName = c.AcademicYear.Name,
                DepartmentId = c.DepartmentId,
                DepartmentName = c.Department != null ? c.Department.Name : null,
                ProgramId = c.ProgramId,
                ProgramName = c.Program != null ? c.Program.Name : null,
                Name = c.Name,
                Code = c.Code,
                SemesterNumber = c.SemesterNumber,
                Sections = c.Sections.Select(s => new ClassSectionDto
                {
                    Id = s.Id,
                    ClassId = s.ClassId,
                    ClassName = c.Name,
                    Name = s.Name,
                    Capacity = s.Capacity,
                    RoomNumber = s.RoomNumber,
                    ClassTeacherId = s.ClassTeacherId,
                    ClassTeacherName = s.ClassTeacher != null ? s.ClassTeacher.FullName : null,
                    EnrolledStudentCount = _context.Enrollments.Count(e => e.ClassSectionId == s.Id && e.IsActive && !e.IsDeleted)
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ClassDto>>.Ok(classes);
    }

    public async Task<ApiResponse<ClassDto>> CreateClassAsync(CreateClassDto dto, CancellationToken cancellationToken = default)
    {
        Guid targetInstitutionId;
        if (dto.InstitutionId.HasValue && dto.InstitutionId.Value != Guid.Empty)
        {
            targetInstitutionId = dto.InstitutionId.Value;
        }
        else if (_currentTenantService.InstitutionId.HasValue)
        {
            targetInstitutionId = _currentTenantService.InstitutionId.Value;
        }
        else
        {
            targetInstitutionId = await _context.Institutions.Where(i => !i.IsDeleted).Select(i => i.Id).FirstOrDefaultAsync(cancellationToken);
        }

        var cls = new Class
        {
            InstitutionId = targetInstitutionId,
            AcademicYearId = dto.AcademicYearId,
            DepartmentId = dto.DepartmentId,
            ProgramId = dto.ProgramId,
            Name = dto.Name,
            Code = dto.Code,
            SemesterNumber = dto.SemesterNumber
        };

        await _context.Classes.AddAsync(cls, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<ClassDto>.Ok(new ClassDto
        {
            Id = cls.Id,
            AcademicYearId = cls.AcademicYearId,
            Name = cls.Name,
            Code = cls.Code,
            SemesterNumber = cls.SemesterNumber
        }, "Class created successfully");
    }

    public async Task<ApiResponse<List<ClassSectionDto>>> GetClassSectionsAsync(Guid classId, CancellationToken cancellationToken = default)
    {
        var sections = await _context.ClassSections
            .Include(cs => cs.Class)
            .Include(cs => cs.ClassTeacher)
            .Where(cs => cs.ClassId == classId)
            .Select(s => new ClassSectionDto
            {
                Id = s.Id,
                ClassId = s.ClassId,
                ClassName = s.Class.Name,
                Name = s.Name,
                Capacity = s.Capacity,
                RoomNumber = s.RoomNumber,
                ClassTeacherId = s.ClassTeacherId,
                ClassTeacherName = s.ClassTeacher != null ? s.ClassTeacher.FullName : null,
                EnrolledStudentCount = _context.Enrollments.Count(e => e.ClassSectionId == s.Id && e.IsActive && !e.IsDeleted)
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ClassSectionDto>>.Ok(sections);
    }

    public async Task<ApiResponse<ClassSectionDto>> CreateClassSectionAsync(CreateClassSectionDto dto, CancellationToken cancellationToken = default)
    {
        var parentClass = await _context.Classes.FirstOrDefaultAsync(c => c.Id == dto.ClassId, cancellationToken);
        var targetInstitutionId = parentClass?.InstitutionId 
            ?? _currentTenantService.InstitutionId 
            ?? (await _context.Institutions.Where(i => !i.IsDeleted).Select(i => i.Id).FirstOrDefaultAsync(cancellationToken));

        var section = new ClassSection
        {
            InstitutionId = targetInstitutionId,
            ClassId = dto.ClassId,
            Name = dto.Name.Trim(),
            Capacity = dto.Capacity > 0 ? dto.Capacity : 40,
            RoomNumber = dto.RoomNumber?.Trim(),
            ClassTeacherId = dto.ClassTeacherId
        };

        await _context.ClassSections.AddAsync(section, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<ClassSectionDto>.Ok(new ClassSectionDto
        {
            Id = section.Id,
            ClassId = section.ClassId,
            Name = section.Name,
            Capacity = section.Capacity,
            RoomNumber = section.RoomNumber,
            ClassTeacherId = section.ClassTeacherId
        }, "Section created successfully");
    }

    
    public async Task<ApiResponse<bool>> DeleteClassAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cls = await _context.Classes
            .Include(c => c.Sections)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (cls == null)
            return ApiResponse<bool>.Fail("Class not found.");

        cls.IsDeleted = true;
        foreach (var sec in cls.Sections)
        {
            sec.IsDeleted = true;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Class deleted successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteClassSectionAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var sec = await _context.ClassSections.FindAsync(new object[] { id }, cancellationToken);
        if (sec == null)
            return ApiResponse<bool>.Fail("Class section not found.");

        sec.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Class section deleted successfully.");
    }

    public async Task<ApiResponse<List<SubjectDto>>> GetSubjectsAsync(CancellationToken cancellationToken = default)
    {
        var subjects = await _context.Subjects
            .Include(s => s.Department)
            .OrderBy(s => s.Name)
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                DepartmentId = s.DepartmentId,
                DepartmentName = s.Department != null ? s.Department.Name : null,
                Name = s.Name,
                Code = s.Code,
                Credits = s.Credits,
                IsElective = s.IsElective
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<SubjectDto>>.Ok(subjects);
    }

    public async Task<ApiResponse<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto, CancellationToken cancellationToken = default)
    {
        var subject = new Subject
        {
            DepartmentId = dto.DepartmentId,
            Name = dto.Name,
            Code = dto.Code,
            Credits = dto.Credits,
            IsElective = dto.IsElective
        };

        await _context.Subjects.AddAsync(subject, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<SubjectDto>.Ok(new SubjectDto
        {
            Id = subject.Id,
            Name = subject.Name,
            Code = subject.Code,
            Credits = subject.Credits,
            IsElective = subject.IsElective
        }, "Subject created successfully");
    }

    public async Task<ApiResponse<List<CourseOfferingDto>>> GetCourseOfferingsAsync(Guid? academicYearId = null, Guid? classSectionId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.CourseOfferings
            .Include(co => co.AcademicYear)
            .Include(co => co.Subject)
            .Include(co => co.ClassSection)
                .ThenInclude(cs => cs.Class)
            .Include(co => co.Teacher)
            .AsQueryable();

        if (academicYearId.HasValue) query = query.Where(co => co.AcademicYearId == academicYearId.Value);
        if (classSectionId.HasValue) query = query.Where(co => co.ClassSectionId == classSectionId.Value);

        var list = await query
            .OrderBy(co => co.ClassSection.Class.Name)
            .ThenBy(co => co.Subject.Name)
            .Select(co => new CourseOfferingDto
            {
                Id = co.Id,
                AcademicYearId = co.AcademicYearId,
                AcademicYearName = co.AcademicYear.Name,
                SubjectId = co.SubjectId,
                SubjectName = co.Subject.Name,
                SubjectCode = co.Subject.Code,
                ClassSectionId = co.ClassSectionId,
                SectionName = co.ClassSection.Name,
                ClassName = co.ClassSection.Class.Name,
                TeacherId = co.TeacherId,
                TeacherName = co.Teacher != null ? co.Teacher.FullName : null,
                SemesterNumber = co.SemesterNumber
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<CourseOfferingDto>>.Ok(list);
    }

    public async Task<ApiResponse<CourseOfferingDto>> CreateCourseOfferingAsync(CreateCourseOfferingDto dto, CancellationToken cancellationToken = default)
    {
        var offering = new CourseOffering
        {
            AcademicYearId = dto.AcademicYearId,
            SubjectId = dto.SubjectId,
            ClassSectionId = dto.ClassSectionId,
            TeacherId = dto.TeacherId,
            SemesterNumber = dto.SemesterNumber
        };

        await _context.CourseOfferings.AddAsync(offering, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<CourseOfferingDto>.Ok(new CourseOfferingDto
        {
            Id = offering.Id,
            AcademicYearId = offering.AcademicYearId,
            SubjectId = offering.SubjectId,
            ClassSectionId = offering.ClassSectionId,
            TeacherId = offering.TeacherId,
            SemesterNumber = offering.SemesterNumber
        }, "Course offering created successfully");
    }
}
