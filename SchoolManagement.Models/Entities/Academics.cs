using SchoolManagement.Models.Common;

namespace SchoolManagement.Models.Entities;

public class AcademicYear : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; } = false;

    public ICollection<Class> Classes { get; set; } = new List<Class>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}

public class Department : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? HeadOfDepartmentId { get; set; }
    public Staff? HeadOfDepartment { get; set; }

    public ICollection<Program> Programs { get; set; } = new List<Program>();
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public ICollection<Staff> StaffMembers { get; set; } = new List<Staff>();
}

public class Program : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int TotalSemesters { get; set; } = 8;
    public string? DegreeType { get; set; } // e.g., Bachelor, Diploma, Master

    public ICollection<Class> Classes { get; set; } = new List<Class>();
}

public class Class : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public Guid? ProgramId { get; set; }
    public Program? Program { get; set; }

    public string Name { get; set; } = string.Empty; // e.g., "Grade 10" or "Semester 1 - CS"
    public string Code { get; set; } = string.Empty;
    public int? SemesterNumber { get; set; }

    public ICollection<ClassSection> Sections { get; set; } = new List<ClassSection>();
}

public class ClassSection : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public string Name { get; set; } = string.Empty; // e.g., "A", "B"
    public int Capacity { get; set; } = 40;
    public string? RoomNumber { get; set; }

    public Guid? ClassTeacherId { get; set; }
    public Staff? ClassTeacher { get; set; }

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<CourseOffering> CourseOfferings { get; set; } = new List<CourseOffering>();
}

public class Subject : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public decimal Credits { get; set; } = 3.0m;
    public bool IsElective { get; set; } = false;

    public ICollection<CourseOffering> CourseOfferings { get; set; } = new List<CourseOffering>();
}

public class CourseOffering : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public Guid ClassSectionId { get; set; }
    public ClassSection ClassSection { get; set; } = null!;

    public Guid? TeacherId { get; set; }
    public Staff? Teacher { get; set; }

    public int? SemesterNumber { get; set; }

    public ICollection<Timetable> Timetables { get; set; } = new List<Timetable>();
    public ICollection<Exam> Exams { get; set; } = new List<Exam>();
}

public class Timetable : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid CourseOfferingId { get; set; }
    public CourseOffering CourseOffering { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string? RoomNumber { get; set; }
}
