import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PagedResult,
  Student,
  Staff,
  StaffHierarchyNode,
  AcademicYear,
  Department,
  Program,
  ClassModel,
  ClassSection,
  Subject,
  AttendanceRecord,
  AttendanceSummary,
  Exam,
  ExamResult,
  StudentReportCard,
  FeeStructure,
  StudentInvoice,
  PaymentReceipt,
  OutstandingBalance,
  DashboardAnalytics,
  PlatformPlan,
  TenantSubscription,
  Announcement,
  CourseOffering,
  TimetableSlot,
  ScheduleSlotPayload,
  ConflictDetectionResult,
  WeeklyTimetable,
  TeacherWeeklyTimetable,
  Assignment,
  AssignmentSubmission,
  EnrollmentDemographicsReport,
  AttendanceAnalyticsReport,
  FinancialCollectionReport,
  ExecutiveSummaryReport
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Dashboard & Analytics
  getInstitutionDashboard(): Observable<ApiResponse<DashboardAnalytics>> {
    return this.http.get<ApiResponse<DashboardAnalytics>>(`${this.baseUrl}/dashboard/institution`);
  }

  getPlatformAdminDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/dashboard/platform`);
  }

  // Students
  getStudents(pageIndex = 1, pageSize = 20, search?: string, classSectionId?: string): Observable<ApiResponse<PagedResult<Student>>> {
    let params = new HttpParams().set('pageIndex', pageIndex).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (classSectionId) params = params.set('classSectionId', classSectionId);
    return this.http.get<ApiResponse<PagedResult<Student>>>(`${this.baseUrl}/students`, { params });
  }

  getStudentById(id: string): Observable<ApiResponse<Student>> {
    return this.http.get<ApiResponse<Student>>(`${this.baseUrl}/students/${id}`);
  }

  createStudent(payload: any): Observable<ApiResponse<Student>> {
    return this.http.post<ApiResponse<Student>>(`${this.baseUrl}/students`, payload);
  }

  updateStudent(id: string, payload: any): Observable<ApiResponse<Student>> {
    return this.http.put<ApiResponse<Student>>(`${this.baseUrl}/students/${id}`, payload);
  }

  deleteStudent(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/students/${id}`);
  }

  // Staff
  getStaff(pageIndex = 1, pageSize = 20, search?: string): Observable<ApiResponse<PagedResult<Staff>>> {
    let params = new HttpParams().set('pageIndex', pageIndex).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PagedResult<Staff>>>(`${this.baseUrl}/staff`, { params });
  }

  createStaff(payload: any): Observable<ApiResponse<Staff>> {
    return this.http.post<ApiResponse<Staff>>(`${this.baseUrl}/staff`, payload);
  }

  getStaffHierarchy(): Observable<ApiResponse<StaffHierarchyNode[]>> {
    return this.http.get<ApiResponse<StaffHierarchyNode[]>>(`${this.baseUrl}/staff/hierarchy`);
  }

  // Academics
  getAcademicYears(): Observable<ApiResponse<AcademicYear[]>> {
    return this.http.get<ApiResponse<AcademicYear[]>>(`${this.baseUrl}/academic/years`);
  }

  createAcademicYear(payload: any): Observable<ApiResponse<AcademicYear>> {
    return this.http.post<ApiResponse<AcademicYear>>(`${this.baseUrl}/academic/years`, payload);
  }

  getDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.baseUrl}/academic/departments`);
  }

  createDepartment(payload: any): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(`${this.baseUrl}/academic/departments`, payload);
  }

  getPrograms(): Observable<ApiResponse<Program[]>> {
    return this.http.get<ApiResponse<Program[]>>(`${this.baseUrl}/academic/programs`);
  }

  createProgram(payload: any): Observable<ApiResponse<Program>> {
    return this.http.post<ApiResponse<Program>>(`${this.baseUrl}/academic/programs`, payload);
  }

  getClasses(academicYearId?: string): Observable<ApiResponse<ClassModel[]>> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http.get<ApiResponse<ClassModel[]>>(`${this.baseUrl}/academic/classes`, { params });
  }

  createClass(payload: any): Observable<ApiResponse<ClassModel>> {
    return this.http.post<ApiResponse<ClassModel>>(`${this.baseUrl}/academic/classes`, payload);
  }

  createSection(payload: any): Observable<ApiResponse<ClassSection>> {
    return this.http.post<ApiResponse<ClassSection>>(`${this.baseUrl}/academic/sections`, payload);
  }

  getSubjects(): Observable<ApiResponse<Subject[]>> {
    return this.http.get<ApiResponse<Subject[]>>(`${this.baseUrl}/academic/subjects`);
  }

  createSubject(payload: any): Observable<ApiResponse<Subject>> {
    return this.http.post<ApiResponse<Subject>>(`${this.baseUrl}/academic/subjects`, payload);
  }

  // Attendance
  getAttendance(classSectionId: string, date: string): Observable<ApiResponse<AttendanceRecord[]>> {
    const params = new HttpParams().set('classSectionId', classSectionId).set('date', date);
    return this.http.get<ApiResponse<AttendanceRecord[]>>(`${this.baseUrl}/attendance`, { params });
  }

  saveBulkAttendance(payload: any): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/attendance/bulk`, payload);
  }

  getStudentAttendanceSummary(studentId: string, academicYearId: string): Observable<ApiResponse<AttendanceSummary>> {
    const params = new HttpParams().set('academicYearId', academicYearId);
    return this.http.get<ApiResponse<AttendanceSummary>>(`${this.baseUrl}/attendance/student/${studentId}/summary`, { params });
  }

  // Examinations
  getExams(courseOfferingId?: string): Observable<ApiResponse<Exam[]>> {
    let params = new HttpParams();
    if (courseOfferingId) params = params.set('courseOfferingId', courseOfferingId);
    return this.http.get<ApiResponse<Exam[]>>(`${this.baseUrl}/examinations`, { params });
  }

  createExam(payload: any): Observable<ApiResponse<Exam>> {
    return this.http.post<ApiResponse<Exam>>(`${this.baseUrl}/examinations`, payload);
  }

  getExamResults(examId: string): Observable<ApiResponse<ExamResult[]>> {
    return this.http.get<ApiResponse<ExamResult[]>>(`${this.baseUrl}/examinations/${examId}/results`);
  }

  submitBulkExamResults(payload: any): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/examinations/results/bulk`, payload);
  }

  getStudentReportCard(studentId: string, academicYearId: string): Observable<ApiResponse<StudentReportCard>> {
    const params = new HttpParams().set('studentId', studentId).set('academicYearId', academicYearId);
    return this.http.get<ApiResponse<StudentReportCard>>(`${this.baseUrl}/examinations/report-card`, { params });
  }

  // Fees & Billing
  getFeeStructures(academicYearId?: string): Observable<ApiResponse<FeeStructure[]>> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http.get<ApiResponse<FeeStructure[]>>(`${this.baseUrl}/fees/structures`, { params });
  }

  createFeeStructure(payload: any): Observable<ApiResponse<FeeStructure>> {
    return this.http.post<ApiResponse<FeeStructure>>(`${this.baseUrl}/fees/structures`, payload);
  }

  deleteFeeStructure(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/fees/structures/${id}`);
  }

  assignFee(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/fees/assign`, payload);
  }

  assignFeeToClass(payload: { classSectionId: string; feeStructureId: string; discountPercentage?: number }): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.baseUrl}/fees/assign-class`, payload);
  }

  getInvoices(pageIndex = 1, pageSize = 20, search?: string, studentId?: string): Observable<ApiResponse<PagedResult<StudentInvoice>>> {
    let params = new HttpParams().set('pageIndex', pageIndex).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (studentId) params = params.set('studentId', studentId);
    return this.http.get<ApiResponse<PagedResult<StudentInvoice>>>(`${this.baseUrl}/invoices`, { params });
  }

  generateInvoices(payload: any): Observable<ApiResponse<StudentInvoice[]>> {
    return this.http.post<ApiResponse<StudentInvoice[]>>(`${this.baseUrl}/invoices/generate`, payload);
  }

  recordManualPayment(payload: any): Observable<ApiResponse<PaymentReceipt>> {
    return this.http.post<ApiResponse<PaymentReceipt>>(`${this.baseUrl}/payments/collect-manual`, payload);
  }

  getOutstandingBalances(): Observable<ApiResponse<OutstandingBalance[]>> {
    return this.http.get<ApiResponse<OutstandingBalance[]>>(`${this.baseUrl}/payments/outstanding-balances`);
  }

  // SaaS Subscriptions
  getPlatformPlans(): Observable<ApiResponse<PlatformPlan[]>> {
    return this.http.get<ApiResponse<PlatformPlan[]>>(`${this.baseUrl}/subscriptions/plans`);
  }

  getCurrentSubscription(): Observable<ApiResponse<TenantSubscription>> {
    return this.http.get<ApiResponse<TenantSubscription>>(`${this.baseUrl}/subscriptions/current`);
  }

  subscribePlan(payload: any): Observable<ApiResponse<TenantSubscription>> {
    return this.http.post<ApiResponse<TenantSubscription>>(`${this.baseUrl}/subscriptions/subscribe`, payload);
  }

  // Announcements
  getAnnouncements(audience?: string): Observable<ApiResponse<Announcement[]>> {
    let params = new HttpParams();
    if (audience) params = params.set('audience', audience);
    return this.http.get<ApiResponse<Announcement[]>>(`${this.baseUrl}/announcements`, { params });
  }

  createAnnouncement(payload: any): Observable<ApiResponse<Announcement>> {
    return this.http.post<ApiResponse<Announcement>>(`${this.baseUrl}/announcements`, payload);
  }

  // Timetables & Scheduling Engine
  getCourseOfferings(academicYearId?: string, classSectionId?: string): Observable<ApiResponse<CourseOffering[]>> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    if (classSectionId) params = params.set('classSectionId', classSectionId);
    return this.http.get<ApiResponse<CourseOffering[]>>(`${this.baseUrl}/timetables/course-offerings`, { params });
  }

  createCourseOffering(payload: any): Observable<ApiResponse<CourseOffering>> {
    return this.http.post<ApiResponse<CourseOffering>>(`${this.baseUrl}/timetables/course-offerings`, payload);
  }

  detectTimetableConflicts(payload: ScheduleSlotPayload, excludeSlotId?: string): Observable<ApiResponse<ConflictDetectionResult>> {
    let params = new HttpParams();
    if (excludeSlotId) params = params.set('excludeSlotId', excludeSlotId);
    return this.http.post<ApiResponse<ConflictDetectionResult>>(`${this.baseUrl}/timetables/detect-conflicts`, payload, { params });
  }

  scheduleTimetableSlot(payload: ScheduleSlotPayload): Observable<ApiResponse<TimetableSlot>> {
    return this.http.post<ApiResponse<TimetableSlot>>(`${this.baseUrl}/timetables/slots`, payload);
  }

  getClassSectionWeeklyTimetable(classSectionId: string): Observable<ApiResponse<WeeklyTimetable>> {
    return this.http.get<ApiResponse<WeeklyTimetable>>(`${this.baseUrl}/timetables/class-sections/${classSectionId}`);
  }

  getTeacherWeeklyTimetable(teacherId: string): Observable<ApiResponse<TeacherWeeklyTimetable>> {
    return this.http.get<ApiResponse<TeacherWeeklyTimetable>>(`${this.baseUrl}/timetables/teachers/${teacherId}`);
  }

  getRoomSchedule(roomNumber: string, dayOfWeek?: number): Observable<ApiResponse<TimetableSlot[]>> {
    let params = new HttpParams();
    if (dayOfWeek !== undefined) params = params.set('dayOfWeek', dayOfWeek);
    return this.http.get<ApiResponse<TimetableSlot[]>>(`${this.baseUrl}/timetables/rooms/${encodeURIComponent(roomNumber)}`, { params });
  }

  deleteTimetableSlot(slotId: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/timetables/slots/${slotId}`);
  }

  // Homework & Assignments
  getAssignments(classSectionId?: string, courseOfferingId?: string): Observable<ApiResponse<Assignment[]>> {
    let params = new HttpParams();
    if (classSectionId) params = params.set('classSectionId', classSectionId);
    if (courseOfferingId) params = params.set('courseOfferingId', courseOfferingId);
    return this.http.get<ApiResponse<Assignment[]>>(`${this.baseUrl}/assignments`, { params });
  }

  getAssignmentById(id: string): Observable<ApiResponse<Assignment>> {
    return this.http.get<ApiResponse<Assignment>>(`${this.baseUrl}/assignments/${id}`);
  }

  createAssignment(payload: any): Observable<ApiResponse<Assignment>> {
    return this.http.post<ApiResponse<Assignment>>(`${this.baseUrl}/assignments`, payload);
  }

  deleteAssignment(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/assignments/${id}`);
  }

  submitAssignment(assignmentId: string, payload: any): Observable<ApiResponse<AssignmentSubmission>> {
    return this.http.post<ApiResponse<AssignmentSubmission>>(`${this.baseUrl}/assignments/${assignmentId}/submissions`, payload);
  }

  getAssignmentSubmissions(assignmentId: string): Observable<ApiResponse<AssignmentSubmission[]>> {
    return this.http.get<ApiResponse<AssignmentSubmission[]>>(`${this.baseUrl}/assignments/${assignmentId}/submissions`);
  }

  gradeSubmission(payload: any): Observable<ApiResponse<AssignmentSubmission>> {
    return this.http.post<ApiResponse<AssignmentSubmission>>(`${this.baseUrl}/assignments/submissions/grade`, payload);
  }

  getStudentSubmissions(studentId: string): Observable<ApiResponse<AssignmentSubmission[]>> {
    return this.http.get<ApiResponse<AssignmentSubmission[]>>(`${this.baseUrl}/assignments/student/${studentId}`);
  }

  // Essential Reports
  getEnrollmentReport(academicYearId?: string): Observable<ApiResponse<EnrollmentDemographicsReport>> {
    let params = new HttpParams();
    if (academicYearId) params = params.set('academicYearId', academicYearId);
    return this.http.get<ApiResponse<EnrollmentDemographicsReport>>(`${this.baseUrl}/reports/enrollment`, { params });
  }

  getAttendanceReport(classSectionId?: string, startDate?: string, endDate?: string): Observable<ApiResponse<AttendanceAnalyticsReport>> {
    let params = new HttpParams();
    if (classSectionId) params = params.set('classSectionId', classSectionId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<AttendanceAnalyticsReport>>(`${this.baseUrl}/reports/attendance`, { params });
  }

  getFinancialReport(startDate?: string, endDate?: string): Observable<ApiResponse<FinancialCollectionReport>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<FinancialCollectionReport>>(`${this.baseUrl}/reports/financial`, { params });
  }

  getExecutiveReport(): Observable<ApiResponse<ExecutiveSummaryReport>> {
    return this.http.get<ApiResponse<ExecutiveSummaryReport>>(`${this.baseUrl}/reports/executive`);
  }
}
