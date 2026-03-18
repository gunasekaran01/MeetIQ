import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, ADMIN_EMAIL } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { RiArrowLeftLine, RiArrowRightSLine, RiErrorWarningLine } from 'react-icons/ri';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) throw authErr;
      const role = data.user.email === ADMIN_EMAIL ? 'admin' : 'user';
      login({ id: data.user.id, email: data.user.email, full_name: data.user.user_metadata?.full_name || '', role }, data.session.access_token);
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <div style={S.page}>
      {/* Top bar */}
      <div style={S.topBar}>
        <Link to="/" style={S.logo}>
          Meet<span style={{ color: 'var(--accent)' }}>IQ</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="auth-wrap" style={S.wrap}>
        {/* Left brand panel */}
        <div className="brand-panel" style={S.brandPanel}>
          {/* Gold top accent */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #F59E0B, #D97706, transparent)' }} />
          <div style={S.brandLogo}>Meet<span style={{ color: '#FBBF24' }}>IQ</span></div>
          <h2 style={S.brandH2}>Meeting intelligence<br />for modern teams.</h2>
          <p style={S.brandBody}>
            Automatically transcribe, summarise, and report on every meeting —
            so nothing important gets missed.
          </p>
          <div style={S.brandFeatures}>
            {['AI transcription in minutes', 'Automatic action items', 'One-click PDF reports'].map(f => (
              <div key={f} style={S.brandFeatureRow}>
                <div style={S.brandFeatureDot} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
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
              <h1 style={S.title}>Welcome back</h1>
              <p style={S.sub}>Enter your credentials to continue.</p>
            </div>

            {error && (
              <div style={S.errorBox}>
                <RiErrorWarningLine size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={S.form}>
              <div>
                <label className="input-label">Email address</label>
                <input className="input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                  required autoComplete="email" />
              </div>
              <div>
                <label className="input-label">Password</label>
                <input className="input" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  required autoComplete="current-password" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 6, gap: 6 }}>
                {loading
                  ? <><span className="spinner-sm" /> Signing in…</>
                  : <>Sign in <RiArrowRightSLine size={16} /></>
                }
              </button>
            </form>

            <p style={S.foot}>
              No account yet?{' '}
              <Link to="/signup" style={S.link}>Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh', background: 'var(--bg)',
    display: 'flex', flexDirection: 'column',
  },
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

  /* Brand side */
  brandPanel: {
    background: 'linear-gradient(145deg, #111827 0%, #0F172A 50%, #1a2236 100%)',
    padding: '60px 48px',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    borderRight: '1px solid var(--border)',
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

  /* Form side */
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
    borderRadius: 6, padding: '9px 12px',
    color: 'var(--danger)', fontSize: 13, marginBottom: 16,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  foot: { textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 20 },
  link: { color: 'var(--accent-t)', textDecoration: 'none', fontWeight: 600 },
};
