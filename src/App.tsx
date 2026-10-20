import React, { useEffect, useState, Suspense } from 'react';
import { useStore } from './services/store';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AIChat from './components/ai/AIChat';
import { ToastContainer } from './components/ui/Toast';

// Lazy-loaded page components for optimal initial bundle size and instant loading
const HRDashboard = React.lazy(() => import('./pages/HRDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/ManagerDashboard'));
const EmployeeDashboard = React.lazy(() => import('./pages/EmployeeDashboard'));
const DeveloperDashboard = React.lazy(() => import('./pages/DeveloperDashboard'));
const TeamLeadDashboard = React.lazy(() => import('./pages/TeamLeadDashboard'));
const EmployeesPage = React.lazy(() => import('./pages/EmployeesPage'));
const DepartmentsPage = React.lazy(() => import('./pages/DepartmentsPage'));
const HRManagersPage = React.lazy(() => import('./pages/HRManagersPage'));
const LeavePage = React.lazy(() => import('./pages/LeavePage'));
const AttendancePage = React.lazy(() => import('./pages/AttendancePage'));
const PerformancePage = React.lazy(() => import('./pages/PerformancePage'));
const RecruitmentPage = React.lazy(() => import('./pages/RecruitmentPage'));
const OrgChartPage = React.lazy(() => import('./pages/OrgChartPage'));
const ExpensesPage = React.lazy(() => import('./pages/ExpensesPage'));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'));
const CalendarPage = React.lazy(() => import('./pages/CalendarPage'));

const ReportsPage = React.lazy(() => import('./pages/OtherPages').then(m => ({ default: m.ReportsPage })));
const NotificationsPage = React.lazy(() => import('./pages/OtherPages').then(m => ({ default: m.NotificationsPage })));
const LeaderboardPage = React.lazy(() => import('./pages/OtherPages').then(m => ({ default: m.LeaderboardPage })));
const AIPage = React.lazy(() => import('./pages/OtherPages').then(m => ({ default: m.AIPage })));
const PayslipsPage = React.lazy(() => import('./pages/OtherPages').then(m => ({ default: m.PayslipsPage })));
const ProfilePage = React.lazy(() => import('./pages/OtherPages').then(m => ({ default: m.ProfilePage })));

function PageLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '380px',
      flexDirection: 'column',
      gap: 12,
      color: 'var(--text-muted)',
    }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Loading module...</span>
    </div>
  );
}

function DashboardView() {
  const { currentUser } = useStore();
  const pos = (currentUser?.position || '').toLowerCase();
  const isDev = pos.includes('dev') || pos.includes('engineer') || pos.includes('frontend') || pos.includes('backend');
  const isLead = pos.includes('lead');

  // Allow tab switching between role view and position workspace
  const [activeTab, setActiveTab] = useState<'default' | 'workspace'>(() => {
    if (isDev || isLead) return 'workspace';
    return 'default';
  });

  if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
    return <AdminDashboard />;
  }
  if (currentUser?.role === 'hr_manager') {
    return <HRDashboard />;
  }

  // Manager: Team Lead or Manager Dashboard
  if (currentUser?.role === 'manager') {
    return (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('workspace')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'workspace' ? '1px solid #4f46e5' : '1px solid var(--border)',
              background: activeTab === 'workspace' ? '#e0e7ff' : 'var(--bg-card)',
              color: activeTab === 'workspace' ? '#4338ca' : 'var(--text-muted)',
            }}
          >
            Team Lead Workspace
          </button>
          <button
            onClick={() => setActiveTab('default')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'default' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: activeTab === 'default' ? 'var(--primary-subtle)' : 'var(--bg-card)',
              color: activeTab === 'default' ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            Manager Overview
          </button>
        </div>
        {activeTab === 'workspace' ? <TeamLeadDashboard /> : <ManagerDashboard />}
      </div>
    );
  }

  // Employee: Developer or General Employee Dashboard
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('workspace')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'workspace' ? '1px solid #059669' : '1px solid var(--border)',
            background: activeTab === 'workspace' ? '#d1fae5' : 'var(--bg-card)',
            color: activeTab === 'workspace' ? '#047857' : 'var(--text-muted)',
          }}
        >
          Developer Workspace
        </button>
        <button
          onClick={() => setActiveTab('default')}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: activeTab === 'default' ? '1px solid var(--primary)' : '1px solid var(--border)',
            background: activeTab === 'default' ? 'var(--primary-subtle)' : 'var(--bg-card)',
            color: activeTab === 'default' ? 'var(--primary)' : 'var(--text-muted)',
          }}
        >
          Employee Overview
        </button>
      </div>
      {activeTab === 'workspace' ? <DeveloperDashboard /> : <EmployeeDashboard />}
    </div>
  );
}

