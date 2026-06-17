import React from 'react';
import { Bell, Calendar, Clock, LayoutDashboard, Menu, User } from 'lucide-react';
import { useStore } from '../../services/store';

interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenMenu: () => void;
}

const MOBILE_ITEMS = [
  { label: 'Home', page: 'dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Attendance', page: 'attendance', icon: <Clock size={20} /> },
  { label: 'Leave', page: 'leave', icon: <Calendar size={20} /> },
  { label: 'Profile', page: 'profile', icon: <User size={20} /> },
];

export default function MobileBottomNav({ currentPage, onNavigate, onOpenMenu }: MobileBottomNavProps) {
  const { notifications } = useStore();
  const unread = notifications.filter((n: { read?: boolean; isRead?: boolean }) => !n.read && !n.isRead).length;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {MOBILE_ITEMS.map(item => {
        const active = currentPage === item.page;
        return (
          <button
            key={item.page}
            type="button"
            className={`mobile-bottom-nav-item ${active ? 'active' : ''}`}
            onClick={() => onNavigate(item.page)}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
      <button type="button" className="mobile-bottom-nav-item" onClick={onOpenMenu}>
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <Menu size={20} />
          {unread > 0 && <span className="mobile-bottom-nav-dot" />}
        </span>
        <span>More</span>
      </button>
      {unread > 0 && (
        <button
          type="button"
          className="mobile-bottom-notification"
          onClick={() => onNavigate('notifications')}
          aria-label={`${unread} unread notifications`}
        >
          <Bell size={16} />
          <span>{unread > 9 ? '9+' : unread}</span>
        </button>
      )}
    </nav>
  );
}
