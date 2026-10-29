using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class AssignmentService : IAssignmentService
{
    private readonly ApplicationDbContext _context;

    public AssignmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<AssignmentDto>>> GetAssignmentsAsync(
        Guid? classSectionId = null,
        Guid? courseOfferingId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assignments
            .Include(a => a.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(a => a.CourseOffering)
                .ThenInclude(co => co.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Include(a => a.CourseOffering)
                .ThenInclude(co => co.Teacher)
            .Include(a => a.Submissions)
            .Where(a => !a.IsDeleted);

        if (classSectionId.HasValue)
        {
            query = query.Where(a => a.CourseOffering.ClassSectionId == classSectionId.Value);
        }

        if (courseOfferingId.HasValue)
        {
            query = query.Where(a => a.CourseOfferingId == courseOfferingId.Value);
        }

        var assignments = await query
            .OrderByDescending(a => a.DueDateUtc)
            .Select(a => new AssignmentDto
            {
                Id = a.Id,
                CourseOfferingId = a.CourseOfferingId,
                SubjectName = a.CourseOffering.Subject.Name,
                SubjectCode = a.CourseOffering.Subject.Code,
                ClassSectionId = a.CourseOffering.ClassSectionId,
                ClassName = a.CourseOffering.ClassSection.Class.Name,
                SectionName = a.CourseOffering.ClassSection.Name,
                TeacherId = a.CourseOffering.TeacherId,
                TeacherName = a.CourseOffering.Teacher != null ? a.CourseOffering.Teacher.FullName : null,
                Title = a.Title,
                Description = a.Description,
                AttachmentUrl = a.AttachmentUrl,
                AttachmentFileName = a.AttachmentFileName,
                MaxPoints = a.MaxPoints,
                DueDateUtc = a.DueDateUtc,
                IsPublished = a.IsPublished,
                TotalSubmissions = a.Submissions.Count(s => !s.IsDeleted),
                GradedSubmissions = a.Submissions.Count(s => !s.IsDeleted && s.Status == SubmissionStatus.Graded)
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AssignmentDto>>.Ok(assignments);
    }

    public async Task<ApiResponse<AssignmentDto>> GetAssignmentByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var assignment = await _context.Assignments
            .Include(a => a.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(a => a.CourseOffering)
                .ThenInclude(co => co.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Include(a => a.CourseOffering)
                .ThenInclude(co => co.Teacher)
            .Include(a => a.Submissions)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (assignment == null)
        {
            return ApiResponse<AssignmentDto>.Fail("Assignment not found.");
        }

        return ApiResponse<AssignmentDto>.Ok(new AssignmentDto
        {
            Id = assignment.Id,
            CourseOfferingId = assignment.CourseOfferingId,
            SubjectName = assignment.CourseOffering.Subject.Name,
            SubjectCode = assignment.CourseOffering.Subject.Code,
            ClassSectionId = assignment.CourseOffering.ClassSectionId,
            ClassName = assignment.CourseOffering.ClassSection.Class.Name,
            SectionName = assignment.CourseOffering.ClassSection.Name,
            TeacherId = assignment.CourseOffering.TeacherId,
            TeacherName = assignment.CourseOffering.Teacher?.FullName,
            Title = assignment.Title,
            Description = assignment.Description,
            AttachmentUrl = assignment.AttachmentUrl,
            AttachmentFileName = assignment.AttachmentFileName,
            MaxPoints = assignment.MaxPoints,
            DueDateUtc = assignment.DueDateUtc,
            IsPublished = assignment.IsPublished,
            TotalSubmissions = assignment.Submissions.Count(s => !s.IsDeleted),
            GradedSubmissions = assignment.Submissions.Count(s => !s.IsDeleted && s.Status == SubmissionStatus.Graded)
        });
    }

    public async Task<ApiResponse<AssignmentDto>> CreateAssignmentAsync(CreateAssignmentDto dto, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
        {
            return ApiResponse<AssignmentDto>.Fail("Assignment title is required.");
        }

        if (dto.MaxPoints <= 0)
        {
            return ApiResponse<AssignmentDto>.Fail("Max points must be greater than zero.");
        }

        var offering = await _context.CourseOfferings
            .Include(co => co.Subject)
            .Include(co => co.ClassSection)
                .ThenInclude(cs => cs.Class)
            .Include(co => co.Teacher)
            .FirstOrDefaultAsync(co => co.Id == dto.CourseOfferingId, cancellationToken);

        if (offering == null)
        {
            return ApiResponse<AssignmentDto>.Fail("Course offering not found.");
        }

        var assignment = new Assignment
        {
            TenantId = offering.TenantId,
            InstitutionId = offering.InstitutionId,
            CourseOfferingId = offering.Id,
            Title = dto.Title.Trim(),
            Description = dto.Description.Trim(),
            AttachmentUrl = dto.AttachmentUrl,
            AttachmentFileName = dto.AttachmentFileName,
            MaxPoints = dto.MaxPoints,
            DueDateUtc = dto.DueDateUtc,
            IsPublished = dto.IsPublished
        };

        await _context.Assignments.AddAsync(assignment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetAssignmentByIdAsync(assignment.Id, cancellationToken);
    }

    public async Task<ApiResponse<AssignmentSubmissionDto>> SubmitAssignmentAsync(SubmitAssignmentDto dto, CancellationToken cancellationToken = default)
    {
        var assignment = await _context.Assignments
            .Include(a => a.CourseOffering)
            .FirstOrDefaultAsync(a => a.Id == dto.AssignmentId, cancellationToken);

        if (assignment == null)
        {
            return ApiResponse<AssignmentSubmissionDto>.Fail("Assignment not found.");
        }

        var student = await _context.Students
            .FirstOrDefaultAsync(s => s.Id == dto.StudentId, cancellationToken);

        if (student == null)
        {
            return ApiResponse<AssignmentSubmissionDto>.Fail("Student not found.");
        }

        var existingSubmission = await _context.AssignmentSubmissions
            .FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == dto.StudentId, cancellationToken);

        var utcNow = DateTime.UtcNow;
        var isLate = utcNow > assignment.DueDateUtc;
        var status = isLate ? SubmissionStatus.Late : SubmissionStatus.Submitted;

        if (existingSubmission != null)
        {
            // Update existing submission
            existingSubmission.SubmissionText = dto.SubmissionText;
            existingSubmission.FileUrl = dto.FileUrl ?? existingSubmission.FileUrl;
            existingSubmission.FileName = dto.FileName ?? existingSubmission.FileName;
            existingSubmission.SubmittedAtUtc = utcNow;
            existingSubmission.Status = status;

            await _context.SaveChangesAsync(cancellationToken);

            return ApiResponse<AssignmentSubmissionDto>.Ok(new AssignmentSubmissionDto
            {
                Id = existingSubmission.Id,
                AssignmentId = assignment.Id,
                AssignmentTitle = assignment.Title,
                MaxPoints = assignment.MaxPoints,
                DueDateUtc = assignment.DueDateUtc,
                StudentId = student.Id,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                SubmissionText = existingSubmission.SubmissionText,
                FileUrl = existingSubmission.FileUrl,
                FileName = existingSubmission.FileName,
                SubmittedAtUtc = existingSubmission.SubmittedAtUtc,
                Status = existingSubmission.Status,
                ObtainedPoints = existingSubmission.ObtainedPoints,
                TeacherFeedback = existingSubmission.TeacherFeedback
            }, isLate ? "Assignment resubmitted (Late)." : "Assignment resubmitted successfully.");
        }

        var newSubmission = new AssignmentSubmission
        {
            TenantId = assignment.TenantId,
            InstitutionId = assignment.InstitutionId,
            AssignmentId = assignment.Id,
            StudentId = student.Id,
            SubmissionText = dto.SubmissionText,
            FileUrl = dto.FileUrl,
            FileName = dto.FileName,
            SubmittedAtUtc = utcNow,
            Status = status
        };

        await _context.AssignmentSubmissions.AddAsync(newSubmission, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AssignmentSubmissionDto>.Ok(new AssignmentSubmissionDto
        {
            Id = newSubmission.Id,
            AssignmentId = assignment.Id,
            AssignmentTitle = assignment.Title,
            MaxPoints = assignment.MaxPoints,
            DueDateUtc = assignment.DueDateUtc,
            StudentId = student.Id,
            StudentName = student.FullName,
            AdmissionNumber = student.AdmissionNumber,
            SubmissionText = newSubmission.SubmissionText,
            FileUrl = newSubmission.FileUrl,
            FileName = newSubmission.FileName,
            SubmittedAtUtc = newSubmission.SubmittedAtUtc,
            Status = newSubmission.Status
        }, isLate ? "Assignment submitted after deadline (Marked Late)." : "Assignment submitted successfully on time.");
    }

    public async Task<ApiResponse<List<AssignmentSubmissionDto>>> GetAssignmentSubmissionsAsync(
        Guid assignmentId,
        CancellationToken cancellationToken = default)
    {
        var assignment = await _context.Assignments
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment == null)
        {
            return ApiResponse<List<AssignmentSubmissionDto>>.Fail("Assignment not found.");
        }

        var submissions = await _context.AssignmentSubmissions
            .Include(s => s.Student)
            .Include(s => s.GradedBy)
            .Where(s => !s.IsDeleted && s.AssignmentId == assignmentId)
            .OrderBy(s => s.Student.LastName)
            .ThenBy(s => s.Student.FirstName)
            .Select(s => new AssignmentSubmissionDto
            {
                Id = s.Id,
                AssignmentId = assignment.Id,
                AssignmentTitle = assignment.Title,
                MaxPoints = assignment.MaxPoints,
                DueDateUtc = assignment.DueDateUtc,
                StudentId = s.StudentId,
                StudentName = s.Student.FullName,
                AdmissionNumber = s.Student.AdmissionNumber,
                SubmissionText = s.SubmissionText,
                FileUrl = s.FileUrl,
                FileName = s.FileName,
                SubmittedAtUtc = s.SubmittedAtUtc,
                Status = s.Status,
                ObtainedPoints = s.ObtainedPoints,
                TeacherFeedback = s.TeacherFeedback,
                GradedAtUtc = s.GradedAtUtc,
                GradedById = s.GradedById,
                GradedByName = s.GradedBy != null ? s.GradedBy.FullName : null
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AssignmentSubmissionDto>>.Ok(submissions);
    }

    public async Task<ApiResponse<AssignmentSubmissionDto>> GradeSubmissionAsync(
        GradeSubmissionDto dto,
        Guid? teacherStaffId = null,
        CancellationToken cancellationToken = default)
    {
        var submission = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.GradedBy)
            .FirstOrDefaultAsync(s => s.Id == dto.SubmissionId, cancellationToken);

        if (submission == null)
        {
            return ApiResponse<AssignmentSubmissionDto>.Fail("Submission not found.");
        }

        if (dto.ObtainedPoints < 0 || dto.ObtainedPoints > submission.Assignment.MaxPoints)
        {
            return ApiResponse<AssignmentSubmissionDto>.Fail($"Obtained score must be between 0 and {submission.Assignment.MaxPoints}.");
        }

        submission.ObtainedPoints = dto.ObtainedPoints;
        submission.TeacherFeedback = dto.TeacherFeedback?.Trim();
        submission.Status = dto.Status;
        submission.GradedAtUtc = DateTime.UtcNow;

        if (teacherStaffId.HasValue)
        {
            submission.GradedById = teacherStaffId.Value;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AssignmentSubmissionDto>.Ok(new AssignmentSubmissionDto
        {
            Id = submission.Id,
            AssignmentId = submission.AssignmentId,
            AssignmentTitle = submission.Assignment.Title,
            MaxPoints = submission.Assignment.MaxPoints,
            DueDateUtc = submission.Assignment.DueDateUtc,
            StudentId = submission.StudentId,
            StudentName = submission.Student.FullName,
            AdmissionNumber = submission.Student.AdmissionNumber,
            SubmissionText = submission.SubmissionText,
            FileUrl = submission.FileUrl,
            FileName = submission.FileName,
            SubmittedAtUtc = submission.SubmittedAtUtc,
            Status = submission.Status,
            ObtainedPoints = submission.ObtainedPoints,
            TeacherFeedback = submission.TeacherFeedback,
            GradedAtUtc = submission.GradedAtUtc,
            GradedById = submission.GradedById,
            GradedByName = submission.GradedBy?.FullName
        }, "Submission graded successfully.");
    }

    public async Task<ApiResponse<List<AssignmentSubmissionDto>>> GetStudentSubmissionsAsync(
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        var submissions = await _context.AssignmentSubmissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Include(s => s.GradedBy)
            .Where(s => !s.IsDeleted && s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAtUtc)
            .Select(s => new AssignmentSubmissionDto
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                MaxPoints = s.Assignment.MaxPoints,
                DueDateUtc = s.Assignment.DueDateUtc,
                StudentId = s.StudentId,
                StudentName = s.Student.FullName,
                AdmissionNumber = s.Student.AdmissionNumber,
                SubmissionText = s.SubmissionText,
                FileUrl = s.FileUrl,
                FileName = s.FileName,
                SubmittedAtUtc = s.SubmittedAtUtc,
                Status = s.Status,
                ObtainedPoints = s.ObtainedPoints,
                TeacherFeedback = s.TeacherFeedback,
                GradedAtUtc = s.GradedAtUtc,
                GradedById = s.GradedById,
                GradedByName = s.GradedBy != null ? s.GradedBy.FullName : null
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AssignmentSubmissionDto>>.Ok(submissions);
    }

    public async Task<ApiResponse<bool>> DeleteAssignmentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var assignment = await _context.Assignments.FindAsync(new object[] { id }, cancellationToken);
        if (assignment == null)
        {
            return ApiResponse<bool>.Fail("Assignment not found.");
        }

        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Assignment deleted successfully.");
    }
}
