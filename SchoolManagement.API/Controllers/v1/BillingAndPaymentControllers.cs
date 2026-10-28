using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.API.Controllers.v1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class FeesController : ControllerBase
{
    private readonly IFeeManagementService _feeManagementService;

    public FeesController(IFeeManagementService feeManagementService)
    {
        _feeManagementService = feeManagementService;
    }

    [HttpGet("structures")]
    public async Task<IActionResult> GetFeeStructures([FromQuery] Guid? academicYearId, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.GetFeeStructuresAsync(academicYearId, cancellationToken);
        return Ok(result);
    }

    [HttpPost("structures")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Accountant")]
    public async Task<IActionResult> CreateFeeStructure([FromBody] CreateFeeStructureDto dto, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.CreateFeeStructureAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("assign")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Accountant")]
    public async Task<IActionResult> AssignFee([FromBody] AssignFeeDto dto, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.AssignFeeToStudentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IFeeManagementService _feeManagementService;

    public InvoicesController(IFeeManagementService feeManagementService)
    {
        _feeManagementService = feeManagementService;
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? studentId = null,
        [FromQuery] InvoiceStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new PaginationFilter
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            SearchTerm = search
        };

        var result = await _feeManagementService.GetInvoicesAsync(filter, studentId, status, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetInvoiceById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.GetInvoiceByIdAsync(id, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPost("generate")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Accountant")]
    public async Task<IActionResult> GenerateInvoices([FromBody] GenerateInvoiceDto dto, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.GenerateInvoicesAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/v1/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IFeeManagementService _feeManagementService;
    private readonly IPaymentGatewayService _paymentGatewayService;

    public PaymentsController(
        IFeeManagementService feeManagementService,
        IPaymentGatewayService paymentGatewayService)
    {
        _feeManagementService = feeManagementService;
        _paymentGatewayService = paymentGatewayService;
    }

    [HttpPost("collect-manual")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Accountant")]
    public async Task<IActionResult> RecordManualPayment([FromBody] RecordPaymentDto dto, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.RecordPaymentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("receipts/{paymentId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetPaymentReceipt(Guid paymentId, CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.GetPaymentReceiptAsync(paymentId, cancellationToken);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("outstanding-balances")]
    [Authorize(Roles = "PlatformAdmin,InstitutionAdmin,Accountant")]
    public async Task<IActionResult> GetOutstandingBalances(CancellationToken cancellationToken)
    {
        var result = await _feeManagementService.GetOutstandingBalancesAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost("initiate-online")]
    [Authorize]
    public async Task<IActionResult> InitiateOnlinePayment([FromBody] InitiateOnlinePaymentDto dto, CancellationToken cancellationToken)
    {
        var result = await _paymentGatewayService.InitiatePaymentAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ProcessWebhook([FromBody] PaymentWebhookDto dto, CancellationToken cancellationToken)
    {
        var result = await _paymentGatewayService.ProcessWebhookAsync(dto, cancellationToken);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
