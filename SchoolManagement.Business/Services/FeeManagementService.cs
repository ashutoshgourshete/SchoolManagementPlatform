using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class FeeManagementService : IFeeManagementService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public FeeManagementService(ApplicationDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<List<FeeStructureDto>>> GetFeeStructuresAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.FeeStructures
            .Include(f => f.AcademicYear)
            .Include(f => f.Class)
            .Include(f => f.Program)
            .Include(f => f.Items)
            .Where(f => !f.IsDeleted);

        if (academicYearId.HasValue)
        {
            query = query.Where(f => f.AcademicYearId == academicYearId.Value);
        }

        var list = await query
            .OrderBy(f => f.Name)
            .Select(f => new FeeStructureDto
            {
                Id = f.Id,
                AcademicYearId = f.AcademicYearId,
                AcademicYearName = f.AcademicYear.Name,
                ClassId = f.ClassId,
                ClassName = f.Class != null ? f.Class.Name : null,
                ProgramId = f.ProgramId,
                ProgramName = f.Program != null ? f.Program.Name : null,
                Name = f.Name,
                BillingCycle = f.BillingCycle,
                TotalAmount = f.TotalAmount,
                IsActive = f.IsActive,
                Items = f.Items.Select(i => new FeeStructureItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Amount = i.Amount,
                    IsOptional = i.IsOptional
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<List<FeeStructureDto>>.Ok(list);
    }

    public async Task<ApiResponse<FeeStructureDto>> CreateFeeStructureAsync(CreateFeeStructureDto dto, CancellationToken cancellationToken = default)
    {
        var total = dto.Items.Sum(i => i.Amount);

        var structure = new FeeStructure
        {
            AcademicYearId = dto.AcademicYearId,
            ClassId = dto.ClassId,
            ProgramId = dto.ProgramId,
            Name = dto.Name,
            BillingCycle = dto.BillingCycle,
            TotalAmount = total,
            IsActive = true
        };

        foreach (var item in dto.Items)
        {
            structure.Items.Add(new FeeStructureItem
            {
                Name = item.Name,
                Amount = item.Amount,
                IsOptional = item.IsOptional
            });
        }

        await _context.FeeStructures.AddAsync(structure, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return (await GetFeeStructuresAsync(dto.AcademicYearId, cancellationToken))
            .Data!.First(s => s.Id == structure.Id) is { } created
            ? ApiResponse<FeeStructureDto>.Ok(created, "Fee structure created successfully")
            : ApiResponse<FeeStructureDto>.Fail("Failed to retrieve created structure");
    }

    public async Task<ApiResponse<StudentFeeAssignmentDto>> AssignFeeToStudentAsync(AssignFeeDto dto, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { dto.StudentId }, cancellationToken);
        if (student == null) return ApiResponse<StudentFeeAssignmentDto>.Fail("Student not found");

        var structure = await _context.FeeStructures.FindAsync(new object[] { dto.FeeStructureId }, cancellationToken);
        if (structure == null) return ApiResponse<StudentFeeAssignmentDto>.Fail("Fee structure not found");

        // Deactivate existing active assignment for this structure if any
        var existing = await _context.StudentFeeAssignments
            .Where(sfa => sfa.StudentId == dto.StudentId && sfa.FeeStructureId == dto.FeeStructureId && sfa.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var ex in existing)
        {
            ex.IsActive = false;
        }

        var assignment = new StudentFeeAssignment
        {
            StudentId = dto.StudentId,
            FeeStructureId = dto.FeeStructureId,
            DiscountPercentage = dto.DiscountPercentage,
            DiscountAmount = dto.DiscountAmount,
            DiscountReason = dto.DiscountReason,
            EffectiveFrom = dto.EffectiveFrom,
            EffectiveTo = dto.EffectiveTo,
            IsActive = true
        };

        await _context.StudentFeeAssignments.AddAsync(assignment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<StudentFeeAssignmentDto>.Ok(new StudentFeeAssignmentDto
        {
            Id = assignment.Id,
            StudentId = student.Id,
            StudentName = student.FullName,
            AdmissionNumber = student.AdmissionNumber,
            FeeStructureId = structure.Id,
            FeeStructureName = structure.Name,
            TotalStructureAmount = structure.TotalAmount,
            DiscountPercentage = assignment.DiscountPercentage,
            DiscountAmount = assignment.DiscountAmount,
            DiscountReason = assignment.DiscountReason,
            EffectiveFrom = assignment.EffectiveFrom,
            EffectiveTo = assignment.EffectiveTo,
            IsActive = assignment.IsActive
        }, "Fee structure assigned to student");
    }

    public async Task<ApiResponse<PagedResult<StudentInvoiceDto>>> GetInvoicesAsync(PaginationFilter filter, Guid? studentId = null, InvoiceStatus? status = null, CancellationToken cancellationToken = default)
    {
        var query = _context.StudentInvoices
            .Include(i => i.Student)
            .Include(i => i.Lines)
            .Where(i => !i.IsDeleted);

        if (studentId.HasValue) query = query.Where(i => i.StudentId == studentId.Value);
        if (status.HasValue) query = query.Where(i => i.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(i =>
                i.InvoiceNumber.ToLower().Contains(search) ||
                i.Student.FirstName.ToLower().Contains(search) ||
                i.Student.LastName.ToLower().Contains(search) ||
                i.Student.AdmissionNumber.ToLower().Contains(search));
        }

        var total = await query.CountAsync(cancellationToken);

        var invoices = await query
            .OrderByDescending(i => i.IssueDate)
            .Skip((filter.PageIndex - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(i => new StudentInvoiceDto
            {
                Id = i.Id,
                StudentId = i.StudentId,
                StudentName = i.Student.FullName,
                AdmissionNumber = i.Student.AdmissionNumber,
                InvoiceNumber = i.InvoiceNumber,
                IssueDate = i.IssueDate,
                DueDate = i.DueDate,
                PeriodStart = i.PeriodStart,
                PeriodEnd = i.PeriodEnd,
                SubTotal = i.SubTotal,
                DiscountAmount = i.DiscountAmount,
                TotalAmount = i.TotalAmount,
                PaidAmount = i.PaidAmount,
                BalanceAmount = i.BalanceAmount,
                CurrencyCode = i.CurrencyCode,
                Status = i.Status,
                Remarks = i.Remarks,
                Lines = i.Lines.Select(l => new InvoiceLineDto
                {
                    Id = l.Id,
                    Description = l.Description,
                    UnitAmount = l.UnitAmount,
                    Quantity = l.Quantity,
                    TotalAmount = l.TotalAmount
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<PagedResult<StudentInvoiceDto>>.Ok(new PagedResult<StudentInvoiceDto>(invoices, total, filter.PageIndex, filter.PageSize));
    }

    public async Task<ApiResponse<StudentInvoiceDto>> GetInvoiceByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var i = await _context.StudentInvoices
            .Include(inv => inv.Student)
            .Include(inv => inv.Lines)
            .FirstOrDefaultAsync(inv => inv.Id == id && !inv.IsDeleted, cancellationToken);

        if (i == null) return ApiResponse<StudentInvoiceDto>.Fail("Invoice not found");

        return ApiResponse<StudentInvoiceDto>.Ok(new StudentInvoiceDto
        {
            Id = i.Id,
            StudentId = i.StudentId,
            StudentName = i.Student.FullName,
            AdmissionNumber = i.Student.AdmissionNumber,
            InvoiceNumber = i.InvoiceNumber,
            IssueDate = i.IssueDate,
            DueDate = i.DueDate,
            PeriodStart = i.PeriodStart,
            PeriodEnd = i.PeriodEnd,
            SubTotal = i.SubTotal,
            DiscountAmount = i.DiscountAmount,
            TotalAmount = i.TotalAmount,
            PaidAmount = i.PaidAmount,
            BalanceAmount = i.BalanceAmount,
            CurrencyCode = i.CurrencyCode,
            Status = i.Status,
            Remarks = i.Remarks,
            Lines = i.Lines.Select(l => new InvoiceLineDto
            {
                Id = l.Id,
                Description = l.Description,
                UnitAmount = l.UnitAmount,
                Quantity = l.Quantity,
                TotalAmount = l.TotalAmount
            }).ToList()
        });
    }

    public async Task<ApiResponse<List<StudentInvoiceDto>>> GenerateInvoicesAsync(GenerateInvoiceDto dto, CancellationToken cancellationToken = default)
    {
        // Identify target students
        var studentsQuery = _context.Students
            .Include(s => s.FeeAssignments.Where(fa => fa.IsActive && !fa.IsDeleted))
                .ThenInclude(fa => fa.FeeStructure)
                    .ThenInclude(fs => fs.Items)
            .Where(s => s.IsActive && !s.IsDeleted);

        if (dto.StudentId.HasValue)
        {
            studentsQuery = studentsQuery.Where(s => s.Id == dto.StudentId.Value);
        }
        else if (dto.ClassSectionId.HasValue)
        {
            studentsQuery = studentsQuery.Where(s => s.Enrollments.Any(e => e.ClassSectionId == dto.ClassSectionId.Value && e.IsActive && !e.IsDeleted));
        }

        var students = await studentsQuery.ToListAsync(cancellationToken);
        if (!students.Any())
        {
            return ApiResponse<List<StudentInvoiceDto>>.Fail("No eligible students found for invoice generation.");
        }

        var year = DateTime.UtcNow.Year;
        var existingCount = await _context.StudentInvoices.CountAsync(cancellationToken);
        var generatedList = new List<StudentInvoiceDto>();

        foreach (var student in students)
        {
            var assignment = student.FeeAssignments.FirstOrDefault();
            if (assignment == null) continue;

            existingCount++;
            var invoiceNumber = $"INV-{year}-{existingCount:D4}";

            var subTotal = assignment.FeeStructure.Items.Sum(i => i.Amount);
            var discount = assignment.DiscountAmount;
            if (assignment.DiscountPercentage > 0)
            {
                discount += (subTotal * (assignment.DiscountPercentage / 100m));
            }
            var totalAmount = Math.Max(0, subTotal - discount);

            var invoice = new StudentInvoice
            {
                StudentId = student.Id,
                InvoiceNumber = invoiceNumber,
                IssueDate = dto.IssueDate,
                DueDate = dto.DueDate,
                PeriodStart = dto.PeriodStart,
                PeriodEnd = dto.PeriodEnd,
                SubTotal = subTotal,
                DiscountAmount = discount,
                TotalAmount = totalAmount,
                PaidAmount = 0m,
                Status = InvoiceStatus.Issued,
                Remarks = dto.Remarks ?? $"Term fee for {assignment.FeeStructure.Name}"
            };

            foreach (var item in assignment.FeeStructure.Items)
            {
                invoice.Lines.Add(new InvoiceLine
                {
                    Description = item.Name,
                    UnitAmount = item.Amount,
                    Quantity = 1,
                    TotalAmount = item.Amount
                });
            }

            await _context.StudentInvoices.AddAsync(invoice, cancellationToken);

            generatedList.Add(new StudentInvoiceDto
            {
                Id = invoice.Id,
                StudentId = student.Id,
                StudentName = student.FullName,
                AdmissionNumber = student.AdmissionNumber,
                InvoiceNumber = invoiceNumber,
                IssueDate = invoice.IssueDate,
                DueDate = invoice.DueDate,
                PeriodStart = invoice.PeriodStart,
                PeriodEnd = invoice.PeriodEnd,
                SubTotal = subTotal,
                DiscountAmount = discount,
                TotalAmount = totalAmount,
                PaidAmount = 0m,
                BalanceAmount = totalAmount,
                Status = InvoiceStatus.Issued,
                Remarks = invoice.Remarks
            });
        }

        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<List<StudentInvoiceDto>>.Ok(generatedList, $"{generatedList.Count} invoices generated successfully");
    }

    public async Task<ApiResponse<PaymentReceiptDto>> RecordPaymentAsync(RecordPaymentDto dto, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students.FindAsync(new object[] { dto.StudentId }, cancellationToken);
        if (student == null) return ApiResponse<PaymentReceiptDto>.Fail("Student not found");

        var year = DateTime.UtcNow.Year;
        var paymentCount = await _context.Payments.CountAsync(cancellationToken) + 1;
        var receiptNumber = $"RCT-{year}-{paymentCount:D4}";

        var payment = new Payment
        {
            StudentId = dto.StudentId,
            StudentInvoiceId = dto.StudentInvoiceId,
            ReceiptNumber = receiptNumber,
            PaymentDateUtc = DateTime.UtcNow,
            Amount = dto.Amount,
            Method = dto.Method,
            Status = PaymentStatus.Completed,
            GatewayTransactionId = dto.GatewayTransactionId,
            Notes = dto.Notes,
            CollectedByUserId = _currentTenantService.UserId
        };

        // If specific invoice is specified, allocate directly
        if (dto.StudentInvoiceId.HasValue)
        {
            var invoice = await _context.StudentInvoices.FindAsync(new object[] { dto.StudentInvoiceId.Value }, cancellationToken);
            if (invoice != null)
            {
                var allocAmount = Math.Min(dto.Amount, invoice.BalanceAmount);
                invoice.PaidAmount += allocAmount;

                if (invoice.BalanceAmount <= 0)
                {
                    invoice.Status = InvoiceStatus.Paid;
                }
                else
                {
                    invoice.Status = InvoiceStatus.PartiallyPaid;
                }

                payment.Allocations.Add(new PaymentAllocation
                {
                    StudentInvoice = invoice,
                    Amount = allocAmount
                });
            }
        }
        else
        {
            // Auto-allocate across unpaid/partially paid invoices oldest first
            var pendingInvoices = await _context.StudentInvoices
                .Where(i => i.StudentId == dto.StudentId && (i.Status == InvoiceStatus.Issued || i.Status == InvoiceStatus.PartiallyPaid || i.Status == InvoiceStatus.Overdue))
                .OrderBy(i => i.DueDate)
                .ToListAsync(cancellationToken);

            var remainingPayment = dto.Amount;
            foreach (var inv in pendingInvoices)
            {
                if (remainingPayment <= 0) break;

                var allocAmount = Math.Min(remainingPayment, inv.BalanceAmount);
                inv.PaidAmount += allocAmount;
                remainingPayment -= allocAmount;

                if (inv.BalanceAmount <= 0) inv.Status = InvoiceStatus.Paid;
                else inv.Status = InvoiceStatus.PartiallyPaid;

                payment.Allocations.Add(new PaymentAllocation
                {
                    StudentInvoice = inv,
                    Amount = allocAmount
                });
            }
        }

        await _context.Payments.AddAsync(payment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var receiptDto = new PaymentReceiptDto
        {
            PaymentId = payment.Id,
            ReceiptNumber = payment.ReceiptNumber,
            PaymentDateUtc = payment.PaymentDateUtc,
            StudentId = student.Id,
            StudentName = student.FullName,
            AdmissionNumber = student.AdmissionNumber,
            InvoiceNumber = payment.Allocations.FirstOrDefault()?.StudentInvoice?.InvoiceNumber,
            Amount = payment.Amount,
            CurrencyCode = payment.CurrencyCode,
            Method = payment.Method,
            Status = payment.Status,
            Notes = payment.Notes,
            CollectedBy = _currentTenantService.UserId?.ToString()
        };

        return ApiResponse<PaymentReceiptDto>.Ok(receiptDto, "Payment recorded and allocated successfully");
    }

    public async Task<ApiResponse<PaymentReceiptDto>> GetPaymentReceiptAsync(Guid paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await _context.Payments
            .Include(p => p.Student)
            .Include(p => p.Allocations)
                .ThenInclude(a => a.StudentInvoice)
            .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);

        if (payment == null) return ApiResponse<PaymentReceiptDto>.Fail("Payment receipt not found");

        return ApiResponse<PaymentReceiptDto>.Ok(new PaymentReceiptDto
        {
            PaymentId = payment.Id,
            ReceiptNumber = payment.ReceiptNumber,
            PaymentDateUtc = payment.PaymentDateUtc,
            StudentId = payment.StudentId,
            StudentName = payment.Student.FullName,
            AdmissionNumber = payment.Student.AdmissionNumber,
            InvoiceNumber = payment.Allocations.FirstOrDefault()?.StudentInvoice?.InvoiceNumber,
            Amount = payment.Amount,
            CurrencyCode = payment.CurrencyCode,
            Method = payment.Method,
            Status = payment.Status,
            Notes = payment.Notes
        });
    }

    public async Task<ApiResponse<List<OutstandingBalanceReportDto>>> GetOutstandingBalancesAsync(CancellationToken cancellationToken = default)
    {
        var list = await _context.Students
            .Include(s => s.Enrollments.Where(e => e.IsActive && !e.IsDeleted))
                .ThenInclude(e => e.ClassSection)
                    .ThenInclude(cs => cs.Class)
            .Include(s => s.Invoices.Where(i => !i.IsDeleted))
            .Where(s => s.IsActive && !s.IsDeleted && s.Invoices.Any(i => i.PaidAmount < i.TotalAmount))
            .ToListAsync(cancellationToken);

        var report = list.Select(s =>
        {
            var enrollment = s.Enrollments.FirstOrDefault();
            var totalInvoiced = s.Invoices.Sum(i => i.TotalAmount);
            var totalPaid = s.Invoices.Sum(i => i.PaidAmount);
            var outstanding = totalInvoiced - totalPaid;
            var overdue = s.Invoices.Count(i => i.DueDate < DateTime.UtcNow && i.PaidAmount < i.TotalAmount);

            return new OutstandingBalanceReportDto
            {
                StudentId = s.Id,
                StudentName = s.FullName,
                AdmissionNumber = s.AdmissionNumber,
                ClassName = enrollment?.ClassSection?.Class?.Name ?? "Unassigned",
                SectionName = enrollment?.ClassSection?.Name ?? "Unassigned",
                TotalInvoiced = totalInvoiced,
                TotalPaid = totalPaid,
                TotalOutstanding = outstanding,
                OverdueInvoiceCount = overdue
            };
        }).OrderByDescending(r => r.TotalOutstanding).ToList();

        return ApiResponse<List<OutstandingBalanceReportDto>>.Ok(report);
    }
}
