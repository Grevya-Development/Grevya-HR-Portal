import { create } from 'zustand';
import {
  User, Employee, LeaveRequest, Notification, HRManager, Expense,
  UserRole, Department, LeaveType, LeaveBalance, Holiday,
  AttendanceRecord, WorkPolicy, TodayAttendanceRecord, PaySlip, PayrollRun,
  Task, Resignation, OnboardingTaskItem, EmployeeInvitation
} from '../types';
import { supabase } from '../lib/supabase';
import { calculateLeaveDays, checkLeaveOverlap } from '../utils/leaveCalculations';
import { isPermittedGrevyaEmail, EMAIL_POLICY_MESSAGE } from '../utils/emailValidation';

const STORAGE_KEYS = {
  user: 'grevya.currentUser',
  employees: 'grevya.employees',
  leaveRequests: 'grevya_leaves',
  notifications: 'grevya.notifications',
  hrManagers: 'grevya.hrManagers',
  expenses: 'grevya.expenses',
};

const LEAVES_STORAGE_KEY = 'grevya_leaves';

const normalizeLeave = (req: LeaveRequest): LeaveRequest => {
  const empId = req.employeeId || (req as any).employee?.id || '';
  const empName = req.employeeName || (req as any).employee?.name || '';
  const empAvatar = req.employeeAvatar || (req as any).employee?.avatar || '';
  const empDept = req.department || (req as any).employee?.department || '';
  return {
    ...req,
    employeeId: empId,
    employeeName: empName,
    employeeAvatar: empAvatar,
    department: empDept,
    employee: {
      id: empId,
      name: empName,
      avatar: empAvatar,
      department: empDept,
    },
  };
};

export const readLeavesFromStorage = (): LeaveRequest[] => {
  const primary = readStorage<LeaveRequest[] | null>(LEAVES_STORAGE_KEY, null);
  if (primary && Array.isArray(primary)) return primary.map(normalizeLeave);
  const legacy = readStorage<LeaveRequest[] | null>('grevya.leaveRequests', null);
  if (legacy && Array.isArray(legacy)) return legacy.map(normalizeLeave);
  return [];
};

export const persistLeavesToStorage = (leaves: LeaveRequest[]) => {
  const normalized = leaves.map(normalizeLeave);
  writeStorage(LEAVES_STORAGE_KEY, normalized);
  writeStorage('grevya.leaveRequests', normalized);
};

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

function buildUserFromProfile(user: { id: string; email?: string }, profile: any): User {
  const deptName = (Array.isArray(profile.departments) ? profile.departments[0]?.name : profile.departments?.name) || 'General';
  const fullName = profile.full_name || user.email?.split('@')[0] || 'User';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return {
    id: profile.id || user.id,
    name: fullName,
    email: profile.email || user.email || '',
    role: (profile.role as UserRole) || 'employee',
    department: deptName,
    position: profile.job_title || 'Team Member',
    avatar: profile.avatar || initials,
    joinDate: profile.hire_date || new Date().toISOString().split('T')[0],
    status: profile.status,
    managerId: profile.manager_id || undefined,
  };
}

function mapProfileToEmployee(p: any): Employee {
  const deptName = (Array.isArray(p.departments) ? p.departments[0]?.name : p.departments?.name) || 'General';
  const fullName = p.full_name || p.email?.split('@')[0] || 'Employee';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'EM';

  return {
    id: p.id,
    name: fullName,
    email: p.email || '',
    role: p.role,
    department: deptName,
    departmentId: p.department_id || undefined,
    position: p.job_title || 'Team Member',
    status: (['active', 'inactive', 'on_leave', 'pending', 'rejected'].includes(p.status) ? p.status : 'active') as Employee['status'],
    joinDate: p.hire_date || '',
    salary: p.salary ? Number(p.salary) : 0,
    performance: p.performance_score ?? 80,
    attendance: p.attendance_score ?? 90,
    avatar: p.avatar || initials,
    managerId: p.manager_id || '',
    phone: p.phone || '',
    location: p.location || '',
    points: p.points ?? 0,
    badges: [],
    streak: p.streak ?? 0,
    lastSeenAt: p.last_seen_at || undefined,
    // Extended HRMS Fields
    employeeCode: p.employee_code || undefined,
    personalEmail: p.personal_email || undefined,
    alternatePhone: p.alternate_phone || undefined,
    currentAddress: p.current_address || undefined,
    permanentAddress: p.permanent_address || undefined,
    dob: p.dob || undefined,
    gender: p.gender || undefined,
    emergencyContact: p.emergency_contact || undefined,
    bio: p.bio || undefined,
    workMode: p.work_mode || 'office',
    confirmationDate: p.confirmation_date || undefined,
    skills: p.skills || [],
    qualifications: p.qualifications || undefined,
    certifications: p.certifications || undefined,
    bankName: p.bank_name || undefined,
    bankAccountNo: p.bank_account_no || undefined,
    bankIfsc: p.bank_ifsc || undefined,
    bankHolderName: p.bank_holder_name || undefined,
    panNumber: p.pan_number || undefined,
  };
}

