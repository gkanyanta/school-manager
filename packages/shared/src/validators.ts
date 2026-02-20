import { z } from 'zod';
import { Role, Gender, StudentStatus, PaymentMethod, AttendanceStatus, AssessmentType, InvoiceStatus, AnnouncementTarget, TermName, DayOfWeek } from './enums';

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  schoolCode: z.string().min(2).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

export const adminResetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8),
});

// School
export const createSchoolSchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  motto: z.string().optional(),
});

export const updateSchoolSchema = createSchoolSchema.partial();

// User
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().optional(),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Student
export const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().or(z.date()),
  gender: z.nativeEnum(Gender),
  admissionNumber: z.string().min(1).max(50),
  admissionDate: z.string().or(z.date()),
  classId: z.string().uuid(),
  status: z.nativeEnum(StudentStatus).default(StudentStatus.ACTIVE),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  guardians: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().min(1),
    email: z.string().email().optional(),
    relationship: z.string().min(1),
    isPrimary: z.boolean().default(false),
  })).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

// Guardian
export const createGuardianSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
});

// Grade
export const createGradeSchema = z.object({
  name: z.string().min(1).max(50),
  level: z.number().int().min(0).max(20),
  description: z.string().optional(),
});

// Class
export const createClassSchema = z.object({
  name: z.string().min(1).max(50),
  gradeId: z.string().uuid(),
  capacity: z.number().int().min(1).optional(),
});

// Subject
export const createSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  gradeId: z.string().uuid(),
  description: z.string().optional(),
});

// Teacher Assignment
export const createTeacherAssignmentSchema = z.object({
  teacherId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  isClassTeacher: z.boolean().default(false),
});

// Academic Year & Term
export const createAcademicYearSchema = z.object({
  name: z.string().min(1).max(50),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isCurrent: z.boolean().default(false),
});

export const createTermSchema = z.object({
  name: z.nativeEnum(TermName),
  academicYearId: z.string().uuid(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isCurrent: z.boolean().default(false),
});

// Timetable
export const createTimetableEntrySchema = z.object({
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  periodNumber: z.number().int().min(1).max(12),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// Attendance
export const markAttendanceSchema = z.object({
  classId: z.string().uuid(),
  date: z.string().or(z.date()),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.nativeEnum(AttendanceStatus),
    reason: z.string().optional(),
  })),
});

// Assessment
export const createAssessmentSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.nativeEnum(AssessmentType),
  subjectId: z.string().uuid(),
  classId: z.string().uuid(),
  termId: z.string().uuid(),
  totalMarks: z.number().min(1),
  weight: z.number().min(0).max(100),
  date: z.string().or(z.date()).optional(),
});

export const enterMarksSchema = z.object({
  assessmentId: z.string().uuid(),
  marks: z.array(z.object({
    studentId: z.string().uuid(),
    score: z.number().min(0),
    remarks: z.string().optional(),
  })),
});

// Fee Structure
export const createFeeStructureSchema = z.object({
  gradeId: z.string().uuid(),
  termId: z.string().uuid(),
  items: z.array(z.object({
    name: z.string().min(1),
    amount: z.number().min(0),
    isOptional: z.boolean().default(false),
  })),
});

// Payment
export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().min(0.01),
  method: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paidDate: z.string().or(z.date()),
});

// Announcement
export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  target: z.nativeEnum(AnnouncementTarget),
  targetId: z.string().uuid().optional(),
  publishAt: z.string().or(z.date()).optional(),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CreateSchoolDto = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolDto = z.infer<typeof updateSchoolSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export type CreateGuardianDto = z.infer<typeof createGuardianSchema>;
export type CreateGradeDto = z.infer<typeof createGradeSchema>;
export type CreateClassDto = z.infer<typeof createClassSchema>;
export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
export type CreateTeacherAssignmentDto = z.infer<typeof createTeacherAssignmentSchema>;
export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
export type CreateTermDto = z.infer<typeof createTermSchema>;
export type CreateTimetableEntryDto = z.infer<typeof createTimetableEntrySchema>;
export type MarkAttendanceDto = z.infer<typeof markAttendanceSchema>;
export type CreateAssessmentDto = z.infer<typeof createAssessmentSchema>;
export type EnterMarksDto = z.infer<typeof enterMarksSchema>;
export type CreateFeeStructureDto = z.infer<typeof createFeeStructureSchema>;
export type RecordPaymentDto = z.infer<typeof recordPaymentSchema>;
export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;
