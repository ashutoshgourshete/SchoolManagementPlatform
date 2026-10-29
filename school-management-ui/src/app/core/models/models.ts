export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiration: string;
  userId: string;
  fullName: string;
  email: string;
  role: string | number;
  tenantId?: string;
  tenantName?: string;
  institutionId?: string;
  institutionName?: string;
  availableInstitutions: {
    institutionId: string;
    name: string;
    code: string;
    type: number;
    role: number;
  }[];
}

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string;
  gender: number;
  bloodGroup?: string;
  admissionDate: string;
  emergencyContactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive: boolean;
  currentClassName?: string;
  currentSectionName?: string;
  currentClassSectionId?: string;
  guardians: Guardian[];
}

export interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  relationship: number;
  occupation?: string;
  email: string;
  phone: string;
  address?: string;
  isPrimaryContact: boolean;
}

export interface Staff {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation: string;
  departmentId?: string;
  departmentName?: string;
  qualification?: string;
  email: string;
  phone: string;
  joiningDate: string;
  isActive: boolean;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: string;
  headOfDepartmentName?: string;
}

export interface Program {
  id: string;
  departmentId?: string;
  departmentName?: string;
  name: string;
  code: string;
  totalSemesters: number;
  degreeType?: string;
}

export interface ClassModel {
  id: string;
  academicYearId: string;
  academicYearName: string;
  departmentId?: string;
  departmentName?: string;
  programId?: string;
  programName?: string;
  name: string;
  code: string;
  semesterNumber?: number;
  sections: ClassSection[];
}

export interface ClassSection {
  id: string;
  classId: string;
  className: string;
  name: string;
  capacity: number;
  roomNumber?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  enrolledStudentCount: number;
}

export interface Subject {
  id: string;
  departmentId?: string;
  departmentName?: string;
  name: string;
  code: string;
  credits: number;
  isElective: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber?: string;
  classSectionId: string;
  date: string;
  status: number; // 1: Present, 2: Absent, 3: Late, 4: Excused, 5: HalfDay
  remarks?: string;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export interface Exam {
  id: string;
  courseOfferingId: string;
  subjectName: string;
  className: string;
  sectionName: string;
  name: string;
  type: number;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  resultsCount: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  examName: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  marksObtained: number;
  maxMarks: number;
  grade?: string;
  isAbsent: boolean;
  remarks?: string;
}

export interface StudentReportCard {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  academicYear: string;
  subjectResults: {
    subjectName: string;
    examName: string;
    marksObtained: number;
    maxMarks: number;
    grade?: string;
    isAbsent: boolean;
  }[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string;
}

export interface FeeStructure {
  id: string;
  academicYearId: string;
  academicYearName: string;
  classId?: string;
  className?: string;
  name: string;
  billingCycle: number;
  totalAmount: number;
  isActive: boolean;
  items: {
    id: string;
    name: string;
    amount: number;
    isOptional: boolean;
  }[];
}

export interface StudentInvoice {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  subTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currencyCode: string;
  status: number; // 1: Draft, 2: Issued, 3: PartiallyPaid, 4: Paid, 5: Overdue
  remarks?: string;
  lines: {
    id: string;
    description: string;
    unitAmount: number;
    quantity: number;
    totalAmount: number;
  }[];
}

export interface PaymentReceipt {
  paymentId: string;
  receiptNumber: string;
  paymentDateUtc: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  invoiceNumber?: string;
  amount: number;
  currencyCode: string;
  method: number | string;
  status: number;
  notes?: string;
  collectedBy?: string;
}

export interface OutstandingBalance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueInvoiceCount: number;
}

export interface DashboardAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalStaff: number;
  totalClasses: number;
  totalFeeCollectedThisMonth: number;
  totalOutstandingFees: number;
  averageAttendanceRate: number;
  recentCollections: { month: string; amount: number }[];
}

