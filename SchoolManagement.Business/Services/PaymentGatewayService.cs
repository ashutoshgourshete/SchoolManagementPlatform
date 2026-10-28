using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Services;

public class PaymentGatewayService : IPaymentGatewayService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ICurrentTenantService _currentTenantService;
    private readonly ILogger<PaymentGatewayService> _logger;

    public PaymentGatewayService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ICurrentTenantService currentTenantService,
        ILogger<PaymentGatewayService> logger)
    {
        _context = context;
        _configuration = configuration;
        _currentTenantService = currentTenantService;
        _logger = logger;
    }

    public async Task<ApiResponse<OnlinePaymentInitiationResultDto>> InitiatePaymentAsync(InitiateOnlinePaymentDto dto, CancellationToken cancellationToken = default)
    {
        var invoice = await _context.StudentInvoices
            .Include(i => i.Student)
            .FirstOrDefaultAsync(i => i.Id == dto.StudentInvoiceId, cancellationToken);

        if (invoice == null) return ApiResponse<OnlinePaymentInitiationResultDto>.Fail("Invoice not found");

        if (dto.Amount <= 0 || dto.Amount > invoice.BalanceAmount)
        {
            return ApiResponse<OnlinePaymentInitiationResultDto>.Fail($"Invalid payment amount. Balance due is {invoice.BalanceAmount}.");
        }

        var provider = dto.GatewayProvider;
        var orderId = $"{provider.ToUpperInvariant()}_ORD_{Guid.NewGuid():N}".Substring(0, 24);
        var key = _configuration[$"PaymentGateways:{provider}:KeyId"] ?? "rzp_test_sampleKey12345";

        var result = new OnlinePaymentInitiationResultDto
        {
            OrderId = orderId,
            Amount = dto.Amount,
            Currency = invoice.CurrencyCode,
            GatewayProvider = provider,
            ProviderKey = key
        };

        return ApiResponse<OnlinePaymentInitiationResultDto>.Ok(result, "Online payment initiated successfully");
    }

    public async Task<ApiResponse<bool>> ProcessWebhookAsync(PaymentWebhookDto dto, CancellationToken cancellationToken = default)
    {
        // 1. Deduplication Check using PaymentWebhookEvent table
        var isDuplicate = await _context.PaymentWebhookEvents
            .AnyAsync(w => w.ProviderName == dto.Provider && w.EventId == dto.EventId, cancellationToken);

        if (isDuplicate)
        {
            _logger.LogInformation("Duplicate webhook event ignored: Provider={Provider}, EventId={EventId}", dto.Provider, dto.EventId);
            return ApiResponse<bool>.Ok(true, "Event already processed (idempotent duplicate)");
        }

        // 2. Signature verification
        var webhookSecret = _configuration[$"PaymentGateways:{dto.Provider}:WebhookSecret"] ?? "sample_webhook_secret_key";
        var isValidSignature = VerifyHmacSignature(dto.Payload, dto.Signature, webhookSecret);

        var webhookLog = new PaymentWebhookEvent
        {
            ProviderName = dto.Provider,
            EventId = dto.EventId,
            EventType = dto.EventType,
            RawPayload = dto.Payload,
            ReceivedAtUtc = DateTime.UtcNow
        };

        if (!isValidSignature && !_configuration.GetValue<bool>("PaymentGateways:AllowUnsignedWebhooksInDev", true))
        {
            webhookLog.IsSuccess = false;
            webhookLog.ErrorMessage = "Invalid signature";
            await _context.PaymentWebhookEvents.AddAsync(webhookLog, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Fail("Invalid webhook signature");
        }

        try
        {
            using var doc = JsonDocument.Parse(dto.Payload);
            var root = doc.RootElement;

            if (dto.EventType == "payment.captured" || dto.EventType == "charge.successful")
            {
                if (root.TryGetProperty("invoice_id", out var invoiceIdProp) &&
                    Guid.TryParse(invoiceIdProp.GetString(), out var invoiceId) &&
                    root.TryGetProperty("amount", out var amountProp))
                {
                    var amount = amountProp.GetDecimal();
                    var transactionId = root.TryGetProperty("payment_id", out var payId) ? payId.GetString() : dto.EventId;

                    var invoice = await _context.StudentInvoices
                        .Include(i => i.Student)
                        .FirstOrDefaultAsync(i => i.Id == invoiceId, cancellationToken);

                    if (invoice != null)
                    {
                        var year = DateTime.UtcNow.Year;
                        var paymentCount = await _context.Payments.CountAsync(cancellationToken) + 1;
                        var receiptNumber = $"RCT-{year}-{paymentCount:D4}";

                        var payment = new Payment
                        {
                            StudentId = invoice.StudentId,
                            StudentInvoiceId = invoice.Id,
                            ReceiptNumber = receiptNumber,
                            PaymentDateUtc = DateTime.UtcNow,
                            Amount = amount,
                            Method = PaymentMethod.OnlineUPI,
                            Status = PaymentStatus.Completed,
                            CurrencyCode = invoice.CurrencyCode,
                            GatewayName = dto.Provider,
                            GatewayTransactionId = transactionId,
                            Notes = $"Online payment confirmed via webhook ({dto.Provider})"
                        };

                        var allocAmount = Math.Min(amount, invoice.BalanceAmount);
                        invoice.PaidAmount += allocAmount;
                        invoice.Status = invoice.BalanceAmount <= 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid;

                        payment.Allocations.Add(new PaymentAllocation
                        {
                            StudentInvoice = invoice,
                            Amount = allocAmount
                        });

                        await _context.Payments.AddAsync(payment, cancellationToken);
                    }
                }
            }

            webhookLog.IsSuccess = true;
            webhookLog.ProcessedAtUtc = DateTime.UtcNow;
            await _context.PaymentWebhookEvents.AddAsync(webhookLog, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return ApiResponse<bool>.Ok(true, "Webhook processed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing webhook {EventId}", dto.EventId);
            webhookLog.IsSuccess = false;
            webhookLog.ErrorMessage = ex.Message;
            await _context.PaymentWebhookEvents.AddAsync(webhookLog, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);
            return ApiResponse<bool>.Fail($"Webhook processing error: {ex.Message}");
        }
    }

    private static bool VerifyHmacSignature(string payload, string signature, string secret)
    {
        if (string.IsNullOrEmpty(signature) || string.IsNullOrEmpty(secret)) return false;

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedSignature = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

        return string.Equals(computedSignature, signature, StringComparison.OrdinalIgnoreCase);
    }
}
