import React, { useState } from 'react';
import { useStore } from '../../services/store';
import { UserRole } from '../../types';
import {
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FolderOpen,
  GitBranch,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  Shield,
  Star,
  Sun,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  page: string;
  roles: UserRole[];
}

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  recentPages: string[];
}

const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'];
const HR_ROLES: UserRole[] = ['super_admin', 'admin', 'hr_manager'];
const ADMIN_HR_MANAGER_ROLES: UserRole[] = ['super_admin', 'admin', 'hr_manager', 'manager'];
const DEFAULT_FAVORITES = ['dashboard', 'employees', 'attendance', 'leave'];
const GREVYA_LOGO_SRC = '/brand/grevya-logo.png';

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={18} />, page: 'dashboard', roles: ALL_ROLES },
      { label: 'Employees', icon: <Users size={18} />, page: 'employees', roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Org Chart', icon: <GitBranch size={18} />, page: 'orgchart', roles: ALL_ROLES },
      { label: 'Recruitment', icon: <Briefcase size={18} />, page: 'recruitment', roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Onboarding', icon: <Users size={18} />, page: 'onboarding', roles: ADMIN_HR_MANAGER_ROLES },
    ],
  },
  {
    label: 'HR',
    items: [
      { label: 'Leave Management', icon: <Calendar size={18} />, page: 'leave', roles: ALL_ROLES },
      { label: 'Attendance', icon: <Clock size={18} />, page: 'attendance', roles: ALL_ROLES },
      { label: 'Performance', icon: <BarChart3 size={18} />, page: 'performance', roles: ALL_ROLES },
      { label: 'Expenses', icon: <FileText size={18} />, page: 'expenses', roles: ALL_ROLES },
      { label: 'Calendar', icon: <Calendar size={18} />, page: 'calendar', roles: ALL_ROLES },
      { label: 'Reports', icon: <FileText size={18} />, page: 'reports', roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Payslips', icon: <FileText size={18} />, page: 'payslips', roles: ['super_admin', 'admin', 'hr_manager', 'employee'] as UserRole[] },
      { label: 'Documents', icon: <FolderOpen size={18} />, page: 'documents', roles: ALL_ROLES },
      { label: 'Shifts', icon: <Sun size={18} />, page: 'shifts', roles: ALL_ROLES },
    ],
  },
  {
    label: 'More',
    items: [
      { label: 'Leaderboard', icon: <Trophy size={18} />, page: 'leaderboard', roles: ALL_ROLES },
      { label: 'AI Insights', icon: <Zap size={18} />, page: 'ai', roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Access Requests', icon: <UserCheck size={18} />, page: 'access', roles: HR_ROLES },
      { label: 'Audit Log', icon: <Shield size={18} />, page: 'audit', roles: HR_ROLES },
      { label: 'Compliance', icon: <Shield size={18} />, page: 'compliance', roles: HR_ROLES },
      { label: 'Budget Tracker', icon: <TrendingUp size={18} />, page: 'budget', roles: HR_ROLES },
      { label: 'Notifications', icon: <Bell size={18} />, page: 'notifications', roles: ALL_ROLES },
      { label: 'Profile', icon: <User size={18} />, page: 'profile', roles: ALL_ROLES },
    ],
  },
];

const NAV_ITEMS = NAV_SECTIONS.flatMap(section => section.items);

export default function Sidebar({ currentPage, onNavigate, recentPages }: SidebarProps) {
  const { currentUser, sidebarOpen, toggleSidebar, setSidebarOpen, logout, notifications } = useStore();
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('favoritePages') || 'null');
      return Array.isArray(saved) && saved.length ? saved : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });
  const unread = notifications.filter((n: { read?: boolean; isRead?: boolean }) => !n.read && !n.isRead).length;

  if (!currentUser) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const availableItems = NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));
  const favoriteItems = favorites
    .map(page => availableItems.find(item => item.page === page))
    .filter((item): item is NavItem => Boolean(item));
  const recentItems = recentPages
    .filter(page => page !== currentPage)
    .map(page => availableItems.find(item => item.page === page))
    .filter((item): item is NavItem => Boolean(item))
    .slice(0, 4);

  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.roles.includes(currentUser.role) &&
      (!normalizedQuery || item.label.toLowerCase().includes(normalizedQuery))
    ),
  })).filter(section => section.items.length > 0);

  const toggleFavorite = (page: string) => {
    setFavorites(prev => {
      const next = prev.includes(page)
        ? prev.filter(item => item !== page)
        : [page, ...prev].slice(0, 8);
      localStorage.setItem('favoritePages', JSON.stringify(next));
      return next;
    });
  };

  const ROLE_MAP: Record<string, string> = {
    super_admin: 'Founder',
    admin: 'Administrator',
    hr_manager: 'HR Manager',
    manager: 'Manager',
    employee: 'Employee',
  };
  const roleLabel = ROLE_MAP[currentUser.role] || currentUser.role;

  return (
    <>
      <aside
        className={`layout-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}
        style={{
          width: sidebarOpen ? 'var(--sidebar-w)' : '72px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'var(--bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 230,
          transition: 'width 200ms cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            padding: sidebarOpen ? '20px 16px 20px' : '20px 12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            transition: 'background 200ms',
            minHeight: 72,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <img
            src={GREVYA_LOGO_SRC}
            alt="Grevya logo"
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              objectFit: 'contain',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(34,197,94,0.22)',
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          />

          {sidebarOpen && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.94rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Grevya HR
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <span style={{ color: 'rgba(255,255,255,0.42)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 88 }}>{currentUser.name}</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                <span style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {roleLabel}
                </span>
              </div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div style={{ padding: '12px 12px 4px' }}>
            <div
              className="sidebar-search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.54)',
              }}
            >
              <Search size={14} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search modules"
                aria-label="Search modules"
                style={{
                  width: '100%',
                  minWidth: 0,
                  border: 0,
                  outline: 0,
                  background: 'transparent',
                  color: 'white',
                  font: 'inherit',
                  fontSize: '0.8rem',
                }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear module search"
                  onClick={() => setQuery('')}
                  style={{ border: 0, background: 'transparent', color: 'rgba(255,255,255,0.48)', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
          {sidebarOpen && !normalizedQuery && favoriteItems.length > 0 && (
            <NavGroup
              label="Favorites"
              icon={<Star size={12} />}
              items={favoriteItems}
              currentPage={currentPage}
              sidebarOpen={sidebarOpen}
              unread={unread}
              favorites={favorites}
              onNavigate={onNavigate}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {sidebarOpen && !normalizedQuery && recentItems.length > 0 && (
            <NavGroup
              label="Recent"
              icon={<History size={12} />}
              items={recentItems}
              currentPage={currentPage}
              sidebarOpen={sidebarOpen}
              unread={unread}
              favorites={favorites}
              onNavigate={onNavigate}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {visibleSections.map(section => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {sidebarOpen && (
                <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 4px' }}>
                  {section.label}
                </div>
              )}
              {section.items.map(item => (
                <NavItemButton
                  key={item.page}
                  item={item}
                  isActive={currentPage === item.page}
                  sidebarOpen={sidebarOpen}
                  badgeCount={item.page === 'notifications' ? unread : 0}
                  isFavorite={favorites.includes(item.page)}
                  onNavigate={onNavigate}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ))}

          {sidebarOpen && normalizedQuery && visibleSections.length === 0 && (
            <div style={{ padding: '24px 14px', color: 'rgba(255,255,255,0.42)', fontSize: '0.82rem', textAlign: 'center' }}>
              No modules found for "{query}"
            </div>
          )}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => logout()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: sidebarOpen ? '10px 12px' : '10px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              transition: 'all 200ms',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <LogOut size={18} />
            {sidebarOpen && <span style={{ fontSize: '0.875rem' }}>Logout</span>}
          </button>
        </div>

        <button
          onClick={toggleSidebar}
          className="sidebar-collapse-toggle"
          style={{
            position: 'absolute',
            top: 22,
            right: -12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 200ms',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>
      </aside>
      {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}

function NavGroup({
  label,
  icon,
  items,
  currentPage,
  sidebarOpen,
  unread,
  favorites,
  onNavigate,
  onToggleFavorite,
}: {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  currentPage: string;
  sidebarOpen: boolean;
  unread: number;
  favorites: string[];
  onNavigate: (page: string) => void;
  onToggleFavorite: (page: string) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ color: 'rgba(255,255,255,0.26)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        {label}
      </div>
      {items.map(item => (
        <NavItemButton
          key={`${label}-${item.page}`}
          item={item}
          isActive={currentPage === item.page}
          sidebarOpen={sidebarOpen}
          badgeCount={item.page === 'notifications' ? unread : 0}
          isFavorite={favorites.includes(item.page)}
          onNavigate={onNavigate}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}

function NavItemButton({
  item,
  isActive,
  sidebarOpen,
  badgeCount,
  isFavorite,
  onNavigate,
  onToggleFavorite,
}: {
  item: NavItem;
  isActive: boolean;
  sidebarOpen: boolean;
  badgeCount: number;
  isFavorite: boolean;
  onNavigate: (page: string) => void;
  onToggleFavorite: (page: string) => void;
}) {
  const rowColor = isActive ? '#4ade80' : 'rgba(255,255,255,0.5)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 1,
        borderRadius: 10,
        background: isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
      }}
      onMouseLeave={e => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 20, background: '#4ade80', borderRadius: '0 4px 4px 0',
        }} />
      )}
      <button
        aria-label={item.label}
        title={item.label}
        onClick={() => onNavigate(item.page)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
          padding: sidebarOpen ? '9px 10px 9px 12px' : '10px',
          borderRadius: 10,
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          color: rowColor,
          transition: 'all 200ms',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
        {sidebarOpen && (
          <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>
            {item.label}
          </span>
        )}
        {sidebarOpen && badgeCount > 0 && (
          <span style={{ background: '#ef4444', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
            {badgeCount}
          </span>
        )}
        {!sidebarOpen && badgeCount > 0 && (
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
        )}
      </button>
      {sidebarOpen && (
        <button
          type="button"
          aria-label={isFavorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
          title={isFavorite ? 'Remove favorite' : 'Add favorite'}
          onClick={() => onToggleFavorite(item.page)}
          style={{
            width: 28,
            height: 28,
            marginRight: 5,
            border: 0,
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isFavorite ? 'rgba(250,204,21,0.14)' : 'transparent',
            color: isFavorite ? '#facc15' : 'rgba(255,255,255,0.24)',
          }}
        >
          <Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
}
