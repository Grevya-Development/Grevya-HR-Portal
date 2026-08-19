import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Plus, X, Receipt, CheckCircle2, XCircle, Clock, Upload, Download } from 'lucide-react';
import { toast } from '../components/ui/Toast';

interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt?: string;
  submittedOn: string;
  approvedBy?: string;
  comments?: string;
}

const CATEGORIES = ['Travel', 'Food & Entertainment', 'Office Supplies', 'Training', 'Medical', 'Software', 'Other'];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'ex1', employeeId: 'e1', employeeName: 'Kiran Patel', employeeAvatar: 'KP', category: 'Travel', amount: 4500, description: 'Cab to client office (Whitefield)', date: '2024-03-15', status: 'approved', submittedOn: '2024-03-16', approvedBy: 'Divya Kumar', receipt: 'receipt_march1.pdf' },
  { id: 'ex2', employeeId: 'e5', employeeName: 'Arjun Mehta', employeeAvatar: 'AM', category: 'Software', amount: 2999, description: 'JetBrains IDE annual subscription', date: '2024-03-10', status: 'pending', submittedOn: '2024-03-12' },
  { id: 'ex3', employeeId: 'e2', employeeName: 'Sneha Rao', employeeAvatar: 'SR', category: 'Training', amount: 8000, description: 'Content strategy certification course', date: '2024-03-08', status: 'approved', submittedOn: '2024-03-09', approvedBy: 'Ravi Nair' },
  { id: 'ex4', employeeId: 'e8', employeeName: 'Ananya Singh', employeeAvatar: 'AS', category: 'Food & Entertainment', amount: 3200, description: 'Team lunch with clients', date: '2024-03-20', status: 'pending', submittedOn: '2024-03-21' },
  { id: 'ex5', employeeId: 'e9', employeeName: 'Vikram Joshi', employeeAvatar: 'VJ', category: 'Office Supplies', amount: 1450, description: 'USB-C hub and cables', date: '2024-03-05', status: 'rejected', submittedOn: '2024-03-06', approvedBy: 'Divya Kumar', comments: 'Use company procurement portal for hardware.' },
  { id: 'ex6', employeeId: 'e7', employeeName: 'Rahul Gupta', employeeAvatar: 'RG', category: 'Travel', amount: 12000, description: 'Flight to Delhi for client meeting', date: '2024-03-25', status: 'pending', submittedOn: '2024-03-26' },
];

