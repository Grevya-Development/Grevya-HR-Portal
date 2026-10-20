import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { Send, Bot, X, Minimize2, MessageSquare } from 'lucide-react';
import { useStore } from '../../services/store';

function generateLiveResponse(
  input: string,
  state: {
    currentUser: any;
    leaveBalances: any[];
    leaveRequests: any[];
    todayAttendance: any;
    attendanceRecords: any[];
    tasks: any[];
    payrollRecords: any[];
    employees: any[];
    departments: any[];
  }
): string {
  const lower = input.toLowerCase();
  const {
    currentUser,
    leaveBalances,
    leaveRequests,
    todayAttendance,
    attendanceRecords,
    tasks,
    payrollRecords,
    employees,
    departments,
  } = state;

  const userName = currentUser?.name?.split(' ')[0] || 'there';

  // 1. GREETING
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) {
    return `Hello ${userName}! I'm your Grevya HR assistant. How can I assist you with your leaves, attendance, tasks, payslips, or team today?`;
  }

  // 2. LEAVE
  if (lower.includes('leave') || lower.includes('vacation') || lower.includes('off') || lower.includes('holiday')) {
    const totalRemaining = leaveBalances.reduce((sum, b) => sum + (Number(b.remainingDays) || 0), 0);
    const breakdown = leaveBalances.length > 0
      ? leaveBalances.map(b => `${b.leaveTypeName || 'Leave'}: ${b.remainingDays ?? 0}d`).join(', ')
      : 'standard policy';
    const pendingCount = leaveRequests.filter(l => l.status === 'pending').length;

    if (leaveBalances.length > 0) {
      return `You have ${totalRemaining} total days of leave remaining (${breakdown}). You have ${pendingCount} pending leave request(s) awaiting approval. You can apply for leave directly from the Leave Management page.`;
    }
    return `You have ${leaveRequests.length} leave record(s) on file and ${pendingCount} pending request(s). Check the Leave tab for complete balance breakdowns.`;
  }

  // 3. PERFORMANCE & TASKS
  if (lower.includes('performance') || lower.includes('score') || lower.includes('review') || lower.includes('metric')) {
    const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id || t.assignedTo === currentUser?.name);
    const completed = myTasks.filter(t => t.status === 'completed');
    const rate = myTasks.length > 0 ? Math.round((completed.length / myTasks.length) * 100) : 100;

    return `Performance snapshot for ${currentUser?.name || 'your profile'}: Task completion rate is ${rate}% (${completed.length}/${myTasks.length} assigned tasks finished). Department: ${currentUser?.department || 'Operations'}. Maintain your streak and timely task completion to rank high on the team leaderboard!`;
  }

  // 4. BURNOUT & WORKLOAD
  if (lower.includes('burnout') || lower.includes('stress') || lower.includes('overwork') || lower.includes('workload')) {
    const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id || t.assignedTo === currentUser?.name);
    const openTasks = myTasks.filter(t => t.status !== 'completed');
    const urgentTasks = openTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

    return `Workload pulse check: You currently have ${openTasks.length} open task(s), with ${urgentTasks.length} marked high or urgent priority. Today's attendance status: ${todayAttendance?.status?.replace('_', ' ') || 'not clocked in'}. Make sure to take regular breaks, log your lunch hours, and discuss task prioritization with your manager if feeling overwhelmed.`;
  }

  // 5. ATTENDANCE
  if (lower.includes('attendance') || lower.includes('streak') || lower.includes('check') || lower.includes('clock')) {
    const statusText = todayAttendance?.status ? todayAttendance.status.replace('_', ' ').toUpperCase() : 'NOT CLOCKED IN';
    const clockInInfo = todayAttendance?.clockInTime
      ? ` (Clocked in at ${new Date(todayAttendance.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
      : '';
    const myAttendanceCount = attendanceRecords.filter(a => a.employeeId === currentUser?.id).length;

    return `Today's attendance status: ${statusText}${clockInInfo}. You have ${myAttendanceCount} attendance log entries recorded in Grevya. Don't forget that photo verification and GPS location are required for valid clock-ins.`;
  }

  // 6. SALARY / PAYSLIP
  if (lower.includes('salary') || lower.includes('payslip') || lower.includes('pay') || lower.includes('bonus')) {
    const myPayslips = payrollRecords.filter(p => p.employeeId === currentUser?.id);
    if (myPayslips.length > 0) {
      const latest = myPayslips[0];
      return `Your latest recorded payslip is for ${latest.month} ${latest.year}. Net pay: ₹${Number(latest.netSalary || 0).toLocaleString('en-IN')}. Status: Paid. You can view itemized breakdowns and download slips in the Payslips tab.`;
    }
    return `Payroll runs are processed on a monthly cycle by HR. Once your monthly attendance is locked, your official payslip will be generated and available under your profile payslips section.`;
  }

  // 7. TEAM
  if (lower.includes('team') || lower.includes('member') || lower.includes('productivity') || lower.includes('department')) {
    const deptEmployees = employees.filter(e => e.department === currentUser?.department);
    const isLeadership = ['super_admin', 'admin', 'hr_manager', 'manager', 'team_lead'].includes(currentUser?.role || '');

    if (isLeadership) {
      return `Organization summary: Grevya has ${employees.length} registered employees across ${departments.length} departments. Department '${currentUser?.department || 'Operations'}' has ${deptEmployees.length} members. You can review attendance trends and team tasks from your leadership dashboard.`;
    }
    return `Your team: You are part of the '${currentUser?.department || 'Operations'}' department, which has ${deptEmployees.length} registered member(s). You can explore full reporting lines in the Organization Chart.`;
  }

  // DEFAULT
  return `I'm your Grevya HR AI assistant for ${currentUser?.name || 'you'}. I can provide live updates on your leave balances, today's attendance status, task progress, team structure, and payslips. What would you like to check?`;
}

export default function AIChat() {
  const {
    currentUser,
    leaveBalances,
    leaveRequests,
    todayAttendance,
    attendanceRecords,
    tasks,
    payrollRecords,
    employees,
    departments,
  } = useStore();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const getContextState = () => ({
    currentUser,
    leaveBalances,
    leaveRequests,
    todayAttendance,
    attendanceRecords,
    tasks,
    payrollRecords,
    employees,
    departments,
  });

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = generateLiveResponse('', getContextState());
      setMessages([{ id: '0', role: 'assistant', content: greeting, timestamp: new Date().toISOString() }]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    const currentInput = input;
    setInput('');
    setTyping(true);
    await new Promise(r => setTimeout(r, 600));
    const replyContent = generateLiveResponse(currentInput, getContextState());
    const reply: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: replyContent, timestamp: new Date().toISOString() };
    setMessages(m => [...m, reply]);
    setTyping(false);
  };

  const QUICK_PROMPTS = ['Plan my leave', 'My performance score', 'Team productivity', 'Burnout check'];

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34,197,94,0.45)',
            zIndex: 500,
            transition: 'transform 200ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <MessageSquare size={22} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 360,
          height: minimized ? 56 : 520,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: 'var(--shadow-xl)',
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'height 300ms cubic-bezier(.4,0,.2,1)',
          animation: 'scaleIn 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>Grevya AI</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>HR Assistant · Online</div>
            </div>
            <button onClick={() => setMinimized(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 4 }}>
              <Minimize2 size={14} />
            </button>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 4 }}>
              <X size={14} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}>
                    {msg.role === 'assistant' && (
                      <div style={{ width: 24, height: 24, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2 }}>
                        <Bot size={12} color="#16a34a" />
                      </div>
                    )}
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg)',
                      color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                      fontSize: '0.8rem',
                      lineHeight: 1.55,
                      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={12} color="#16a34a" />
                    </div>
                    <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'var(--bg)', borderRadius: '14px 14px 14px 4px', border: '1px solid var(--border)' }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setInput(p); }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#22c55e'; (e.currentTarget as HTMLElement).style.color = '#22c55e'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding: '8px 12px 14px', display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ask me anything..."
                  style={{ height: 40, fontSize: '0.8rem', borderRadius: 12 }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || typing}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: input.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--border)',
                    color: 'white',
                    border: 'none',
                    cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms',
                    flexShrink: 0,
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