function mapProfileToHRManager(p: any): HRManager {
  const deptName = (Array.isArray(p.departments) ? p.departments[0]?.name : p.departments?.name) || 'HR';
  const fullName = p.full_name || p.email?.split('@')[0] || 'HR Manager';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'HR';

  return {
    id: p.id,
    name: fullName,
    email: p.email || '',
    department: deptName,
    departmentId: p.department_id || undefined,
    status: (p.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    avatar: p.avatar || initials,
    joinDate: p.hire_date || '',
    phone: p.phone || '',
    location: p.location || '',
  };
}

function validateProfileStatus(profile: any): { valid: boolean; error?: string } {
  if (!profile) {
    return { valid: false, error: 'No user profile found for this account. Access denied.' };
  }
  if (!profile.role) {
    return { valid: false, error: 'User account has no assigned portal role. Access denied.' };
  }
  const status = profile.status;
  if (status === 'active' || status === 'on_leave') {
    return { valid: true };
  }
  if (status === 'pending' || status === 'pending_activation') {
    return { valid: false, error: 'Your account registration is pending HR approval.' };
  }
  if (status === 'rejected') {
    return { valid: false, error: 'Your account registration was declined. Please contact your administrator.' };
  }
  if (status === 'inactive') {
    return { valid: false, error: 'Your account is currently inactive. Please contact HR.' };
  }
  return { valid: false, error: `Account status "${status}" is not authorized to access protected dashboards.` };
}

let authListenerAttached = false;

interface AppState {
  currentUser: User | null;
  authLoading: boolean;
  authError: string | null;
  departments: Department[];
  departmentsLoading: boolean;
  employees: Employee[];
  employeesLoading: boolean;
  employeesError: string | null;
  leaveTypes: LeaveType[];
  leaveBalances: LeaveBalance[];
  holidays: Holiday[];
  leaveRequests: LeaveRequest[];
  leavesLoading: boolean;
  leavesError: string | null;
  attendanceRecords: AttendanceRecord[];
  attendanceLoading: boolean;
  attendanceError: string | null;
  todayAttendance: TodayAttendanceRecord | null;
  workPolicy: WorkPolicy | null;
  notifications: Notification[];
  hrManagers: HRManager[];
  expenses: Expense[];
  expensesLoading: boolean;
  expensesError: string | null;
  payrollRuns: PayrollRun[];
  payrollRecords: PaySlip[];
  payrollLoading: boolean;
  payrollError: string | null;
  darkMode: boolean;
  sidebarOpen: boolean;

  initAuth: () => Promise<void>;
  fetchDepartments: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchLeaveTypes: () => Promise<void>;
  fetchHolidays: () => Promise<void>;
  fetchLeaveBalances: () => Promise<void>;
  fetchLeaves: () => Promise<void>;
  fetchWorkPolicy: () => Promise<void>;
  fetchTodayAttendance: () => Promise<void>;
  fetchAttendance: (filters?: { month?: string; employeeId?: string }) => Promise<void>;
  clockIn: (workMode?: 'office' | 'remote' | 'hybrid', notes?: string, latitude?: number, longitude?: number, photoUrl?: string, accuracy?: number, exceptionReason?: string) => Promise<{ success: boolean; error?: string }>;
  lunchOut: () => Promise<{ success: boolean; error?: string }>;
  lunchIn: () => Promise<{ success: boolean; error?: string }>;
  clockOut: (notes?: string, photoUrl?: string, latitude?: number, longitude?: number, accuracy?: number, exceptionReason?: string) => Promise<{ success: boolean; error?: string }>;
  fetchExpenses: () => Promise<void>;
  fetchPayroll: () => Promise<void>;
  processPayroll: (month: string, year: number) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchInitialData: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;

  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  updateMyProfile: (updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addHRManager: (manager: Omit<HRManager, 'id'>) => Promise<void>;
  updateHRManager: (id: string, data: Partial<HRManager>) => Promise<void>;
  deleteHRManager: (id: string) => Promise<void>;
  toggleHRManagerStatus: (id: string) => Promise<void>;

  createDepartment: (dept: { name: string; code?: string; description?: string; headId?: string | null }) => Promise<{ success: boolean; error?: string }>;
  updateDepartment: (id: string, updates: { name?: string; code?: string; description?: string; headId?: string | null; isActive?: boolean }) => Promise<{ success: boolean; error?: string }>;
  deleteDepartment: (id: string) => Promise<{ success: boolean; error?: string }>;
  reassignDepartment: (employeeId: string, newDepartmentId: string) => Promise<{ success: boolean; error?: string }>;
  toggleDepartmentStatus: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  updateOrgPosition: (employeeId: string, updates: { jobTitle?: string; departmentId?: string | null; managerId?: string | null; role?: UserRole }) => Promise<{ success: boolean; error?: string }>;

  approveLeave: (id: string, comments?: string) => Promise<void>;
  rejectLeave: (id: string, comments?: string) => Promise<void>;
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'status' | 'submittedOn'>) => Promise<void>;
  approveExpense: (id: string, comments?: string) => Promise<void>;
  rejectExpense: (id: string, comments?: string) => Promise<void>;

  tasks: Task[];
  tasksLoading: boolean;
  resignations: Resignation[];
  resignationsLoading: boolean;
  onboardingTasks: OnboardingTaskItem[];
  onboardingLoading: boolean;
  onlineUserIds: string[];

  invitations: EmployeeInvitation[];
  invitationsLoading: boolean;
  invitationsError: string | null;
  fetchInvitations: () => Promise<void>;
  inviteEmployee: (data: { email: string; fullName: string; role?: UserRole; jobTitle?: string; departmentId?: string; managerId?: string }) => Promise<{ success: boolean; token?: string; error?: string }>;
  resendInvitation: (id: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  revokeInvitation: (id: string) => Promise<{ success: boolean; error?: string }>;

  register: (data: { name: string; email: string; password: string; role?: UserRole; departmentId?: string; position?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  approveRegistration: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  rejectRegistration: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  fetchTasks: () => Promise<void>;
  createTask: (task: Partial<Task>) => Promise<{ success: boolean; error?: string }>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<{ success: boolean; error?: string }>;
  fetchResignations: () => Promise<void>;
  submitResignation: (reason: string, desiredLastDate?: string) => Promise<{ success: boolean; error?: string }>;
  decideResignation: (resignationId: string, status: 'approved' | 'rejected', noticePeriodDays: number, comments?: string) => Promise<{ success: boolean; error?: string }>;
  fetchOnboardingTasks: () => Promise<void>;
  toggleOnboardingTask: (taskId: string, done: boolean) => Promise<{ success: boolean; error?: string }>;
  createOnboardingTask: (task: Partial<OnboardingTaskItem>) => Promise<{ success: boolean; error?: string }>;
  initPresence: () => void;

  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  authLoading: true,
  authError: null,
  departments: [],
  departmentsLoading: false,
  employees: [],
  employeesLoading: false,
  employeesError: null,
  leaveTypes: [],
  leaveBalances: [],
  holidays: [],
  leaveRequests: [],
  leavesLoading: false,
  leavesError: null,
  attendanceRecords: [],
  attendanceLoading: false,
  attendanceError: null,
  todayAttendance: null,
  workPolicy: null,
  notifications: [],
  invitations: [],
  invitationsLoading: false,
  invitationsError: null,
  hrManagers: [],
  expenses: [],
  expensesLoading: false,
  expensesError: null,
  payrollRuns: [],
  payrollRecords: [],
  payrollLoading: false,
  payrollError: null,
  tasks: [],
  tasksLoading: false,
  resignations: [],
  resignationsLoading: false,
  onboardingTasks: [],
  onboardingLoading: false,
  onlineUserIds: [],
  darkMode: false,
  sidebarOpen: true,

  initAuth: async () => {
    set({ authLoading: true, authError: null });

    if (!authListenerAttached) {
      authListenerAttached = true;
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          set({ currentUser: null });
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session.user && !get().currentUser) {
            await get().initAuth();
          }
        }
      });
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        set({ currentUser: null, authLoading: false });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, job_title, avatar, hire_date, status, manager_id, departments!department_id(id, name)')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile during initAuth:', profileError);
        await supabase.auth.signOut();
        set({ currentUser: null, authLoading: false, authError: 'Unable to load profile. Please sign in again.' });
        return;
      }

      const validation = validateProfileStatus(profile);
      if (!validation.valid) {
        await supabase.auth.signOut();
        set({ currentUser: null, authLoading: false, authError: validation.error });
        return;
      }

      const currentUser = buildUserFromProfile(session.user, profile);
      set({ currentUser, authLoading: false, authError: null });
      await get().fetchInitialData();
    } catch (err: any) {
      console.error('Unexpected error in initAuth:', err);
      set({ currentUser: null, authLoading: false });
    }
  },

  fetchDepartments: async () => {
    set({ departmentsLoading: true });
    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          id,
          name,
          code,
          description,
          head_id,
          is_active,
          created_at,
          updated_at,
          head:profiles!departments_head_id_fkey(full_name)
        `)
        .order('name');
      if (error) {
        console.error('Error fetching departments from Supabase:', error.message);
      } else if (data) {
        const departments: Department[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          description: d.description,
          headId: d.head_id,
          headName: d.head?.full_name || null,
          isActive: d.is_active ?? true,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        set({ departments, departmentsLoading: false });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching departments:', err);
      set({ departmentsLoading: false });
    }
  },

  fetchEmployees: async () => {
    set({ employeesLoading: true, employeesError: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, full_name, email, role, job_title, status, department_id,
          departments!department_id(id, name), manager_id, hire_date, phone,
          location, performance_score, attendance_score, salary, points, streak,
          last_seen_at, employee_code, personal_email, alternate_phone,
          current_address, permanent_address, dob, gender, emergency_contact,
          bio, work_mode, confirmation_date, skills, qualifications, certifications,
          bank_name, bank_account_no, bank_ifsc, bank_holder_name, pan_number
        `)
        .order('full_name');

      if (error) {
        console.error('Error fetching profiles from Supabase:', error.message);
        set({ employeesLoading: false, employeesError: error.message });
        return;
      }

      if (data) {
        const employees = data.map(mapProfileToEmployee);
        const hrManagers = data.filter((p: any) => p.role === 'hr_manager' || p.role === 'admin' || p.role === 'super_admin').map(mapProfileToHRManager);

        set({ employees, hrManagers, employeesLoading: false, employeesError: null });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching employees:', err);
      set({ employeesLoading: false, employeesError: err.message || 'Failed to load employees from database.' });
    }
  },

  fetchLeaveTypes: async () => {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('id, name, annual_quota, carry_forward, paid, created_at, updated_at')
        .order('name');
      if (error) {
        console.error('Error fetching leave types from Supabase:', error.message);
      } else if (data) {
        const leaveTypes: LeaveType[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          annualQuota: t.annual_quota,
          carryForward: t.carry_forward,
          paid: t.paid,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }));
        set({ leaveTypes });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching leave types:', err);
    }
  },

  fetchHolidays: async () => {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('id, date, name, is_optional, created_at')
        .order('date');
      if (error) {
        console.error('Error fetching holidays from Supabase:', error.message);
      } else if (data) {
        const holidays: Holiday[] = data.map((h: any) => ({
          id: h.id,
          date: h.date,
          name: h.name,
          isOptional: h.is_optional,
          createdAt: h.created_at,
        }));
        set({ holidays });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching holidays:', err);
    }
  },

  fetchLeaveBalances: async () => {
    try {
      const user = get().currentUser;
      if (!user?.id) return;
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('leave_balances')
        .select('id, employee_id, leave_type_id, year, total, used, leave_types(id, name, annual_quota)')
        .eq('year', currentYear);
      if (error) {
        console.error('Error fetching leave balances from Supabase:', error.message);
      } else if (data) {
        const leaveBalances: LeaveBalance[] = data.map((b: any) => ({
          id: b.id,
          employeeId: b.employee_id,
          leaveTypeId: b.leave_type_id,
          year: b.year,
          total: Number(b.total),
          used: Number(b.used),
          leaveType: b.leave_types ? {
            id: b.leave_types.id,
            name: b.leave_types.name,
            annualQuota: b.leave_types.annual_quota,
            carryForward: false,
            paid: true,
          } : undefined,
        }));
        set({ leaveBalances });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching leave balances:', err);
    }
  },

  fetchLeaves: async () => {
    set({ leavesLoading: true, leavesError: null });
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          id,
          employee_id,
          leave_type_id,
          from_date,
          to_date,
          days,
          status,
          reason,
          approver_id,
          comments,
          decided_at,
          created_at,
          leave_types (
            id,
            name,
            annual_quota
          ),
          profiles!leave_requests_employee_id_fkey (
            id,
            full_name,
            avatar,
            department_id,
            departments!department_id (
              id,
              name
            )
          ),
          approver:profiles!leave_requests_approver_id_fkey (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching leave requests from Supabase:', error.message);
        set({ leavesLoading: false, leavesError: error.message });
        return;
      }

      if (data) {
        const leaveRequests: LeaveRequest[] = data.map((r: any) => {
          const empProfile = r.profiles;
          const deptName = empProfile?.departments?.name || 'General';
          const empName = empProfile?.full_name || 'Employee';
          const empAvatar = empProfile?.avatar || empName.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'EM';
          const leaveTypeName = (r.leave_types?.name || 'casual').toLowerCase();
          const approverName = r.approver?.full_name || undefined;

          return {
            id: r.id,
            employeeId: r.employee_id,
            employeeName: empName,
            employeeAvatar: empAvatar,
            department: deptName,
            type: leaveTypeName as any,
            startDate: r.from_date,
            endDate: r.to_date,
            days: Number(r.days),
            reason: r.reason || '',
            status: r.status as any,
            appliedOn: r.created_at ? r.created_at.split('T')[0] : '',
            approvedBy: approverName,
            approverId: r.approver_id || undefined,
            comments: r.comments || undefined,
            decidedAt: r.decided_at || undefined,
            leaveTypeId: r.leave_type_id,
            employee: {
              id: r.employee_id,
              name: empName,
              avatar: empAvatar,
              department: deptName,
            },
          };
        });

        set({ leaveRequests, leavesLoading: false, leavesError: null });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching leave requests:', err);
      set({ leavesLoading: false, leavesError: err.message || 'Failed to load leave requests from database.' });
    }
  },

  fetchWorkPolicy: async () => {
    try {
      const { data, error } = await supabase
        .from('work_policies')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching work policy from Supabase:', error.message);
        return;
      }

      if (data) {
        set({
          workPolicy: {
            id: data.id,
            name: data.name,
            startTime: data.start_time,
            endTime: data.end_time,
            graceMinutes: data.grace_minutes,
            standardHours: Number(data.standard_hours) || 8,
            halfDayHours: Number(data.half_day_hours) || 4,
            workDays: data.work_days || [1, 2, 3, 4, 5],
            overtimeMultiplier: Number(data.overtime_multiplier) || 1.5,
          },
        });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching work policy:', err);
    }
  },

  fetchTodayAttendance: async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_today_attendance');
      if (error) {
        console.error('Error fetching today attendance from Supabase:', error.message);
        return;
      }
      if (data) {
        set({
          todayAttendance: {
            hasRecord: Boolean(data.has_record),
            id: data.id,
            workDate: data.work_date,
            clockIn: data.clock_in,
            clockOut: data.clock_out,
            lunchStart: data.lunch_start,
            lunchEnd: data.lunch_end,
            status: data.status,
            workMode: data.work_mode,
            totalHours: Number(data.total_hours) || 0,
            overtimeHours: Number(data.overtime_hours) || 0,
            isIncomplete: Boolean(data.is_incomplete),
            notes: data.notes,
            shift: data.shift,
            policy: data.policy,
            latitude: data.latitude ? Number(data.latitude) : undefined,
            longitude: data.longitude ? Number(data.longitude) : undefined,
            checkInPhotoUrl: data.check_in_photo_url || undefined,
            checkInAccuracy: data.check_in_accuracy ? Number(data.check_in_accuracy) : undefined,
            checkOutPhotoUrl: data.check_out_photo_url || undefined,
            checkOutLatitude: data.check_out_latitude ? Number(data.check_out_latitude) : undefined,
            checkOutLongitude: data.check_out_longitude ? Number(data.check_out_longitude) : undefined,
            checkOutAccuracy: data.check_out_accuracy ? Number(data.check_out_accuracy) : undefined,
            verificationStatus: data.verification_status || 'verified',
            exceptionReason: data.exception_reason || undefined,
          },
        });
      }
    } catch (err: any) {
      console.error('Unexpected error fetching today attendance:', err);
    }
  },

  fetchAttendance: async (filters) => {
    set({ attendanceLoading: true, attendanceError: null });
    try {
      let query = supabase
        .from('attendance_records')
        .select(`
          id,
          employee_id,
          work_date,
          clock_in,
          clock_out,
          lunch_start,
          lunch_end,
          status,
          work_mode,
          total_hours,
          overtime_hours,
          is_incomplete,
          notes,
          source,
          breaks,
          latitude,
          longitude,
          check_in_photo_url,
          check_in_accuracy,
          check_out_photo_url,
          check_out_latitude,
          check_out_longitude,
          check_out_accuracy,
          verification_status,
          exception_reason,
          profiles!attendance_records_employee_id_fkey (
            id,
            full_name,
            avatar,
            department_id,
            departments!department_id (
              id,
              name
            )
          )
        `)
        .order('work_date', { ascending: false });

      if (filters?.employeeId) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.month) {
        const startOfMonth = `${filters.month}-01`;
        const [y, m] = filters.month.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const endOfMonth = `${filters.month}-${String(lastDay).padStart(2, '0')}`;
        query = query.gte('work_date', startOfMonth).lte('work_date', endOfMonth);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching attendance records:', error.message);
        set({ attendanceLoading: false, attendanceError: error.message || 'Failed to load attendance records' });
        return;
      }

      const records: AttendanceRecord[] = (data || []).map((row: any) => {
        const profile = row.profiles;
        const empName = profile?.full_name || 'Employee';
        const deptName = (Array.isArray(profile?.departments) ? profile?.departments[0]?.name : profile?.departments?.name) || 'General';
        const initials = empName
          .split(' ')
          .filter(Boolean)
          .map((w: string) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'EM';

        const formatTime = (ts: string | null) => {
          if (!ts) return '';
          try {
            const d = new Date(ts);
            return d.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
          } catch {
            return '';
          }
        };

        return {
          id: row.id,
          employeeId: row.employee_id,
          workDate: row.work_date,
          date: row.work_date,
          clockIn: row.clock_in,
          checkIn: formatTime(row.clock_in),
          clockOut: row.clock_out,
          checkOut: formatTime(row.clock_out),
          lunchStart: row.lunch_start,
          lunchEnd: row.lunch_end,
          status: row.status,
          workMode: row.work_mode,
          totalHours: Number(row.total_hours) || 0,
          hours: Number(row.total_hours) || 0,
          overtimeHours: Number(row.overtime_hours) || 0,
          isIncomplete: Boolean(row.is_incomplete),
          notes: row.notes,
          source: row.source,
          breaks: row.breaks || [],
          latitude: row.latitude ? Number(row.latitude) : undefined,
          longitude: row.longitude ? Number(row.longitude) : undefined,
          checkInPhotoUrl: row.check_in_photo_url || undefined,
          checkInAccuracy: row.check_in_accuracy ? Number(row.check_in_accuracy) : undefined,
          checkOutPhotoUrl: row.check_out_photo_url || undefined,
          checkOutLatitude: row.check_out_latitude ? Number(row.check_out_latitude) : undefined,
          checkOutLongitude: row.check_out_longitude ? Number(row.check_out_longitude) : undefined,
          checkOutAccuracy: row.check_out_accuracy ? Number(row.check_out_accuracy) : undefined,
          verificationStatus: row.verification_status || 'verified',
          exceptionReason: row.exception_reason || undefined,
          employeeName: empName,
          employeeAvatar: profile?.avatar || initials,
          department: deptName,
        };
      });

      set({ attendanceRecords: records, attendanceLoading: false, attendanceError: null });
    } catch (err: any) {
      console.error('Unexpected error fetching attendance records:', err);
      set({ attendanceLoading: false, attendanceError: err.message || 'Failed to fetch attendance.' });
    }
  },

  fetchInitialData: async () => {
    await Promise.all([
      get().fetchDepartments(),
      get().fetchEmployees(),
      get().fetchLeaveTypes(),
      get().fetchHolidays(),
      get().fetchLeaves(),
      get().fetchLeaveBalances(),
      get().fetchWorkPolicy(),
      get().fetchTodayAttendance(),
      get().fetchAttendance(),
      get().fetchExpenses(),
      get().fetchPayroll(),
      get().fetchTasks(),
      get().fetchResignations(),
      get().fetchOnboardingTasks(),
      get().fetchNotifications(),
    ]);
    get().initPresence();
    const role = get().currentUser?.role;
    if (role === 'admin' || role === 'super_admin' || role === 'hr_manager') {
      await get().fetchInvitations();
    }
  },

  login: async (email, password) => {
    set({ authError: null });
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError || !authData.user) {
        const msg = authError?.message === 'Invalid login credentials'
          ? 'Invalid login credentials. Please verify your email and password.'
          : (authError?.message || 'Authentication failed. Please check your credentials and try again.');
        set({ authError: msg });
        return { success: false, error: msg };
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, job_title, avatar, hire_date, status, manager_id, departments!department_id(id, name)')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile after sign-in:', profileError);
        await supabase.auth.signOut();
        const msg = 'Unable to load user profile. Access denied.';
        set({ currentUser: null, authError: msg });
        return { success: false, error: msg };
      }

      const validation = validateProfileStatus(profile);
      if (!validation.valid) {
        await supabase.auth.signOut();
        set({ currentUser: null, authError: validation.error });
        return { success: false, error: validation.error };
      }

      const currentUser = buildUserFromProfile(authData.user, profile);
      set({ currentUser, authError: null });
      await get().fetchInitialData();
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'A network error occurred. Please check your connection and try again.';
      set({ authError: msg });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    try {
      supabase.removeAllChannels();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      set({
        currentUser: null,
        authError: null,
        attendanceRecords: [],
        todayAttendance: null,
        workPolicy: null,
        expenses: [],
        expensesError: null,
        payrollRecords: [],
        payrollRuns: [],
        payrollError: null,
      });
    }
  },

  clearAuthError: () => set({ authError: null }),

  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  addEmployee: async (emp) => {
    if (!emp.name?.trim() || !emp.email?.trim()) {
      throw new Error('Full Name and Email are required.');
    }

    let departmentId: string | null = null;
    if (emp.departmentId) {
      departmentId = emp.departmentId;
    } else if (emp.department) {
      const depts = get().departments;
      const matched = depts.find(d => d.name.toLowerCase() === emp.department.toLowerCase());
      if (matched) departmentId = matched.id;
    }

    const payload: any = {
      full_name: emp.name.trim(),
      email: emp.email.trim().toLowerCase(),
      role: 'employee',
      department_id: departmentId,
      job_title: emp.position?.trim() || null,
      status: emp.status || 'active',
      hire_date: emp.joinDate ? emp.joinDate : null,
      salary: emp.salary ? emp.salary : null,
      performance_score: emp.performance ?? 80,
      attendance_score: emp.attendance ?? 90,
      avatar: emp.avatar || null,
      phone: emp.phone?.trim() || null,
      location: emp.location?.trim() || null,
    };

    const existing = get().employees.find(e => e.email.toLowerCase() === payload.email);
    if (existing) {
      throw new Error(`An employee with email '${payload.email}' already exists.`);
    }

    const { error } = await supabase.from('profiles').insert(payload);
    if (error) {
      console.error('Failed to insert employee into Supabase:', error);
      if (error.code === '23503' && error.message.includes('profiles_id_fkey')) {
        throw new Error(
          `Auth Account Required: Supabase profiles requires a linked Auth user ID (profiles.id -> auth.users.id). User '${payload.email}' must be invited or registered via Supabase Auth before linking an employee profile.`
        );
      }
      if (error.code === '23505' || error.message.includes('profiles_email_key')) {
        throw new Error(`An employee with email '${payload.email}' already exists in the database.`);
      }
      throw new Error(error.message || 'Failed to create employee profile in Supabase.');
    }

    await get().fetchEmployees();
  },

  updateEmployee: async (id, data) => {
    let departmentId: string | undefined = undefined;
    if (data.departmentId) {
      departmentId = data.departmentId;
    } else if (data.department) {
      const targetDept = data.department.toLowerCase();
      const depts = get().departments;
      const matched = depts.find(d => d.name.toLowerCase() === targetDept);
      if (matched) departmentId = matched.id;
    }

    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.full_name = data.name.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (departmentId !== undefined) updatePayload.department_id = departmentId;
    if (data.position !== undefined) updatePayload.job_title = data.position?.trim() || null;
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.managerId !== undefined) updatePayload.manager_id = data.managerId ? data.managerId : null;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null;
    if (data.location !== undefined) updatePayload.location = data.location?.trim() || null;
    if (data.salary !== undefined) updatePayload.salary = data.salary ? data.salary : null;
    if (data.joinDate !== undefined) updatePayload.hire_date = data.joinDate ? data.joinDate : null;
    if (data.performance !== undefined) updatePayload.performance_score = data.performance;
    if (data.attendance !== undefined) updatePayload.attendance_score = data.attendance;
    if (data.avatar !== undefined) updatePayload.avatar = data.avatar;
    if (data.employeeCode !== undefined) updatePayload.employee_code = data.employeeCode?.trim() || null;
    if (data.personalEmail !== undefined) updatePayload.personal_email = data.personalEmail?.trim() || null;
    if (data.alternatePhone !== undefined) updatePayload.alternate_phone = data.alternatePhone?.trim() || null;
    if (data.currentAddress !== undefined) updatePayload.current_address = data.currentAddress?.trim() || null;
    if (data.permanentAddress !== undefined) updatePayload.permanent_address = data.permanentAddress?.trim() || null;
    if (data.dob !== undefined) updatePayload.dob = data.dob || null;
    if (data.gender !== undefined) updatePayload.gender = data.gender || null;
    if (data.emergencyContact !== undefined) updatePayload.emergency_contact = data.emergencyContact;
    if (data.bio !== undefined) updatePayload.bio = data.bio?.trim() || null;
    if (data.workMode !== undefined) updatePayload.work_mode = data.workMode;
    if (data.confirmationDate !== undefined) updatePayload.confirmation_date = data.confirmationDate || null;
    if (data.skills !== undefined) updatePayload.skills = data.skills;
    if (data.qualifications !== undefined) updatePayload.qualifications = data.qualifications?.trim() || null;
    if (data.certifications !== undefined) updatePayload.certifications = data.certifications?.trim() || null;
    if (data.bankName !== undefined) updatePayload.bank_name = data.bankName?.trim() || null;
    if (data.bankAccountNo !== undefined) updatePayload.bank_account_no = data.bankAccountNo?.trim() || null;
    if (data.bankIfsc !== undefined) updatePayload.bank_ifsc = data.bankIfsc?.trim() || null;
    if (data.bankHolderName !== undefined) updatePayload.bank_holder_name = data.bankHolderName?.trim() || null;
    if (data.panNumber !== undefined) updatePayload.pan_number = data.panNumber?.trim() || null;

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id);
    if (error) {
      console.error('Failed to update employee in Supabase:', error);
      if (error.code === '23505' || error.message.includes('profiles_email_key')) {
        throw new Error(`An employee with email '${data.email}' already exists.`);
      }
      throw new Error(error.message || 'Failed to update employee in database.');
    }

    await get().fetchEmployees();
  },

  updateMyProfile: async (updates: Partial<Employee>) => {
    const user = get().currentUser;
    if (!user?.id) throw new Error('Not authenticated');

    const updatePayload: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) updatePayload.full_name = updates.name.trim();
    if (updates.phone !== undefined) updatePayload.phone = updates.phone.trim() || null;
    if (updates.alternatePhone !== undefined) updatePayload.alternate_phone = updates.alternatePhone.trim() || null;
    if (updates.personalEmail !== undefined) updatePayload.personal_email = updates.personalEmail.trim() || null;
    if (updates.location !== undefined) updatePayload.location = updates.location.trim() || null;
    if (updates.currentAddress !== undefined) updatePayload.current_address = updates.currentAddress.trim() || null;
    if (updates.permanentAddress !== undefined) updatePayload.permanent_address = updates.permanentAddress.trim() || null;
    if (updates.emergencyContact !== undefined) updatePayload.emergency_contact = updates.emergencyContact;
    if (updates.bio !== undefined) updatePayload.bio = updates.bio.trim() || null;
    if (updates.skills !== undefined) updatePayload.skills = updates.skills;
    if (updates.qualifications !== undefined) updatePayload.qualifications = updates.qualifications.trim() || null;
    if (updates.certifications !== undefined) updatePayload.certifications = updates.certifications.trim() || null;
    if (updates.avatar !== undefined) updatePayload.avatar = updates.avatar;

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', user.id);
    if (error) {
      console.error('Failed to update self-service profile:', error);
      throw new Error(error.message || 'Failed to update profile');
    }

    set(s => ({
      currentUser: s.currentUser ? {
        ...s.currentUser,
        name: updates.name ? updates.name.trim() : s.currentUser.name,
      } : null,
    }));
    await get().fetchEmployees();
  },

  createDepartment: async (dept: { name: string; code?: string; description?: string; headId?: string | null }) => {
    try {
      const payload: any = {
        name: dept.name.trim(),
        code: dept.code?.trim().toUpperCase() || null,
        description: dept.description?.trim() || null,
        head_id: dept.headId || null,
        is_active: true,
      };
      const { error } = await supabase.from('departments').insert(payload);
      if (error) {
        if (error.code === '23505') {
          return { success: false, error: `A department named '${dept.name}' already exists.` };
        }
        return { success: false, error: error.message };
      }
      await get().fetchDepartments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create department' };
    }
  },

  updateDepartment: async (id: string, updates: { name?: string; code?: string; description?: string; headId?: string | null; isActive?: boolean }) => {
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.code !== undefined) payload.code = updates.code.trim().toUpperCase() || null;
      if (updates.description !== undefined) payload.description = updates.description.trim() || null;
      if (updates.headId !== undefined) payload.head_id = updates.headId || null;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;

      const { error } = await supabase.from('departments').update(payload).eq('id', id);
      if (error) return { success: false, error: error.message };
      await get().fetchDepartments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update department' };
    }
  },

  reassignDepartment: async (employeeId: string, newDepartmentId: string) => {
    try {
      const { error } = await supabase.from('profiles').update({ department_id: newDepartmentId, updated_at: new Date().toISOString() }).eq('id', employeeId);
      if (error) return { success: false, error: error.message };
      await Promise.all([get().fetchEmployees(), get().fetchDepartments()]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reassign department' };
    }
  },

  toggleDepartmentStatus: async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from('departments').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) return { success: false, error: error.message };
      await get().fetchDepartments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to change department status' };
    }
  },

  deleteDepartment: async (id: string) => {
    try {
      const user = get().currentUser;
      if (!user || !['admin', 'super_admin', 'hr_manager'].includes(user.role)) {
        return { success: false, error: 'Unauthorized: Only HR Managers and Administrators can delete departments.' };
      }

      // Check if any employees in active store state are assigned
      const assignedEmps = get().employees.filter(e => e.departmentId === id);
      if (assignedEmps.length > 0) {
        return {
          success: false,
          error: `Cannot delete department: ${assignedEmps.length} employee(s) are actively assigned. Please reassign staff before deleting.`,
        };
      }

      // Check database directly for any referencing profiles (active or inactive)
      const { data: dbProfiles, error: profileCheckErr } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('department_id', id);

      if (profileCheckErr) {
        return { success: false, error: profileCheckErr.message };
      }

      if (dbProfiles && dbProfiles.length > 0) {
        return {
          success: false,
          error: `Cannot delete department: ${dbProfiles.length} employee profile(s) reference this department. Please reassign them or deactivate the department instead.`,
        };
      }

      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          return {
            success: false,
            error: 'Database constraint: Historical attendance, leave, or payroll records reference this department. Deactivate the department instead to preserve audit history.',
          };
        }
        return { success: false, error: error.message };
      }

      await get().fetchDepartments();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete department' };
    }
  },

  updateOrgPosition: async (employeeId: string, updates: { jobTitle?: string; departmentId?: string | null; managerId?: string | null; role?: UserRole }) => {
    try {
      const user = get().currentUser;
      if (!user || !['admin', 'super_admin', 'hr_manager'].includes(user.role)) {
        return { success: false, error: 'Unauthorized: Only HR Managers and Administrators can modify organizational hierarchy.' };
      }

      if (updates.managerId && updates.managerId === employeeId) {
        return { success: false, error: 'Integrity rule violation: An employee cannot be assigned as their own reporting manager.' };
      }

      // Cycle detection: traverse candidate manager's chain
      if (updates.managerId) {
        let currentMgrId: string | null = updates.managerId;
        const visited = new Set<string>([employeeId]);
        const allEmps = get().employees;
        while (currentMgrId) {
          if (visited.has(currentMgrId)) {
            return {
              success: false,
              error: 'Integrity rule violation: Circular reporting relationship detected. This assignment would create a reporting loop.',
            };
          }
          visited.add(currentMgrId);
          const mgr = allEmps.find(e => e.id === currentMgrId);
          currentMgrId = mgr?.managerId || null;
        }
      }

      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.jobTitle !== undefined) {
        payload.job_title = updates.jobTitle.trim() || null;
      }
      if (updates.departmentId !== undefined) {
        payload.department_id = updates.departmentId || null;
      }
      if (updates.managerId !== undefined) {
        payload.manager_id = updates.managerId || null;
      }
      if (updates.role !== undefined) {
        if (!['admin', 'super_admin'].includes(user.role)) {
          return { success: false, error: 'Unauthorized: Only Administrators can modify application permission roles.' };
        }
        payload.role = updates.role;
      }

      const { error } = await supabase.from('profiles').update(payload).eq('id', employeeId);
      if (error) {
        return { success: false, error: error.message };
      }

      await Promise.all([
        get().fetchEmployees(),
        get().fetchDepartments(),
      ]);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update organizational position' };
    }
  },

  deleteEmployee: async (id) => {
    // Preserve records and avoid cascading data loss as required by Phase 2 rules
    const { error } = await supabase.from('profiles').update({ status: 'inactive' }).eq('id', id);
    if (error) {
      console.error('Failed to deactivate employee in Supabase:', error);
      throw new Error(error.message || 'Failed to update employee status in database.');
    }
    await get().fetchEmployees();
  },

  addHRManager: async (manager) => {
    if (!manager.name?.trim() || !manager.email?.trim()) {
      throw new Error('Full Name and Email are required.');
    }

    let departmentId: string | null = null;
    if (manager.departmentId) {
      departmentId = manager.departmentId;
    } else if (manager.department) {
      const depts = get().departments;
      const matched = depts.find(d => d.name.toLowerCase() === manager.department.toLowerCase());
      if (matched) departmentId = matched.id;
    }

    const payload: any = {
      full_name: manager.name.trim(),
      email: manager.email.trim().toLowerCase(),
      role: 'hr_manager',
      department_id: departmentId,
      job_title: 'HR Manager',
      status: manager.status || 'active',
      hire_date: manager.joinDate ? manager.joinDate : null,
      avatar: manager.avatar || null,
      phone: manager.phone?.trim() || null,
      location: manager.location?.trim() || null,
    };

    const { error } = await supabase.from('profiles').insert(payload);
    if (error) {
      console.error('Failed to insert HR Manager into Supabase:', error);
      if (error.code === '23503' && error.message.includes('profiles_id_fkey')) {
        throw new Error(
          `Auth Account Required: Supabase profiles requires a linked Auth user ID (profiles.id -> auth.users.id). User '${payload.email}' must be invited or registered via Supabase Auth first.`
        );
      }
      if (error.code === '23505' || error.message.includes('profiles_email_key')) {
        throw new Error(`A user with email '${payload.email}' already exists in the database.`);
      }
      throw new Error(error.message || 'Failed to add HR Manager in database.');
    }

    await get().fetchEmployees();
  },

  updateHRManager: async (id, data) => {
    let departmentId: string | undefined = undefined;
    if (data.departmentId) {
      departmentId = data.departmentId;
    } else if (data.department) {
      const targetDept = data.department.toLowerCase();
      const depts = get().departments;
      const matched = depts.find(d => d.name.toLowerCase() === targetDept);
      if (matched) departmentId = matched.id;
    }

    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.full_name = data.name.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim().toLowerCase();
    if (departmentId !== undefined) updatePayload.department_id = departmentId;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null;
    if (data.location !== undefined) updatePayload.location = data.location?.trim() || null;
    if (data.joinDate !== undefined) updatePayload.hire_date = data.joinDate ? data.joinDate : null;
    if (data.avatar !== undefined) updatePayload.avatar = data.avatar;

    const { error } = await supabase.from('profiles').update(updatePayload).eq('id', id);
    if (error) {
      console.error('Failed to update HR Manager in Supabase:', error);
      throw new Error(error.message || 'Failed to update HR Manager in database.');
    }

    await get().fetchEmployees();
  },

  deleteHRManager: async (id) => {
    const { error } = await supabase.from('profiles').update({ status: 'inactive' }).eq('id', id);
    if (error) {
      console.error('Failed to deactivate HR Manager in Supabase:', error);
      throw new Error(error.message || 'Failed to update HR Manager in database.');
    }
    await get().fetchEmployees();
  },

  toggleHRManagerStatus: async (id) => {
    const manager = get().hrManagers.find(m => m.id === id);
    if (!manager) return;
    const newStatus = manager.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('Failed to toggle HR Manager status in Supabase:', error);
      throw new Error(error.message || 'Failed to toggle status in database.');
    }
    await get().fetchEmployees();
  },

  approveLeave: async (id, comments) => {
    const user = get().currentUser;
    if (!user) throw new Error('You must be signed in to approve a leave request.');

    // Execute atomic RPC function with row locking and balance update
    const { error: rpcError } = await supabase.rpc('approve_leave_request', {
      p_request_id: id,
      p_comments: comments || null,
    });

    if (rpcError) {
      console.error('RPC approve_leave_request rejected:', rpcError.message);
      throw new Error(rpcError.message || 'Failed to approve leave request.');
    }

    await Promise.all([
      get().fetchLeaves(),
      get().fetchLeaveBalances(),
    ]);
  },

  rejectLeave: async (id, comments) => {
    const user = get().currentUser;
    if (!user) throw new Error('You must be signed in to reject a leave request.');

    // Execute atomic RPC function with row locking
    const { error: rpcError } = await supabase.rpc('reject_leave_request', {
      p_request_id: id,
      p_comments: comments || null,
    });

    if (rpcError) {
      console.error('RPC reject_leave_request rejected:', rpcError.message);
      throw new Error(rpcError.message || 'Failed to reject leave request.');
    }

    await Promise.all([
      get().fetchLeaves(),
      get().fetchLeaveBalances(),
    ]);
  },

  applyLeave: async (request) => {
    const user = get().currentUser;
    if (!user?.id) {
      throw new Error('You must be signed in to submit a leave request.');
    }

    if (!request.startDate || !request.endDate) {
      throw new Error('Start date and end date are required.');
    }
    if (request.endDate < request.startDate) {
      throw new Error('End date must be greater than or equal to start date.');
    }
    if (!request.reason?.trim()) {
      throw new Error('A reason for the leave request is required.');
    }

    // Ensure leave types are loaded
    let leaveTypes = get().leaveTypes;
    if (leaveTypes.length === 0) {
      await get().fetchLeaveTypes();
      leaveTypes = get().leaveTypes;
    }

    const reqTypeStr = (request.type || 'casual').toLowerCase();
    const matchedType = leaveTypes.find(t => t.name.toLowerCase() === reqTypeStr) || leaveTypes[0];
    if (!matchedType) {
      throw new Error(`Invalid leave type "${request.type}". Available types: ${leaveTypes.map(t => t.name).join(', ')}`);
    }

    // Check for overlapping requests
    const existingRequests = get().leaveRequests.filter(r => r.employeeId === user.id);
    const overlap = checkLeaveOverlap(request.startDate, request.endDate, existingRequests);
    if (overlap.hasOverlap && overlap.conflictingRequest) {
      const conf = overlap.conflictingRequest;
      throw new Error(
        `Date conflict: You already have a ${conf.status} ${conf.type} leave request from ${conf.startDate} to ${conf.endDate}.`
      );
    }

    // Calculate business days excluding weekends and holidays
    let holidays = get().holidays;
    if (holidays.length === 0) {
      await get().fetchHolidays();
      holidays = get().holidays;
    }
    const days = calculateLeaveDays(request.startDate, request.endDate, holidays);
    if (days <= 0) {
      throw new Error('The selected date range contains 0 working days (dates fall on weekends or public holidays).');
    }

    // Insert request into Supabase
    const payload = {
      employee_id: user.id,
      leave_type_id: matchedType.id,
      from_date: request.startDate,
      to_date: request.endDate,
      days,
      reason: request.reason.trim(),
      status: 'pending',
    };

    const { error } = await supabase.from('leave_requests').insert(payload);
    if (error) {
      console.error('Failed to submit leave request to Supabase:', error);
      throw new Error(error.message || 'Failed to submit leave request.');
    }

    // Refresh leaves and balances
    await Promise.all([
      get().fetchLeaves(),
      get().fetchLeaveBalances(),
    ]);
  },

  fetchExpenses: async () => {
    set({ expensesLoading: true, expensesError: null });
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          employee_id,
          category,
          amount,
          description,
          expense_date,
          status,
          receipt_path,
          submitted_at,
          approver_id,
          comments,
          decided_at,
          profiles!employee_id (
            id,
            full_name,
            avatar
          ),
          approver:profiles!approver_id (
            id,
            full_name
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        set({ expensesLoading: false, expensesError: error.message });
        return;
      }

      const expenses: Expense[] = (data || []).map((row: any) => {
        const emp = row.profiles || {};
        const approver = row.approver || {};
        const empName = emp.full_name || 'Employee';
        const empAvatar = emp.avatar || empName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() || 'EM';
        return {
          id: row.id,
          employeeId: row.employee_id,
          employeeName: empName,
          employeeAvatar: empAvatar,
          category: row.category,
          amount: Number(row.amount),
          description: row.description || '',
          date: row.expense_date || (row.submitted_at ? row.submitted_at.split('T')[0] : ''),
          status: row.status,
          receipt: row.receipt_path || undefined,
          submittedOn: row.submitted_at ? row.submitted_at.split('T')[0] : '',
          approvedBy: approver.full_name || undefined,
          approverId: row.approver_id || undefined,
          comments: row.comments || undefined,
          decidedAt: row.decided_at || undefined,
        };
      });

      set({ expenses, expensesLoading: false, expensesError: null });
    } catch (err: any) {
      console.error('Unexpected error fetching expenses:', err);
      set({ expensesLoading: false, expensesError: err.message || 'Failed to fetch expenses.' });
    }
  },

  addExpense: async (expenseData) => {
    const user = get().currentUser;
    if (!user) throw new Error('Authentication required to submit an expense claim.');

    if (!expenseData.amount || Number(expenseData.amount) <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }
    if (!expenseData.description?.trim()) {
      throw new Error('Expense description is required.');
    }
    if (!expenseData.date) {
      throw new Error('Expense date is required.');
    }

    const payload = {
      employee_id: user.id,
      category: expenseData.category || 'Other',
      amount: Number(expenseData.amount),
      description: expenseData.description.trim(),
      expense_date: expenseData.date,
      receipt_path: expenseData.receipt?.trim() || null,
      status: 'pending',
    };

    const { error } = await supabase.from('expenses').insert(payload);
    if (error) {
      console.error('Failed to submit expense to Supabase:', error);
      throw new Error(error.message || 'Failed to submit expense claim.');
    }

    await get().fetchExpenses();
  },

  approveExpense: async (id, comments) => {
    const { data, error } = await supabase.rpc('decide_expense', {
      p_expense_id: id,
      p_decision: 'approved',
      p_comments: comments?.trim() || null,
    });

    if (error) {
      console.error('Failed to approve expense:', error);
      throw new Error(error.message || 'Failed to approve expense claim.');
    }

    await get().fetchExpenses();
  },

  rejectExpense: async (id, comments) => {
    const { data, error } = await supabase.rpc('decide_expense', {
      p_expense_id: id,
      p_decision: 'rejected',
      p_comments: comments?.trim() || null,
    });

    if (error) {
      console.error('Failed to reject expense:', error);
      throw new Error(error.message || 'Failed to reject expense claim.');
    }

    await get().fetchExpenses();
  },

  fetchPayroll: async () => {
    set({ payrollLoading: true, payrollError: null });
    try {
      const user = get().currentUser;
      const isAdminOrHr = user && ['admin', 'super_admin', 'hr_manager'].includes(user.role);

      // 1. Fetch payroll records (scoped by RLS to own or company if admin/hr)
      const { data: recordsData, error: recordsError } = await supabase
        .from('payroll_records')
        .select(`
          id,
          employee_id,
          run_id,
          base_salary,
          allowances,
          deductions,
          net_pay,
          status,
          payslip_pdf_path,
          created_at,
          payroll_runs!run_id (
            id,
            month,
            year,
            status,
            processed_at
          ),
          profiles!employee_id (
            id,
            full_name,
            job_title,
            departments!department_id (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (recordsError) {
        console.error('Error fetching payroll records:', recordsError);
        set({ payrollLoading: false, payrollError: recordsError.message });
        return;
      }

      const payrollRecords: PaySlip[] = (recordsData || []).map((row: any) => {
        const run = row.payroll_runs || {};
        const profile = row.profiles || {};
        const dept = Array.isArray(profile.departments) ? profile.departments[0]?.name : profile.departments?.name;
        const allowances = row.allowances || {};
        const deductions = row.deductions || {};

        return {
          id: row.id,
          employeeId: row.employee_id,
          runId: row.run_id,
          month: run.month || 'March',
          year: run.year || 2024,
          basicSalary: Number(row.base_salary || 0),
          hra: Number(allowances.hra || 0),
          conveyance: Number(allowances.conveyance || 0),
          medical: Number(allowances.medical || 0),
          bonus: Number(allowances.bonus || 0),
          pf: Number(deductions.pf || 0),
          tax: Number(deductions.tax || 0),
          netSalary: Number(row.net_pay || 0),
          status: row.status || 'paid',
          employeeName: profile.full_name,
          designation: profile.job_title,
          department: dept,
          payslipPdfPath: row.payslip_pdf_path,
          processedAt: run.processed_at,
        };
      });

      // 2. If Admin or HR, also fetch payroll runs overview
      let payrollRuns: PayrollRun[] = [];
      if (isAdminOrHr) {
        const { data: runsData, error: runsError } = await supabase
          .from('payroll_runs')
          .select('id, month, year, status, processed_by, processed_at, created_at')
          .order('year', { ascending: false })
          .order('created_at', { ascending: false });

        if (!runsError && runsData) {
          payrollRuns = runsData.map((r: any) => {
            const runRecords = payrollRecords.filter(rec => rec.runId === r.id);
            const totalPayout = runRecords.reduce((sum, rec) => sum + rec.netSalary, 0);
            return {
              id: r.id,
              month: r.month,
              year: r.year,
              status: r.status,
              processedBy: r.processed_by,
              processedAt: r.processed_at,
              createdAt: r.created_at,
              recordsCount: runRecords.length,
              totalPayout,
            };
          });
        }
      }

      set({ payrollRecords, payrollRuns, payrollLoading: false, payrollError: null });
    } catch (err: any) {
      console.error('Unexpected error fetching payroll:', err);
      set({ payrollLoading: false, payrollError: err.message || 'Failed to fetch payroll.' });
    }
  },

  processPayroll: async (month: string, year: number) => {
    try {
      const { data, error } = await supabase.rpc('process_payroll_run', {
        p_month: month,
        p_year: year,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await get().fetchPayroll();
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to process payroll run.' };
    }
  },

  clockIn: async (workMode = 'office', notes, latitude, longitude, photoUrl, accuracy, exceptionReason) => {
    try {
      const { data, error } = await supabase.rpc('clock_in', {
        p_work_mode: workMode,
        p_notes: notes || null,
        p_latitude: latitude ?? null,
        p_longitude: longitude ?? null,
        p_photo_url: photoUrl ?? null,
        p_accuracy: accuracy ?? null,
        p_exception_reason: exceptionReason ?? null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Immediately commit server-authoritative attendance state to store
      if (data) {
        const prev = get().todayAttendance;
        set({
          todayAttendance: {
            hasRecord: true,
            id: data.id || prev?.id,
            workDate: data.work_date || prev?.workDate || new Date().toISOString().split('T')[0],
            clockIn: data.clock_in,
            clockOut: prev?.clockOut || null,
            lunchStart: prev?.lunchStart || null,
            lunchEnd: prev?.lunchEnd || null,
            status: data.status || 'present',
            workMode: data.work_mode || workMode || 'office',
            totalHours: prev?.totalHours || 0,
            overtimeHours: prev?.overtimeHours || 0,
            isIncomplete: false,
            notes: notes || prev?.notes || null,
            latitude: data.latitude ? Number(data.latitude) : prev?.latitude || null,
            longitude: data.longitude ? Number(data.longitude) : prev?.longitude || null,
            checkInPhotoUrl: data.check_in_photo_url || prev?.checkInPhotoUrl || null,
            checkInAccuracy: data.check_in_accuracy ? Number(data.check_in_accuracy) : prev?.checkInAccuracy || null,
            checkOutPhotoUrl: prev?.checkOutPhotoUrl || null,
            checkOutLatitude: prev?.checkOutLatitude || null,
            checkOutLongitude: prev?.checkOutLongitude || null,
            checkOutAccuracy: prev?.checkOutAccuracy || null,
            verificationStatus: data.verification_status || 'verified',
            exceptionReason: exceptionReason || prev?.exceptionReason || null,
            shift: prev?.shift || null,
            policy: prev?.policy || null,
          },
        });
      }

      // Concurrently reconcile full history in background
      Promise.all([
        get().fetchTodayAttendance(),
        get().fetchAttendance(),
      ]).catch((err) => console.warn('Background attendance refresh warning:', err));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Clock-in failed' };
    }
  },

  lunchOut: async () => {
    try {
      const { data, error } = await supabase.rpc('lunch_out');
      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.lunch_start) {
        set((state) => ({
          todayAttendance: state.todayAttendance ? {
            ...state.todayAttendance,
            lunchStart: data.lunch_start,
          } : null,
        }));
      }

      Promise.all([
        get().fetchTodayAttendance(),
        get().fetchAttendance(),
      ]).catch((err) => console.warn('Background attendance refresh warning:', err));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lunch start failed' };
    }
  },

  lunchIn: async () => {
    try {
      const { data, error } = await supabase.rpc('lunch_in');
      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.lunch_end) {
        set((state) => ({
          todayAttendance: state.todayAttendance ? {
            ...state.todayAttendance,
            lunchEnd: data.lunch_end,
          } : null,
        }));
      }

      Promise.all([
        get().fetchTodayAttendance(),
        get().fetchAttendance(),
      ]).catch((err) => console.warn('Background attendance refresh warning:', err));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Lunch end failed' };
    }
  },

  clockOut: async (notes, photoUrl, latitude, longitude, accuracy, exceptionReason) => {
    try {
      const { data, error } = await supabase.rpc('clock_out', {
        p_notes: notes || null,
        p_photo_url: photoUrl ?? null,
        p_latitude: latitude ?? null,
        p_longitude: longitude ?? null,
        p_accuracy: accuracy ?? null,
        p_exception_reason: exceptionReason ?? null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Immediately commit server-authoritative clock-out state to store
      if (data) {
        const prev = get().todayAttendance;
        set({
          todayAttendance: {
            hasRecord: true,
            id: data.id || prev?.id,
            workDate: data.work_date || prev?.workDate || new Date().toISOString().split('T')[0],
            clockIn: prev?.clockIn || null,
            clockOut: data.clock_out,
            lunchStart: prev?.lunchStart || null,
            lunchEnd: prev?.lunchEnd || null,
            status: data.status || prev?.status || 'present',
            workMode: prev?.workMode || 'office',
            totalHours: Number(data.total_hours) || 0,
            overtimeHours: Number(data.overtime_hours) || 0,
            isIncomplete: false,
            notes: notes || prev?.notes || null,
            latitude: prev?.latitude || null,
            longitude: prev?.longitude || null,
            checkInPhotoUrl: prev?.checkInPhotoUrl || null,
            checkInAccuracy: prev?.checkInAccuracy || null,
            checkOutPhotoUrl: data.check_out_photo_url || prev?.checkOutPhotoUrl || null,
            checkOutLatitude: data.check_out_latitude ? Number(data.check_out_latitude) : prev?.checkOutLatitude || null,
            checkOutLongitude: data.check_out_longitude ? Number(data.check_out_longitude) : prev?.checkOutLongitude || null,
            checkOutAccuracy: data.check_out_accuracy ? Number(data.check_out_accuracy) : prev?.checkOutAccuracy || null,
            verificationStatus: data.verification_status || 'verified',
            exceptionReason: exceptionReason || prev?.exceptionReason || null,
            shift: prev?.shift || null,
            policy: prev?.policy || null,
          },
        });
      }

      Promise.all([
        get().fetchTodayAttendance(),
        get().fetchAttendance(),
      ]).catch((err) => console.warn('Background attendance refresh warning:', err));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Clock-out failed' };
    }
  },

  register: async (data) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!isPermittedGrevyaEmail(normalizedEmail)) {
      return { success: false, error: EMAIL_POLICY_MESSAGE };
    }
    if (!data.name?.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    const requestedRole = (data.role === 'manager') ? 'manager' : 'employee';
    const position = data.position?.trim() || 'Team Member';

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.name.trim(),
            role: requestedRole,
            job_title: position,
          }
        }
      });

      if (signUpError) {
        return { success: false, error: signUpError.message };
      }

      if (authData.user) {
        // If department or phone were specified, update the created profile
        if (data.departmentId || data.phone) {
          await supabase
            .from('profiles')
            .update({
              department_id: data.departmentId || null,
              phone: data.phone?.trim() || null,
            })
            .eq('id', authData.user.id);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed. Please try again.' };
    }
  },

  approveRegistration: async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          reviewed_by: get().currentUser?.id || null,
          reviewed_at: new Date().toISOString(),
          decision_method: 'admin_manual_approval'
        })
        .eq('id', profileId);

      if (error) {
        return { success: false, error: error.message };
      }
      await get().fetchEmployees();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to approve registration.' };
    }
  },

  rejectRegistration: async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          reviewed_by: get().currentUser?.id || null,
          reviewed_at: new Date().toISOString(),
          decision_method: 'admin_manual_rejection'
        })
        .eq('id', profileId);

      if (error) {
        return { success: false, error: error.message };
      }
      await get().fetchEmployees();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reject registration.' };
    }
  },

  fetchTasks: async () => {
    set({ tasksLoading: true });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          assignee_id,
          creator_id,
          department_id,
          due_date,
          completed_at,
          github_pr_url,
          github_issue_url,
          created_at,
          updated_at,
          assignee:profiles!tasks_assignee_id_fkey (
            id,
            full_name,
            avatar,
            job_title
          )
        `)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('Error fetching tasks from Supabase:', error.message);
        set({ tasksLoading: false });
        return;
      }

      if (data) {
        const tasks: Task[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          assigneeId: t.assignee_id,
          creatorId: t.creator_id,
          departmentId: t.department_id,
          dueDate: t.due_date,
          completedAt: t.completed_at,
          githubPrUrl: t.github_pr_url,
          githubIssueUrl: t.github_issue_url,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          assignee: t.assignee ? {
            id: t.assignee.id,
            name: t.assignee.full_name,
            avatar: t.assignee.avatar,
            position: t.assignee.job_title,
          } : undefined,
        }));
        set({ tasks, tasksLoading: false });
      }
    } catch (err) {
      console.error('Unexpected error fetching tasks:', err);
      set({ tasksLoading: false });
    }
  },

  createTask: async (task: Partial<Task>) => {
    try {
      const user = get().currentUser;
      const payload: any = {
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        assignee_id: task.assigneeId || null,
        creator_id: user?.id || null,
        department_id: task.departmentId || null,
        due_date: task.dueDate || null,
        github_pr_url: task.githubPrUrl || null,
        github_issue_url: task.githubIssueUrl || null,
      };
      const { error } = await supabase.from('tasks').insert(payload);
      if (error) return { success: false, error: error.message };
      await get().fetchTasks();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create task' };
    }
  },

  updateTaskStatus: async (taskId: string, status: Task['status']) => {
    try {
      const updatePayload: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'completed') {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }
      const { error } = await supabase.from('tasks').update(updatePayload).eq('id', taskId);
      if (error) return { success: false, error: error.message };
      
      set(s => ({
        tasks: s.tasks.map(t => t.id === taskId ? { ...t, status, completedAt: updatePayload.completed_at } : t)
      }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update task status' };
    }
  },

  fetchResignations: async () => {
    set({ resignationsLoading: true });
    try {
      const { data, error } = await supabase
        .from('resignations')
        .select(`
          id,
          employee_id,
          submission_date,
          desired_last_date,
          reason,
          status,
          notice_period_days,
          calculated_last_date,
          decided_by,
          decided_at,
          comments,
          created_at,
          updated_at,
          employee:profiles!resignations_employee_id_fkey (
            id,
            full_name,
            avatar,
            department_id,
            departments!department_id (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching resignations:', error.message);
        set({ resignationsLoading: false });
        return;
      }

      if (data) {
        const resignations: Resignation[] = data.map((r: any) => ({
          id: r.id,
          employeeId: r.employee_id,
          employeeName: r.employee?.full_name || 'Employee',
          employeeAvatar: r.employee?.avatar,
          department: (Array.isArray(r.employee?.departments) ? r.employee?.departments[0]?.name : r.employee?.departments?.name) || 'General',
          submissionDate: r.submission_date,
          desiredLastDate: r.desired_last_date,
          reason: r.reason,
          status: r.status,
          noticePeriodDays: r.notice_period_days,
          calculatedLastDate: r.calculated_last_date,
          decidedBy: r.decided_by,
          decidedAt: r.decided_at,
          comments: r.comments,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        set({ resignations, resignationsLoading: false });
      }
    } catch (err) {
      console.error('Unexpected error fetching resignations:', err);
      set({ resignationsLoading: false });
    }
  },

  submitResignation: async (reason: string, desiredLastDate?: string) => {
    try {
      const user = get().currentUser;
      if (!user?.id) return { success: false, error: 'You must be logged in to submit a resignation.' };

      const payload = {
        employee_id: user.id,
        reason: reason.trim(),
        desired_last_date: desiredLastDate || null,
        submission_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notice_period_days: 30,
      };

      const { error } = await supabase.from('resignations').insert(payload);
      if (error) return { success: false, error: error.message };
      await get().fetchResignations();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit resignation.' };
    }
  },

  decideResignation: async (resignationId: string, status: 'approved' | 'rejected', noticePeriodDays: number, comments?: string) => {
    try {
      const user = get().currentUser;
      const decidedAt = new Date();
      let calculatedLastDate: string | null = null;
      if (status === 'approved') {
        const lastDate = new Date(decidedAt);
        lastDate.setDate(lastDate.getDate() + noticePeriodDays);
        calculatedLastDate = lastDate.toISOString().split('T')[0];
      }

      const payload = {
        status,
        notice_period_days: noticePeriodDays,
        calculated_last_date: calculatedLastDate,
        decided_by: user?.id || null,
        decided_at: decidedAt.toISOString(),
        comments: comments?.trim() || null,
        updated_at: decidedAt.toISOString(),
      };

      const { error } = await supabase.from('resignations').update(payload).eq('id', resignationId);
      if (error) return { success: false, error: error.message };
      await get().fetchResignations();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to decide resignation.' };
    }
  },

  fetchOnboardingTasks: async () => {
    set({ onboardingLoading: true });
    try {
      const { data, error } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .order('due_day', { ascending: true });

      if (error) {
        console.error('Error fetching onboarding tasks:', error.message);
        set({ onboardingLoading: false });
        return;
      }

      if (data) {
        const onboardingTasks: OnboardingTaskItem[] = data.map((t: any) => ({
          id: t.id,
          employeeId: t.employee_id,
          taskLabel: t.task_label,
          dueDay: t.due_day,
          assigneeId: t.assignee_id,
          buddyId: t.buddy_id,
          notes: t.notes,
          done: Boolean(t.done),
          startDate: t.start_date,
          completedAt: t.completed_at,
          createdAt: t.created_at,
        }));
        set({ onboardingTasks, onboardingLoading: false });
      }
    } catch (err) {
      console.error('Unexpected error fetching onboarding tasks:', err);
      set({ onboardingLoading: false });
    }
  },

  toggleOnboardingTask: async (taskId: string, done: boolean) => {
    try {
      const payload = {
        done,
        completed_at: done ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('onboarding_tasks').update(payload).eq('id', taskId);
      if (error) return { success: false, error: error.message };
      
      set(s => ({
        onboardingTasks: s.onboardingTasks.map(t => t.id === taskId ? { ...t, done, completedAt: payload.completed_at || undefined } : t)
      }));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to toggle onboarding task' };
    }
  },

  createOnboardingTask: async (task: Partial<OnboardingTaskItem>) => {
    try {
      const payload = {
        task_label: task.taskLabel,
        due_day: task.dueDay ?? 1,
        employee_id: task.employeeId || null,
        assignee_id: task.assigneeId || null,
        buddy_id: task.buddyId || null,
        notes: task.notes || null,
        done: false,
      };
      const { error } = await supabase.from('onboarding_tasks').insert(payload);
      if (error) return { success: false, error: error.message };
      await get().fetchOnboardingTasks();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create onboarding task' };
    }
  },

  initPresence: () => {
    const user = get().currentUser;
    if (!user?.id) return;

    supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id).then();

    const channel = supabase.channel('presence:online-users', {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineUserIds = Object.keys(state);
        set({ onlineUserIds });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: user.name,
            role: user.role,
            online_at: new Date().toISOString(),
          });
        }
      });
  },

  fetchInvitations: async () => {
    set({ invitationsLoading: true, invitationsError: null });
    try {
      const { data, error } = await supabase
        .from('employee_invitations')
        .select(`
          id,
          email,
          full_name,
          role,
          job_title,
          department_id,
          manager_id,
          status,
          invitation_token,
          token_expires_at,
          invited_by,
          created_at,
          updated_at,
          departments!department_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employee invitations:', error.message);
        set({ invitationsLoading: false, invitationsError: error.message });
        return;
      }

      const invitations: EmployeeInvitation[] = (data || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role as UserRole,
        jobTitle: row.job_title,
        departmentId: row.department_id,
        departmentName: (Array.isArray(row.departments) ? row.departments[0]?.name : row.departments?.name) || null,
        managerId: row.manager_id,
        status: row.status,
        invitationToken: row.invitation_token,
        tokenExpiresAt: row.token_expires_at,
        invitedBy: row.invited_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      set({ invitations, invitationsLoading: false, invitationsError: null });
    } catch (err: any) {
      console.error('Unexpected error fetching invitations:', err);
      set({ invitationsLoading: false, invitationsError: err.message || 'Failed to load invitations' });
    }
  },

  inviteEmployee: async (data) => {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!isPermittedGrevyaEmail(normalizedEmail)) {
      return { success: false, error: EMAIL_POLICY_MESSAGE };
    }
    try {
      const { data: res, error } = await supabase.rpc('invite_employee', {
        p_email: normalizedEmail,
        p_full_name: data.fullName.trim(),
        p_role: data.role || 'employee',
        p_job_title: data.jobTitle?.trim() || 'Team Member',
        p_department_id: data.departmentId || null,
        p_manager_id: data.managerId || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await get().fetchInvitations();
      return { success: true, token: res?.token || res?.invitation_token };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send invitation' };
    }
  },

  resendInvitation: async (id: string) => {
    try {
      const { data: res, error } = await supabase.rpc('resend_employee_invitation', {
        p_invitation_id: id,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await get().fetchInvitations();
      return { success: true, token: res?.token || res?.invitation_token };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to resend invitation' };
    }
  },

  revokeInvitation: async (id: string) => {
    try {
      const { error } = await supabase.rpc('revoke_employee_invitation', {
        p_invitation_id: id,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await get().fetchInvitations();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to revoke invitation' };
    }
  },

  fetchNotifications: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error.message);
        return;
      }

      const notifications: Notification[] = (data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        type: (row.type as Notification['type']) || 'info',
        timestamp: row.created_at,
        read: Boolean(row.is_read),
        link: row.link || undefined,
      }));

      set({ notifications });
    } catch (err) {
      console.error('Unexpected error fetching notifications:', err);
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      }
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  },

  markAllRead: async () => {
    try {
      const user = get().currentUser;
      if (!user?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('is_read', false);

      if (!error) {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      }
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  },
}));
