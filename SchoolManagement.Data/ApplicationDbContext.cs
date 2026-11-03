using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.Entities;

namespace SchoolManagement.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    private readonly ICurrentTenantService _currentTenantService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentTenantService currentTenantService)
        : base(options)
    {
        _currentTenantService = currentTenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Institution> Institutions => Set<Institution>();
    public DbSet<Campus> Campuses => Set<Campus>();
    public DbSet<TenantMembership> TenantMemberships => Set<TenantMembership>();
    public DbSet<InstitutionMembership> InstitutionMemberships => Set<InstitutionMembership>();

    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Program> Programs => Set<Program>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<ClassSection> ClassSections => Set<ClassSection>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<CourseOffering> CourseOfferings => Set<CourseOffering>();
    public DbSet<Timetable> Timetables => Set<Timetable>();

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Guardian> Guardians => Set<Guardian>();
    public DbSet<StudentGuardian> StudentGuardians => Set<StudentGuardian>();
    public DbSet<Staff> StaffMembers => Set<Staff>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamResult> ExamResults => Set<ExamResult>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<AssignmentSubmission> AssignmentSubmissions => Set<AssignmentSubmission>();

    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<FeeStructureItem> FeeStructureItems => Set<FeeStructureItem>();
    public DbSet<StudentFeeAssignment> StudentFeeAssignments => Set<StudentFeeAssignment>();
    public DbSet<StudentInvoice> StudentInvoices => Set<StudentInvoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentAllocation> PaymentAllocations => Set<PaymentAllocation>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<PaymentWebhookEvent> PaymentWebhookEvents => Set<PaymentWebhookEvent>();

    public DbSet<PlatformPlan> PlatformPlans => Set<PlatformPlan>();
    public DbSet<TenantSubscription> TenantSubscriptions => Set<TenantSubscription>();
    public DbSet<PlatformInvoice> PlatformInvoices => Set<PlatformInvoice>();
    public DbSet<PlatformPayment> PlatformPayments => Set<PlatformPayment>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Ignore unmapped Tenant.LogoUrl so SQL query doesn't fail if column doesn't exist in DB
        builder.Entity<Tenant>().Ignore(t => t.LogoUrl);

        // Configure Decimal Precisions
        foreach (var property in builder.Model.GetEntityTypes()
                     .SelectMany(t => t.GetProperties())
                     .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        // Configure Global Query Filters for Tenant Isolation and Soft Deletes
        builder.Entity<Institution>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));
        
        builder.Entity<Campus>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<AcademicYear>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Department>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Program>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Class>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<ClassSection>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Subject>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<CourseOffering>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Timetable>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Student>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Guardian>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<StudentGuardian>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Staff>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Enrollment>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<AttendanceRecord>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Exam>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<ExamResult>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Announcement>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Assignment>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<AssignmentSubmission>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<FeeStructure>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<FeeStructureItem>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<StudentFeeAssignment>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<StudentInvoice>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<InvoiceLine>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<PaymentAllocation>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        builder.Entity<Refund>().HasQueryFilter(e => !e.IsDeleted &&
            (_currentTenantService.IsPlatformAdmin || !_currentTenantService.TenantId.HasValue || e.TenantId == _currentTenantService.TenantId));

        // Unique Indexes
        builder.Entity<Tenant>().HasIndex(t => t.Code).IsUnique();
        builder.Entity<Institution>().HasIndex(i => new { i.TenantId, i.Code }).IsUnique();
        builder.Entity<Student>().HasIndex(s => new { s.TenantId, s.AdmissionNumber }).IsUnique();
        builder.Entity<Staff>().HasIndex(s => new { s.TenantId, s.EmployeeCode }).IsUnique();
        builder.Entity<StudentInvoice>().HasIndex(i => new { i.TenantId, i.InvoiceNumber }).IsUnique();
        builder.Entity<Payment>().HasIndex(p => new { p.TenantId, p.ReceiptNumber }).IsUnique();
        builder.Entity<PaymentWebhookEvent>().HasIndex(w => new { w.ProviderName, w.EventId }).IsUnique();
        builder.Entity<AssignmentSubmission>().HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique();

        // Relationships with multiple navigations between same types
        builder.Entity<Department>()
            .HasOne(d => d.HeadOfDepartment)
            .WithMany()
            .HasForeignKey(d => d.HeadOfDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Staff>()
            .HasOne(s => s.Department)
            .WithMany(d => d.StaffMembers)
            .HasForeignKey(s => s.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ClassSection>()
            .HasOne(cs => cs.ClassTeacher)
            .WithMany(s => s.AssignedClassSections)
            .HasForeignKey(cs => cs.ClassTeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CourseOffering>()
            .HasOne(co => co.Teacher)
            .WithMany(s => s.CourseOfferings)
            .HasForeignKey(co => co.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        // Set default DeleteBehavior to Restrict for all foreign keys to prevent SQL Server multiple cascade path cycles
        foreach (var relationship in builder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Explicit composition cascades for owned child entities
        builder.Entity<PaymentAllocation>()
            .HasOne(pa => pa.Payment)
            .WithMany(p => p.Allocations)
            .HasForeignKey(pa => pa.PaymentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<InvoiceLine>()
            .HasOne(il => il.StudentInvoice)
            .WithMany(si => si.Lines)
            .HasForeignKey(il => il.StudentInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<FeeStructureItem>()
            .HasOne(fsi => fsi.FeeStructure)
            .WithMany(fs => fs.Items)
            .HasForeignKey(fsi => fsi.FeeStructureId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentGuardian>()
            .HasOne(sg => sg.Student)
            .WithMany(s => s.StudentGuardians)
            .HasForeignKey(sg => sg.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<AssignmentSubmission>()
            .HasOne(asub => asub.Assignment)
            .WithMany(a => a.Submissions)
            .HasForeignKey(asub => asub.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditAndSoftDelete();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditAndSoftDelete();
        return base.SaveChanges();
    }

    private void ApplyAuditAndSoftDelete()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        var utcNow = DateTime.UtcNow;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAtUtc = utcNow;
                entry.Entity.CreatedBy = _currentTenantService.UserId?.ToString();

                if (entry.Entity is ITenantEntity tenantEntity && tenantEntity.TenantId == Guid.Empty)
                {
                    if (_currentTenantService.TenantId.HasValue)
                    {
                        tenantEntity.TenantId = _currentTenantService.TenantId.Value;
                    }
                }

                if (entry.Entity is IInstitutionEntity instEntity && instEntity.InstitutionId == Guid.Empty)
                {
                    if (_currentTenantService.InstitutionId.HasValue)
                    {
                        instEntity.InstitutionId = _currentTenantService.InstitutionId.Value;
                    }
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAtUtc = utcNow;
                entry.Entity.UpdatedBy = _currentTenantService.UserId?.ToString();
            }
            else if (entry.State == EntityState.Deleted)
            {
                // Intercept physical delete and convert to soft delete
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.UpdatedAtUtc = utcNow;
                entry.Entity.UpdatedBy = _currentTenantService.UserId?.ToString();
            }
        }
    }
}
