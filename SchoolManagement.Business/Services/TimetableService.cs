using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;

namespace SchoolManagement.Business.Services;

public class TimetableService : ITimetableService
{
    private readonly ApplicationDbContext _context;

    public TimetableService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<ConflictDetectionResultDto>> DetectConflictsAsync(
        ScheduleSlotDto dto,
        Guid? excludeSlotId = null,
        CancellationToken cancellationToken = default)
    {
        if (dto.StartTime >= dto.EndTime)
        {
            return ApiResponse<ConflictDetectionResultDto>.Fail("Start time must be earlier than end time.");
        }

        var offering = await _context.CourseOfferings
            .Include(co => co.Subject)
            .Include(co => co.Teacher)
            .Include(co => co.ClassSection)
                .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(co => co.Id == dto.CourseOfferingId, cancellationToken);

        if (offering == null)
        {
            return ApiResponse<ConflictDetectionResultDto>.Fail("Course offering not found.");
        }

        var result = new ConflictDetectionResultDto();

        // 1. Query all overlapping slots on the same day across the institution
        var overlappingSlotsQuery = _context.Timetables
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Teacher)
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Where(t => !t.IsDeleted &&
                        t.DayOfWeek == dto.DayOfWeek &&
                        t.StartTime < dto.EndTime &&
                        t.EndTime > dto.StartTime);

        if (excludeSlotId.HasValue)
        {
            overlappingSlotsQuery = overlappingSlotsQuery.Where(t => t.Id != excludeSlotId.Value);
        }

        var overlappingSlots = await overlappingSlotsQuery.ToListAsync(cancellationToken);

        // 2. Check Teacher Conflict
        if (offering.TeacherId.HasValue)
        {
            var teacherClash = overlappingSlots.FirstOrDefault(t => t.CourseOffering.TeacherId == offering.TeacherId.Value);
            if (teacherClash != null)
            {
                result.TeacherConflict = true;
                result.TeacherConflictDetails =
                    $"Teacher {offering.Teacher?.FullName ?? "Unknown"} is already booked for " +
                    $"{teacherClash.CourseOffering.Subject.Name} with {teacherClash.CourseOffering.ClassSection.Class.Name}-{teacherClash.CourseOffering.ClassSection.Name} " +
                    $"from {teacherClash.StartTime:hh\\:mm} to {teacherClash.EndTime:hh\\:mm} on {dto.DayOfWeek}.";
            }
        }

        // 3. Check Room Allocation Conflict
        var room = !string.IsNullOrWhiteSpace(dto.RoomNumber)
            ? dto.RoomNumber.Trim()
            : offering.ClassSection.RoomNumber?.Trim();

        if (!string.IsNullOrWhiteSpace(room))
        {
            var roomClash = overlappingSlots.FirstOrDefault(t =>
                string.Equals(t.RoomNumber?.Trim(), room, StringComparison.OrdinalIgnoreCase) ||
                (string.IsNullOrWhiteSpace(t.RoomNumber) && string.Equals(t.CourseOffering.ClassSection.RoomNumber?.Trim(), room, StringComparison.OrdinalIgnoreCase)));

            if (roomClash != null)
            {
                result.RoomConflict = true;
                result.RoomConflictDetails =
                    $"Room {room} is already allocated to " +
                    $"{roomClash.CourseOffering.ClassSection.Class.Name}-{roomClash.CourseOffering.ClassSection.Name} " +
                    $"({roomClash.CourseOffering.Subject.Name}) from {roomClash.StartTime:hh\\:mm} to {roomClash.EndTime:hh\\:mm} on {dto.DayOfWeek}.";
            }
        }

        // 4. Check Class Section Double-Booking Conflict
        var sectionClash = overlappingSlots.FirstOrDefault(t => t.CourseOffering.ClassSectionId == offering.ClassSectionId);
        if (sectionClash != null)
        {
            result.ClassSectionConflict = true;
            result.ClassSectionConflictDetails =
                $"Class section {offering.ClassSection.Class.Name}-{offering.ClassSection.Name} already has " +
                $"{sectionClash.CourseOffering.Subject.Name} scheduled from {sectionClash.StartTime:hh\\:mm} to {sectionClash.EndTime:hh\\:mm} on {dto.DayOfWeek}.";
        }

