import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { Send, Bot, X, Minimize2, MessageSquare } from 'lucide-react';

const MOCK_RESPONSES: Record<string, string> = {
  default: "I'm your HR AI assistant. I can help with leave planning, performance insights, attendance patterns, and team productivity tips. What would you like to know?",
  leave: "Based on your attendance pattern and current workload, I recommend taking leave between April 15-20. The team coverage looks good during that period, and you have 12 days remaining.",
  performance: "Your performance score is trending upward — 91 this month vs 82 three months ago. Key strengths: task completion rate and peer feedback. Area to improve: response time on cross-team requests.",
  burnout: "I notice you've logged 52+ hours this week. Based on historical patterns, this increases burnout risk by 34%. Consider delegating 2-3 tasks and ensuring 8hrs sleep. Would you like help identifying tasks to delegate?",
  attendance: "Your attendance rate is 97% — top 10% in the company! You have a 45-day check-in streak. Keep it up to unlock the 'Streak Master' badge at 90 days.",
  salary: "Your next payslip for March 2024 includes a performance bonus of ₹5,000 based on your Q1 metrics. Total net salary: ₹91,150. It'll be credited by March 31.",
  team: "Your team's productivity index is 88/100. Highlight: Kiran Patel and Vikram Joshi are performing exceptionally. One flag: Arjun Mehta may need workload review — his metrics dipped 12% this sprint.",
  hi: "Hello! Great to see you. How can I assist you with HR matters today? You can ask me about leaves, performance, attendance, payslips, or team insights.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('hi') || lower.includes('hello') || lower.includes('hey')) return MOCK_RESPONSES.hi;
  if (lower.includes('leave') || lower.includes('vacation') || lower.includes('off')) return MOCK_RESPONSES.leave;
  if (lower.includes('performance') || lower.includes('score') || lower.includes('review')) return MOCK_RESPONSES.performance;
  if (lower.includes('burnout') || lower.includes('stress') || lower.includes('overwork')) return MOCK_RESPONSES.burnout;
  if (lower.includes('attendance') || lower.includes('streak') || lower.includes('check')) return MOCK_RESPONSES.attendance;
  if (lower.includes('salary') || lower.includes('payslip') || lower.includes('pay')) return MOCK_RESPONSES.salary;
  if (lower.includes('team') || lower.includes('member') || lower.includes('productivity')) return MOCK_RESPONSES.team;
  return MOCK_RESPONSES.default;
}

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: MOCK_RESPONSES.default, timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    await new Promise(r => setTimeout(r, 1200));
    const reply: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: getResponse(input), timestamp: new Date().toISOString() };
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
