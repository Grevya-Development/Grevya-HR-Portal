import React, { useState } from 'react';
import { useStore } from '../services/store';
import { CheckCircle2, Circle, Clock, Users, Laptop, FileText, BookOpen, MessageSquare, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '../components/ui/Toast';

interface CheckItem {
  id: string;
  label: string;
  done: boolean;
  dueDay: number;
  assignee: string;
  notes?: string;
}

interface OnboardingEmployee {
  id: string;
  name: string;
  avatar: string;
  department: string;
  position: string;
  startDate: string;
  buddy: string;
  progress: number;
  checklist: CheckItem[];
}

const DEFAULT_CHECKLIST: Omit<CheckItem, 'id' | 'done'>[] = [
  { label: 'Send welcome email with portal credentials', dueDay: 0, assignee: 'HR', notes: 'Include login link and first-day instructions' },
  { label: 'Set up workstation & equipment', dueDay: 1, assignee: 'IT' },
  { label: 'Create company email account', dueDay: 0, assignee: 'IT' },
  { label: 'Add to all relevant Slack channels', dueDay: 1, assignee: 'IT' },
  { label: 'Introduce to team & assign buddy', dueDay: 1, assignee: 'Manager' },
  { label: 'Complete HR policy & compliance forms', dueDay: 2, assignee: 'HR' },
  { label: 'Submit ID & address proof documents', dueDay: 3, assignee: 'Employee' },
  { label: 'Bank account setup for salary', dueDay: 3, assignee: 'HR' },
  { label: 'Complete security & data privacy training', dueDay: 7, assignee: 'IT' },
  { label: 'Department tools & software access', dueDay: 2, assignee: 'IT' },
  { label: 'First 1:1 meeting with manager', dueDay: 5, assignee: 'Manager' },
  { label: 'Set 30-60-90 day goals', dueDay: 7, assignee: 'Manager' },
  { label: 'Complete probation period review', dueDay: 90, assignee: 'HR', notes: 'Schedule formal review at end of 90 days' },
];

const INITIAL_EMPLOYEES: OnboardingEmployee[] = [
  {
    id: 'ob1', name: 'Deepak Sharma', avatar: 'DS', department: 'Engineering', position: 'Full-stack Developer',
    startDate: '2024-04-01', buddy: 'Kiran Patel', progress: 65,
    checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: `c${i}`, done: i < 8 })),
  },
  {
    id: 'ob2', name: 'Lavanya Krishnan', avatar: 'LK', department: 'Design', position: 'UI Designer',
    startDate: '2024-04-08', buddy: 'Priya Sharma', progress: 30,
    checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: `c${i}`, done: i < 4 })),
  },
  {
    id: 'ob3', name: 'Mohit Bansal', avatar: 'MB', department: 'Sales', position: 'Sales Executive',
    startDate: '2024-04-15', buddy: 'Ravi Nair', progress: 0,
    checklist: DEFAULT_CHECKLIST.map((c, i) => ({ ...c, id: `c${i}`, done: false })),
  },
];

const ASSIGNEE_COLORS: Record<string, string> = {
  HR: '#3b82f6', IT: '#22c55e', Manager: '#8b5cf6', Employee: '#f59e0b',
};

const PHASE_ICONS: Record<string, React.ReactNode> = {
  HR: <Users size={13} />, IT: <Laptop size={13} />, Manager: <MessageSquare size={13} />, Employee: <FileText size={13} />,
};

