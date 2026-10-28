using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.DTOs;

public class AttendanceRecordDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public Guid ClassSectionId { get; set; }
    public DateTime Date { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Remarks { get; set; }
}

public class MarkAttendanceDto
{
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? Remarks { get; set; }
}

public class BulkAttendanceDto
{
    public Guid ClassSectionId { get; set; }
    public DateTime Date { get; set; }
    public List<MarkAttendanceDto> Records { get; set; } = new();
}

public class AttendanceSummaryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int TotalDays { get; set; }
    public int PresentDays { get; set; }
    public int AbsentDays { get; set; }
    public int LateDays { get; set; }
    public double AttendancePercentage => TotalDays > 0 ? Math.Round((double)PresentDays / TotalDays * 100, 2) : 0;
}

public class ExamDto
{
    public Guid Id { get; set; }
    public Guid CourseOfferingId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public ExamType Type { get; set; }
    public DateTime ExamDate { get; set; }
    public decimal MaxMarks { get; set; }
    public decimal PassingMarks { get; set; }
    public int ResultsCount { get; set; }
}

public class CreateExamDto
{
    public Guid AcademicYearId { get; set; }
    public Guid CourseOfferingId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ExamType Type { get; set; } = ExamType.MidTerm;
    public DateTime ExamDate { get; set; }
    public decimal MaxMarks { get; set; } = 100m;
    public decimal PassingMarks { get; set; } = 35m;
}

public class ExamResultDto
{
    public Guid Id { get; set; }
    public Guid ExamId { get; set; }
    public string ExamName { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
    public string? Grade { get; set; }
    public bool IsAbsent { get; set; }
    public string? Remarks { get; set; }
}

public class SubmitExamResultDto
{
    public Guid ExamId { get; set; }
    public Guid StudentId { get; set; }
    public decimal MarksObtained { get; set; }
    public bool IsAbsent { get; set; } = false;
    public string? Remarks { get; set; }
}

public class BulkExamResultDto
{
    public Guid ExamId { get; set; }
    public List<SubmitExamResultDto> Results { get; set; } = new();
}

public class StudentReportCardDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public List<SubjectResultItemDto> SubjectResults { get; set; } = new();
    public decimal TotalMarksObtained { get; set; }
    public decimal TotalMaxMarks { get; set; }
    public double Percentage => TotalMaxMarks > 0 ? Math.Round((double)TotalMarksObtained / (double)TotalMaxMarks * 100, 2) : 0;
    public string OverallGrade { get; set; } = string.Empty;
}

public class SubjectResultItemDto
{
    public string SubjectName { get; set; } = string.Empty;
    public string ExamName { get; set; } = string.Empty;
    public decimal MarksObtained { get; set; }
    public decimal MaxMarks { get; set; }
    public string? Grade { get; set; }
    public bool IsAbsent { get; set; }
}

public class AnnouncementDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "All";
    public DateTime PublishedAtUtc { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
    public bool IsPinned { get; set; }
}

public class CreateAnnouncementDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "All";
    public DateTime? ExpiresAtUtc { get; set; }
    public bool IsPinned { get; set; } = false;
}
