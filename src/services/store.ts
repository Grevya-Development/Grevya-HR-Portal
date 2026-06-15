import { create } from 'zustand';
import { User, Employee, LeaveRequest, Notification, HRManager } from '../types';
import { DEMO_USERS, EMPLOYEES, HR_MANAGERS, LEAVE_REQUESTS, NOTIFICATIONS } from '../data/mockData';

const STORAGE_KEYS = {
  user: 'grevya.currentUser',
  employees: 'grevya.employees',
  leaveRequests: 'grevya.leaveRequests',
  notifications: 'grevya.notifications',
  hrManagers: 'grevya.hrManagers',
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

  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: readStorage<User | null>(STORAGE_KEYS.user, null),
  employees: readStorage<Employee[]>(STORAGE_KEYS.employees, EMPLOYEES),
  leaveRequests: readStorage<LeaveRequest[]>(STORAGE_KEYS.leaveRequests, LEAVE_REQUESTS),
  notifications: readStorage<Notification[]>(STORAGE_KEYS.notifications, NOTIFICATIONS),
  hrManagers: readStorage<HRManager[]>(STORAGE_KEYS.hrManagers, HR_MANAGERS),
  darkMode: false,
  sidebarOpen: true,

  fetchInitialData: async () => {
    const employees = readStorage<Employee[]>(STORAGE_KEYS.employees, EMPLOYEES);
    const leaveRequests = readStorage<LeaveRequest[]>(STORAGE_KEYS.leaveRequests, LEAVE_REQUESTS);
    const notifications = readStorage<Notification[]>(STORAGE_KEYS.notifications, NOTIFICATIONS);
    const hrManagers = readStorage<HRManager[]>(STORAGE_KEYS.hrManagers, HR_MANAGERS);
    set({ employees, leaveRequests, notifications, hrManagers });
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
    writeStorage(STORAGE_KEYS.leaveRequests, leaveRequests);
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
      request.id === id ? { ...request, status: 'approved' as const, approvedBy: user?.name, comments } : request,
    );
    writeStorage(STORAGE_KEYS.leaveRequests, leaveRequests);
    set({ leaveRequests });
  },

  rejectLeave: async (id, comments) => {
    const user = get().currentUser;
    const leaveRequests = get().leaveRequests.map(request =>
      request.id === id ? { ...request, status: 'rejected' as const, approvedBy: user?.name, comments } : request,
    );
    writeStorage(STORAGE_KEYS.leaveRequests, leaveRequests);
    set({ leaveRequests });
  },

  applyLeave: async (request) => {
    const leaveRequest: LeaveRequest = {
      ...request,
      id: `l${Date.now()}`,
      status: 'pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };
    const leaveRequests = [leaveRequest, ...get().leaveRequests];
    writeStorage(STORAGE_KEYS.leaveRequests, leaveRequests);
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
}));