        return ApiResponse<ConflictDetectionResultDto>.Ok(result, result.HasConflict ? "Scheduling conflicts detected." : "No scheduling conflicts detected.");
    }

    public async Task<ApiResponse<TimetableSlotDto>> ScheduleSlotAsync(
        ScheduleSlotDto dto,
        CancellationToken cancellationToken = default)
    {
        if (dto.StartTime >= dto.EndTime)
        {
            return ApiResponse<TimetableSlotDto>.Fail("Slot start time must be earlier than end time.");
        }

        var duration = dto.EndTime - dto.StartTime;
        if (duration < TimeSpan.FromMinutes(15) || duration > TimeSpan.FromHours(5))
        {
            return ApiResponse<TimetableSlotDto>.Fail("Slot duration must be between 15 minutes and 5 hours.");
        }

        var conflictCheck = await DetectConflictsAsync(dto, null, cancellationToken);
        if (!conflictCheck.Success)
        {
            return ApiResponse<TimetableSlotDto>.Fail(conflictCheck.Message);
        }

        if (conflictCheck.Data != null && conflictCheck.Data.HasConflict)
        {
            var conflictErrors = new List<string>();
            if (conflictCheck.Data.TeacherConflict && conflictCheck.Data.TeacherConflictDetails != null)
                conflictErrors.Add(conflictCheck.Data.TeacherConflictDetails);
            if (conflictCheck.Data.RoomConflict && conflictCheck.Data.RoomConflictDetails != null)
                conflictErrors.Add(conflictCheck.Data.RoomConflictDetails);
            if (conflictCheck.Data.ClassSectionConflict && conflictCheck.Data.ClassSectionConflictDetails != null)
                conflictErrors.Add(conflictCheck.Data.ClassSectionConflictDetails);

            return ApiResponse<TimetableSlotDto>.Fail("Cannot schedule slot due to schedule collisions.", conflictErrors);
        }

        var offering = await _context.CourseOfferings
            .Include(co => co.Subject)
            .Include(co => co.Teacher)
            .Include(co => co.ClassSection)
                .ThenInclude(cs => cs.Class)
            .FirstOrDefaultAsync(co => co.Id == dto.CourseOfferingId, cancellationToken);

        if (offering == null)
        {
            return ApiResponse<TimetableSlotDto>.Fail("Course offering not found.");
        }

        var room = !string.IsNullOrWhiteSpace(dto.RoomNumber) ? dto.RoomNumber.Trim() : offering.ClassSection.RoomNumber;

        var slot = new Timetable
        {
            TenantId = offering.TenantId,
            InstitutionId = offering.InstitutionId,
            CourseOfferingId = offering.Id,
            DayOfWeek = dto.DayOfWeek,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            RoomNumber = room
        };

        await _context.Timetables.AddAsync(slot, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new TimetableSlotDto
        {
            Id = slot.Id,
            CourseOfferingId = offering.Id,
            SubjectName = offering.Subject.Name,
            SubjectCode = offering.Subject.Code,
            ClassSectionId = offering.ClassSectionId,
            ClassName = offering.ClassSection.Class.Name,
            SectionName = offering.ClassSection.Name,
            TeacherId = offering.TeacherId,
            TeacherName = offering.Teacher?.FullName,
            DayOfWeek = slot.DayOfWeek,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            RoomNumber = slot.RoomNumber
        };

        return ApiResponse<TimetableSlotDto>.Ok(resultDto, "Timetable slot scheduled successfully.");
    }

    public async Task<ApiResponse<WeeklyTimetableDto>> GetClassSectionWeeklyTimetableAsync(
        Guid classSectionId,
        CancellationToken cancellationToken = default)
    {
        var section = await _context.ClassSections
            .Include(cs => cs.Class)
            .FirstOrDefaultAsync(cs => cs.Id == classSectionId, cancellationToken);

        if (section == null)
        {
            return ApiResponse<WeeklyTimetableDto>.Fail("Class section not found.");
        }

        var slots = await _context.Timetables
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Teacher)
            .Where(t => !t.IsDeleted && t.CourseOffering.ClassSectionId == classSectionId)
            .OrderBy(t => t.DayOfWeek)
            .ThenBy(t => t.StartTime)
            .Select(t => new TimetableSlotDto
            {
                Id = t.Id,
                CourseOfferingId = t.CourseOfferingId,
                SubjectName = t.CourseOffering.Subject.Name,
                SubjectCode = t.CourseOffering.Subject.Code,
                ClassSectionId = section.Id,
                ClassName = section.Class.Name,
                SectionName = section.Name,
                TeacherId = t.CourseOffering.TeacherId,
                TeacherName = t.CourseOffering.Teacher != null ? t.CourseOffering.Teacher.FullName : null,
                DayOfWeek = t.DayOfWeek,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                RoomNumber = t.RoomNumber ?? section.RoomNumber
            })
            .ToListAsync(cancellationToken);

        var daysOfWeek = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday,
            DayOfWeek.Saturday
        };

        var weekly = new WeeklyTimetableDto
        {
            ClassSectionId = section.Id,
            ClassName = section.Class.Name,
            SectionName = section.Name,
            Days = daysOfWeek.Select(day => new DayScheduleDto
            {
                DayOfWeek = day,
                Slots = slots.Where(s => s.DayOfWeek == day).OrderBy(s => s.StartTime).ToList()
            }).ToList()
        };

        return ApiResponse<WeeklyTimetableDto>.Ok(weekly);
    }

    public async Task<ApiResponse<TeacherWeeklyTimetableDto>> GetTeacherWeeklyTimetableAsync(
        Guid teacherId,
        CancellationToken cancellationToken = default)
    {
        var teacher = await _context.StaffMembers
            .FirstOrDefaultAsync(s => s.Id == teacherId, cancellationToken);

        if (teacher == null)
        {
            return ApiResponse<TeacherWeeklyTimetableDto>.Fail("Teacher not found.");
        }

        var slots = await _context.Timetables
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Where(t => !t.IsDeleted && t.CourseOffering.TeacherId == teacherId)
            .OrderBy(t => t.DayOfWeek)
            .ThenBy(t => t.StartTime)
            .Select(t => new TimetableSlotDto
            {
                Id = t.Id,
                CourseOfferingId = t.CourseOfferingId,
                SubjectName = t.CourseOffering.Subject.Name,
                SubjectCode = t.CourseOffering.Subject.Code,
                ClassSectionId = t.CourseOffering.ClassSectionId,
                ClassName = t.CourseOffering.ClassSection.Class.Name,
                SectionName = t.CourseOffering.ClassSection.Name,
                TeacherId = teacher.Id,
                TeacherName = teacher.FullName,
                DayOfWeek = t.DayOfWeek,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                RoomNumber = t.RoomNumber ?? t.CourseOffering.ClassSection.RoomNumber
            })
            .ToListAsync(cancellationToken);

        var daysOfWeek = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday,
            DayOfWeek.Saturday
        };

        var teacherSchedule = new TeacherWeeklyTimetableDto
        {
            TeacherId = teacher.Id,
            TeacherName = teacher.FullName,
            Days = daysOfWeek.Select(day => new DayScheduleDto
            {
                DayOfWeek = day,
                Slots = slots.Where(s => s.DayOfWeek == day).OrderBy(s => s.StartTime).ToList()
            }).ToList()
        };

        return ApiResponse<TeacherWeeklyTimetableDto>.Ok(teacherSchedule);
    }

    public async Task<ApiResponse<List<TimetableSlotDto>>> GetRoomScheduleAsync(
        string roomNumber,
        DayOfWeek? dayOfWeek = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(roomNumber))
        {
            return ApiResponse<List<TimetableSlotDto>>.Fail("Room number is required.");
        }

        var normalizedRoom = roomNumber.Trim();

        var query = _context.Timetables
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Subject)
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.Teacher)
            .Include(t => t.CourseOffering)
                .ThenInclude(co => co.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Where(t => !t.IsDeleted &&
                        (t.RoomNumber == normalizedRoom ||
                         (t.RoomNumber == null && t.CourseOffering.ClassSection.RoomNumber == normalizedRoom)));

        if (dayOfWeek.HasValue)
        {
            query = query.Where(t => t.DayOfWeek == dayOfWeek.Value);
        }

        var slots = await query
            .OrderBy(t => t.DayOfWeek)
            .ThenBy(t => t.StartTime)
            .Select(t => new TimetableSlotDto
            {
                Id = t.Id,
                CourseOfferingId = t.CourseOfferingId,
                SubjectName = t.CourseOffering.Subject.Name,
                SubjectCode = t.CourseOffering.Subject.Code,
                ClassSectionId = t.CourseOffering.ClassSectionId,
                ClassName = t.CourseOffering.ClassSection.Class.Name,
                SectionName = t.CourseOffering.ClassSection.Name,
                TeacherId = t.CourseOffering.TeacherId,
                TeacherName = t.CourseOffering.Teacher != null ? t.CourseOffering.Teacher.FullName : null,
                DayOfWeek = t.DayOfWeek,
                StartTime = t.StartTime,
                EndTime = t.EndTime,
                RoomNumber = t.RoomNumber ?? t.CourseOffering.ClassSection.RoomNumber
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<TimetableSlotDto>>.Ok(slots);
    }

    public async Task<ApiResponse<bool>> DeleteSlotAsync(Guid slotId, CancellationToken cancellationToken = default)
    {
        var slot = await _context.Timetables.FindAsync(new object[] { slotId }, cancellationToken);
        if (slot == null)
        {
            return ApiResponse<bool>.Fail("Timetable slot not found.");
        }

        _context.Timetables.Remove(slot);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<bool>.Ok(true, "Timetable slot deleted successfully.");
    }
}
