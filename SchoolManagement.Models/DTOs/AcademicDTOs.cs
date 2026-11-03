namespace SchoolManagement.Models.DTOs;

public class AcademicYearDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class CreateAcademicYearDto
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
}

public class DepartmentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? HeadOfDepartmentId { get; set; }
    public string? HeadOfDepartmentName { get; set; }
}

public class CreateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? HeadOfDepartmentId { get; set; }
}

public class ProgramDto
{
    public Guid Id { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int TotalSemesters { get; set; }
    public string? DegreeType { get; set; }
}

public class CreateProgramDto
{
    public Guid? DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int TotalSemesters { get; set; } = 8;
    public string? DegreeType { get; set; }
}

public class ClassDto
{
    public Guid Id { get; set; }
    public Guid InstitutionId { get; set; }
    public string? InstitutionName { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public Guid? ProgramId { get; set; }
    public string? ProgramName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int? SemesterNumber { get; set; }
    public List<ClassSectionDto> Sections { get; set; } = new();
    public int TotalEnrolledStudents => Sections.Sum(s => s.EnrolledStudentCount);
    public int TotalCapacity => Sections.Sum(s => s.Capacity);
}

public class CreateClassDto
{
    public Guid? InstitutionId { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? ProgramId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int? SemesterNumber { get; set; }
}

public class ClassSectionDto
{
    public Guid Id { get; set; }
    public Guid InstitutionId { get; set; }
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string? RoomNumber { get; set; }
    public Guid? ClassTeacherId { get; set; }
    public string? ClassTeacherName { get; set; }
    public int EnrolledStudentCount { get; set; }
}

public class CreateClassSectionDto
{
    public Guid ClassId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; } = 40;
    public string? RoomNumber { get; set; }
    public Guid? ClassTeacherId { get; set; }
}

public class SubjectDto
{
    public Guid Id { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public decimal Credits { get; set; }
    public bool IsElective { get; set; }
}

public class CreateSubjectDto
{
    public Guid? DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public decimal Credits { get; set; } = 3.0m;
    public bool IsElective { get; set; }
}

public class CourseOfferingDto
{
    public Guid Id { get; set; }
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectCode { get; set; } = string.Empty;
    public Guid ClassSectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public Guid? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public int? SemesterNumber { get; set; }
}

public class CreateCourseOfferingDto
{
    public Guid AcademicYearId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid ClassSectionId { get; set; }
    public Guid? TeacherId { get; set; }
    public int? SemesterNumber { get; set; }
}

public class TimetableSlotDto
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
    public DayOfWeek DayOfWeek { get; set; }
    public string DayName => DayOfWeek.ToString();
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? RoomNumber { get; set; }
}

public class ScheduleSlotDto
{
    public Guid CourseOfferingId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? RoomNumber { get; set; }
}

public class ConflictDetectionResultDto
{
    public bool HasConflict => TeacherConflict || RoomConflict || ClassSectionConflict;
    public bool TeacherConflict { get; set; }
    public string? TeacherConflictDetails { get; set; }
    public bool RoomConflict { get; set; }
    public string? RoomConflictDetails { get; set; }
    public bool ClassSectionConflict { get; set; }
    public string? ClassSectionConflictDetails { get; set; }
}

public class DayScheduleDto
{
    public DayOfWeek DayOfWeek { get; set; }
    public string DayName => DayOfWeek.ToString();
    public List<TimetableSlotDto> Slots { get; set; } = new();
}

public class WeeklyTimetableDto
{
    public Guid ClassSectionId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public List<DayScheduleDto> Days { get; set; } = new();
}

public class TeacherWeeklyTimetableDto
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public List<DayScheduleDto> Days { get; set; } = new();
}
