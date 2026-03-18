import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ThemeToggle from '../components/ThemeToggle';
import { RiArrowLeftLine, RiArrowRightSLine, RiErrorWarningLine, RiCheckboxCircleLine } from 'react-icons/ri';

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.full_name.trim() } },
      });
      if (authErr) throw authErr;
      setSuccess('Account created. Check your email to confirm, then sign in.');
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <Link to="/" style={S.logo}>
          Meet<span style={{ color: 'var(--accent)' }}>IQ</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="auth-wrap" style={S.wrap}>
        {/* Brand panel */}
        <div className="brand-panel" style={S.brandPanel}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F59E0B, #D97706, transparent)' }} />
          <div style={S.brandLogo}>Meet<span style={{ color: '#FBBF24' }}>IQ</span></div>
          <h2 style={S.brandH2}>Start capturing<br />meeting intelligence.</h2>
          <p style={S.brandBody}>
            Create your free account and get instant access to AI-powered
            transcription, summarisation, and reporting.
          </p>
          <div style={S.brandFeatures}>
            {['Free forever plan', 'No credit card required', 'Private & secure storage'].map(f => (
              <div key={f} style={S.brandFeatureRow}>
                <div style={S.brandFeatureDot} />
                <span style={{ fontSize: 13, color: 'rgba(229,231,235,0.8)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="form-wrap" style={S.formWrap}>
          <div className="auth-card" style={S.card}>
            <div
              onClick={() => navigate('/')}
              style={S.backBtn}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-t)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; }}
            >
              <RiArrowLeftLine size={16} style={{ marginRight: 5 }} />
              Back
            </div>
            <div style={S.cardHead}>
              <h1 style={S.title}>Create account</h1>
              <p style={S.sub}>Fill in your details to get started for free.</p>
            </div>

            {error && (
              <div style={S.errorBox}>
                <RiErrorWarningLine size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}
            {success && (
              <div style={S.successBox}>
                <RiCheckboxCircleLine size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={S.form}>
              <div>
                <label className="input-label">Full name</label>
                <input className="input" type="text" value={form.full_name} onChange={set('full_name')} placeholder="Jane Smith" required />
              </div>
              <div>
                <label className="input-label">Email address</label>
                <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" required />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 6 characters" required />
              </div>
              <div>
                <label className="input-label">Confirm password</label>
                <input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 6, gap: 6 }}>
                {loading
                  ? 'Creating account…'
                  : <>Create account <RiArrowRightSLine size={16} /></>
                }
              </button>
            </form>

            <p style={S.foot}>
              Already have an account?{' '}
              <Link to="/login" style={S.link}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' },
  topBar: {
    height: 58, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 28px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
  },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 800,
    letterSpacing: '-0.04em', color: 'var(--text)', textDecoration: 'none',
  },
  wrap: {
    flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
    marginTop: 58, minHeight: 'calc(100vh - 58px)',
  },
  brandPanel: {
    background: 'linear-gradient(145deg, #111827 0%, #0F172A 50%, #1a2236 100%)',
    padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    position: 'relative', overflow: 'hidden', borderRight: '1px solid var(--border)',
  },
  brandLogo: {
    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800,
    letterSpacing: '-0.04em', color: '#E5E7EB', marginBottom: 40,
  },
  brandH2: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,34px)',
    fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.03em',
    color: '#F9FAFB', marginBottom: 18,
  },
  brandBody: { fontSize: 14.5, color: 'rgba(229,231,235,0.65)', lineHeight: 1.75, marginBottom: 38 },
  brandFeatures: { display: 'flex', flexDirection: 'column', gap: 12 },
  brandFeatureRow: { display: 'flex', gap: 10, alignItems: 'center' },
  brandFeatureDot: { width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 },
  formWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 28px', background: 'var(--bg)',
  },
  card: {
    width: '100%', maxWidth: 400,
    background: 'var(--card)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-xl)', padding: '32px 28px',
    boxShadow: 'var(--shadow-lg)',
  },
  backBtn: {
    display: 'flex', alignItems: 'center', cursor: 'pointer',
    marginBottom: 16, color: 'var(--text3)', fontSize: 13,
    transition: 'color 0.15s', fontWeight: 500,
  },
  cardHead: { marginBottom: 24 },
  title: {
    fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 700,
    letterSpacing: '-0.03em', color: 'var(--text)', marginBottom: 6,
  },
  sub: { color: 'var(--text2)', fontSize: 13.5, lineHeight: 1.5 },
  errorBox: {
    display: 'flex', gap: 7, alignItems: 'flex-start',
    background: 'var(--danger-s)', border: '1px solid rgba(239,68,68,0.18)',
    borderRadius: 6, padding: '9px 12px', color: 'var(--danger)', fontSize: 13, marginBottom: 16,
  },
  successBox: {
    display: 'flex', gap: 7, alignItems: 'flex-start',
    background: 'var(--success-s)', border: '1px solid rgba(16,185,129,0.18)',
    borderRadius: 6, padding: '9px 12px', color: 'var(--success)', fontSize: 13, marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  foot: { textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 20 },
  link: { color: 'var(--accent-t)', textDecoration: 'none', fontWeight: 600 },
};
