import { create } from 'zustand';
import { User, Employee, LeaveRequest, Notification, HRManager, Expense } from '../types';
import { DEMO_USERS, EMPLOYEES, HR_MANAGERS, LEAVE_REQUESTS, NOTIFICATIONS, INITIAL_EXPENSES } from '../data/mockData';

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
  return (LEAVE_REQUESTS || []).map(normalizeLeave);
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

const demoUsers = DEMO_USERS as Array<User & { password: string }>;

interface AppState {
  currentUser: User | null;
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  notifications: Notification[];
  hrManagers: HRManager[];
  expenses: Expense[];
  darkMode: boolean;
  sidebarOpen: boolean;

  fetchInitialData: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;

  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  addHRManager: (manager: Omit<HRManager, 'id'>) => Promise<void>;
  updateHRManager: (id: string, data: Partial<HRManager>) => Promise<void>;
  deleteHRManager: (id: string) => Promise<void>;
  toggleHRManagerStatus: (id: string) => Promise<void>;

  approveLeave: (id: string, comments?: string) => Promise<void>;
  rejectLeave: (id: string, comments?: string) => Promise<void>;
  applyLeave: (request: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'status' | 'submittedOn'>) => Promise<void>;
  approveExpense: (id: string, comments?: string) => Promise<void>;
  rejectExpense: (id: string, comments?: string) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: readStorage<User | null>(STORAGE_KEYS.user, null),
  employees: readStorage<Employee[]>(STORAGE_KEYS.employees, EMPLOYEES),
  leaveRequests: readLeavesFromStorage(),
  notifications: readStorage<Notification[]>(STORAGE_KEYS.notifications, NOTIFICATIONS),
  hrManagers: readStorage<HRManager[]>(STORAGE_KEYS.hrManagers, HR_MANAGERS),
  expenses: readStorage<Expense[]>(STORAGE_KEYS.expenses, INITIAL_EXPENSES),
  darkMode: false,
  sidebarOpen: true,

  fetchInitialData: async () => {
    const employees = readStorage<Employee[]>(STORAGE_KEYS.employees, EMPLOYEES);
    const leaveRequests = readLeavesFromStorage();
    const notifications = readStorage<Notification[]>(STORAGE_KEYS.notifications, NOTIFICATIONS);
    const hrManagers = readStorage<HRManager[]>(STORAGE_KEYS.hrManagers, HR_MANAGERS);
    const expenses = readStorage<Expense[]>(STORAGE_KEYS.expenses, INITIAL_EXPENSES);
    set({ employees, leaveRequests, notifications, hrManagers, expenses });
  },

  login: async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = demoUsers.find(
      (candidate) => candidate.email.toLowerCase() === normalizedEmail && candidate.password === password,
    );

    if (!user) return false;