export default function OnboardingPage() {
  const { currentUser } = useStore();
  const isHR = currentUser?.role === 'hr_manager';
  const [employees, setEmployees] = useState<OnboardingEmployee[]>(INITIAL_EMPLOYEES);
  const [selected, setSelected] = useState<string>(INITIAL_EMPLOYEES[0].id);
  const [expanded, setExpanded] = useState<string[]>([]);

  const selectedEmployee = employees.find(e => e.id === selected)!;

  const toggleItem = (empId: string, itemId: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id !== empId) return emp;
      const checklist = emp.checklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c);
      const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);
      const item = checklist.find(c => c.id === itemId)!;
      if (!emp.checklist.find(c => c.id === itemId)!.done) {
        toast.success('Task completed!', item.label);
      }
      return { ...emp, checklist, progress };
    }));
  };

  const phases = ['HR', 'IT', 'Manager', 'Employee'] as const;

  return (
    <div className="animate-fade">
      {/* Summary stats */}
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Active Onboarding</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{INITIAL_EMPLOYEES.length}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Avg Completion</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>
            {Math.round(employees.reduce((s, e) => s + e.progress, 0) / employees.length)}%
          </div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Pending Tasks</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
            {employees.reduce((s, e) => s + e.checklist.filter(c => !c.done).length, 0)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Employee list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => setSelected(emp.id)}
              className="card"
              style={{
                padding: '16px',
                cursor: 'pointer',
                border: selected === emp.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                background: selected === emp.id ? 'var(--primary-subtle)' : 'var(--bg-card)',
                transition: 'all 200ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="avatar avatar-sm">{emp.avatar}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }} className="truncate">{emp.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                </div>
              </div>
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Start: {emp.startDate}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: emp.progress >= 80 ? '#22c55e' : emp.progress >= 50 ? '#f59e0b' : '#3b82f6' }}>{emp.progress}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${emp.progress}%`, background: emp.progress >= 80 ? '#22c55e' : emp.progress >= 50 ? '#f59e0b' : '#3b82f6' }} />
                </div>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {emp.checklist.filter(c => c.done).length}/{emp.checklist.length} tasks · Buddy: {emp.buddy}
              </div>
            </div>
          ))}
        </div>

        {/* Checklist detail */}
        {selectedEmployee && (
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="avatar avatar-lg">{selectedEmployee.avatar}</div>
                <div>
                  <h3 style={{ marginBottom: 2 }}>{selectedEmployee.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedEmployee.position} · {selectedEmployee.department}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Start: {selectedEmployee.startDate} · Buddy: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedEmployee.buddy}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: selectedEmployee.progress >= 80 ? '#22c55e' : '#f59e0b' }}>{selectedEmployee.progress}%</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>complete</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress" style={{ height: 10, marginBottom: 24 }}>
              <div className="progress-bar progress-green" style={{ width: `${selectedEmployee.progress}%` }} />
            </div>

            {/* Checklist by phase */}
            {phases.map(phase => {
              const items = selectedEmployee.checklist.filter(c => c.assignee === phase);
              if (items.length === 0) return null;
              const isExpanded = expanded.includes(`${selected}-${phase}`);
              const doneCt = items.filter(c => c.done).length;
              return (
                <div key={phase} style={{ marginBottom: 16 }}>
                  <button
                    onClick={() => setExpanded(prev =>
                      prev.includes(`${selected}-${phase}`)
                        ? prev.filter(x => x !== `${selected}-${phase}`)
                        : [...prev, `${selected}-${phase}`]
                    )}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', border: 'none', cursor: 'pointer', borderRadius: 10,
                      background: `${ASSIGNEE_COLORS[phase]}10`, fontFamily: 'inherit',
                      transition: 'background 200ms',
                    }}
                  >
                    <span style={{ color: ASSIGNEE_COLORS[phase] }}>{PHASE_ICONS[phase]}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: ASSIGNEE_COLORS[phase], flex: 1, textAlign: 'left' }}>{phase} Tasks</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{doneCt}/{items.length}</span>
                    {isExpanded ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: 6, paddingLeft: 14 }}>
                      {items.map(item => (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(selectedEmployee.id, item.id)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                            opacity: item.done ? 0.6 : 1,
                            transition: 'all 200ms',
                            marginBottom: 4,
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div style={{ marginTop: 1, flexShrink: 0, color: item.done ? '#22c55e' : 'var(--text-muted)' }}>
                            {item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                              {item.label}
                            </div>
                            {item.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.notes}</div>}
                          </div>
                          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            <Clock size={11} /> Day {item.dueDay}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
