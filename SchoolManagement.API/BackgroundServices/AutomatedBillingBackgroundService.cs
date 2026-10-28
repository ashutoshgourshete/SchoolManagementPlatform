using Microsoft.EntityFrameworkCore;
using SchoolManagement.Data;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.API.BackgroundServices;

public class AutomatedBillingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AutomatedBillingBackgroundService> _logger;

    public AutomatedBillingBackgroundService(
        IServiceProvider serviceProvider,
        ILogger<AutomatedBillingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Automated Billing Background Service is started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBillingRemindersAndOverdueAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in Automated Billing Background Service");
            }

            // Check every 6 hours
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task ProcessBillingRemindersAndOverdueAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // 1. Mark overdue invoices idempotently
        var overdueInvoices = await context.StudentInvoices
            .IgnoreQueryFilters()
            .Where(i => !i.IsDeleted &&
                        i.DueDate < DateTime.UtcNow &&
                        i.Status != InvoiceStatus.Paid &&
                        i.Status != InvoiceStatus.Voided &&
                        i.Status != InvoiceStatus.Overdue)
            .ToListAsync(cancellationToken);

        if (overdueInvoices.Any())
        {
            foreach (var inv in overdueInvoices)
            {
                inv.Status = InvoiceStatus.Overdue;
            }
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Marked {Count} invoices as overdue.", overdueInvoices.Count);
        }

        // 2. Identify invoices due within 3 days and create notification logs (reminders)
        var reminderThreshold = DateTime.UtcNow.AddDays(3);
        var upcomingInvoices = await context.StudentInvoices
            .IgnoreQueryFilters()
            .Include(i => i.Student)
            .Where(i => !i.IsDeleted &&
                        i.DueDate <= reminderThreshold &&
                        i.DueDate > DateTime.UtcNow &&
                        i.Status == InvoiceStatus.Issued)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var inv in upcomingInvoices)
        {
            var alreadyReminded = await context.NotificationLogs
                .AnyAsync(n => n.Recipient == inv.Student.EmergencyContactPhone &&
                               n.Subject.Contains(inv.InvoiceNumber) &&
                               n.SentAtUtc >= DateTime.UtcNow.AddDays(-3), cancellationToken);

            if (!alreadyReminded && !string.IsNullOrWhiteSpace(inv.Student.EmergencyContactPhone))
            {
                await context.NotificationLogs.AddAsync(new NotificationLog
                {
                    TenantId = inv.TenantId,
                    InstitutionId = inv.InstitutionId,
                    Recipient = inv.Student.EmergencyContactPhone,
                    Channel = "SMS",
                    Subject = $"Fee Reminder: {inv.InvoiceNumber}",
                    Message = $"Dear Parent, invoice {inv.InvoiceNumber} for {inv.Student.FullName} of amount {inv.CurrencyCode} {inv.BalanceAmount} is due on {inv.DueDate:dd MMM yyyy}.",
                    Status = "Sent",
                    SentAtUtc = DateTime.UtcNow
                }, cancellationToken);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
