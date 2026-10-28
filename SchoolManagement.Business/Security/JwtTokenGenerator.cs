using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Security;

public class JwtSettings
{
    public string SecretKey { get; set; } = "SchoolManagementPlatformSuperSecretKey2026!#*123456789";
    public string Issuer { get; set; } = "SchoolManagementPlatform";
    public string Audience { get; set; } = "SchoolManagementPlatformClient";
    public int ExpiryMinutes { get; set; } = 120;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}

public interface IJwtTokenGenerator
{
    (string Token, DateTime Expiration) GenerateToken(
        ApplicationUser user,
        IList<string> roles,
        Guid? tenantId = null,
        Guid? institutionId = null);

    string GenerateRefreshToken();
}

public class JwtTokenGenerator : IJwtTokenGenerator
{
    private readonly JwtSettings _jwtSettings;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
    }

    public (string Token, DateTime Expiration) GenerateToken(
        ApplicationUser user,
        IList<string> roles,
        Guid? tenantId = null,
        Guid? institutionId = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (tenantId.HasValue && tenantId.Value != Guid.Empty)
        {
            claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));
        }

        if (institutionId.HasValue && institutionId.Value != Guid.Empty)
        {
            claims.Add(new Claim("institution_id", institutionId.Value.ToString()));
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return (tokenHandler.WriteToken(token), expiration);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