function PageContent({ page }: { page: string }) {
  if (page === 'dashboard') return <DashboardView />;
  if (page === 'developer-dashboard') return <DeveloperDashboard />;
  if (page === 'teamlead-dashboard') return <TeamLeadDashboard />;
  if (page === 'hr-managers') return <HRManagersPage />;
  if (page === 'employees') return <EmployeesPage />;
  if (page === 'departments') return <DepartmentsPage />;
  if (page === 'leave') return <LeavePage />;
  if (page === 'attendance') return <AttendancePage />;
  if (page === 'performance') return <PerformancePage />;
  if (page === 'reports') return <ReportsPage />;
  if (page === 'notifications') return <NotificationsPage />;
  if (page === 'leaderboard') return <LeaderboardPage />;
  if (page === 'ai') return <AIPage />;
  if (page === 'payslips') return <PayslipsPage />;
  if (page === 'profile') return <ProfilePage />;
  if (page === 'recruitment') return <RecruitmentPage />;
  if (page === 'orgchart') return <OrgChartPage />;
  if (page === 'expenses') return <ExpensesPage />;
  if (page === 'onboarding') return <OnboardingPage />;
  if (page === 'calendar') return <CalendarPage />;
  return <DashboardView />;
}

export default function App() {
  const { currentUser, darkMode, sidebarOpen, authLoading, initAuth } = useStore();
  const [page, setPage] = useState('dashboard');
  const [appView, setAppView] = useState<'landing' | 'login' | 'app'>('landing');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Once user logs in, switch to app view
  useEffect(() => {
    if (currentUser && appView !== 'app') setAppView('app');
    if (!currentUser && appView === 'app') setAppView('landing');
  }, [currentUser]);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1f14 0%, #1a3a22 50%, #0d2b18 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: 500 }}>
          Verifying session...
        </span>
      </div>
    );
  }

  const isAcceptInvitation = window.location.pathname.includes('/accept-invitation') || window.location.search.includes('token=');

  if (isAcceptInvitation && !currentUser) {
    return (
      <>
        <AcceptInvitationPage onGoToLogin={() => {
          window.history.replaceState({}, '', '/');
          setAppView('login');
        }} />
        <ToastContainer />
      </>
    );
  }

  if (appView === 'landing' && !currentUser) {
    return (
      <>
        <LandingPage onGetStarted={() => setAppView('login')} />
        <ToastContainer />
      </>
    );
  }

  if (appView === 'login' || !currentUser) {
    return (
      <>
        <LoginPage onBack={() => setAppView('landing')} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Topbar currentPage={page} onNavigate={setPage} />
        <main className="page-content">
          <div className="page-header">
            <PageHeader page={page} />
          </div>
          <Suspense fallback={<PageLoadingFallback />}>
            <PageContent page={page} />
          </Suspense>
        </main>
      </div>
      <AIChat />
      <ToastContainer />
    </div>
  );
}

const PAGE_META: Record<string, { title: string; desc: string }> = {
  dashboard: { title: 'Dashboard', desc: 'Overview of your HR operations' },
  'developer-dashboard': { title: 'Developer Workspace', desc: 'Interactive task management, personal attendance, and GitHub sync' },
  'teamlead-dashboard': { title: 'Team Lead Workspace', desc: 'Team oversight, task assignment, and progress monitoring' },
  'hr-managers': { title: 'HR Manager Management', desc: 'Admin controls HR managers, assignments and status' },
  employees: { title: 'Employee Management', desc: 'Manage your team and their details' },
  departments: { title: 'Departments', desc: 'Manage organizational structure, department heads, and member rosters' },
  leave: { title: 'Leave Management', desc: 'Track and approve leave requests' },
  attendance: { title: 'Attendance', desc: 'Monitor team attendance and logs' },
  performance: { title: 'Performance', desc: 'Performance reviews and analytics' },
  reports: { title: 'Reports & Analytics', desc: 'Insights and data exports' },
  notifications: { title: 'Notifications', desc: 'Stay updated on important activities' },
  leaderboard: { title: 'Leaderboard', desc: 'Top performers and team rankings' },
  ai: { title: 'AI Insights', desc: 'Smart recommendations powered by AI' },
  payslips: { title: 'Payroll & Payslips', desc: 'View, process and download salary slips and payroll history' },
  profile: { title: 'My Profile', desc: 'Manage your account settings' },
  recruitment: { title: 'Recruitment', desc: 'Manage jobs, candidates and hiring pipeline' },
  orgchart: { title: 'Org Chart', desc: 'Visual company hierarchy and department structure' },
  expenses: { title: 'Expense Claims', desc: 'Submit and approve employee expenses' },
  onboarding: { title: 'Onboarding', desc: 'Track new hire tasks and progress' },
  calendar: { title: 'Calendar', desc: 'Company events, leaves and holidays' },
};

function PageHeader({ page }: { page: string }) {
  const meta = PAGE_META[page] || { title: page, desc: '' };
  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: 2 }}>{meta.title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>{meta.desc}</p>
    </div>
  );
}
