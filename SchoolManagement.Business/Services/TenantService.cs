using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class TenantService : ITenantService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentTenantService _currentTenantService;

    public TenantService(ApplicationDbContext context, ICurrentTenantService currentTenantService)
    {
        _context = context;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<List<TenantDto>>> GetAllTenantsAsync(CancellationToken cancellationToken = default)
    {
        var tenants = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Institutions)
            .Include(t => t.Subscriptions)
                .ThenInclude(s => s.PlatformPlan)
            .OrderByDescending(t => t.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var dtos = tenants.Select(t => new TenantDto
        {
            Id = t.Id,
            Name = t.Name,
            Code = t.Code,
            Domain = t.Domain,
            Status = t.Status,
            ContactEmail = t.ContactEmail,
            ContactPhone = t.ContactPhone,
            Address = t.Address,
            CurrencyCode = t.CurrencyCode,
            CreatedAtUtc = t.CreatedAtUtc,
            InstitutionCount = t.Institutions.Count,
            StudentCount = _context.Students.IgnoreQueryFilters().Count(s => s.TenantId == t.Id && !s.IsDeleted),
            CurrentPlanName = t.Subscriptions.OrderByDescending(s => s.CreatedAtUtc).FirstOrDefault()?.PlatformPlan?.Name ?? "Trial"
        }).ToList();

        return ApiResponse<List<TenantDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<TenantDto>> GetTenantByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var t = await _context.Tenants
            .IgnoreQueryFilters()
            .Include(t => t.Institutions)
            .Include(t => t.Subscriptions)
                .ThenInclude(s => s.PlatformPlan)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (t == null)
        {
            return ApiResponse<TenantDto>.Fail("Tenant not found");
        }

        var dto = new TenantDto
        {
            Id = t.Id,
            Name = t.Name,
            Code = t.Code,
            Domain = t.Domain,
            Status = t.Status,
            ContactEmail = t.ContactEmail,
            ContactPhone = t.ContactPhone,
            Address = t.Address,
            CurrencyCode = t.CurrencyCode,
            CreatedAtUtc = t.CreatedAtUtc,
            InstitutionCount = t.Institutions.Count,
            StudentCount = _context.Students.IgnoreQueryFilters().Count(s => s.TenantId == t.Id && !s.IsDeleted),
            CurrentPlanName = t.Subscriptions.OrderByDescending(s => s.CreatedAtUtc).FirstOrDefault()?.PlatformPlan?.Name ?? "Trial"
        };

        return ApiResponse<TenantDto>.Ok(dto);
    }

    public async Task<ApiResponse<TenantDto>> UpdateTenantStatusAsync(Guid id, TenantStatus status, CancellationToken cancellationToken = default)
    {
        var tenant = await _context.Tenants.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (tenant == null)
        {
            return ApiResponse<TenantDto>.Fail("Tenant not found");
        }

        tenant.Status = status;
        await _context.SaveChangesAsync(cancellationToken);

        return await GetTenantByIdAsync(id, cancellationToken);
    }

    public async Task<ApiResponse<List<InstitutionDto>>> GetInstitutionsAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var targetTenantId = _currentTenantService.IsPlatformAdmin ? tenantId : (_currentTenantService.TenantId ?? tenantId);

        var list = await _context.Institutions
            .IgnoreQueryFilters()
            .Where(i => i.TenantId == targetTenantId && !i.IsDeleted)
            .ToListAsync(cancellationToken);

        var dtos = list.Select(i => new InstitutionDto
        {
            Id = i.Id,
            TenantId = i.TenantId,
            Name = i.Name,
            Code = i.Code,
            Type = i.Type,
            ContactEmail = i.ContactEmail,
            ContactPhone = i.ContactPhone,
            Address = i.Address,
            Website = i.Website,
            IsActive = i.IsActive
        }).ToList();

        return ApiResponse<List<InstitutionDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<InstitutionDto>> CreateInstitutionAsync(Guid tenantId, CreateInstitutionDto dto, CancellationToken cancellationToken = default)
    {
        var targetTenantId = _currentTenantService.IsPlatformAdmin ? tenantId : (_currentTenantService.TenantId ?? tenantId);

        var codeExists = await _context.Institutions
            .IgnoreQueryFilters()
            .AnyAsync(i => i.TenantId == targetTenantId && i.Code == dto.Code.Trim().ToUpperInvariant(), cancellationToken);

        if (codeExists)
        {
            return ApiResponse<InstitutionDto>.Fail($"Institution code '{dto.Code}' already exists for this tenant.");
        }

        var inst = new Institution
        {
            TenantId = targetTenantId,
            Name = dto.Name,
            Code = dto.Code.Trim().ToUpperInvariant(),
            Type = dto.Type,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            Address = dto.Address,
            Website = dto.Website,
            IsActive = true
        };

        await _context.Institutions.AddAsync(inst, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return ApiResponse<InstitutionDto>.Ok(new InstitutionDto
        {
            Id = inst.Id,
            TenantId = inst.TenantId,
            Name = inst.Name,
            Code = inst.Code,
            Type = inst.Type,
            ContactEmail = inst.ContactEmail,
            ContactPhone = inst.ContactPhone,
            Address = inst.Address,
            Website = inst.Website,
            IsActive = inst.IsActive
        }, "Institution created successfully");
    }
}
