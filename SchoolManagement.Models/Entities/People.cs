using SchoolManagement.Models.Common;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.Entities;

public class Student : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public string AdmissionNumber { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; } = Gender.Male;
    public string? BloodGroup { get; set; }
    public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<StudentGuardian> StudentGuardians { get; set; } = new List<StudentGuardian>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
    public ICollection<StudentFeeAssignment> FeeAssignments { get; set; } = new List<StudentFeeAssignment>();
    public ICollection<StudentInvoice> Invoices { get; set; } = new List<StudentInvoice>();
}

public class Guardian : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public GuardianRelationship Relationship { get; set; } = GuardianRelationship.Father;
    public string? Occupation { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }

    public ICollection<StudentGuardian> StudentGuardians { get; set; } = new List<StudentGuardian>();
}

public class StudentGuardian : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid GuardianId { get; set; }
    public Guardian Guardian { get; set; } = null!;

    public bool IsPrimaryContact { get; set; } = true;
    public bool CanPickup { get; set; } = true;
}

public class Staff : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Designation { get; set; } = "Teacher"; // e.g. Director, Principal, Vice Principal, HOD, Teacher
    
    // Organizational Hierarchy (Reports to Director / Principal / HOD)
    public Guid? ReportsToStaffId { get; set; }
    public Staff? ReportsToStaff { get; set; }
    public ICollection<Staff> DirectReports { get; set; } = new List<Staff>();

    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string? Qualification { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public ICollection<CourseOffering> CourseOfferings { get; set; } = new List<CourseOffering>();
    public ICollection<ClassSection> AssignedClassSections { get; set; } = new List<ClassSection>();
}

public class Enrollment : BaseEntity, IInstitutionEntity
{
    public Guid TenantId { get; set; }
    public Guid InstitutionId { get; set; }
    public Institution Institution { get; set; } = null!;

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid AcademicYearId { get; set; }
    public AcademicYear AcademicYear { get; set; } = null!;

    public Guid ClassSectionId { get; set; }
    public ClassSection ClassSection { get; set; } = null!;

    public string? RollNumber { get; set; }
    public DateTime EnrolledAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
