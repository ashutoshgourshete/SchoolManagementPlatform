using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;

namespace SchoolManagement.Business.Services;

public class ExaminationService : IExaminationService
{
    private readonly ApplicationDbContext _context;

    public ExaminationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<ExamDto>>> GetExamsAsync(Guid? courseOfferingId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Exams
            .Include(e => e.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(e => e.CourseOffering)
                .ThenInclude(co => co.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Include(e => e.Results)
            .AsQueryable();

        if (courseOfferingId.HasValue)
        {
            query = query.Where(e => e.CourseOfferingId == courseOfferingId.Value);
        }

        var exams = await query
            .OrderByDescending(e => e.ExamDate)
            .Select(e => new ExamDto
            {
                Id = e.Id,
                CourseOfferingId = e.CourseOfferingId,
                SubjectName = e.CourseOffering.Subject.Name,
                ClassName = e.CourseOffering.ClassSection.Class.Name,
                SectionName = e.CourseOffering.ClassSection.Name,
                Name = e.Name,
                Type = e.Type,
                ExamDate = e.ExamDate,
                MaxMarks = e.MaxMarks,
                PassingMarks = e.PassingMarks,
                ResultsCount = e.Results.Count
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<ExamDto>>.Ok(exams);
    }

    public async Task<ApiResponse<ExamDto>> CreateExamAsync(CreateExamDto dto, CancellationToken cancellationToken = default)
    {
        var exam = new Exam
        {
            AcademicYearId = dto.AcademicYearId,
            CourseOfferingId = dto.CourseOfferingId,
            Name = dto.Name,
            Type = dto.Type,
            ExamDate = dto.ExamDate,
            MaxMarks = dto.MaxMarks,
            PassingMarks = dto.PassingMarks
        };

        await _context.Exams.AddAsync(exam, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var offering = await _context.CourseOfferings
            .Include(co => co.Subject)
            .Include(co => co.ClassSection)
                .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(co => co.Id == dto.CourseOfferingId, cancellationToken);

        return ApiResponse<ExamDto>.Ok(new ExamDto
        {
            Id = exam.Id,
            CourseOfferingId = exam.CourseOfferingId,
            SubjectName = offering?.Subject.Name ?? string.Empty,
            ClassName = offering?.ClassSection.Class.Name ?? string.Empty,
            SectionName = offering?.ClassSection.Name ?? string.Empty,
            Name = exam.Name,
            Type = exam.Type,
            ExamDate = exam.ExamDate,
            MaxMarks = exam.MaxMarks,
            PassingMarks = exam.PassingMarks,
            ResultsCount = 0
        }, "Exam created successfully");
    }

    public async Task<ApiResponse<List<ExamResultDto>>> GetExamResultsAsync(Guid examId, CancellationToken cancellationToken = default)
    {
        var exam = await _context.Exams
            .Include(e => e.CourseOffering)
            .FirstOrDefaultAsync(e => e.Id == examId, cancellationToken);

        if (exam == null) return ApiResponse<List<ExamResultDto>>.Fail("Exam not found");

        // Get students enrolled in this offering's class section
        var enrolledStudents = await _context.Enrollments
            .Include(e => e.Student)
            .Where(e => e.ClassSectionId == exam.CourseOffering.ClassSectionId && e.IsActive && !e.IsDeleted)
            .Select(e => e.Student)
            .ToListAsync(cancellationToken);

        var existingResults = await _context.ExamResults
            .Where(er => er.ExamId == examId)
            .ToListAsync(cancellationToken);

        var dtos = new List<ExamResultDto>();

        foreach (var student in enrolledStudents)
        {
            var res = existingResults.FirstOrDefault(r => r.StudentId == student.Id);
            dtos.Add(new ExamResultDto
            {
                Id = res?.Id ?? Guid.Empty,
                ExamId = examId,
                ExamName = exam.Name,
                StudentId = student.Id,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                MarksObtained = res?.MarksObtained ?? 0m,
                MaxMarks = exam.MaxMarks,
                Grade = res?.Grade ?? CalculateGrade(res?.MarksObtained ?? 0m, exam.MaxMarks),
                IsAbsent = res?.IsAbsent ?? false,
                Remarks = res?.Remarks
            });
        }

        return ApiResponse<List<ExamResultDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<bool>> SubmitBulkExamResultsAsync(BulkExamResultDto dto, CancellationToken cancellationToken = default)
    {
        var exam = await _context.Exams.FindAsync(new object[] { dto.ExamId }, cancellationToken);
        if (exam == null) return ApiResponse<bool>.Fail("Exam not found");

        var existing = await _context.ExamResults
            .Where(er => er.ExamId == dto.ExamId)
            .ToListAsync(cancellationToken);

        foreach (var item in dto.Results)
        {
            var result = existing.FirstOrDefault(r => r.StudentId == item.StudentId);
            var grade = item.IsAbsent ? "AB" : CalculateGrade(item.MarksObtained, exam.MaxMarks);

            if (result != null)
            {
                result.MarksObtained = item.MarksObtained;
                result.Grade = grade;
                result.IsAbsent = item.IsAbsent;
                result.Remarks = item.Remarks;
            }
            else
            {
                await _context.ExamResults.AddAsync(new ExamResult
                {
                    ExamId = dto.ExamId,
                    StudentId = item.StudentId,
                    MarksObtained = item.MarksObtained,
                    Grade = grade,
                    IsAbsent = item.IsAbsent,
                    Remarks = item.Remarks
                }, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Exam results recorded successfully");
    }

    public async Task<ApiResponse<StudentReportCardDto>> GetStudentReportCardAsync(Guid studentId, Guid academicYearId, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students
            .Include(s => s.Enrollments)
                .ThenInclude(e => e.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(s => s.Id == studentId, cancellationToken);

        if (student == null) return ApiResponse<StudentReportCardDto>.Fail("Student not found");

        var activeEnrollment = student.Enrollments.FirstOrDefault(e => e.AcademicYearId == academicYearId && e.IsActive);
        var academicYear = await _context.AcademicYears.FindAsync(new object[] { academicYearId }, cancellationToken);

        var results = await _context.ExamResults
            .Include(r => r.Exam)
                .ThenInclude(e => e.CourseOffering)
                    .ThenInclude(co => co.Subject)
            .Where(r => r.StudentId == studentId && r.Exam.AcademicYearId == academicYearId)
            .ToListAsync(cancellationToken);

        var subjectResults = results.Select(r => new SubjectResultItemDto
        {
            SubjectName = r.Exam.CourseOffering.Subject.Name,
            ExamName = r.Exam.Name,
            MarksObtained = r.MarksObtained,
            MaxMarks = r.Exam.MaxMarks,
            Grade = r.Grade,
            IsAbsent = r.IsAbsent
        }).ToList();

        var totalObtained = results.Where(r => !r.IsAbsent).Sum(r => r.MarksObtained);
        var totalMax = results.Sum(r => r.Exam.MaxMarks);

        var reportCard = new StudentReportCardDto
        {
            StudentId = student.Id,
            StudentName = student.FullName,
            AdmissionNumber = student.AdmissionNumber,
            ClassName = activeEnrollment?.ClassSection.Class.Name ?? "N/A",
            SectionName = activeEnrollment?.ClassSection.Name ?? "N/A",
            AcademicYear = academicYear?.Name ?? "N/A",
            SubjectResults = subjectResults,
            TotalMarksObtained = totalObtained,
            TotalMaxMarks = totalMax,
            OverallGrade = CalculateGrade(totalObtained, totalMax)
        };

        return ApiResponse<StudentReportCardDto>.Ok(reportCard);
    }

    private static string CalculateGrade(decimal marks, decimal maxMarks)
    {
        if (maxMarks <= 0) return "N/A";
        var percentage = (marks / maxMarks) * 100m;

        if (percentage >= 90m) return "A+";
        if (percentage >= 80m) return "A";
        if (percentage >= 70m) return "B+";
        if (percentage >= 60m) return "B";
        if (percentage >= 50m) return "C";
        if (percentage >= 35m) return "D";
        return "F";
    }
}
