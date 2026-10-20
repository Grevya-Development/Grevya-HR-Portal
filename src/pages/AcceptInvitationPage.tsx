import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ShieldCheck, AlertCircle, CheckCircle2, Lock, Eye, EyeOff,
  User, Mail, Briefcase, Building2, Phone, ArrowRight, RefreshCw
} from 'lucide-react';

interface InvitationDetails {
  id: string;
  email: string;
  full_name: string;
  role: string;
  job_title: string;
  department_name: string;
}

interface AcceptInvitationPageProps {
  onGoToLogin?: () => void;
}

export default function AcceptInvitationPage({ onGoToLogin }: AcceptInvitationPageProps) {
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidationError('No invitation token was found in the link. Please check your invitation email.');
      setLoading(false);
      return;
    }

    validateToken(token);
  }, [token]);

  const validateToken = async (invitationToken: string) => {
    setLoading(true);
    setValidationError(null);
    try {
      const { data, error } = await supabase.rpc('validate_invitation_token', {
        p_token: invitationToken.trim(),
      });

      if (error) {
        setValidationError(error.message || 'Unable to validate invitation.');
        setLoading(false);
        return;
      }

      if (!data || !data.valid) {
        setValidationError(data?.error || 'Invalid or expired invitation link.');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    } catch (err: any) {
      setValidationError(err.message || 'A network error occurred while validating the invitation.');
      setLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    if (onGoToLogin) {
      onGoToLogin();
    } else {
      window.location.href = '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!invitation) return;

    if (!password || password.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please verify.');
      return;
    }

    if (!termsAccepted) {
      setSubmitError('You must acknowledge and accept the Grevya Employee Code of Conduct to proceed.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Sign up user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: invitation.full_name,
            role: invitation.role,
            job_title: invitation.job_title,
            phone: phone.trim() || undefined,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('An account with this email address is already registered. Please sign in directly.');
        }
        throw new Error(authError.message);
      }

      // 2. Mark invitation accepted in database
      const { data: acceptData, error: acceptError } = await supabase.rpc('mark_invitation_accepted', {
        p_token: token.trim(),
      });

      if (acceptError) {
        console.warn('Could not mark invitation accepted:', acceptError);
      }

      // 3. Check if session was created automatically or email confirmation is needed
      if (authData.session) {
        setIsSuccess(true);
        setTimeout(() => {
          handleReturnToLogin();
        }, 2000);
      } else {
        setIsSuccess(true);
        setEmailConfirmationRequired(true);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Account activation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
            G
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Grevya <span className="text-emerald-600 dark:text-emerald-400">HR</span>
          </span>
        </div>
        <h2 className="text-center text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Employee Onboarding
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-zinc-400">
          Activate your official Grevya employee portal account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none sm:rounded-2xl border border-slate-200 dark:border-zinc-800">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Validating your secure invitation token...
              </p>
            </div>
          ) : validationError ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Invitation Invalid or Expired
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 max-w-sm mx-auto">
                  {validationError}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-zinc-700 text-xs font-semibold rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Account Activated Successfully!
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
                  {emailConfirmationRequired
                    ? 'A confirmation link has been sent to your email. Please click it to verify your account, then sign in.'
                    : 'Welcome to the team! Redirecting to your Grevya workspace...'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          ) : invitation ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pre-assigned employee banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  Verified Organization Invitation
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Full Name</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">{invitation.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Work Email</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">{invitation.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Position</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">{invitation.job_title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block text-[10px] uppercase font-bold">Department</span>
                    <span className="font-medium text-slate-800 dark:text-zinc-200">{invitation.department_name}</span>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Password Setup */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Create Your Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Optional Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                  Contact Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Code of Conduct Acknowledgment */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-zinc-400 leading-snug">
                    I agree to the Grevya Information Security Policy and confirm that I will maintain confidentiality of company data and assets.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Activating Account...
                    </>
                  ) : (
                    <>
                      <span>Complete Onboarding & Activate</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
