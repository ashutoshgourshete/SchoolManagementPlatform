namespace SchoolManagement.Models.DTOs;

public class ClassEnrollmentStatDto
{
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public Guid ClassSectionId { get; set; }
    public string SectionName { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int TotalEnrolled { get; set; }
    public int MaleCount { get; set; }
    public int FemaleCount { get; set; }
    public decimal OccupancyRate => Capacity > 0 ? Math.Round((decimal)TotalEnrolled / Capacity * 100m, 1) : 0;
}

public class EnrollmentDemographicsReportDto
{
    public int TotalStudents { get; set; }
    public int TotalClasses { get; set; }
    public int TotalSections { get; set; }
    public int TotalMale { get; set; }
    public int TotalFemale { get; set; }
    public decimal OverallOccupancyRate { get; set; }
    public List<ClassEnrollmentStatDto> ClassStats { get; set; } = new();
}

public class StudentAttendanceReportItemDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AdmissionNumber { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string SectionName { get; set; } = string.Empty;
    public string? GuardianPhone { get; set; }
    public int TotalSessions { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public decimal AttendancePercentage { get; set; }
    public bool IsCriticalDefaulter => AttendancePercentage < 75.0m;
}

public class AttendanceAnalyticsReportDto
{
    public decimal OverallAttendanceRate { get; set; }
    public int TotalStudentsEvaluated { get; set; }
    public int CriticalDefaultersCount { get; set; }
    public List<StudentAttendanceReportItemDto> Records { get; set; } = new();
}

public class PaymentMethodBreakdownDto
{
    public string Method { get; set; } = string.Empty;
    public int TransactionCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class FinancialCollectionReportDto
{
    public decimal TotalInvoicedAmount { get; set; }
    public decimal TotalCollectedAmount { get; set; }
    public decimal TotalOutstandingAmount { get; set; }
    public decimal CollectionEfficiencyRate => TotalInvoicedAmount > 0 
        ? Math.Round(TotalCollectedAmount / TotalInvoicedAmount * 100m, 1) 
        : 0;
    public List<PaymentMethodBreakdownDto> MethodBreakdown { get; set; } = new();
    public List<PaymentReceiptDto> RecentReceipts { get; set; } = new();
}

public class ExecutiveSummaryReportDto
{
    public string InstitutionName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
    public EnrollmentDemographicsReportDto Enrollment { get; set; } = new();
    public AttendanceAnalyticsReportDto Attendance { get; set; } = new();
    public FinancialCollectionReportDto Financials { get; set; } = new();
}
