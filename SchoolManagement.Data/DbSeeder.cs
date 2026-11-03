using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager)
    {
        // 1. Seed Roles
        var roles = Enum.GetNames<UserRoleType>();
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
            }
        }

        // 2. Seed Platform Plans
        if (!await context.PlatformPlans.AnyAsync())
        {
            var plans = new List<PlatformPlan>
            {
                new()
                {
                    Name = "Starter Plan",
                    Code = "STARTER",
                    Tier = SubscriptionPlanTier.Starter,
                    Description = "Ideal for single-campus schools and small academies up to 300 students.",
                    MonthlyPrice = 1999m,
                    AnnualPrice = 19990m,
                    CurrencyCode = "INR",
                    MaxStudents = 300,
                    MaxInstitutions = 1,
                    FeaturesJson = "[\"Student Management\", \"Attendance\", \"Report Cards\", \"Manual Fee Collection\"]",
                    IsActive = true
                },
                new()
                {
                    Name = "Standard Plan",
                    Code = "STANDARD",
                    Tier = SubscriptionPlanTier.Standard,
                    Description = "Perfect for growing schools and colleges up to 1,500 students.",
                    MonthlyPrice = 4999m,
                    AnnualPrice = 49990m,
                    CurrencyCode = "INR",
                    MaxStudents = 1500,
                    MaxInstitutions = 3,
                    FeaturesJson = "[\"Everything in Starter\", \"Online Payments\", \"College Programs & Semesters\", \"Automated Reminders\", \"Advanced Reports\"]",
                    IsActive = true
                },
                new()
                {
                    Name = "Enterprise Plan",
                    Code = "ENTERPRISE",
                    Tier = SubscriptionPlanTier.Enterprise,
                    Description = "Designed for university campuses and multi-institution groups with unlimited students.",
                    MonthlyPrice = 9999m,
                    AnnualPrice = 99990m,
                    CurrencyCode = "INR",
                    MaxStudents = 10000,
                    MaxInstitutions = 10,
                    FeaturesJson = "[\"Everything in Standard\", \"Multi-Campus Hierarchy\", \"Custom Gateway Integration\", \"Dedicated Support\", \"Audit Trails\"]",
                    IsActive = true
                }
            };
            await context.PlatformPlans.AddRangeAsync(plans);
            await context.SaveChangesAsync();
        }

        // 3. Seed Platform Admin
        var adminEmail = "platformadmin@schoolsaas.com";
        var platformAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (platformAdmin == null)
        {
            platformAdmin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Super",
                LastName = "Admin",
                EmailConfirmed = true,
                PrimaryRole = UserRoleType.PlatformAdmin,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(platformAdmin, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(platformAdmin, UserRoleType.PlatformAdmin.ToString());
            }
        }

        // 4. Seed Demo Tenant (Apex International Academy)
        if (!await context.Tenants.AnyAsync(t => t.Code == "APEX"))
        {
            var standardPlan = await context.PlatformPlans.FirstAsync(p => p.Code == "STANDARD");

            var tenant = new Tenant
            {
                Name = "Apex International Academy",
                Code = "APEX",
                Domain = "apex.schoolsaas.com",
                LogoUrl = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80",
                Status = TenantStatus.Active,
                ContactEmail = "contact@apexacademy.edu",
                ContactPhone = "+91 98765 43210",
                Address = "Plot 42, Knowledge Park, Bengaluru, Karnataka, 560001",
                CurrencyCode = "INR",
                TimeZone = "India Standard Time",
                IsTrial = false
            };
            await context.Tenants.AddAsync(tenant);
            await context.SaveChangesAsync();

            // Tenant Subscription
            var sub = new TenantSubscription
            {
                TenantId = tenant.Id,
                PlatformPlanId = standardPlan.Id,
                BillingCycle = BillingCycle.Monthly,
                Status = "Active",
                StartDateUtc = DateTime.UtcNow,
                CurrentPeriodEndUtc = DateTime.UtcNow.AddMonths(1)
            };
            await context.TenantSubscriptions.AddAsync(sub);

            // Institution
            var institution = new Institution
            {
                TenantId = tenant.Id,
                Name = "Apex High School & Junior College",
                Code = "AHS-01",
                Type = InstitutionType.Combined,
                ContactEmail = "principal@apexacademy.edu",
                ContactPhone = "+91 98765 43211",
                Address = "Plot 42, Knowledge Park, Bengaluru",
                Website = "https://apexacademy.edu",
                LogoUrl = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=128&auto=format&fit=crop&q=80",
                IsActive = true
            };
            await context.Institutions.AddAsync(institution);
            await context.SaveChangesAsync();

            // Campus
            var campus = new Campus
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Name = "Main Campus",
                Address = "Plot 42, Knowledge Park, Bengaluru",
                ContactPhone = "+91 98765 43211",
                IsMainCampus = true
            };
            await context.Campuses.AddAsync(campus);

            // Institution Admin User
            var instAdminEmail = "admin@apexacademy.edu";
            var instAdmin = new ApplicationUser
            {
                UserName = instAdminEmail,
                Email = instAdminEmail,
                FirstName = "Rajesh",
                LastName = "Sharma",
                EmailConfirmed = true,
                PrimaryRole = UserRoleType.InstitutionAdmin,
                IsActive = true
            };
            await userManager.CreateAsync(instAdmin, "Admin@123456");
            await userManager.AddToRoleAsync(instAdmin, UserRoleType.InstitutionAdmin.ToString());

            await context.TenantMemberships.AddAsync(new TenantMembership
            {
                TenantId = tenant.Id,
                UserId = instAdmin.Id,
                Role = UserRoleType.InstitutionAdmin,
                IsActive = true
            });
            await context.InstitutionMemberships.AddAsync(new InstitutionMembership
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                UserId = instAdmin.Id,
                Role = UserRoleType.InstitutionAdmin,
                IsActive = true
            });

            // Teacher User
            var teacherEmail = "teacher@apexacademy.edu";
            var teacherUser = new ApplicationUser
            {
                UserName = teacherEmail,
                Email = teacherEmail,
                FirstName = "Priya",
                LastName = "Nair",
                EmailConfirmed = true,
                PrimaryRole = UserRoleType.Teacher,
                IsActive = true
            };
            await userManager.CreateAsync(teacherUser, "Teacher@123456");
            await userManager.AddToRoleAsync(teacherUser, UserRoleType.Teacher.ToString());

            await context.TenantMemberships.AddAsync(new TenantMembership
            {
                TenantId = tenant.Id,
                UserId = teacherUser.Id,
                Role = UserRoleType.Teacher,
                IsActive = true
            });
            await context.InstitutionMemberships.AddAsync(new InstitutionMembership
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                UserId = teacherUser.Id,
                Role = UserRoleType.Teacher,
                IsActive = true
            });

            // Accountant User
            var accountantEmail = "accountant@apexacademy.edu";
            var accountantUser = new ApplicationUser
            {
                UserName = accountantEmail,
                Email = accountantEmail,
                FirstName = "Vikram",
                LastName = "Mehta",
                EmailConfirmed = true,
                PrimaryRole = UserRoleType.Accountant,
                IsActive = true
            };
            await userManager.CreateAsync(accountantUser, "Account@123456");
            await userManager.AddToRoleAsync(accountantUser, UserRoleType.Accountant.ToString());

            await context.TenantMemberships.AddAsync(new TenantMembership
            {
                TenantId = tenant.Id,
                UserId = accountantUser.Id,
                Role = UserRoleType.Accountant,
                IsActive = true
            });
            await context.InstitutionMemberships.AddAsync(new InstitutionMembership
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                UserId = accountantUser.Id,
                Role = UserRoleType.Accountant,
                IsActive = true
            });

            // Academic Year
            var academicYear = new AcademicYear
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Name = "2026-2027",
                StartDate = new DateTime(2026, 6, 1),
                EndDate = new DateTime(2027, 5, 31),
                IsCurrent = true
            };
            await context.AcademicYears.AddAsync(academicYear);

            // Department
            var dept = new Department
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Name = "Science and Mathematics",
                Code = "SCIMATH",
                Description = "High School Science and Math Department"
            };
            await context.Departments.AddAsync(dept);

            // College Department & Program
            var csDept = new Department
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Name = "Computer Science & Engineering",
                Code = "CSE",
                Description = "Undergraduate Engineering Program"
            };
            await context.Departments.AddAsync(csDept);

            var btechProgram = new Program
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Department = csDept,
                Name = "B.Tech in Computer Science",
                Code = "BTECH-CS",
                TotalSemesters = 8,
                DegreeType = "Bachelor of Technology"
            };
            await context.Programs.AddAsync(btechProgram);

            // Hierarchy Seed: Director -> Principal -> Vice Principal -> HOD -> Teacher
            var directorStaff = new Staff
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                EmployeeCode = "DIR-001",
                FirstName = "Dr. Rajeshwar",
                LastName = "Sharma",
                Designation = "Director",
                Department = dept,
                Qualification = "Ph.D Educational Leadership, M.Sc",
                Email = "director@school.com",
                Phone = "+91 98765 00001",
                JoiningDate = new DateTime(2020, 1, 15),
                IsActive = true
            };
            await context.StaffMembers.AddAsync(directorStaff);

            var principalStaff = new Staff
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                EmployeeCode = "PRN-001",
                FirstName = "Prof. Sunita",
                LastName = "Kulkarni",
                Designation = "Principal",
                Department = dept,
                Qualification = "Ph.D Physics, M.Ed",
                Email = "principal@school.com",
                Phone = "+91 98765 00002",
                JoiningDate = new DateTime(2021, 4, 1),
                ReportsToStaff = directorStaff,
                IsActive = true
            };
            await context.StaffMembers.AddAsync(principalStaff);

            var vicePrincipalStaff = new Staff
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                EmployeeCode = "VPR-001",
                FirstName = "Dr. Arvind",
                LastName = "Narayan",
                Designation = "Vice Principal",
                Department = dept,
                Qualification = "M.Sc Chemistry, M.Phil, B.Ed",
                Email = "viceprincipal@school.com",
                Phone = "+91 98765 00003",
                JoiningDate = new DateTime(2022, 6, 1),
                ReportsToStaff = principalStaff,
                IsActive = true
            };
            await context.StaffMembers.AddAsync(vicePrincipalStaff);

            var hodStaff = new Staff
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                EmployeeCode = "HOD-001",
                FirstName = "Prof. Meenakshi",
                LastName = "Sundaram",
                Designation = "Head of Department (Science)",
                Department = dept,
                Qualification = "M.Sc Mathematics, Ph.D",
                Email = "hod.science@school.com",
                Phone = "+91 98765 00004",
                JoiningDate = new DateTime(2022, 8, 10),
                ReportsToStaff = vicePrincipalStaff,
                IsActive = true
            };
            await context.StaffMembers.AddAsync(hodStaff);
            dept.HeadOfDepartment = hodStaff;

            // Staff Member (Teacher)
            var staff = new Staff
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                UserId = teacherUser.Id,
                EmployeeCode = "EMP-001",
                FirstName = "Priya",
                LastName = "Nair",
                Designation = "Senior Mathematics Teacher",
                Department = dept,
                Qualification = "M.Sc Mathematics, B.Ed",
                Email = teacherEmail,
                Phone = "+91 98765 11111",
                JoiningDate = new DateTime(2023, 6, 1),
                ReportsToStaff = hodStaff,
                IsActive = true
            };
            await context.StaffMembers.AddAsync(staff);

            // Classes & Sections
            var class10 = new Class
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                AcademicYear = academicYear,
                Name = "Grade 10",
                Code = "GR-10"
            };
            await context.Classes.AddAsync(class10);

            var sectionA = new ClassSection
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Class = class10,
                Name = "Section A",
                Capacity = 40,
                RoomNumber = "Room 101",
                ClassTeacher = staff
            };
            await context.ClassSections.AddAsync(sectionA);

            // Subject & CourseOffering
            var mathSubject = new Subject
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Department = dept,
                Name = "Advanced Mathematics",
                Code = "MATH-10",
                Credits = 4.0m
            };
            await context.Subjects.AddAsync(mathSubject);

            var courseOffering = new CourseOffering
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                AcademicYear = academicYear,
                Subject = mathSubject,
                ClassSection = sectionA,
                Teacher = staff
            };
            await context.CourseOfferings.AddAsync(courseOffering);

            // Fee Structure
            var feeStructure = new FeeStructure
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                AcademicYear = academicYear,
                Class = class10,
                Name = "Grade 10 Standard Annual Fee",
                BillingCycle = BillingCycle.Quarterly,
                TotalAmount = 36000m,
                IsActive = true
            };
            feeStructure.Items.Add(new FeeStructureItem
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                FeeStructure = feeStructure,
                Name = "Tuition Fee",
                Amount = 24000m
            });
            feeStructure.Items.Add(new FeeStructureItem
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                FeeStructure = feeStructure,
                Name = "Science Laboratory Fee",
                Amount = 6000m
            });
            feeStructure.Items.Add(new FeeStructureItem
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                FeeStructure = feeStructure,
                Name = "Library & Sports Fee",
                Amount = 6000m
            });
            await context.FeeStructures.AddAsync(feeStructure);

            // Sample Student 1: Aarav Patel
            var student1 = new Student
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                AdmissionNumber = "ADM-2026-001",
                RollNumber = "101",
                FirstName = "Aarav",
                LastName = "Patel",
                DateOfBirth = new DateTime(2010, 4, 15),
                Gender = Gender.Male,
                BloodGroup = "O+",
                AdmissionDate = new DateTime(2026, 6, 1),
                EmergencyContactPhone = "+91 98765 22222",
                Address = "12 Sunflower Street",
                City = "Bengaluru",
                State = "Karnataka",
                PostalCode = "560001",
                IsActive = true
            };
            await context.Students.AddAsync(student1);

            // Guardian
            var guardian = new Guardian
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                FirstName = "Sanjay",
                LastName = "Patel",
                Relationship = GuardianRelationship.Father,
                Occupation = "Software Architect",
                Email = "sanjay.patel@example.com",
                Phone = "+91 98765 22222",
                Address = "12 Sunflower Street, Bengaluru"
            };
            await context.Guardians.AddAsync(guardian);

            await context.StudentGuardians.AddAsync(new StudentGuardian
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Student = student1,
                Guardian = guardian,
                IsPrimaryContact = true,
                CanPickup = true
            });

            // Enrollment
            await context.Enrollments.AddAsync(new Enrollment
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Student = student1,
                AcademicYear = academicYear,
                ClassSection = sectionA,
                RollNumber = "101",
                IsActive = true
            });

            // Fee Assignment
            await context.StudentFeeAssignments.AddAsync(new StudentFeeAssignment
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Student = student1,
                FeeStructure = feeStructure,
                DiscountPercentage = 10m, // 10% scholarship discount
                DiscountAmount = 3600m,
                DiscountReason = "Merit Scholarship",
                EffectiveFrom = new DateTime(2026, 6, 1),
                IsActive = true
            });

            // Sample Student Invoice
            var invoice = new StudentInvoice
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Student = student1,
                InvoiceNumber = "INV-2026-0001",
                IssueDate = new DateTime(2026, 6, 1),
                DueDate = new DateTime(2026, 6, 20),
                PeriodStart = new DateTime(2026, 6, 1),
                PeriodEnd = new DateTime(2026, 8, 31),
                SubTotal = 9000m,
                DiscountAmount = 900m,
                TotalAmount = 8100m,
                PaidAmount = 8100m,
                Status = InvoiceStatus.Paid,
                CurrencyCode = "INR",
                Remarks = "Q1 Tuition & Laboratory Fee"
            };
            invoice.Lines.Add(new InvoiceLine
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                StudentInvoice = invoice,
                Description = "Q1 Tuition Fee",
                UnitAmount = 6000m,
                Quantity = 1,
                TotalAmount = 6000m
            });
            invoice.Lines.Add(new InvoiceLine
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                StudentInvoice = invoice,
                Description = "Q1 Lab & Sports Fee",
                UnitAmount = 3000m,
                Quantity = 1,
                TotalAmount = 3000m
            });
            await context.StudentInvoices.AddAsync(invoice);

            // Sample Payment for Invoice
            var payment = new Payment
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Student = student1,
                StudentInvoice = invoice,
                ReceiptNumber = "RCT-2026-0001",
                PaymentDateUtc = new DateTime(2026, 6, 5),
                Amount = 8100m,
                Method = PaymentMethod.BankTransfer,
                Status = PaymentStatus.Completed,
                CurrencyCode = "INR",
                GatewayName = "Manual",
                GatewayTransactionId = "NEFT-98723491",
                Notes = "Online transfer received and verified",
                CollectedByUserId = accountantUser.Id
            };
            payment.Allocations.Add(new PaymentAllocation
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Payment = payment,
                StudentInvoice = invoice,
                Amount = 8100m
            });
            await context.Payments.AddAsync(payment);

            // Sample Announcement
            await context.Announcements.AddAsync(new Announcement
            {
                TenantId = tenant.Id,
                InstitutionId = institution.Id,
                Title = "Welcome to Academic Year 2026-2027",
                Content = "Classes will commence on June 1st. Students are requested to collect uniforms and textbooks from the campus store.",
                TargetAudience = "All",
                PublishedAtUtc = DateTime.UtcNow,
                IsPinned = true
            });

            await context.SaveChangesAsync();
        }
    }
}
