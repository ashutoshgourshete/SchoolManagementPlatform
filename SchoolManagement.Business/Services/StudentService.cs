using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;

namespace SchoolManagement.Business.Services;

public class StudentService : IStudentService
{
    private readonly ApplicationDbContext _context;

    public StudentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<StudentDto>>> GetStudentsAsync(PaginationFilter filter, Guid? classSectionId = null, Guid? classId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Students
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Include(s => s.StudentGuardians)
                .ThenInclude(sg => sg.Guardian)
            .Where(s => !s.IsDeleted);

        if (classSectionId.HasValue)
        {
            query = query.Where(s => s.Enrollments.Any(e => e.ClassSectionId == classSectionId.Value && e.IsActive && !e.IsDeleted));
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(s =>
                s.FirstName.ToLower().Contains(search) ||
                s.LastName.ToLower().Contains(search) ||
                s.AdmissionNumber.ToLower().Contains(search) ||
                (s.RollNumber != null && s.RollNumber.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var students = await query
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Skip((filter.PageIndex - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new StudentDto
            {
                Id = s.Id,
                AdmissionNumber = s.AdmissionNumber,
                RollNumber = s.RollNumber,
                FirstName = s.FirstName,
                LastName = s.LastName,
                DateOfBirth = s.DateOfBirth,
                Gender = s.Gender,
                BloodGroup = s.BloodGroup,
                AdmissionDate = s.AdmissionDate,
                EmergencyContactPhone = s.EmergencyContactPhone,
                Address = s.Address,
                City = s.City,
                State = s.State,
                PostalCode = s.PostalCode,
                IsActive = s.IsActive,
                CurrentClassName = s.Enrollments.Where(e => e.IsActive && !e.IsDeleted).Select(e => e.ClassSection.Class.Name).FirstOrDefault(),
                CurrentSectionName = s.Enrollments.Where(e => e.IsActive && !e.IsDeleted).Select(e => e.ClassSection.Name).FirstOrDefault(),
                CurrentClassSectionId = s.Enrollments.Where(e => e.IsActive && !e.IsDeleted).Select(e => (Guid?)e.ClassSectionId).FirstOrDefault(),
                Guardians = s.StudentGuardians.Select(sg => new GuardianDto
                {
                    Id = sg.Guardian.Id,
                    FirstName = sg.Guardian.FirstName,
                    LastName = sg.Guardian.LastName,
                    Relationship = sg.Guardian.Relationship,
                    Occupation = sg.Guardian.Occupation,
                    Email = sg.Guardian.Email,
                    Phone = sg.Guardian.Phone,
                    Address = sg.Guardian.Address,
                    IsPrimaryContact = sg.IsPrimaryContact
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        var pagedResult = new PagedResult<StudentDto>(students, totalCount, filter.PageIndex, filter.PageSize);
        return ApiResponse<PagedResult<StudentDto>>.Ok(pagedResult);
    }

    public async Task<ApiResponse<StudentDto>> GetStudentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var s = await _context.Students
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Include(s => s.StudentGuardians)
                .ThenInclude(sg => sg.Guardian)
            .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, cancellationToken);

        if (s == null) return ApiResponse<StudentDto>.Fail("Student not found");

        var activeEnrollment = s.Enrollments.FirstOrDefault(e => e.IsActive && !e.IsDeleted);

        var dto = new StudentDto
        {
            Id = s.Id,
            AdmissionNumber = s.AdmissionNumber,
            RollNumber = s.RollNumber,
            FirstName = s.FirstName,
            LastName = s.LastName,
            DateOfBirth = s.DateOfBirth,
            Gender = s.Gender,
            BloodGroup = s.BloodGroup,
            AdmissionDate = s.AdmissionDate,
            EmergencyContactPhone = s.EmergencyContactPhone,
            Address = s.Address,
            City = s.City,
            State = s.State,
            PostalCode = s.PostalCode,
            IsActive = s.IsActive,
            CurrentClassName = activeEnrollment?.ClassSection?.Class?.Name,
            CurrentSectionName = activeEnrollment?.ClassSection?.Name,
            CurrentClassSectionId = activeEnrollment?.ClassSectionId,
            Guardians = s.StudentGuardians.Select(sg => new GuardianDto
            {
                Id = sg.Guardian.Id,
                FirstName = sg.Guardian.FirstName,
                LastName = sg.Guardian.LastName,
                Relationship = sg.Guardian.Relationship,
                Occupation = sg.Guardian.Occupation,
                Email = sg.Guardian.Email,
                Phone = sg.Guardian.Phone,
                Address = sg.Guardian.Address,
                IsPrimaryContact = sg.IsPrimaryContact
            }).ToList()
        };

        return ApiResponse<StudentDto>.Ok(dto);
    }

    public async Task<ApiResponse<StudentDto>> CreateStudentAsync(CreateStudentDto dto, CancellationToken cancellationToken = default)
    {
        // 1. Check duplicate admission number in this tenant
        var duplicate = await _context.Students.AnyAsync(s => s.AdmissionNumber == dto.AdmissionNumber.Trim(), cancellationToken);
        if (duplicate)
        {
            return ApiResponse<StudentDto>.Fail($"Admission number '{dto.AdmissionNumber}' already exists in this institution.");
        }

        var student = new Student
        {
            AdmissionNumber = dto.AdmissionNumber.Trim(),
            RollNumber = dto.RollNumber?.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            DateOfBirth = dto.DateOfBirth,
            Gender = dto.Gender,
            BloodGroup = dto.BloodGroup,
            AdmissionDate = dto.AdmissionDate,
            EmergencyContactPhone = dto.EmergencyContactPhone,
            Address = dto.Address,
            City = dto.City,
            State = dto.State,
            PostalCode = dto.PostalCode,
            IsActive = true
        };

        await _context.Students.AddAsync(student, cancellationToken);

        // 2. Add Guardian if provided
        if (dto.Guardian != null && !string.IsNullOrWhiteSpace(dto.Guardian.FirstName))
        {
            var guardian = new Guardian
            {
                FirstName = dto.Guardian.FirstName.Trim(),
                LastName = dto.Guardian.LastName.Trim(),
                Relationship = dto.Guardian.Relationship,
                Occupation = dto.Guardian.Occupation,
                Email = dto.Guardian.Email.Trim(),
                Phone = dto.Guardian.Phone.Trim(),
                Address = dto.Guardian.Address ?? dto.Address
            };

            await _context.Guardians.AddAsync(guardian, cancellationToken);

            var studentGuardian = new StudentGuardian
            {
                Student = student,
                Guardian = guardian,
                IsPrimaryContact = dto.Guardian.IsPrimaryContact,
                CanPickup = dto.Guardian.CanPickup
            };

            await _context.StudentGuardians.AddAsync(studentGuardian, cancellationToken);
        }

        // 3. Add Enrollment if class section provided
        if (dto.ClassSectionId.HasValue && dto.ClassSectionId.Value != Guid.Empty)
        {
            var academicYearId = dto.AcademicYearId;
            if (!academicYearId.HasValue || academicYearId.Value == Guid.Empty)
            {
                var currentYear = await _context.AcademicYears.FirstOrDefaultAsync(ay => ay.IsCurrent, cancellationToken);
                academicYearId = currentYear?.Id ?? Guid.Empty;
            }

            if (academicYearId.Value != Guid.Empty)
            {
                var enrollment = new Enrollment
                {
                    Student = student,
                    AcademicYearId = academicYearId.Value,
                    ClassSectionId = dto.ClassSectionId.Value,
                    RollNumber = dto.RollNumber,
                    EnrolledAtUtc = DateTime.UtcNow,
                    IsActive = true
                };

                await _context.Enrollments.AddAsync(enrollment, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentByIdAsync(student.Id, cancellationToken);
    }

    public async Task<ApiResponse<StudentDto>> UpdateStudentAsync(Guid id, UpdateStudentDto dto, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { id }, cancellationToken);
        if (student == null) return ApiResponse<StudentDto>.Fail("Student not found");

        student.FirstName = dto.FirstName.Trim();
        student.LastName = dto.LastName.Trim();
        student.RollNumber = dto.RollNumber?.Trim();
        student.DateOfBirth = dto.DateOfBirth;
        student.Gender = dto.Gender;
        student.BloodGroup = dto.BloodGroup;
        student.EmergencyContactPhone = dto.EmergencyContactPhone;
        student.Address = dto.Address;
        student.City = dto.City;
        student.State = dto.State;
        student.PostalCode = dto.PostalCode;
        student.IsActive = dto.IsActive;

        await _context.SaveChangesAsync(cancellationToken);

        return await GetStudentByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<bool>> DeleteStudentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { id }, cancellationToken);
        if (student == null) return ApiResponse<bool>.Fail("Student not found");

        student.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Student deleted successfully");
    }

    public async Task<ApiResponse<EnrollmentDto>> EnrollStudentAsync(CreateEnrollmentDto dto, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { dto.StudentId }, cancellationToken);
        if (student == null) return ApiResponse<EnrollmentDto>.Fail("Student not found");

        // Deactivate previous active enrollments for the same academic year
        var previousEnrollments = await _context.Enrollments
            .Where(e => e.StudentId == dto.StudentId && e.AcademicYearId == dto.AcademicYearId && e.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var prev in previousEnrollments)
        {
            prev.IsActive = false;
        }

        var enrollment = new Enrollment
        {
            StudentId = dto.StudentId,
            AcademicYearId = dto.AcademicYearId,
            ClassSectionId = dto.ClassSectionId,
            RollNumber = dto.RollNumber,
            EnrolledAtUtc = DateTime.UtcNow,
            IsActive = true
        };

        await _context.Enrollments.AddAsync(enrollment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var section = await _context.ClassSections
            .Include(cs => cs.Class)
            .FirstOrDefaultAsync(cs => cs.Id == dto.ClassSectionId, cancellationToken);

        var year = await _context.AcademicYears.FindAsync(new object[] { dto.AcademicYearId }, cancellationToken);

        return ApiResponse<EnrollmentDto>.Ok(new EnrollmentDto
        {
            Id = enrollment.Id,
            StudentId = student.Id,
            StudentName = student.FullName,
            AdmissionNumber = student.AdmissionNumber,
            AcademicYearId = dto.AcademicYearId,
            AcademicYearName = year?.Name ?? string.Empty,
            ClassSectionId = dto.ClassSectionId,
            ClassName = section?.Class?.Name ?? string.Empty,
            SectionName = section?.Name ?? string.Empty,
            RollNumber = enrollment.RollNumber,
            EnrolledAtUtc = enrollment.EnrolledAtUtc,
            IsActive = enrollment.IsActive
        }, "Student enrolled successfully");
    }
}
