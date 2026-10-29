using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.DTOs;

public class AssignmentDto
{
    public Guid Id { get; set; }
    public Guid CourseOfferingId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public Guid ClassSectionId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public Guid? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public decimal MaxPoints { get; set; }
    public DateTime DueDateUtc { get; set; }
    public bool IsPublished { get; set; }
    public int TotalSubmissions { get; set; }
    public int GradedSubmissions { get; set; }
}

public class CreateAssignmentDto
{
    public Guid CourseOfferingId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentFileName { get; set; }
    public decimal MaxPoints { get; set; } = 100m;
    public DateTime DueDateUtc { get; set; }
    public bool IsPublished { get; set; } = true;
}

public class AssignmentSubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public string AssignmentTitle { get; set; } = string.Empty;
    public decimal MaxPoints { get; set; }
    public DateTime DueDateUtc { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? SubmissionText { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime SubmittedAtUtc { get; set; }
    public SubmissionStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public decimal? ObtainedPoints { get; set; }
    public string? TeacherFeedback { get; set; }
    public DateTime? GradedAtUtc { get; set; }
    public Guid? GradedById { get; set; }
    public string? GradedByName { get; set; }
}

public class SubmitAssignmentDto
{
    public Guid AssignmentId { get; set; }
    public Guid StudentId { get; set; }
    public string? SubmissionText { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
}

public class GradeSubmissionDto
{
    public Guid SubmissionId { get; set; }
    public decimal ObtainedPoints { get; set; }
    public string? TeacherFeedback { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Graded;
}
