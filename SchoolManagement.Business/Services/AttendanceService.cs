using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class AttendanceService : IAttendanceService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public AttendanceService(ApplicationDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<List<AttendanceRecordDto>>> GetAttendanceAsync(Guid classSectionId, DateTime date, CancellationToken cancellationToken = default)
    {
        var targetDate = date.Date;

        // Fetch enrolled students for this class section
        var enrolledStudents = await _context.Enrollments
            .Include(e => e.Student)
            .Where(e => e.ClassSectionId == classSectionId && e.IsActive && !e.IsDeleted)
            .OrderBy(e => e.RollNumber)
            .ThenBy(e => e.Student.LastName)
            .Select(e => e.Student)
            .ToListAsync(cancellationToken);

        // Fetch existing attendance records for that day
        var existingRecords = await _context.AttendanceRecords
            .Where(ar => ar.ClassSectionId == classSectionId && ar.Date.Date == targetDate)
            .ToListAsync(cancellationToken);

        var list = new List<AttendanceRecordDto>();

        foreach (var student in enrolledStudents)
        {
            var record = existingRecords.FirstOrDefault(r => r.StudentId == student.Id);
            list.Add(new AttendanceRecordDto
            {
                Id = record?.Id ?? Guid.Empty,
                StudentId = student.Id,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                RollNumber = student.RollNumber,
                ClassSectionId = classSectionId,
                Date = targetDate,
                Status = record?.Status ?? AttendanceStatus.Present,
                Remarks = record?.Remarks
            });
        }

        return ApiResponse<List<AttendanceRecordDto>>.Ok(list);
    }

    public async Task<ApiResponse<bool>> SaveBulkAttendanceAsync(BulkAttendanceDto dto, CancellationToken cancellationToken = default)
    {
        var targetDate = dto.Date.Date;

        var existing = await _context.AttendanceRecords
            .Where(ar => ar.ClassSectionId == dto.ClassSectionId && ar.Date.Date == targetDate)
            .ToListAsync(cancellationToken);

        foreach (var item in dto.Records)
        {
            var record = existing.FirstOrDefault(r => r.StudentId == item.StudentId);
            if (record != null)
            {
                record.Status = item.Status;
                record.Remarks = item.Remarks;
                record.MarkedById = _currentTenantService.UserId;
            }
            else
            {
                await _context.AttendanceRecords.AddAsync(new AttendanceRecord
                {
                    ClassSectionId = dto.ClassSectionId,
                    StudentId = item.StudentId,
                    Date = targetDate,
                    Status = item.Status,
                    Remarks = item.Remarks,
                    MarkedById = _currentTenantService.UserId
                }, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Attendance recorded successfully");
    }

    public async Task<ApiResponse<AttendanceSummaryDto>> GetStudentAttendanceSummaryAsync(Guid studentId, Guid academicYearId, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { studentId }, cancellationToken);
        if (student == null) return ApiResponse<AttendanceSummaryDto>.Fail("Student not found");

        var academicYear = await _context.AcademicYears.FindAsync(new object[] { academicYearId }, cancellationToken);
        if (academicYear == null) return ApiResponse<AttendanceSummaryDto>.Fail("Academic year not found");

        var records = await _context.AttendanceRecords
            .Where(ar => ar.StudentId == studentId && ar.Date >= academicYear.StartDate && ar.Date <= academicYear.EndDate)
            .ToListAsync(cancellationToken);

        var total = records.Count;
        var present = records.Count(r => r.Status == AttendanceStatus.Present || r.Status == AttendanceStatus.HalfDay);
        var absent = records.Count(r => r.Status == AttendanceStatus.Absent);
        var late = records.Count(r => r.Status == AttendanceStatus.Late);

        var summary = new AttendanceSummaryDto
        {
            StudentId = student.Id,
            StudentName = student.FullName,
            TotalDays = total,
            PresentDays = present,
            AbsentDays = absent,
            LateDays = late
        };

        return ApiResponse<AttendanceSummaryDto>.Ok(summary);
    }
}
