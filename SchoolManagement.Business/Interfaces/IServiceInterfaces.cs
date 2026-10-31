using SchoolManagement.Models.Common;
using SchoolManagement.Models.DTOs;
using SchoolManagement.Models.Entities;
using SchoolManagement.Models.Enums;

namespace SchoolManagement.Business.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponseDto>> RegisterTenantAsync(RegisterTenantRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<ForgotPasswordResponseDto>> ForgotPasswordAsync(ForgotPasswordRequestDto request, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken cancellationToken = default);
}

public interface ITenantService
{
    Task<ApiResponse<List<TenantDto>>> GetAllTenantsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<TenantDto>> GetTenantByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<TenantDto>> UpdateTenantStatusAsync(Guid id, TenantStatus status, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<InstitutionDto>>> GetInstitutionsAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<ApiResponse<InstitutionDto>> CreateInstitutionAsync(Guid tenantId, CreateInstitutionDto dto, CancellationToken cancellationToken = default);
}

public interface IAcademicService
{
    Task<ApiResponse<List<AcademicYearDto>>> GetAcademicYearsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<AcademicYearDto>> CreateAcademicYearAsync(CreateAcademicYearDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AcademicYearDto>> SetCurrentAcademicYearAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<DepartmentDto>>> GetDepartmentsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<DepartmentDto>> CreateDepartmentAsync(CreateDepartmentDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<ProgramDto>>> GetProgramsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<ProgramDto>> CreateProgramAsync(CreateProgramDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<ClassDto>>> GetClassesAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClassDto>> CreateClassAsync(CreateClassDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<ClassSectionDto>>> GetClassSectionsAsync(Guid classId, CancellationToken cancellationToken = default);
    Task<ApiResponse<ClassSectionDto>> CreateClassSectionAsync(CreateClassSectionDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<SubjectDto>>> GetSubjectsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<List<CourseOfferingDto>>> GetCourseOfferingsAsync(Guid? academicYearId = null, Guid? classSectionId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<CourseOfferingDto>> CreateCourseOfferingAsync(CreateCourseOfferingDto dto, CancellationToken cancellationToken = default);
}

public interface IStudentService
{
    Task<ApiResponse<PagedResult<StudentDto>>> GetStudentsAsync(PaginationFilter filter, Guid? classSectionId = null, Guid? classId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentDto>> GetStudentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentDto>> CreateStudentAsync(CreateStudentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentDto>> UpdateStudentAsync(Guid id, UpdateStudentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteStudentAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<EnrollmentDto>> EnrollStudentAsync(CreateEnrollmentDto dto, CancellationToken cancellationToken = default);
}

public interface IStaffService
{
    Task<ApiResponse<PagedResult<StaffDto>>> GetStaffAsync(PaginationFilter filter, Guid? departmentId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<StaffDto>> GetStaffByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<StaffDto>> CreateStaffAsync(CreateStaffDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<StaffHierarchyDto>>> GetHierarchyTreeAsync(CancellationToken cancellationToken = default);
}

public interface IAttendanceService
{
    Task<ApiResponse<List<AttendanceRecordDto>>> GetAttendanceAsync(Guid classSectionId, DateTime date, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> SaveBulkAttendanceAsync(BulkAttendanceDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceSummaryDto>> GetStudentAttendanceSummaryAsync(Guid studentId, Guid academicYearId, CancellationToken cancellationToken = default);
}

public interface IExaminationService
{
    Task<ApiResponse<List<ExamDto>>> GetExamsAsync(Guid? courseOfferingId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ExamDto>> CreateExamAsync(CreateExamDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<ExamResultDto>>> GetExamResultsAsync(Guid examId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> SubmitBulkExamResultsAsync(BulkExamResultDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentReportCardDto>> GetStudentReportCardAsync(Guid studentId, Guid academicYearId, CancellationToken cancellationToken = default);
}

public interface IFeeManagementService
{
    Task<ApiResponse<List<FeeStructureDto>>> GetFeeStructuresAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<FeeStructureDto>> CreateFeeStructureAsync(CreateFeeStructureDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentFeeAssignmentDto>> AssignFeeToStudentAsync(AssignFeeDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<PagedResult<StudentInvoiceDto>>> GetInvoicesAsync(PaginationFilter filter, Guid? studentId = null, InvoiceStatus? status = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<StudentInvoiceDto>> GetInvoiceByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<StudentInvoiceDto>>> GenerateInvoicesAsync(GenerateInvoiceDto dto, CancellationToken cancellationToken = default);

    Task<ApiResponse<PaymentReceiptDto>> RecordPaymentAsync(RecordPaymentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaymentReceiptDto>> GetPaymentReceiptAsync(Guid paymentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<OutstandingBalanceReportDto>>> GetOutstandingBalancesAsync(CancellationToken cancellationToken = default);
}

public interface IPaymentGatewayService
{
    Task<ApiResponse<OnlinePaymentInitiationResultDto>> InitiatePaymentAsync(InitiateOnlinePaymentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> ProcessWebhookAsync(PaymentWebhookDto dto, CancellationToken cancellationToken = default);
}

public interface ISubscriptionBillingService
{
    Task<ApiResponse<List<PlatformPlanDto>>> GetPlansAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<TenantSubscriptionDto>> GetCurrentSubscriptionAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<TenantSubscriptionDto>> SubscribeAsync(SubscribePlanDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<PlatformInvoiceDto>>> GetPlatformInvoicesAsync(CancellationToken cancellationToken = default);
}

public interface IDashboardService
{
    Task<ApiResponse<DashboardAnalyticsDto>> GetInstitutionDashboardAnalyticsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<PlatformAdminDashboardDto>> GetPlatformAdminDashboardAsync(CancellationToken cancellationToken = default);
}

public interface IAnnouncementService
{
    Task<ApiResponse<List<AnnouncementDto>>> GetAnnouncementsAsync(string? targetAudience = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<AnnouncementDto>> CreateAnnouncementAsync(CreateAnnouncementDto dto, CancellationToken cancellationToken = default);
}

public interface ITimetableService
{
    Task<ApiResponse<ConflictDetectionResultDto>> DetectConflictsAsync(ScheduleSlotDto dto, Guid? excludeSlotId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<TimetableSlotDto>> ScheduleSlotAsync(ScheduleSlotDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<WeeklyTimetableDto>> GetClassSectionWeeklyTimetableAsync(Guid classSectionId, CancellationToken cancellationToken = default);
    Task<ApiResponse<TeacherWeeklyTimetableDto>> GetTeacherWeeklyTimetableAsync(Guid teacherId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<TimetableSlotDto>>> GetRoomScheduleAsync(string roomNumber, DayOfWeek? dayOfWeek = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteSlotAsync(Guid slotId, CancellationToken cancellationToken = default);
}

public interface IAssignmentService
{
    Task<ApiResponse<List<AssignmentDto>>> GetAssignmentsAsync(Guid? classSectionId = null, Guid? courseOfferingId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<AssignmentDto>> GetAssignmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<AssignmentDto>> CreateAssignmentAsync(CreateAssignmentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<AssignmentSubmissionDto>> SubmitAssignmentAsync(SubmitAssignmentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AssignmentSubmissionDto>>> GetAssignmentSubmissionsAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<AssignmentSubmissionDto>> GradeSubmissionAsync(GradeSubmissionDto dto, Guid? teacherStaffId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<AssignmentSubmissionDto>>> GetStudentSubmissionsAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAssignmentAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IReportsService
{
    Task<ApiResponse<EnrollmentDemographicsReportDto>> GetEnrollmentDemographicsReportAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<AttendanceAnalyticsReportDto>> GetAttendanceAnalyticsReportAsync(Guid? classSectionId = null, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<FinancialCollectionReportDto>> GetFinancialCollectionReportAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<ExecutiveSummaryReportDto>> GetExecutiveSummaryReportAsync(CancellationToken cancellationToken = default);
}
