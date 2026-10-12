import React, { useState, useEffect } from 'react';
import { useStore } from '../../services/store';
import { Bell, Sun, Moon, Search, Menu, ChevronDown } from 'lucide-react';
import GlobalSearch from '../ui/GlobalSearch';

interface TopbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'hr-managers': 'HR Manager Management',
  employees: 'Employee Management',
  leave: 'Leave Management',
  attendance: 'Attendance',
  performance: 'Performance',
  reports: 'Reports & Analytics',
  payslips: 'Payslips',
  leaderboard: 'Leaderboard',
  ai: 'AI Insights',
  notifications: 'Notifications',
  profile: 'Profile',
  recruitment: 'Recruitment Pipeline',
  orgchart: 'Org Chart',
};

export default function Topbar({ currentPage, onNavigate }: TopbarProps) {
  const { currentUser, darkMode, toggleDarkMode, toggleSidebar, notifications } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header style={{
      height: 'var(--header-h)',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 20,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Mobile menu */}
      <button className="btn btn-ghost btn-icon" onClick={toggleSidebar} style={{ display: 'none' }}>
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div style={{ flexShrink: 0, minWidth: 'max-content' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
          {PAGE_TITLES[currentPage] || 'Dashboard'}
        </h2>
      </div>

      {/* Search */}
      <div 
        className="search-wrap topbar-search" 
        style={{
          flex: 1,
          maxWidth: 480,
          minWidth: 260,
          height: 38,
          padding: '0 14px 0 38px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          transition: 'all 200ms ease',
        }}
        onClick={() => setSearchOpen(true)}
      >
        <Search size={15} style={{ position: 'absolute', left: 12, color: 'var(--text-muted)', pointerEvents: 'none', flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Search global...
        </div>
        <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--border-light)', border: '1px solid var(--border)', fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>
          Ctrl+K
        </kbd>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleDarkMode}
          style={{ position: 'relative', flexShrink: 0 }}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="btn btn-ghost btn-icon"
          onClick={() => onNavigate('notifications')}
          style={{ position: 'relative', flexShrink: 0 }}
        >
          <Bell size={18} />
          {unread > 0 && (
            <span style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              fontSize: '0.6rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {unread}
            </span>
          )}
        </button>

        {/* User menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            className="topbar-profile-btn"
            onClick={() => setShowUserMenu(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px 6px 10px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              cursor: 'pointer',
              transition: 'all 200ms',
              flexShrink: 0,
              overflow: 'visible',
            }}
          >
            <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{currentUser?.avatar}</div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                {currentUser?.name.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {currentUser?.role === 'admin' ? 'Admin' : currentUser?.role === 'hr_manager' ? 'HR Manager' : currentUser?.role === 'manager' ? 'Manager' : 'Employee'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 2 }} />
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: 'var(--shadow-xl)',
              padding: '8px',
              minWidth: 180,
              zIndex: 200,
              animation: 'scaleIn 0.15s ease',
            }}>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 8 }}
                onClick={() => { onNavigate('profile'); setShowUserMenu(false); }}
              >
                View Profile
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 8 }}
                onClick={() => { onNavigate('notifications'); setShowUserMenu(false); }}
              >
                Notifications
              </button>
              <div className="divider" style={{ margin: '6px 0' }} />
              <button
                className="btn"
                style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 8, background: '#fee2e2', color: '#dc2626' }}
                onClick={() => { useStore.getState().logout(); setShowUserMenu(false); }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Global Search Component */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={onNavigate} />
    </header>
  );
}
