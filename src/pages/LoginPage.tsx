import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import brandLogo from '../brandimage/icon-192.png';
import { UserRole } from '../types';
import { isPermittedGrevyaEmail, EMAIL_POLICY_MESSAGE } from '../utils/emailValidation';

interface LoginPageProps {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const { login, register, authError, clearAuthError, departments, fetchDepartments } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<'employee' | 'manager'>('employee');
  const [regPosition, setRegPosition] = useState('Developer');
  const [regDepartmentId, setRegDepartmentId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  React.useEffect(() => {
    if (departments.length === 0) {
      fetchDepartments();
    }
  }, []);

  React.useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    clearAuthError();
    setLoading(true);
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials. Please check your email and password.');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRegSuccess('');

    if (!isPermittedGrevyaEmail(regEmail)) {
      setError(EMAIL_POLICY_MESSAGE);
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);
    const res = await register({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole as UserRole,
      position: regPosition,
      departmentId: regDepartmentId || undefined,
      phone: regPhone,
    });

    if (!res.success) {
      setError(res.error || 'Registration failed. Please try again.');
    } else {
      setRegSuccess('Your account registration has been submitted successfully! Your account is pending HR approval. You will be able to log in once an administrator approves your profile.');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegPhone('');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1f14 0%, #1a3a22 50%, #0d2b18 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* BG circles */}
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          borderRadius: '50%',
          background: `rgba(34,197,94,${0.03 + i * 0.02})`,
          width: `${300 + i * 200}px`,
          height: `${300 + i * 200}px`,
          top: `${-50 + i * 100}px`,
          right: `${-100 + i * 50}px`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Back to landing */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 32,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.75)', borderRadius: 10,
            padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.8rem', fontWeight: 500, transition: 'all 200ms', backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      )}

      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {/* Left panel */}
        <div style={{
          background: 'linear-gradient(160deg, #1a4a28 0%, #0f2b18 100%)',
          padding: '56px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
                overflow: 'hidden',
              }}>
                <img src={brandLogo} alt="Grevya logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Grevya</span>
            </div>

            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
              Your people.<br />
              <span style={{ color: '#4ade80' }}>Powered by AI.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Modern HR management built for high-growth e-commerce teams. Smart insights, seamless workflows.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              '🤖 AI-powered burnout detection',
              '📊 Real-time performance analytics',
              '🎮 Gamified employee engagement',
              '📱 Mobile-first design',
            ].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Form */}
        <div style={{ background: '#ffffff', padding: '48px 44px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>
          {/* Mode Switch Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setRegSuccess(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#0f172a' : '#64748b',
                fontWeight: mode === 'login' ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: mode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms',
              }}
            >
              <LogIn size={14} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setRegSuccess(''); }}
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: mode === 'register' ? '#ffffff' : 'transparent',
                color: mode === 'register' ? '#0f172a' : '#64748b',
                fontWeight: mode === 'register' ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: mode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms',
              }}
            >
              <UserPlus size={14} /> Register Account
            </button>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              {mode === 'login' ? 'Welcome back' : 'Create your employee profile'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.825rem' }}>
              {mode === 'login' ? 'Access your Grevya HR Portal dashboard' : 'Join Grevya HR Portal. New accounts require HR review.'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.82rem' }}>{error}</span>
            </div>
          )}

          {regSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '0.82rem' }}>{regSuccess}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Email Address</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@grevya.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ marginTop: 8, justifyContent: 'center', fontSize: '0.9rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Signing in...
                  </>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name *</label>
                <input
                  className="input"
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="e.g. Rohith Kumar"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Official Email Address (@grevya.com or *.grevya@gmail.com) *</label>
                <input
                  className="input"
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="name@grevya.com or name.grevya@gmail.com"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Role *</label>
                  <select
                    className="input"
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as any)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager / Team Lead</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Department</label>
                  <select
                    className="input"
                    value={regDepartmentId}
                    onChange={e => setRegDepartmentId(e.target.value)}
                  >
                    <option value="">Select department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Job Title / Position *</label>
                  <input
                    className="input"
                    type="text"
                    value={regPosition}
                    onChange={e => setRegPosition(e.target.value)}
                    placeholder="e.g. Developer, QA Engineer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Phone Number</label>
                  <input
                    className="input"
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Password *</label>
                  <input
                    className="input"
                    type="password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Confirm Password *</label>
                  <input
                    className="input"
                    type="password"
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ marginTop: 6, justifyContent: 'center', fontSize: '0.9rem' }}
              >
                {loading ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Submitting registration...
                  </>
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