    const { password: _password, ...currentUser } = user;
    writeStorage(STORAGE_KEYS.user, currentUser);
    set({ currentUser });
    await get().fetchInitialData();
    return true;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.user);
    set({ currentUser: null });
  },

  toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

  addEmployee: async (emp) => {
    const newEmp = { ...emp, id: `e${Date.now()}` };
    const employees = [...get().employees, newEmp];
    writeStorage(STORAGE_KEYS.employees, employees);
    set({ employees });
  },

  updateEmployee: async (id, data) => {
    const employees = get().employees.map(employee => employee.id === id ? { ...employee, ...data } : employee);
    writeStorage(STORAGE_KEYS.employees, employees);
    set({ employees });
  },

  deleteEmployee: async (id) => {
    const employees = get().employees.filter(employee => employee.id !== id);
    const leaveRequests = get().leaveRequests.filter(request => request.employeeId !== id);
    writeStorage(STORAGE_KEYS.employees, employees);
    persistLeavesToStorage(leaveRequests);
    set({ employees, leaveRequests });
  },

  addHRManager: async (manager) => {
    const newManager = { ...manager, id: `m${Date.now()}` };
    const hrManagers = [...get().hrManagers, newManager];
    writeStorage(STORAGE_KEYS.hrManagers, hrManagers);
    set({ hrManagers });
  },

  updateHRManager: async (id, data) => {
    const hrManagers = get().hrManagers.map(manager => manager.id === id ? { ...manager, ...data } : manager);
    writeStorage(STORAGE_KEYS.hrManagers, hrManagers);
    set({ hrManagers });
  },

  deleteHRManager: async (id) => {
    const remainingManagers = get().hrManagers.filter(manager => manager.id !== id);
    const fallbackManagerId = remainingManagers[0]?.id || 'm1';
    const employees = get().employees.map(employee => employee.managerId === id ? { ...employee, managerId: fallbackManagerId } : employee);
    writeStorage(STORAGE_KEYS.hrManagers, remainingManagers);
    writeStorage(STORAGE_KEYS.employees, employees);
    set({ hrManagers: remainingManagers, employees });
  },

  toggleHRManagerStatus: async (id) => {
    const hrManagers = get().hrManagers.map(manager =>
      manager.id === id ? { ...manager, status: manager.status === 'active' ? 'inactive' as const : 'active' as const } : manager,
    );
    writeStorage(STORAGE_KEYS.hrManagers, hrManagers);
    set({ hrManagers });
  },

  approveLeave: async (id, comments) => {
    const user = get().currentUser;
    const leaveRequests = get().leaveRequests.map(request =>
      request.id === id ? normalizeLeave({ ...request, status: 'approved' as const, approvedBy: user?.name, comments }) : request,
    );
    persistLeavesToStorage(leaveRequests);
    set({ leaveRequests });
  },

  rejectLeave: async (id, comments) => {
    const user = get().currentUser;
    const leaveRequests = get().leaveRequests.map(request =>
      request.id === id ? normalizeLeave({ ...request, status: 'rejected' as const, approvedBy: user?.name, comments }) : request,
    );
    persistLeavesToStorage(leaveRequests);
    set({ leaveRequests });
  },

  applyLeave: async (request) => {
    const user = get().currentUser;
    const empId = request.employeeId || (request as any).employee?.id || user?.id || 'e1';
    const empName = request.employeeName || (request as any).employee?.name || user?.name || 'Kiran Patel';
    const empAvatar = request.employeeAvatar || (request as any).employee?.avatar || user?.avatar || 'KP';
    const empDept = request.department || (request as any).employee?.department || user?.department || 'Engineering';

    const leaveRequest: LeaveRequest = normalizeLeave({
      ...request,
      id: (request as any).id || `l${Date.now()}`,
      employeeId: empId,
      employeeName: empName,
      employeeAvatar: empAvatar,
      department: empDept,
      status: 'pending',
      appliedOn: (request as any).appliedOn || new Date().toISOString().split('T')[0],
    });
    if (!leaveRequest.appliedOn) {
      leaveRequest.appliedOn = new Date().toISOString().split('T')[0];
    }
    const leaveRequests = [leaveRequest, ...get().leaveRequests];
    persistLeavesToStorage(leaveRequests);
    set({ leaveRequests });
  },

  markNotificationRead: async (id) => {
    const notifications = get().notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification,
    );
    writeStorage(STORAGE_KEYS.notifications, notifications);
    set({ notifications });
  },

  markAllRead: async () => {
    const notifications = get().notifications.map(notification => ({ ...notification, read: true }));
    writeStorage(STORAGE_KEYS.notifications, notifications);
    set({ notifications });
  },

  addExpense: async (expenseData) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `ex${Date.now()}`,
      status: 'pending',
      submittedOn: new Date().toISOString().split('T')[0],
    };
    const expenses = [newExpense, ...get().expenses];
    writeStorage(STORAGE_KEYS.expenses, expenses);
    set({ expenses });
  },

  approveExpense: async (id, comments) => {
    const user = get().currentUser;
    const expenses = get().expenses.map(expense =>
      expense.id === id ? { ...expense, status: 'approved' as const, approvedBy: user?.name, comments } : expense,
    );
    writeStorage(STORAGE_KEYS.expenses, expenses);
    set({ expenses });
  },

  rejectExpense: async (id, comments) => {
    const user = get().currentUser;
    const expenses = get().expenses.map(expense =>
      expense.id === id ? { ...expense, status: 'rejected' as const, approvedBy: user?.name, comments } : expense,
    );
    writeStorage(STORAGE_KEYS.expenses, expenses);
    set({ expenses });
  },
}));
