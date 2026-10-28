# EduManage SaaS: School & College Management Platform

A commercial, production-oriented, multi-tenant SaaS platform built with **ASP.NET Core 8 Web API (C#)**, **Entity Framework Core 8**, **SQL Server**, and **Angular (TypeScript)**.

---

## 1. Solution Architecture

The system is architected as a clean, layered modular monolith with strict separation of concerns and tenant isolation:

```
SchoolManagementPlatform/
├── SchoolManagement.API/          # RESTful v1 controllers, middleware, JWT auth, Swagger, Hosted services
├── SchoolManagement.Business/     # Domain services, business rules, interfaces, security, billing runners
├── SchoolManagement.Data/         # ApplicationDbContext, EF Core migrations, global query filters, seeder
├── SchoolManagement.Models/       # Domain entities, enums, DTOs, API wrappers (ApiResponse, PagedResult)
├── SchoolManagement.Tests/        # Automated integration and unit tests (xUnit, InMemory DB, Moq)
└── school-management-ui/          # Angular 18/19 SPA with standalone components, interceptors, and guards
```

### Multi-Tenancy & Security Isolation
- **Tenant Isolation**: Every institution-owned entity inherits `ITenantEntity` and/or `IInstitutionEntity`.
- **Global Query Filters**: `ApplicationDbContext` enforces `TenantId == currentTenantService.TenantId` and soft-delete filters (`!IsDeleted`) across all queries.
- **Trusted JWT Claims**: `TenantResolutionMiddleware` extracts `tenant_id` and `institution_id` exclusively from cryptographically signed JWT claims. The client cannot forge or supply an arbitrary `TenantId`.
- **Role-Based Access Control (RBAC)**: Supports `PlatformAdmin`, `InstitutionAdmin`, `Teacher`, `Accountant`, `Student`, and `Parent`.

---

## 2. Business Models Supported

1. **Platform SaaS Subscription Billing**: Schools and colleges subscribe to tiers (`Starter`, `Standard`, `Enterprise`) on a monthly or annual billing cycle.
2. **Institution Fee Billing**: Institutions configure fee schedules (monthly, quarterly, annual), line-item breakdowns (tuition, laboratory, library, sports), student scholarship discounts, automated term invoices, manual fee collection receipts, online checkout, and overdue aging reports.
3. **Dual Education Structure**:
   - **K-12 School Model**: Academic years, grades, classes, sections, and class teachers.
   - **Higher Education / College Model**: Departments, degree programs (e.g. B.Tech, B.Sc), semester tracking (1–8), credits, and course offerings.

---

## 3. Seed Data & Demo Accounts

The database auto-seeds on first startup with demo data for **Apex International Academy**:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Platform SuperAdmin** | `platformadmin@schoolsaas.com` | `Admin@123456` | Global SaaS overview, all tenants, MRR/ARR |
| **Institution Admin** | `admin@apexacademy.edu` | `Admin@123456` | Full institution management, staff, academics |
| **Teacher / Faculty** | `teacher@apexacademy.edu` | `Teacher@123456` | Attendance entry, exam marks recording |
| **Accountant** | `accountant@apexacademy.edu` | `Account@123456` | Fee invoices, cash/bank collection, receipts |

---

## 4. Local Development Instructions

### Prerequisites
- .NET 8 SDK or .NET 9/10 SDK with net8.0 runtime
- SQL Server (LocalDB or Express)
- Node.js (v18+) and npm (for Angular frontend)

### Backend Setup
1. Clone or navigate to the solution directory:
   ```bash
   cd SchoolManagementPlatform
   ```
2. Verify or update connection string in `SchoolManagement.API/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=SchoolManagementSaaS_Dev;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
   }
   ```
3. Apply database migrations:
   ```bash
   dotnet ef database update --project SchoolManagement.Data --startup-project SchoolManagement.API
   ```
4. Run the Web API:
   ```bash
   dotnet run --project SchoolManagement.API
   ```
5. Open Swagger UI in your browser at `https://localhost:5001` or `http://localhost:5000`.

### Running Automated Tests
```bash
dotnet test SchoolManagement.Tests/SchoolManagement.Tests.csproj
```
All 6 test suites verify:
- Cross-tenant data isolation and global query filters
- Student admission and duplicate admission number rejection
- Scholarship discount calculation and term invoice generation
- Manual payment allocation and invoice status transitions
- Webhook deduplication and signature idempotency

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd school-management-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm start
   ```
4. Access the dashboard at `http://localhost:4200`.

---

## 5. Low-Cost Production Deployment & Monthly Cost in INR

To achieve maximum reliability and security with minimum ongoing expenditure, the recommended architecture avoids paid Kubernetes clusters and expensive enterprise database tiers:

```
[Cloudflare DNS + SSL + Edge Cache (Free)]
                 │
  ┌──────────────┴──────────────┐
  │                             │
[Angular SPA]             [.NET 8 Web API]
Static Hosting (Vercel /   Single Linux VPS (Hetzner / DigitalOcean)
Cloudflare Pages / S3)     Nginx Reverse Proxy + Kestrel Systemd
Cost: ₹0 / month          Cost: ~₹450 / month
                                │
                                ▼
                       [Managed SQL Server / PostgreSQL]
                       Azure SQL Database Basic (5 DTU)
                       or Contabo / Hetzner Dedicated SQL Instance
                       Cost: ~₹420 - ₹950 / month
```

### Monthly Cost Breakdown (INR)

| Component | Recommended Low-Cost Provider | Specifications | Estimated Monthly Cost |
| :--- | :--- | :--- | :--- |
| **Frontend Static Hosting** | Cloudflare Pages / Vercel Hobby | Global CDN, HTTPS, Unlimited Bandwidth | **₹0** (Free Tier) |
| **API Backend (Compute)** | Hetzner Cloud (CPX11) or DigitalOcean | 2 vCPU, 2 GB RAM, 40 GB NVMe, Ubuntu Linux | **~₹450 / mo** (€4.50) |
| **Database (SQL Server)** | Azure SQL Database (Basic 5 DTU, 2 GB) or Self-Hosted SQL on VPS | Managed automated backups, 99.99% SLA | **~₹420 / mo** ($4.99) |
| **Domain & DNS / SSL** | Cloudflare DNS + Standard .com / .in domain | Universal SSL, DDoS protection | **~₹75 / mo** (₹900/yr) |
| **Transactional Email** | Brevo / Resend Free Tier | Up to 300 emails/day | **₹0** (Free Tier) |
| **Payment Gateway** | Razorpay / Stripe | Standard per-transaction fee (no monthly fee) | **₹0 fixed** (2% per txn) |
| **Total Estimated Cost** | | | **~₹945 – ₹1,200 / month** |

### Database Backup & Maintenance Guidance
- Configure automated nightly SQL database backups with 7-day retention.
- Keep the database server bound to localhost or within a private VPC network; never expose port `1433` directly to the public internet.

---

## 6. Prioritized Roadmap & Future Enhancements

1. **High Priority**:
   - Biometric / RFID hardware attendance scanner webhook integration.
   - WhatsApp Business API notifications for instant parent fee reminders.
2. **Medium Priority**:
   - Library book cataloging, barcode scanning, and fine management.
   - Transport bus GPS tracking and route fare calculator.
3. **Low Priority**:
   - Native mobile application for Parents and Students using Flutter/Capacitor.
   - Hostel accommodation and mess billing module.
