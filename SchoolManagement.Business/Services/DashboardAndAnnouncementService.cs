using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public DashboardService(ApplicationDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<DashboardAnalyticsDto>> GetInstitutionDashboardAnalyticsAsync(CancellationToken cancellationToken = default)
    {
        var totalStudents = await _context.Students.CountAsync(s => !s.IsDeleted, cancellationToken);
        var activeStudents = await _context.Students.CountAsync(s => s.IsActive && !s.IsDeleted, cancellationToken);
        var totalStaff = await _context.StaffMembers.CountAsync(s => s.IsActive && !s.IsDeleted, cancellationToken);
        var totalClasses = await _context.Classes.CountAsync(c => !c.IsDeleted, cancellationToken);

        var firstDayOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var monthFeeCollected = await _context.Payments
            .Where(p => p.Status == PaymentStatus.Completed && p.PaymentDateUtc >= firstDayOfMonth)
            .SumAsync(p => p.Amount, cancellationToken);

        var totalInvoiced = await _context.StudentInvoices.Where(i => !i.IsDeleted).SumAsync(i => i.TotalAmount, cancellationToken);
        var totalPaid = await _context.StudentInvoices.Where(i => !i.IsDeleted).SumAsync(i => i.PaidAmount, cancellationToken);
        var totalOutstanding = Math.Max(0, totalInvoiced - totalPaid);

        // Average attendance for the past 30 days
        var thirtyDaysAgo = DateTime.UtcNow.Date.AddDays(-30);
        var attendanceRecords = await _context.AttendanceRecords
            .Where(ar => ar.Date >= thirtyDaysAgo)
            .ToListAsync(cancellationToken);

        double avgAttendance = 0;
        if (attendanceRecords.Any())
        {
            var presentCount = attendanceRecords.Count(a => a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.HalfDay);
            avgAttendance = Math.Round((double)presentCount / attendanceRecords.Count * 100, 1);
        }

        // Recent monthly fee collection chart data
        var recentCollections = new List<MonthlyFeeCollectionDto>();
        for (int i = 5; i >= 0; i--)
        {
            var mDate = DateTime.UtcNow.AddMonths(-i);
            var mStart = new DateTime(mDate.Year, mDate.Month, 1);
            var mEnd = mStart.AddMonths(1).AddTicks(-1);
            var sum = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Completed && p.PaymentDateUtc >= mStart && p.PaymentDateUtc <= mEnd)
                .SumAsync(p => p.Amount, cancellationToken);

            recentCollections.Add(new MonthlyFeeCollectionDto
            {
                Month = mDate.ToString("MMM yyyy"),
                Amount = sum
            });
        }

        var analytics = new DashboardAnalyticsDto
        {
            TotalStudents = totalStudents,
            ActiveStudents = activeStudents,
            TotalStaff = totalStaff,
            TotalClasses = totalClasses,
            TotalFeeCollectedThisMonth = monthFeeCollected,
            TotalOutstandingFees = totalOutstanding,
            AverageAttendanceRate = avgAttendance,
            RecentCollections = recentCollections
        };

        return ApiResponse<DashboardAnalyticsDto>.Ok(analytics);
    }

    public async Task<ApiResponse<PlatformAdminDashboardDto>> GetPlatformAdminDashboardAsync(CancellationToken cancellationToken = default)
    {
        var tenants = await _context.Tenants.IgnoreQueryFilters().Where(t => !t.IsDeleted).ToListAsync(cancellationToken);
        var totalTenants = tenants.Count;
        var activeTenants = tenants.Count(t => t.Status == TenantStatus.Active);
        var totalInstitutions = await _context.Institutions.IgnoreQueryFilters().CountAsync(i => !i.IsDeleted, cancellationToken);
        var totalStudents = await _context.Students.IgnoreQueryFilters().CountAsync(s => !s.IsDeleted, cancellationToken);

        var activeSubscriptions = await _context.TenantSubscriptions
            .IgnoreQueryFilters()
            .Include(s => s.PlatformPlan)
            .Include(s => s.Tenant)
            .Where(s => s.Status == "Active" && !s.IsDeleted)
            .ToListAsync(cancellationToken);

        decimal mrr = 0m;
        foreach (var sub in activeSubscriptions)
        {
            if (sub.BillingCycle == BillingCycle.Annual)
            {
                mrr += sub.PlatformPlan.AnnualPrice / 12m;
            }
            else
            {
                mrr += sub.PlatformPlan.MonthlyPrice;
            }
        }

        var arr = mrr * 12m;

        var recentSubs = activeSubscriptions
            .OrderByDescending(s => s.CreatedAtUtc)
            .Take(5)
            .Select(s => new TenantSubscriptionSummaryDto
            {
                TenantId = s.TenantId,
                TenantName = s.Tenant.Name,
                PlanName = s.PlatformPlan.Name,
                Status = s.Status,
                ExpiryDateUtc = s.CurrentPeriodEndUtc
            })
            .ToList();

        var dto = new PlatformAdminDashboardDto
        {
            TotalTenants = totalTenants,
            ActiveTenants = activeTenants,
            TotalInstitutions = totalInstitutions,
            TotalPlatformStudents = totalStudents,
            MonthlyRecurringRevenue = Math.Round(mrr, 2),
            AnnualRecurringRevenue = Math.Round(arr, 2),
            RecentSubscriptions = recentSubs
        };

        return ApiResponse<PlatformAdminDashboardDto>.Ok(dto);
    }
}

public class AnnouncementService : IAnnouncementService
{
    private readonly ApplicationDbContext _context;

    public AnnouncementService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<List<AnnouncementDto>>> GetAnnouncementsAsync(string? targetAudience = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Announcements
            .Where(a => !a.IsDeleted && (a.ExpiresAtUtc == null || a.ExpiresAtUtc > DateTime.UtcNow));

        if (!string.IsNullOrWhiteSpace(targetAudience) && targetAudience != "All")
        {
            query = query.Where(a => a.TargetAudience == "All" || a.TargetAudience == targetAudience);
        }

        var list = await query
            .OrderByDescending(a => a.IsPinned)
            .ThenByDescending(a => a.PublishedAtUtc)
            .Select(a => new AnnouncementDto
            {
                Id = a.Id,
                Title = a.Title,
                Content = a.Content,
                TargetAudience = a.TargetAudience,
                PublishedAtUtc = a.PublishedAtUtc,
                ExpiresAtUtc = a.ExpiresAtUtc,
                IsPinned = a.IsPinned
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<AnnouncementDto>>.Ok(list);
    }

    public async Task<ApiResponse<AnnouncementDto>> CreateAnnouncementAsync(CreateAnnouncementDto dto, CancellationToken cancellationToken = default)
    {
        var ann = new Announcement
        {
            Title = dto.Title,
            Content = dto.Content,
            TargetAudience = dto.TargetAudience,
            ExpiresAtUtc = dto.ExpiresAtUtc,
            IsPinned = dto.IsPinned,
            PublishedAtUtc = DateTime.UtcNow
        };

        await _context.Announcements.AddAsync(ann, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<AnnouncementDto>.Ok(new AnnouncementDto
        {
            Id = ann.Id,
            Title = ann.Title,
            Content = ann.Content,
            TargetAudience = ann.TargetAudience,
            PublishedAtUtc = ann.PublishedAtUtc,
            ExpiresAtUtc = ann.ExpiresAtUtc,
            IsPinned = ann.IsPinned
        }, "Announcement published successfully");
    }
}
