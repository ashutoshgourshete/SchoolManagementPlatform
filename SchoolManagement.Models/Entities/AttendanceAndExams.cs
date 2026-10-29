using SchoolManagement.Models.Common;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.Entities;

public class AttendanceRecord : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid ClassSectionId { get; set; }
    public ClassSection ClassSection { get; set; } = null!;

    public DateTime Date { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
    public string? Remarks { get; set; }
    public Guid? MarkedById { get; set; }
    public Staff? MarkedBy { get; set; }
}

public class Exam : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid CourseOfferingId { get; set; }
    public CourseOffering CourseOffering { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public ExamType Type { get; set; } = ExamType.MidTerm;
    public DateTime ExamDate { get; set; }
    public decimal MaxMarks { get; set; } = 100m;
    public decimal PassingMarks { get; set; } = 35m;

    public ICollection<ExamResult> Results { get; set; } = new List<ExamResult>();
}

public class ExamResult : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid ExamId { get; set; }
    public Exam Exam { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public decimal MarksObtained { get; set; }
    public string? Grade { get; set; }
    public bool IsAbsent { get; set; } = false;
    public string? Remarks { get; set; }
}

public class Announcement : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "All"; // "All", "Staff", "Students", "Parents"
    public DateTime PublishedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAtUtc { get; set; }
    public bool IsPinned { get; set; } = false;
}

public class Assignment : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid CourseOfferingId { get; set; }
    public CourseOffering CourseOffering { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public decimal MaxPoints { get; set; } = 100m;
    public DateTime DueDateUtc { get; set; }
    public bool IsPublished { get; set; } = true;

    public ICollection<AssignmentSubmission> Submissions { get; set; } = new List<AssignmentSubmission>();
}

public class AssignmentSubmission : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public string? SubmissionText { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public decimal? ObtainedPoints { get; set; }
    public string? TeacherFeedback { get; set; }
    public DateTime? GradedAtUtc { get; set; }
    public Guid? GradedById { get; set; }
    public Staff? GradedBy { get; set; }
}
