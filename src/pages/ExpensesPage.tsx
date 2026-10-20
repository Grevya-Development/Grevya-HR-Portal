import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/store';
import { Expense } from '../types';
import { Plus, X, Receipt, CheckCircle2, XCircle, Clock, Upload, Download, Eye } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['Travel', 'Food & Entertainment', 'Office Supplies', 'Training', 'Medical', 'Software', 'Other'];

/**
 * Validates that the receipt is either a valid URL format (http/https/file)
 * or a valid local / server path with supported document or image extension.
 */
function isValidReceipt(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed || trimmed.length < 3) return false;

  // 1. Web or file protocol URL
  try {
    const url = new URL(trimmed);
    if (['http:', 'https:', 'file:'].includes(url.protocol)) {
      return true;
    }
  } catch {
    // Continue to check relative or file path formats
  }

  // 2. Domain-based URL without protocol (e.g., www.example.com/receipt.pdf)
  if (/^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return true;
  }

  // 3. Supported file extensions for receipts
  const validExtensionPattern = /\.(pdf|png|jpe?g|webp|gif|svg|doc|docx|txt|csv)$/i;

  // A. Root-relative or relative path starting with / or ./ or ../ (e.g., /receipts/march.pdf)
  if (/^(\/|\.\/|\.\.\/|\\|\.\\|\.\.\\)/.test(trimmed)) {
    return trimmed.length >= 4 && (validExtensionPattern.test(trimmed) || trimmed.includes('/'));
  }

  // B. Windows drive letter path (e.g., C:\receipts\march.pdf or C:/receipts/march.pdf)
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return trimmed.length >= 5;
  }

  // C. Relative filename with a valid file extension (e.g., receipt_march1.pdf)
  if (validExtensionPattern.test(trimmed) && trimmed.length >= 5) {
    return !/[<>:"|?*]/.test(trimmed);
  }

  return false;
}

