using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SchoolManagement.API.BackgroundServices;
using SchoolManagement.API.Middleware;
using SchoolManagement.Business.Interfaces;
using SchoolManagement.Business.Security;
using SchoolManagement.Business.Services;
using SchoolManagement.Data;
using SchoolManagement.Data.Services;
using SchoolManagement.Models.Entities;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Configuration & DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=(localdb)\\MSSQLLocalDB;Database=SchoolManagementSaaS_Dev;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// 2. Add ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// 3. Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
var key = Encoding.UTF8.GetBytes(jwtSettings.SecretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. Add Multi-Tenant Context and Business Services
builder.Services.AddScoped<ICurrentTenantService, CurrentTenantService>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IAcademicService, AcademicService>();
builder.Services.AddScoped<IStudentService, StudentService>();
builder.Services.AddScoped<IStaffService, StaffService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IExaminationService, ExaminationService>();
builder.Services.AddScoped<IFeeManagementService, FeeManagementService>();
builder.Services.AddScoped<IPaymentGatewayService, PaymentGatewayService>();
builder.Services.AddScoped<ISubscriptionBillingService, SubscriptionBillingService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAnnouncementService, AnnouncementService>();

// 5. Add Background Hosted Services
builder.Services.AddHostedService<AutomatedBillingBackgroundService>();

// 6. Add CORS
var allowedOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:4200", "https://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 7. Add Swagger with Bearer Support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "School & College Management SaaS API",
        Version = "v1",
        Description = "Production-oriented multi-tenant School & College Management Platform REST API."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token format: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 8. Auto-migrate database & seed initial demo data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        // Ensure database is created with schema
        await context.Database.EnsureCreatedAsync();

        // Seed default roles, platform plans, platform admin, and demo academy tenant
        await DbSeeder.SeedAsync(context, userManager, roleManager);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database migration/seeding.");
    }
}

// 9. Configure Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "School Management API v1");
        c.RoutePrefix = string.Empty; // Swagger at root for convenience
    });
}

app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