export interface PlatformPlan {
  id: string;
  name: string;
  code: string;
  tier: number;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  currencyCode: string;
  maxStudents: number;
  maxInstitutions: number;
  featuresJson?: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  platformPlanId: string;
  planName: string;
  billingCycle: number;
  status: string;
  startDateUtc: string;
  currentPeriodEndUtc: string;
  cancelAtPeriodEnd: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  publishedAtUtc: string;
  isPinned: boolean;
}

export interface CourseOffering {
  id: string;
  academicYearId: string;
  academicYearName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  classSectionId: string;
  sectionName: string;
  className: string;
  teacherId?: string;
  teacherName?: string;
  semesterNumber?: number;
}

export interface TimetableSlot {
  id: string;
  courseOfferingId: string;
  subjectName: string;
  subjectCode: string;
  classSectionId: string;
  className: string;
  sectionName: string;
  teacherId?: string;
  teacherName?: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

export interface ScheduleSlotPayload {
  courseOfferingId: string;
  dayOfWeek: number;
  startTime: string; // e.g. "09:00:00"
  endTime: string;   // e.g. "09:50:00"
  roomNumber?: string;
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  teacherConflict: boolean;
  teacherConflictDetails?: string;
  roomConflict: boolean;
  roomConflictDetails?: string;
  classSectionConflict: boolean;
  classSectionConflictDetails?: string;
}

export interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  slots: TimetableSlot[];
}

export interface WeeklyTimetable {
  classSectionId: string;
  className: string;
  sectionName: string;
  days: DaySchedule[];
}

export interface TeacherWeeklyTimetable {
  teacherId: string;
  teacherName: string;
  days: DaySchedule[];
}

export interface Assignment {
  id: string;
  courseOfferingId: string;
  subjectName: string;
  subjectCode: string;
  classSectionId: string;
  className: string;
  sectionName: string;
  teacherId?: string;
  teacherName?: string;
  title: string;
  description: string;
  attachmentUrl?: string;
  attachmentFileName?: string;
  maxPoints: number;
  dueDateUtc: string;
  isPublished: boolean;
  totalSubmissions: number;
  gradedSubmissions: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  maxPoints: number;
  dueDateUtc: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  submissionText?: string;
  fileUrl?: string;
  fileName?: string;
  submittedAtUtc: string;
  status: number;
  statusName: string;
  obtainedPoints?: number;
  teacherFeedback?: string;
  gradedAtUtc?: string;
  gradedByName?: string;
}

export interface ClassEnrollmentStat {
  classId: string;
  className: string;
  classSectionId: string;
  sectionName: string;
  capacity: number;
  totalEnrolled: number;
  maleCount: number;
  femaleCount: number;
  occupancyRate: number;
}

export interface EnrollmentDemographicsReport {
  totalStudents: number;
  totalClasses: number;
  totalSections: number;
  totalMale: number;
  totalFemale: number;
  overallOccupancyRate: number;
  classStats: ClassEnrollmentStat[];
}

export interface StudentAttendanceReportItem {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  guardianPhone?: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
  isCriticalDefaulter: boolean;
}

export interface AttendanceAnalyticsReport {
  overallAttendanceRate: number;
  totalStudentsEvaluated: number;
  criticalDefaultersCount: number;
  records: StudentAttendanceReportItem[];
}

export interface PaymentMethodBreakdown {
  method: string;
  transactionCount: number;
  totalAmount: number;
}

export interface FinancialCollectionReport {
  totalInvoicedAmount: number;
  totalCollectedAmount: number;
  totalOutstandingAmount: number;
  collectionEfficiencyRate: number;
  methodBreakdown: PaymentMethodBreakdown[];
  recentReceipts: PaymentReceipt[];
}

export interface ExecutiveSummaryReport {
  institutionName: string;
  academicYear: string;
  generatedAtUtc: string;
  enrollment: EnrollmentDemographicsReport;
  attendance: AttendanceAnalyticsReport;
  financials: FinancialCollectionReport;
}
