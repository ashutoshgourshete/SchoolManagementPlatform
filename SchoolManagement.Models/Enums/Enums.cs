namespace SchoolManagement.Models.Enums;

public enum InstitutionType
{
    School = 1,
    College = 2,
    Combined = 3
}

public enum TenantStatus
{
    Pending = 1,
    Active = 2,
    Suspended = 3,
    Canceled = 4
}

public enum SubscriptionPlanTier
{
    Starter = 1,
    Standard = 2,
    Enterprise = 3
}

public enum BillingCycle
{
    Monthly = 1,
    Quarterly = 2,
    SemiAnnual = 3,
    Annual = 4
}

public enum InvoiceStatus
{
    Draft = 1,
    Issued = 2,
    PartiallyPaid = 3,
    Paid = 4,
    Overdue = 5,
    Voided = 6
}

public enum PaymentMethod
{
    Cash = 1,
    BankTransfer = 2,
    Check = 3,
    OnlineCard = 4,
    OnlineUPI = 5,
    OnlineNetBanking = 6,
    Other = 7
}

public enum PaymentStatus
{
    Pending = 1,
    Completed = 2,
    Failed = 3,
    Refunded = 4,
    PartiallyRefunded = 5
}

public enum AttendanceStatus
{
    Present = 1,
    Absent = 2,
    Late = 3,
    Excused = 4,
    HalfDay = 5
}

public enum Gender
{
    Male = 1,
    Female = 2,
    Other = 3
}

public enum GuardianRelationship
{
    Father = 1,
    Mother = 2,
    Guardian = 3,
    Other = 4
}

public enum ExamType
{
    MidTerm = 1,
    Final = 2,
    Quiz = 3,
    UnitAssessment = 4,
    SemesterExam = 5,
    Practical = 6
}

public enum UserRoleType
{
    PlatformAdmin = 1,
    InstitutionAdmin = 2,
    Teacher = 3,
    Accountant = 4,
    Student = 5,
    Parent = 6
}
