using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Services;
using SchoolManagement.Data;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using Xunit;

namespace SchoolManagement.Tests;

public class TimetableAndSchedulingTests
{
    private async Task<(ApplicationDbContext Context, Guid TenantId, Guid InstitutionId, AcademicYear Year, ClassSection SectionA, ClassSection SectionB, Staff Teacher, Subject Math, Subject Science)> SetupTestDataAsync()
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
            Name = "Grade 10",
            Code = "G10"
        };
        await context.Classes.AddAsync(class10);

        var sectionA = new ClassSection
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Class = class10,
            Name = "A",
            RoomNumber = "Room-101",
            Capacity = 40
        };
        var sectionB = new ClassSection
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Class = class10,
            Name = "B",
            RoomNumber = "Room-102",
            Capacity = 40
        };
        await context.ClassSections.AddRangeAsync(sectionA, sectionB);

        var teacher = new Staff
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            EmployeeCode = "EMP-T101",
            FirstName = "Vikram",
            LastName = "Patil",
            Email = "vikram.patil@school.com",
            Designation = "Senior Teacher",
            IsActive = true
        };
        await context.StaffMembers.AddAsync(teacher);

        var math = new Subject
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Name = "Mathematics",
            Code = "MATH-10",
            Credits = 4.0m
        };
        var science = new Subject
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            Name = "Science",
            Code = "SCI-10",
            Credits = 4.0m
        };
        await context.Subjects.AddRangeAsync(math, science);
        await context.SaveChangesAsync();

        return (context, tenantId, institutionId, year, sectionA, sectionB, teacher, math, science);
    }

    [Fact]
    public async Task ScheduleSlot_ShouldSucceed_WhenNoCollisionsExist()
    {
        var (context, tenantId, institutionId, year, sectionA, _, teacher, math, _) = await SetupTestDataAsync();
        var timetableService = new TimetableService(context);

        var offering = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionA.Id,
            SubjectId = math.Id,
            TeacherId = teacher.Id
        };
        await context.CourseOfferings.AddAsync(offering);
        await context.SaveChangesAsync();

        var slotDto = new ScheduleSlotDto
        {
            CourseOfferingId = offering.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(9, 0, 0), // 09:00 AM
            EndTime = new TimeSpan(10, 0, 0),  // 10:00 AM
            RoomNumber = "Room-101"
        };

        var result = await timetableService.ScheduleSlotAsync(slotDto);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Mathematics", result.Data.SubjectName);
        Assert.Equal("Grade 10", result.Data.ClassName);
        Assert.Equal("A", result.Data.SectionName);
        Assert.Equal("Room-101", result.Data.RoomNumber);
    }

    [Fact]
    public async Task DetectConflicts_ShouldDetectTeacherCollision_WhenTeacherAlreadyAssigned()
    {
        var (context, tenantId, institutionId, year, sectionA, sectionB, teacher, math, science) = await SetupTestDataAsync();
        var timetableService = new TimetableService(context);

        // Offering 1: Math with Section A taught by Vikram
        var offering1 = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionA.Id,
            SubjectId = math.Id,
            TeacherId = teacher.Id
        };
        // Offering 2: Science with Section B ALSO taught by Vikram
        var offering2 = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionB.Id,
            SubjectId = science.Id,
            TeacherId = teacher.Id
        };
        await context.CourseOfferings.AddRangeAsync(offering1, offering2);
        await context.SaveChangesAsync();

        // Schedule Slot 1: Monday 09:00 - 10:00 in Section A
        await timetableService.ScheduleSlotAsync(new ScheduleSlotDto
        {
            CourseOfferingId = offering1.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(10, 0, 0),
            RoomNumber = "Room-101"
        });

        // Attempt to Schedule Slot 2 for Section B during overlapping time: Monday 09:30 - 10:30 with same teacher
        var overlappingSlotDto = new ScheduleSlotDto
        {
            CourseOfferingId = offering2.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(9, 30, 0),
            EndTime = new TimeSpan(10, 30, 0),
            RoomNumber = "Room-102"
        };

        var conflict = await timetableService.DetectConflictsAsync(overlappingSlotDto);
        Assert.True(conflict.Success);
        Assert.True(conflict.Data!.HasConflict);
        Assert.True(conflict.Data.TeacherConflict);
        Assert.Contains("Vikram Patil is already booked", conflict.Data.TeacherConflictDetails);

        // Scheduling should also be rejected
        var scheduleResult = await timetableService.ScheduleSlotAsync(overlappingSlotDto);
        Assert.False(scheduleResult.Success);
        Assert.Contains("collisions", scheduleResult.Message);
    }

    [Fact]
    public async Task DetectConflicts_ShouldDetectRoomCollision_WhenRoomAlreadyAllocated()
    {
        var (context, tenantId, institutionId, year, sectionA, sectionB, teacher, math, science) = await SetupTestDataAsync();
        var timetableService = new TimetableService(context);

        // Teacher 2 for Section B
        var teacher2 = new Staff
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            EmployeeCode = "EMP-T102",
            FirstName = "Anita",
            LastName = "Desai",
            Email = "anita.desai@school.com"
        };
        await context.StaffMembers.AddAsync(teacher2);

        var offering1 = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionA.Id,
            SubjectId = math.Id,
            TeacherId = teacher.Id
        };
        var offering2 = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionB.Id,
            SubjectId = science.Id,
            TeacherId = teacher2.Id
        };
        await context.CourseOfferings.AddRangeAsync(offering1, offering2);
        await context.SaveChangesAsync();

        // Book Room-LAB-1 for Section A from 11:00 to 12:00 on Wednesday
        await timetableService.ScheduleSlotAsync(new ScheduleSlotDto
        {
            CourseOfferingId = offering1.Id,
            DayOfWeek = DayOfWeek.Wednesday,
            StartTime = new TimeSpan(11, 0, 0),
            EndTime = new TimeSpan(12, 0, 0),
            RoomNumber = "Room-LAB-1"
        });

        // Attempt to book the same Room-LAB-1 for Section B from 11:30 to 12:30 on Wednesday
        var roomClashDto = new ScheduleSlotDto
        {
            CourseOfferingId = offering2.Id,
            DayOfWeek = DayOfWeek.Wednesday,
            StartTime = new TimeSpan(11, 30, 0),
            EndTime = new TimeSpan(12, 30, 0),
            RoomNumber = "Room-LAB-1"
        };

        var conflict = await timetableService.DetectConflictsAsync(roomClashDto);
        Assert.True(conflict.Data!.RoomConflict);
        Assert.Contains("Room Room-LAB-1 is already allocated", conflict.Data.RoomConflictDetails);
    }

    [Fact]
    public async Task GetWeeklyTimetable_ShouldReturnStructuredWeeklyGrid()
    {
        var (context, tenantId, institutionId, year, sectionA, _, teacher, math, science) = await SetupTestDataAsync();
        var timetableService = new TimetableService(context);

        var offering1 = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionA.Id,
            SubjectId = math.Id,
            TeacherId = teacher.Id
        };
        var offering2 = new CourseOffering
        {
            TenantId = tenantId,
            InstitutionId = institutionId,
            AcademicYearId = year.Id,
            ClassSectionId = sectionA.Id,
            SubjectId = science.Id,
            TeacherId = teacher.Id
        };
        await context.CourseOfferings.AddRangeAsync(offering1, offering2);
        await context.SaveChangesAsync();

        // Monday slots
        await timetableService.ScheduleSlotAsync(new ScheduleSlotDto
        {
            CourseOfferingId = offering1.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(9, 50, 0),
            RoomNumber = "Room-101"
        });
        await timetableService.ScheduleSlotAsync(new ScheduleSlotDto
        {
            CourseOfferingId = offering2.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(10, 50, 0),
            RoomNumber = "Room-101"
        });

        var weekly = await timetableService.GetClassSectionWeeklyTimetableAsync(sectionA.Id);

        Assert.True(weekly.Success);
        Assert.NotNull(weekly.Data);
        Assert.Equal(6, weekly.Data.Days.Count); // Monday through Saturday
        var monday = weekly.Data.Days.First(d => d.DayOfWeek == DayOfWeek.Monday);
        Assert.Equal(2, monday.Slots.Count);
        Assert.Equal("Mathematics", monday.Slots[0].SubjectName);
        Assert.Equal("Science", monday.Slots[1].SubjectName);
    }
}
