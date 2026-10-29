using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class ReportsService : IReportsService
{
    private readonly ApplicationDbContext _context;

    public ReportsService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<EnrollmentDemographicsReportDto>> GetEnrollmentDemographicsReportAsync(
        Guid? academicYearId = null,
        CancellationToken cancellationToken = default)
    {
        var yearId = academicYearId;
        if (!yearId.HasValue)
        {
            var currentYear = await _context.AcademicYears.FirstOrDefaultAsync(ay => ay.IsCurrent, cancellationToken);
            yearId = currentYear?.Id;
        }

        var sectionsQuery = _context.ClassSections
            .Include(cs => cs.Class)
            .Include(cs => cs.Enrollments)
                .ThenInclude(e => e.Student)
            .Where(cs => !cs.IsDeleted);

        if (yearId.HasValue)
        {
            sectionsQuery = sectionsQuery.Where(cs => cs.Class.AcademicYearId == yearId.Value);
        }

        var sections = await sectionsQuery.ToListAsync(cancellationToken);

        var report = new EnrollmentDemographicsReportDto();
        var totalCapacity = 0;

        foreach (var cs in sections)
        {
            var activeStudents = cs.Enrollments
                .Where(e => !e.IsDeleted && e.IsActive && e.Student != null && !e.Student.IsDeleted)
                .Select(e => e.Student)
                .ToList();

            var male = activeStudents.Count(s => s.Gender == Gender.Male);
            var female = activeStudents.Count(s => s.Gender == Gender.Female);
            var total = activeStudents.Count;

            report.ClassStats.Add(new ClassEnrollmentStatDto
            {
                ClassId = cs.ClassId,
                ClassName = cs.Class.Name,
                ClassSectionId = cs.Id,
                SectionName = cs.Name,
                Capacity = cs.Capacity,
                TotalEnrolled = total,
                MaleCount = male,
                FemaleCount = female
            });

            report.TotalStudents += total;
            report.TotalMale += male;
            report.TotalFemale += female;
            totalCapacity += cs.Capacity;
        }

        report.TotalSections = sections.Count;
        report.TotalClasses = sections.Select(s => s.ClassId).Distinct().Count();
        report.OverallOccupancyRate = totalCapacity > 0 ? Math.Round((decimal)report.TotalStudents / totalCapacity * 100m, 1) : 0;

        return ApiResponse<EnrollmentDemographicsReportDto>.Ok(report);
    }

    public async Task<ApiResponse<AttendanceAnalyticsReportDto>> GetAttendanceAnalyticsReportAsync(
        Guid? classSectionId = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AttendanceRecords
            .Include(a => a.Student)
            .Include(a => a.ClassSection)
                .ThenInclude(cs => cs.Class)
            .Where(a => !a.IsDeleted);

        if (classSectionId.HasValue)
        {
            query = query.Where(a => a.ClassSectionId == classSectionId.Value);
        }

        if (startDate.HasValue)
        {
            query = query.Where(a => a.Date >= startDate.Value.Date);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.Date <= endDate.Value.Date);
        }

        var records = await query.ToListAsync(cancellationToken);

        var studentGroups = records
            .GroupBy(r => r.StudentId)
            .ToList();

        var report = new AttendanceAnalyticsReportDto();
        var totalPresentSessions = 0;
        var totalSessions = 0;

        foreach (var group in studentGroups)
        {
            var first = group.First();
            var total = group.Count();
            var present = group.Count(r => r.Status == AttendanceStatus.Present || r.Status == AttendanceStatus.HalfDay);
            var absent = group.Count(r => r.Status == AttendanceStatus.Absent);
            var late = group.Count(r => r.Status == AttendanceStatus.Late);
            var pct = total > 0 ? Math.Round((decimal)present / total * 100m, 1) : 0;

            var item = new StudentAttendanceReportItemDto
            {
                StudentId = group.Key,
                StudentName = first.Student.FullName,
                AdmissionNumber = first.Student.AdmissionNumber,
                ClassName = first.ClassSection.Class.Name,
                SectionName = first.ClassSection.Name,
                GuardianPhone = first.Student.EmergencyContactPhone,
                TotalSessions = total,
                PresentCount = present,
                AbsentCount = absent,
                LateCount = late,
                AttendancePercentage = pct
            };

            report.Records.Add(item);
            if (item.IsCriticalDefaulter)
            {
                report.CriticalDefaultersCount++;
            }

            totalPresentSessions += present;
            totalSessions += total;
        }

        report.TotalStudentsEvaluated = studentGroups.Count;
        report.OverallAttendanceRate = totalSessions > 0 ? Math.Round((decimal)totalPresentSessions / totalSessions * 100m, 1) : 0;
        report.Records = report.Records.OrderBy(r => r.AttendancePercentage).ToList();

        return ApiResponse<AttendanceAnalyticsReportDto>.Ok(report);
    }

    public async Task<ApiResponse<FinancialCollectionReportDto>> GetFinancialCollectionReportAsync(
        DateTime? startDate = null,
        DateTime? endDate = null,
        CancellationToken cancellationToken = default)
    {
        var invoiceQuery = _context.StudentInvoices.Where(i => !i.IsDeleted && i.Status != InvoiceStatus.Voided);
        var paymentQuery = _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Allocations)
                .ThenInclude(a => a.StudentInvoice)
            .Where(p => !p.IsDeleted && p.Status == PaymentStatus.Completed);

        if (startDate.HasValue)
        {
            paymentQuery = paymentQuery.Where(p => p.PaymentDateUtc >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            paymentQuery = paymentQuery.Where(p => p.PaymentDateUtc <= endDate.Value);
        }

        var invoices = await invoiceQuery.ToListAsync(cancellationToken);
        var payments = await paymentQuery.OrderByDescending(p => p.PaymentDateUtc).ToListAsync(cancellationToken);

        var report = new FinancialCollectionReportDto
        {
            TotalInvoicedAmount = invoices.Sum(i => i.TotalAmount),
            TotalCollectedAmount = payments.Sum(p => p.Amount),
            TotalOutstandingAmount = invoices.Sum(i => i.BalanceAmount)
        };

        report.MethodBreakdown = payments
            .GroupBy(p => p.Method.ToString())
            .Select(g => new PaymentMethodBreakdownDto
            {
                Method = g.Key,
                TransactionCount = g.Count(),
                TotalAmount = g.Sum(p => p.Amount)
            })
            .ToList();

        report.RecentReceipts = payments.Take(15).Select(p => new PaymentReceiptDto
        {
            PaymentId = p.Id,
            ReceiptNumber = p.ReceiptNumber,
            PaymentDateUtc = p.PaymentDateUtc,
            StudentId = p.StudentId,
            StudentName = p.Student.FullName,
            AdmissionNumber = p.Student.AdmissionNumber,
            InvoiceNumber = p.Allocations.FirstOrDefault()?.StudentInvoice?.InvoiceNumber,
            Amount = p.Amount,
            CurrencyCode = p.CurrencyCode,
            Method = p.Method,
            Status = p.Status,
            Notes = p.Notes,
            CollectedBy = p.CreatedBy
        }).ToList();

        return ApiResponse<FinancialCollectionReportDto>.Ok(report);
    }

    public async Task<ApiResponse<ExecutiveSummaryReportDto>> GetExecutiveSummaryReportAsync(CancellationToken cancellationToken = default)
    {
        var currentYear = await _context.AcademicYears.FirstOrDefaultAsync(ay => ay.IsCurrent, cancellationToken);
        var institution = await _context.Institutions.FirstOrDefaultAsync(cancellationToken);

        var enrollmentRes = await GetEnrollmentDemographicsReportAsync(currentYear?.Id, cancellationToken);
        var attendanceRes = await GetAttendanceAnalyticsReportAsync(null, null, null, cancellationToken);
        var financialsRes = await GetFinancialCollectionReportAsync(null, null, cancellationToken);

        var summary = new ExecutiveSummaryReportDto
        {
            InstitutionName = institution?.Name ?? "EduManage Institution",
            AcademicYear = currentYear?.Name ?? "Current Session",
            Enrollment = enrollmentRes.Data ?? new EnrollmentDemographicsReportDto(),
            Attendance = attendanceRes.Data ?? new AttendanceAnalyticsReportDto(),
            Financials = financialsRes.Data ?? new FinancialCollectionReportDto()
        };

        return ApiResponse<ExecutiveSummaryReportDto>.Ok(summary);
    }
}
