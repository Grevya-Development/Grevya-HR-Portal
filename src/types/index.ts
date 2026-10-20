export type UserRole = 'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatar: string;
  joinDate: string;
  managerId?: string;
  status?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  headId?: string | null;
  headName?: string | null;
  isActive?: boolean;
  employeeCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  department: string;
  departmentId?: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave' | 'pending' | 'rejected';
  joinDate: string;
  salary: number;
  performance: number;
  attendance: number;
  avatar: string;
  managerId: string;
  phone: string;
  location: string;
  points: number;
  badges: string[];
  streak: number;
  lastSeenAt?: string;
  // Extended HRMS Fields
  employeeCode?: string;
  personalEmail?: string;
  alternatePhone?: string;
  currentAddress?: string;
  permanentAddress?: string;
  dob?: string;
  gender?: string;
  emergencyContact?: { name?: string; relation?: string; phone?: string } | any;
  bio?: string;
  workMode?: 'office' | 'remote' | 'hybrid';
  confirmationDate?: string;
  skills?: string[];
  qualifications?: string;
  certifications?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankHolderName?: string;
  panNumber?: string;
}

export interface HRManager {
  id: string;
  name: string;
  email: string;
  department: string;
  departmentId?: string;
  status: 'active' | 'inactive';
  avatar: string;
  joinDate: string;
  phone: string;
  location: string;
}

export interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
  carryForward: boolean;
  paid: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  total: number;
  used: number;
  leaveType?: LeaveType;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  isOptional: boolean;
  createdAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  type: 'sick' | 'casual' | 'annual' | 'maternity' | 'paternity' | 'emergency' | 'optional_holiday' | string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  appliedOn: string;
  approvedBy?: string;
  approverId?: string;
  comments?: string;
  decidedAt?: string;
  leaveTypeId?: string;
  employee?: {
    id: string;
    name: string;
    avatar?: string;
    department?: string;
  };
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  submittedOn: string;
  approvedBy?: string;
  approverId?: string;
  comments?: string;
  decidedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  workDate?: string; // YYYY-MM-DD
  date?: string; // alias for workDate
  clockIn?: string | null; // ISO timestamptz or HH:MM
  checkIn?: string; // alias for clockIn display
  clockOut?: string | null; // ISO timestamptz or HH:MM
  checkOut?: string; // alias for clockOut display
  lunchStart?: string | null;
  lunchEnd?: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday' | 'leave' | 'wfh' | 'incomplete';
  workMode?: 'office' | 'remote' | 'hybrid';
  totalHours?: number;
  hours?: number; // alias for totalHours
  overtimeHours?: number;
  isIncomplete?: boolean;
  notes?: string | null;
  source?: string;
  latitude?: number | null;
  longitude?: number | null;
  checkInPhotoUrl?: string | null;
  checkInAccuracy?: number | null;
  checkOutPhotoUrl?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutAccuracy?: number | null;
  verificationStatus?: 'verified' | 'exception' | 'manual';
  exceptionReason?: string | null;
  breaks?: Array<{ type: string; start: string; end?: string }>;
  employeeName?: string;
  employeeAvatar?: string;
  department?: string;
}

export interface WorkPolicy {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  standardHours: number;
  halfDayHours: number;
  workDays: number[];
  overtimeMultiplier: number;
}

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  shiftDate: string;
  shiftType: string;
  startTime?: string | null;
  endTime?: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string | null;
}

export interface TodayAttendanceRecord {
  hasRecord: boolean;
  id?: string;
  workDate: string;
  clockIn?: string | null;
  clockOut?: string | null;
  lunchStart?: string | null;
  lunchEnd?: string | null;
  status: string;
  workMode: string;
  totalHours: number;
  overtimeHours: number;
  isIncomplete: boolean;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  checkInPhotoUrl?: string | null;
  checkInAccuracy?: number | null;
  checkOutPhotoUrl?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutAccuracy?: number | null;
  verificationStatus?: string | null;
  exceptionReason?: string | null;
  shift?: { type: string; start: string; end: string } | null;
  policy?: { start_time: string; end_time: string; standard_hours: number } | null;
}

export interface EmployeeInvitation {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  jobTitle?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  managerId?: string | null;
  status: 'pending' | 'sent' | 'accepted' | 'expired' | 'revoked' | 'failed';
  invitationToken: string;
  tokenExpiresAt: string;
  invitedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface AIInsight {
  id: string;
  type: 'burnout' | 'performance' | 'attendance' | 'productivity' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedEmployee?: string;
  recommendation: string;
  confidence: number;
}

export interface PerformanceData {
  month: string;
  score: number;
  target: number;
}

export interface DepartmentStat {
  name: string;
  employees: number;
  avgPerformance: number;
  attendance: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const AVAILABLE_BADGES: Badge[] = [
  { id: 'perfect_attendance', name: 'Perfect Attendance', icon: '🏆', description: '30 days no absence', color: '#22c55e' },
  { id: 'top_performer', name: 'Top Performer', icon: '⭐', description: 'Top 10% performance score', color: '#f59e0b' },
  { id: 'team_player', name: 'Team Player', icon: '🤝', description: 'Recognized by peers 5+ times', color: '#3b82f6' },
  { id: 'streak_master', name: 'Streak Master', icon: '🔥', description: '30-day check-in streak', color: '#ef4444' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Consistently on time for 30 days', color: '#8b5cf6' },
  { id: 'mentor', name: 'Mentor', icon: '🎓', description: 'Mentored 3+ team members', color: '#06b6d4' },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PaySlip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  bonus: number;
  pf: number;
  tax: number;
  netSalary: number;
  status?: string;
  runId?: string;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  designation?: string;
  payslipPdfPath?: string | null;
  processedAt?: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  status: 'draft' | 'processed' | 'paid';
  processedBy?: string;
  processedAt?: string;
  createdAt?: string;
  recordsCount?: number;
  totalPayout?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  creatorId?: string;
  departmentId?: string;
  dueDate?: string;
  completedAt?: string;
  githubPrUrl?: string;
  githubIssueUrl?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    position?: string;
  };
}

export interface Resignation {
  id: string;
  employeeId: string;
  employeeName?: string;
  employeeAvatar?: string;
  department?: string;
  submissionDate: string;
  desiredLastDate?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  noticePeriodDays: number;
  calculatedLastDate?: string;
  decidedBy?: string;
  decidedAt?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingTaskItem {
  id: string;
  employeeId?: string;
  taskLabel: string;
  dueDay: number;
  assigneeId?: string;
  buddyId?: string;
  notes?: string;
  done: boolean;
  startDate?: string;
  completedAt?: string;
  createdAt: string;
}