export default function ExpensesPage() {
  const { currentUser, expenses, fetchExpenses, addExpense, approveExpense, rejectExpense } = useStore();
  const isHRorManager = currentUser?.role !== 'employee';
  const isEmployee = currentUser?.role === 'employee';
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [modal, setModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ exp: Expense; type: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({ category: 'Travel', amount: '', description: '', date: '', receipt: '' });
  const [receiptError, setReceiptError] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Claims list: loaded live from Supabase, already RLS-scoped
  const claims = expenses;

  const filtered = claims.filter(e => tab === 'all' || e.status === tab);

  const counts = {
    all: claims.length,
    pending: claims.filter(e => e.status === 'pending').length,
    approved: claims.filter(e => e.status === 'approved').length,
    rejected: claims.filter(e => e.status === 'rejected').length,
  };

  const totalApproved = claims
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalPending = claims
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalClaims = claims.length;

  const validateReceiptField = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setReceiptError('Receipt URL or file path is required.');
      return false;
    }
    if (!isValidReceipt(trimmed)) {
      setReceiptError('Please enter a valid URL (e.g., https://...) or file path (e.g., /receipts/doc.pdf)');
      return false;
    }
    setReceiptError('');
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      setUploadingReceipt(true);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${currentUser.id}/${Date.now()}_${sanitizedName}`;
      try {
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.warn('Storage upload error, using path reference:', uploadError.message);
          setForm(f => ({ ...f, receipt: `/receipts/${sanitizedName}` }));
        } else {
          setForm(f => ({ ...f, receipt: filePath }));
        }
        setReceiptError('');
        toast.success('Receipt attached', file.name);
      } catch (err: any) {
        console.error('File upload exception:', err);
        setForm(f => ({ ...f, receipt: `/receipts/${sanitizedName}` }));
        setReceiptError('');
      } finally {
        setUploadingReceipt(false);
      }
    }
  };

  const handleViewReceipt = async (receiptPath: string) => {
    if (!receiptPath) return;
    if (receiptPath.startsWith('http://') || receiptPath.startsWith('https://')) {
      window.open(receiptPath, '_blank');
      return;
    }
    if (receiptPath.includes('/') && !receiptPath.startsWith('/receipts/')) {
      try {
        const { data, error } = await supabase.storage.from('receipts').createSignedUrl(receiptPath, 3600);
        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      } catch (err) {
        console.warn('Error fetching signed url:', err);
      }
    }
    toast.info('Receipt Document', receiptPath);
  };

  const handleSubmit = async () => {
    const trimmedReceipt = form.receipt.trim();
    if (!form.description.trim() || !form.amount || !form.date || !trimmedReceipt) {
      if (!trimmedReceipt) {
        setReceiptError('Receipt URL or file path is required.');
      }
      toast.error('Submission Error', 'Please fill all required fields and attach a receipt.');
      return;
    }
    if (Number(form.amount) <= 0) {
      toast.error('Validation Error', 'Amount must be a positive number.');
      return;
    }
    if (!isValidReceipt(trimmedReceipt)) {
      setReceiptError('Please enter a valid URL (e.g., https://...) or file path (e.g., /receipts/doc.pdf)');
      toast.error('Validation Error', 'Invalid receipt URL or file path format.');
      return;
    }

    try {
      await addExpense({
        employeeId: currentUser?.id || '',
        employeeName: currentUser?.name || 'Employee',
        employeeAvatar: currentUser?.avatar || 'EM',
        category: form.category,
        amount: Number(form.amount),
        description: form.description.trim(),
        date: form.date,
        receipt: trimmedReceipt,
      });

      setModal(false);
      setReceiptError('');
      setForm({ category: 'Travel', amount: '', description: '', date: '', receipt: '' });
      if (tab === 'approved' || tab === 'rejected') {
        setTab('all');
      }
      toast.success('Expense submitted!', `₹${Number(form.amount).toLocaleString()} claim sent for approval.`);
    } catch (err: any) {
      toast.error('Submission Failed', err.message || 'Failed to submit expense claim.');
    }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { exp, type } = actionModal;
    try {
      if (type === 'approve') {
        await approveExpense(exp.id, comment);
        toast.success('Expense approved!', `₹${exp.amount.toLocaleString()} claim for ${exp.employeeName} approved.`);
      } else {
        await rejectExpense(exp.id, comment);
        toast.error('Expense rejected', `${exp.employeeName}'s ₹${exp.amount.toLocaleString()} claim rejected.`);
      }
      setActionModal(null);
      setComment('');
    } catch (err: any) {
      toast.error('Decision Failed', err.message || 'Failed to process expense claim.');
    }
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
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{totalClaims}</div>
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
                    {exp.receipt && (
                      <div style={{ marginTop: 4 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '2px 8px', fontSize: '0.68rem', height: 'auto', gap: 4, display: 'inline-flex', alignItems: 'center' }}
                          onClick={() => handleViewReceipt(exp.receipt!)}
                          title="View Receipt"
                        >
                          <Eye size={11} /> View Receipt
                        </button>
                      </div>
                    )}
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
                        exp.employeeId === currentUser?.id ? (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Own Claim</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" title="Approve Claim" onClick={() => setActionModal({ exp, type: 'approve' })}><CheckCircle2 size={12} /></button>
                            <button className="btn btn-danger btn-sm" title="Reject Claim" onClick={() => setActionModal({ exp, type: 'reject' })}><XCircle size={12} /></button>
                          </div>
                        )
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
        <div className="modal-overlay" onClick={() => { setModal(false); setReceiptError(''); }}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Submit Expense Claim</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => { setModal(false); setReceiptError(''); }}><X size={18} /></button>
            </div>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Receipt URL/Path *</label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.72rem', height: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={12} /> Browse File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                  </div>
                  <input
                    className="input"
                    type="text"
                    value={form.receipt}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, receipt: val }));
                      if (receiptError) {
                        if (!val.trim()) {
                          setReceiptError('Receipt URL or file path is required.');
                        } else if (isValidReceipt(val)) {
                          setReceiptError('');
                        }
                      }
                    }}
                    onBlur={e => {
                      if (e.target.value.trim()) {
                        validateReceiptField(e.target.value);
                      }
                    }}
                    placeholder="e.g., https://example.com/receipt.pdf or /receipts/doc.pdf"
                    style={receiptError ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
                  />
                  {receiptError ? (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>⚠️</span> {receiptError}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: 2 }}>
                      Accepts valid web URLs (https://...) or local file paths (.pdf, .png, .jpg, .docx)
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setModal(false); setReceiptError(''); }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!form.description.trim() || !form.amount || !form.date || !form.receipt.trim() || !!receiptError}
              >
                <Receipt size={14} /> Submit Claim
              </button>
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
