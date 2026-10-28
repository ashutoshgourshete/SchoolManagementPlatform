using SchoolManagement.Models.Enums;

namespace SchoolManagement.Models.DTOs;

public class StudentDto
{
    public Guid Id { get; set; }
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string? BloodGroup { get; set; }
    public DateTime AdmissionDate { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public bool IsActive { get; set; }
    public string? CurrentClassName { get; set; }
    public string? CurrentSectionName { get; set; }
    public Guid? CurrentClassSectionId { get; set; }
    public List<GuardianDto> Guardians { get; set; } = new();
}

public class CreateStudentDto
{
    public string AdmissionNumber { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; } = Gender.Male;
    public string? BloodGroup { get; set; }
    public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    
    // Enrollment on admission
    public Guid? AcademicYearId { get; set; }
    public Guid? ClassSectionId { get; set; }

    // Guardian details
    public CreateGuardianDto? Guardian { get; set; }
}

public class UpdateStudentDto
{
    public string? RollNumber { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public Gender Gender { get; set; }
    public string? BloodGroup { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? PostalCode { get; set; }
    public bool IsActive { get; set; }
}

public class GuardianDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public GuardianRelationship Relationship { get; set; }
    public string? Occupation { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsPrimaryContact { get; set; }
}

public class CreateGuardianDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public GuardianRelationship Relationship { get; set; } = GuardianRelationship.Father;
    public string? Occupation { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public bool IsPrimaryContact { get; set; } = true;
    public bool CanPickup { get; set; } = true;
}

public class StaffDto
{
    public Guid Id { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}".Trim();
    public string Designation { get; set; } = "Teacher";
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? Qualification { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateStaffDto
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Designation { get; set; } = "Teacher";
    public Guid? DepartmentId { get; set; }
    public string? Qualification { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime JoiningDate { get; set; } = DateTime.UtcNow;
    public UserRoleType Role { get; set; } = UserRoleType.Teacher;
}

public class EnrollmentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public Guid AcademicYearId { get; set; }
    public string AcademicYearName { get; set; } = string.Empty;
    public Guid ClassSectionId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string? RollNumber { get; set; }
    public DateTime EnrolledAtUtc { get; set; }
    public bool IsActive { get; set; }
}

public class CreateEnrollmentDto
{
    public Guid StudentId { get; set; }
    public Guid AcademicYearId { get; set; }
    public Guid ClassSectionId { get; set; }
    public string? RollNumber { get; set; }
}