export default function ExpensesPage() {
  const { currentUser } = useStore();
  const isHRorManager = currentUser?.role !== 'employee';
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [modal, setModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ exp: Expense; type: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({ category: 'Travel', amount: '', description: '', date: '', receipt: '' });

  const filtered = expenses
    .filter(e => tab === 'all' || e.status === tab)
    .filter(e => currentUser?.role === 'employee' ? e.employeeId === 'e1' : true);

  const counts = {
    all: filtered.length,
    pending: filtered.filter(e => e.status === 'pending').length,
    approved: filtered.filter(e => e.status === 'approved').length,
    rejected: filtered.filter(e => e.status === 'rejected').length,
  };

  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  const handleSubmit = () => {
    if (!form.description || !form.amount || !form.date || !form.receipt) {
      toast.error('Submission Error', 'Please fill all required fields and attach a receipt.');
      return;
    }
    if (Number(form.amount) <= 0) {
      toast.error('Validation Error', 'Amount must be a positive number.');
      return;
    }
    const newExp: Expense = {
      id: `ex${Date.now()}`,
      employeeId: currentUser?.id || 'e1',
      employeeName: currentUser?.name || 'Kiran Patel',
      employeeAvatar: currentUser?.avatar || 'KP',
      category: form.category,
      amount: Number(form.amount),
      description: form.description,
      date: form.date,
      status: 'pending',
      receipt: form.receipt,
      submittedOn: new Date().toISOString().split('T')[0],
    };
    setExpenses(prev => [newExp, ...prev]);
    setModal(false);
    setForm({ category: 'Travel', amount: '', description: '', date: '', receipt: '' });
    toast.success('Expense submitted!', `₹${Number(form.amount).toLocaleString()} claim sent for approval.`);
  };

  const handleAction = () => {
    if (!actionModal) return;
    const { exp, type } = actionModal;
    setExpenses(prev => prev.map(e => e.id === exp.id
      ? { ...e, status: type === 'approve' ? 'approved' : 'rejected', approvedBy: currentUser?.name, comments: comment }
      : e
    ));
    if (type === 'approve') toast.success('Expense approved!', `₹${exp.amount.toLocaleString()} claim for ${exp.employeeName} approved.`);
    else toast.error('Expense rejected', `${exp.employeeName}'s ₹${exp.amount.toLocaleString()} claim rejected.`);
    setActionModal(null);
    setComment('');
  };

  const statusBadge = (s: string) => s === 'approved' ? 'badge-green' : s === 'rejected' ? 'badge-red' : 'badge-yellow';
  const catColor: Record<string, string> = {
    'Travel': '#3b82f6', 'Food & Entertainment': '#f59e0b', 'Office Supplies': '#22c55e',
    'Training': '#8b5cf6', 'Medical': '#ef4444', 'Software': '#06b6d4', 'Other': '#94a3b8',
  };

  return (
    <div className="animate-fade">
      {/* Stats */}
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Approved</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>₹{totalApproved.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Pending Claims</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>₹{totalPending.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Claims</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{expenses.length}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="filter-row">
        <div className="tab-nav" style={{ marginBottom: 0, borderBottom: 'none', flex: 1 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{ marginLeft: 6, background: tab === t ? 'var(--primary)' : 'var(--border)', color: tab === t ? 'white' : 'var(--text-muted)', borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 600 }}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Submit Claim
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isHRorManager && <th>Employee</th>}
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Submitted</th>
                <th>Status</th>
                {isHRorManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(exp => (
                <tr key={exp.id}>
                  {isHRorManager && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{exp.employeeAvatar}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{exp.employeeName}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                      background: `${catColor[exp.category] || '#94a3b8'}15`,
                      color: catColor[exp.category] || '#94a3b8',
                    }}>
                      <Receipt size={11} /> {exp.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>
                    <div className="truncate">{exp.description}</div>
                    {exp.comments && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>Note: {exp.comments}</div>}
                  </td>
                  <td style={{ fontWeight: 700, fontSize: '0.95rem', color: exp.status === 'approved' ? '#22c55e' : exp.status === 'rejected' ? '#dc2626' : 'var(--text-primary)' }}>
                    ₹{exp.amount.toLocaleString()}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{exp.date}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.submittedOn}</td>
                  <td>
                    <span className={`badge ${statusBadge(exp.status)}`} style={{ fontSize: '0.7rem' }}>{exp.status}</span>
                    {exp.approvedBy && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>by {exp.approvedBy}</div>}
                  </td>
                  {isHRorManager && (
                    <td>
                      {exp.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setActionModal({ exp, type: 'approve' })}><CheckCircle2 size={12} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ exp, type: 'reject' })}><XCircle size={12} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state"><Receipt size={32} /><h3>No claims</h3><p>No expense claims in this category.</p></div>
          )}
        </div>
      </div>

      {/* Submit modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Submit Expense Claim</h3><button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Expense Date *</label>
                  <input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of expense..." rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Receipt URL/Path *</label>
                  <input className="input" type="text" value={form.receipt} onChange={e => setForm(f => ({ ...f, receipt: e.target.value }))} placeholder="e.g., /receipts/my_receipt.pdf" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.description || !form.amount || !form.date}><Receipt size={14} /> Submit Claim</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionModal.type === 'approve' ? '✅ Approve Expense' : '❌ Reject Expense'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setActionModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{actionModal.exp.employeeName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{actionModal.exp.category} · ₹{actionModal.exp.amount.toLocaleString()} · {actionModal.exp.date}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{actionModal.exp.description}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note..." rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button className={`btn ${actionModal.type === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={handleAction}>
                {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
