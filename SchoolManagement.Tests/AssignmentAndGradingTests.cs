using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Services;
using SchoolManagement.Data;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;
using Xunit;

namespace SchoolManagement.Tests;

public class AssignmentAndGradingTests
{
    private async Task<(ApplicationDbContext Context, Guid TenantId, Guid InstitutionId, CourseOffering Offering, Student Student, Staff Teacher)> SetupTestDataAsync()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var institutionId = Guid.NewGuid();

        var (context, _) = TestDbContextFactory.Create(dbName, tenantId, institutionId);

        var year = new AcademicYear
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Name = "2026-2027",
            StartDate = DateTime.UtcNow,
            EndDate = DateTime.UtcNow.AddYears(1),
            IsCurrent = true
        };
        await context.AcademicYears.AddAsync(year);

        var class10 = new Class
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYear = year,
            Name = "Grade 10"
        };
        await context.Classes.AddAsync(class10);

        var sectionA = new ClassSection
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Class = class10,
            Name = "A"
        };
        await context.ClassSections.AddAsync(sectionA);

        var teacher = new Staff
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            EmployeeCode = "EMP-T201",
            FirstName = "Suresh",
            LastName = "Menon",
            Email = "suresh.menon@school.com",
            Designation = "Science Teacher"
        };
        await context.StaffMembers.AddAsync(teacher);

        var subject = new Subject
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Name = "Physics",
            Code = "PHY-10"
        };
        await context.Subjects.AddAsync(subject);

        var offering = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYear = year,
            ClassSection = sectionA,
            Subject = subject,
            Teacher = teacher
        };
        await context.CourseOfferings.AddAsync(offering);

        var student = new Student
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AdmissionNumber = "ADM-STU-99",
            FirstName = "Aarav",
            LastName = "Sharma",
            IsActive = true
        };
        await context.Students.AddAsync(student);
        await context.SaveChangesAsync();

        return (context, tenantId, institutionId, offering, student, teacher);
    }

    [Fact]
    public async Task CreateAssignment_ShouldSucceed_WithValidPointsAndDueDate()
    {
        var (context, _, _, offering, _, _) = await SetupTestDataAsync();
        var assignmentService = new AssignmentService(context);

        var dto = new CreateAssignmentDto
        {
            CourseOfferingId = offering.Id,
            Title = "Newton's Laws of Motion Problem Set",
            Description = "Solve problems 1 to 10 on page 42 and upload scanned work.",
            MaxPoints = 50m,
            DueDateUtc = DateTime.UtcNow.AddDays(7),
            AttachmentFileName = "ProblemSet1.pdf",
            AttachmentUrl = "https://cdn.edumanage.com/docs/ProblemSet1.pdf"
        };

        var result = await assignmentService.CreateAssignmentAsync(dto);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Newton's Laws of Motion Problem Set", result.Data.Title);
        Assert.Equal(50m, result.Data.MaxPoints);
        Assert.Equal("Physics", result.Data.SubjectName);
        Assert.Equal(0, result.Data.TotalSubmissions);
    }

    [Fact]
    public async Task SubmitAssignment_OnTime_ShouldMarkStatusSubmitted()
    {
        var (context, _, _, offering, student, _) = await SetupTestDataAsync();
        var assignmentService = new AssignmentService(context);

        var assignment = await assignmentService.CreateAssignmentAsync(new CreateAssignmentDto
        {
            CourseOfferingId = offering.Id,
            Title = "Kinematics Worksheet",
            Description = "Complete all questions.",
            MaxPoints = 100m,
            DueDateUtc = DateTime.UtcNow.AddDays(3) // Due in future
        });

        var submitDto = new SubmitAssignmentDto
        {
            AssignmentId = assignment.Data!.Id,
            StudentId = student.Id,
            SubmissionText = "Please find my answers attached in the PDF.",
            FileName = "Aarav_Physics_Worksheet.pdf",
            FileUrl = "https://cdn.edumanage.com/submissions/Aarav_HW.pdf"
        };

        var submission = await assignmentService.SubmitAssignmentAsync(submitDto);

        Assert.True(submission.Success);
        Assert.NotNull(submission.Data);
        Assert.Equal(SubmissionStatus.Submitted, submission.Data.Status);
        Assert.Contains("on time", submission.Message);
    }

    [Fact]
    public async Task SubmitAssignment_AfterDeadline_ShouldMarkStatusLate()
    {
        var (context, _, _, offering, student, _) = await SetupTestDataAsync();
        var assignmentService = new AssignmentService(context);

        var assignment = await assignmentService.CreateAssignmentAsync(new CreateAssignmentDto
        {
            CourseOfferingId = offering.Id,
            Title = "Past Due Assignment",
            Description = "Was due yesterday.",
            MaxPoints = 100m,
            DueDateUtc = DateTime.UtcNow.AddDays(-1) // Already past deadline
        });

        var submitDto = new SubmitAssignmentDto
        {
            AssignmentId = assignment.Data!.Id,
            StudentId = student.Id,
            SubmissionText = "Late submission due to power outage."
        };

        var submission = await assignmentService.SubmitAssignmentAsync(submitDto);

        Assert.True(submission.Success);
        Assert.NotNull(submission.Data);
        Assert.Equal(SubmissionStatus.Late, submission.Data.Status);
        Assert.Contains("Late", submission.Message);
    }

    [Fact]
    public async Task GradeSubmission_ShouldUpdateScoreAndFeedback_AndPreventOverMaxPoints()
    {
        var (context, _, _, offering, student, teacher) = await SetupTestDataAsync();
        var assignmentService = new AssignmentService(context);

        var assignment = await assignmentService.CreateAssignmentAsync(new CreateAssignmentDto
        {
            CourseOfferingId = offering.Id,
            Title = "Optics Lab Report",
            Description = "Lab observations.",
            MaxPoints = 50m,
            DueDateUtc = DateTime.UtcNow.AddDays(2)
        });

        var submission = await assignmentService.SubmitAssignmentAsync(new SubmitAssignmentDto
        {
            AssignmentId = assignment.Data!.Id,
            StudentId = student.Id,
            SubmissionText = "Lab observations completed."
        });

        // 1. Invalid grade (over MaxPoints 50)
        var invalidGrade = await assignmentService.GradeSubmissionAsync(new GradeSubmissionDto
        {
            SubmissionId = submission.Data!.Id,
            ObtainedPoints = 65m, // Exceeds 50
            TeacherFeedback = "Exceeds max points test"
        });
        Assert.False(invalidGrade.Success);
        Assert.Contains("between 0 and 50", invalidGrade.Message);

        // 2. Valid grade (46 / 50)
        var validGrade = await assignmentService.GradeSubmissionAsync(new GradeSubmissionDto
        {
            SubmissionId = submission.Data.Id,
            ObtainedPoints = 46m,
            TeacherFeedback = "Excellent analysis and diagrams!",
            Status = SubmissionStatus.Graded
        }, teacher.Id);

        Assert.True(validGrade.Success);
        Assert.NotNull(validGrade.Data);
        Assert.Equal(46m, validGrade.Data.ObtainedPoints);
        Assert.Equal(SubmissionStatus.Graded, validGrade.Data.Status);
        Assert.Equal("Excellent analysis and diagrams!", validGrade.Data.TeacherFeedback);
    }
}
