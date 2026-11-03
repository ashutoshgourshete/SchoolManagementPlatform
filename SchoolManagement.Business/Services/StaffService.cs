using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class StaffService : IStaffService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentTenantService _currentTenantService;

    public StaffService(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ICurrentTenantService currentTenantService)
    {
        _context = context;
        _userManager = userManager;
        _currentTenantService = currentTenantService;
    }

    public async Task<ApiResponse<PagedResult<StaffDto>>> GetStaffAsync(PaginationFilter filter, Guid? departmentId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.StaffMembers
            .Include(s => s.Department)
            .Where(s => !s.IsDeleted);

        if (departmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == departmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(s =>
                s.FirstName.ToLower().Contains(search) ||
                s.LastName.ToLower().Contains(search) ||
                s.EmployeeCode.ToLower().Contains(search) ||
                s.Designation.ToLower().Contains(search) ||
                s.Email.ToLower().Contains(search));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Skip((filter.PageIndex - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new StaffDto
            {
                Id = s.Id,
                EmployeeCode = s.EmployeeCode,
                FirstName = s.FirstName,
                LastName = s.LastName,
                Designation = s.Designation,
                DepartmentId = s.DepartmentId,
                DepartmentName = s.Department != null ? s.Department.Name : null,
                Qualification = s.Qualification,
                Email = s.Email,
                Phone = s.Phone,
                JoiningDate = s.JoiningDate,
                IsActive = s.IsActive,
                ReportsToStaffId = s.ReportsToStaffId,
                ReportsToName = s.ReportsToStaff != null ? s.ReportsToStaff.FirstName + " " + s.ReportsToStaff.LastName : null,
                ReportsToDesignation = s.ReportsToStaff != null ? s.ReportsToStaff.Designation : null,
                SubordinatesCount = s.DirectReports.Count
            })
            .ToListAsync(cancellationToken);

        return ApiResponse<PagedResult<StaffDto>>.Ok(new PagedResult<StaffDto>(items, total, filter.PageIndex, filter.PageSize));
    }

    public async Task<ApiResponse<StaffDto>> GetStaffByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var s = await _context.StaffMembers
            .Include(s => s.Department)
            .Include(s => s.ReportsToStaff)
            .Include(s => s.DirectReports)
            .FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted, cancellationToken);

        if (s == null) return ApiResponse<StaffDto>.Fail("Staff member not found");

        return ApiResponse<StaffDto>.Ok(new StaffDto
        {
            Id = s.Id,
            EmployeeCode = s.EmployeeCode,
            FirstName = s.FirstName,
            LastName = s.LastName,
            Designation = s.Designation,
            DepartmentId = s.DepartmentId,
            DepartmentName = s.Department != null ? s.Department.Name : null,
            Qualification = s.Qualification,
            Email = s.Email,
            Phone = s.Phone,
            JoiningDate = s.JoiningDate,
            IsActive = s.IsActive,
            ReportsToStaffId = s.ReportsToStaffId,
            ReportsToName = s.ReportsToStaff != null ? $"{s.ReportsToStaff.FirstName} {s.ReportsToStaff.LastName}".Trim() : null,
            ReportsToDesignation = s.ReportsToStaff?.Designation,
            SubordinatesCount = s.DirectReports.Count
        });
    }

    public async Task<ApiResponse<StaffDto>> CreateStaffAsync(CreateStaffDto dto, CancellationToken cancellationToken = default)
    {
        var exists = await _context.StaffMembers.AnyAsync(s => s.EmployeeCode == dto.EmployeeCode.Trim(), cancellationToken);
        if (exists)
        {
            return ApiResponse<StaffDto>.Fail($"Employee code '{dto.EmployeeCode}' is already registered.");
        }

        Guid? createdUserId = null;

        // Optionally create application user login for staff
        var existingUser = await _userManager.FindByEmailAsync(dto.Email.Trim());
        if (existingUser == null)
        {
            var user = new ApplicationUser
            {
                UserName = dto.Email.Trim(),
                Email = dto.Email.Trim(),
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName.Trim(),
                PhoneNumber = dto.Phone.Trim(),
                PrimaryRole = dto.Role,
                IsActive = true
            };

            var userResult = await _userManager.CreateAsync(user, "Staff@123456");
            if (userResult.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, dto.Role.ToString());
                createdUserId = user.Id;

                if (_currentTenantService.TenantId.HasValue)
                {
                    await _context.TenantMemberships.AddAsync(new TenantMembership
                    {
                        TenantId = _currentTenantService.TenantId.Value,
                        UserId = user.Id,
                        Role = dto.Role,
                        IsActive = true
                    }, cancellationToken);

                    if (_currentTenantService.InstitutionId.HasValue)
                    {
                        await _context.InstitutionMemberships.AddAsync(new InstitutionMembership
                        {
                            TenantId = _currentTenantService.TenantId.Value,
                            InstitutionId = _currentTenantService.InstitutionId.Value,
                            UserId = user.Id,
                            Role = dto.Role,
                            IsActive = true
                        }, cancellationToken);
                    }
                }
            }
        }
        else
        {
            createdUserId = existingUser.Id;
        }

        var staff = new Staff
        {
            UserId = createdUserId,
            EmployeeCode = dto.EmployeeCode.Trim(),
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Designation = dto.Designation.Trim(),
            DepartmentId = dto.DepartmentId,
            Qualification = dto.Qualification?.Trim(),
            Email = dto.Email.Trim(),
            Phone = dto.Phone.Trim(),
            JoiningDate = dto.JoiningDate,
            ReportsToStaffId = dto.ReportsToStaffId,
            IsActive = true
        };

        await _context.StaffMembers.AddAsync(staff, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return await GetStaffByIdAsync(staff.Id, cancellationToken);
    }

    public async Task<ApiResponse<List<StaffHierarchyDto>>> GetHierarchyTreeAsync(CancellationToken cancellationToken = default)
    {
        var staffList = await _context.StaffMembers
            .Include(s => s.Department)
            .Include(s => s.ReportsToStaff)
            .Where(s => !s.IsDeleted && s.IsActive)
            .OrderBy(s => s.FirstName)
            .Select(s => new StaffHierarchyDto
            {
                Id = s.Id,
                EmployeeCode = s.EmployeeCode,
                FullName = (s.FirstName + " " + s.LastName).Trim(),
                Designation = s.Designation,
                DepartmentName = s.Department != null ? s.Department.Name : null,
                Email = s.Email,
                Phone = s.Phone,
                ReportsToStaffId = s.ReportsToStaffId,
                ReportsToName = s.ReportsToStaff != null ? (s.ReportsToStaff.FirstName + " " + s.ReportsToStaff.LastName).Trim() : null
            })
            .ToListAsync(cancellationToken);

        var lookup = staffList.ToLookup(s => s.ReportsToStaffId);
        foreach (var member in staffList)
        {
            member.DirectReports = lookup[member.Id].ToList();
        }

        // Roots are staff members who do not report to anyone, or whose supervisor is not in the active staff list
        var staffIds = staffList.Select(s => s.Id).ToHashSet();
        var roots = staffList
            .Where(s => !s.ReportsToStaffId.HasValue || !staffIds.Contains(s.ReportsToStaffId.Value))
            .ToList();

        // Sort roots: Director first, then Principal, etc.
        roots = roots.OrderBy(r => GetRolePriority(r.Designation)).ToList();

        return ApiResponse<List<StaffHierarchyDto>>.Ok(roots);
    }

    private static int GetRolePriority(string designation)
    {
        var d = designation.ToLowerInvariant();
        if (d.Contains("director")) return 1;
        if (d.Contains("vice") && d.Contains("principal")) return 3;
        if (d.Contains("principal")) return 2;
        if (d.Contains("head") || d.Contains("hod")) return 4;
        if (d.Contains("teacher") || d.Contains("faculty")) return 5;
        return 6;
    }
}
