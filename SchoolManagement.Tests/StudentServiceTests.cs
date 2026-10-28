using SchoolManagement.Business.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Enums;
using Xunit;

namespace SchoolManagement.Tests;

public class StudentServiceTests
{
    [Fact]
    public async Task CreateStudent_ShouldSucceed_AndPreventDuplicateAdmissionNumber()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var institutionId = Guid.NewGuid();

        var (context, tenantService) = TestDbContextFactory.Create(dbName, tenantId, institutionId);
        var studentService = new StudentService(context);

        var dto1 = new CreateStudentDto
        {
            AdmissionNumber = "ADM-1001",
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(2012, 1, 1),
            Gender = Gender.Male,
            Guardian = new CreateGuardianDto
            {
                FirstName = "Robert",
                LastName = "Doe",
                Relationship = GuardianRelationship.Father,
                Email = "robert.doe@example.com",
                Phone = "9876543210"
            }
        };

        // 1. First admission should succeed
        var result1 = await studentService.CreateStudentAsync(dto1);
        Assert.True(result1.Success);
        Assert.NotNull(result1.Data);
        Assert.Equal("ADM-1001", result1.Data.AdmissionNumber);
        Assert.Single(result1.Data.Guardians);

        // 2. Duplicate admission number should fail
        var dto2 = new CreateStudentDto
        {
            AdmissionNumber = "ADM-1001",
            FirstName = "Duplicate",
            LastName = "Student",
            DateOfBirth = new DateTime(2013, 2, 2)
        };

        var result2 = await studentService.CreateStudentAsync(dto2);
        Assert.False(result2.Success);
        Assert.Contains("already exists", result2.Message);
    }

    [Fact]
    public async Task GetStudents_ShouldFilterBySearchTerm()
    {
        var dbName = Guid.NewGuid().ToString();
        var tenantId = Guid.NewGuid();
        var (context, _) = TestDbContextFactory.Create(dbName, tenantId);
        var studentService = new StudentService(context);

        await studentService.CreateStudentAsync(new CreateStudentDto { AdmissionNumber = "A1", FirstName = "Albert", LastName = "Einstein" });
        await studentService.CreateStudentAsync(new CreateStudentDto { AdmissionNumber = "A2", FirstName = "Isaac", LastName = "Newton" });

        var filter = new PaginationFilter { SearchTerm = "Albert" };
        var paged = await studentService.GetStudentsAsync(filter);

        Assert.True(paged.Success);
        Assert.Equal(1, paged.Data!.TotalCount);
        Assert.Equal("Albert", paged.Data.Items[0].FirstName);
    }
}
