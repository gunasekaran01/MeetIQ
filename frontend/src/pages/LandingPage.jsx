import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import {
  RiMicLine, RiFlashlightLine, RiFileTextLine,
  RiCheckboxCircleLine, RiPriceTag3Line, RiFilePdfLine,
  RiArrowRightLine, RiShieldCheckLine, RiTimeLine, RiBarChartLine,
} from 'react-icons/ri';

const features = [
  { icon: RiMicLine,            title: 'Screen & Audio Recording',  desc: 'Capture any meeting or call directly in the browser. One click to start — no plugins or extensions required.' },
  { icon: RiFlashlightLine,     title: 'AI Transcription',          desc: 'Whisper-powered engine delivers accurate transcripts within minutes of your meeting ending.' },
  { icon: RiFileTextLine,       title: 'Smart Summaries',           desc: 'Extractive AI distils hours of conversation into a clear, structured executive summary.' },
  { icon: RiCheckboxCircleLine, title: 'Action Item Detection',     desc: 'Automatically surfaces every commitment, deadline, and follow-up buried in the transcript.' },
  { icon: RiPriceTag3Line,      title: 'Topic Classification',      desc: 'KeyBERT extracts key themes so you can search, filter, and categorise recordings at scale.' },
  { icon: RiFilePdfLine,        title: 'Downloadable Reports',      desc: 'Generate branded, print-ready PDF reports for stakeholders with a single click.' },
];

const steps = [
  { n: '01', title: 'Record',  desc: 'Capture your screen or video call with system audio in a single click from any browser tab.' },
  { n: '02', title: 'Process', desc: 'Whisper transcribes and AI extracts summaries, action items, and topic classifications automatically.' },
  { n: '03', title: 'Report',  desc: 'Download a polished PDF or review all insights from your personal meeting dashboard.' },
];

const stats = [
  { value: '98%',    label: 'Transcription accuracy' },
  { value: '<3 min', label: 'Processing time' },
  { value: '100%',   label: 'Private & secure' },
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', overflowX: 'hidden', transition: 'background .25s,color .25s' }}>

      {/* NAV */}
      <nav style={N.nav}>
        <div className="nav-inner" style={N.inner}>
          <span style={N.logo}>Meet<span style={{ color: 'var(--accent)' }}>IQ</span></span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ThemeToggle />
            <Link to="/login"  className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Get started <RiArrowRightLine size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section" style={N.hero}>
        <div className="hero-inner" style={N.heroInner}>

          {/* Left */}
          <div className="hero-left" style={N.heroLeft}>
            <div style={N.pill}>
              <RiShieldCheckLine size={11} />
              AI-Powered Meeting Intelligence
            </div>
            <h1 style={N.h1}>
              Turn every meeting<br />
              into <span style={{ color: 'var(--accent-t)' }}>clear action.</span>
            </h1>
            <p style={N.heroBody}>
              MeetIQ records, transcribes, summarises, and reports on your meetings automatically —
              so your organisation captures every decision and never misses a follow-up.
            </p>
            <div className="hero-cta-row" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link to="/signup" className="btn btn-primary btn-lg" style={{ gap: 8 }}>
                Get started free <RiArrowRightLine size={15} />
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
            </div>
            <p style={N.caveat}>No credit card required · Free to use</p>
          </div>

          {/* Right — stat panel */}
          <div className="hero-stat-panel" style={N.statPanel}>
            {/* Gold top bar */}
            <div style={{ height: 3, background: 'linear-gradient(90deg, var(--accent), transparent)', borderRadius: '12px 12px 0 0', margin: '-1px -1px 0', position: 'relative', top: 0 }} />
            <div style={{ padding: '22px' }}>
              <div style={N.statPanelHead}>
                <div style={N.statPanelDot} />
                <span style={N.statPanelLabel}>Platform performance</span>
              </div>
              {stats.map((s, i) => (
                <div key={i} style={N.statRow}>
                  <span style={N.statValue}>{s.value}</span>
                  <span style={N.statLabel}>{s.label}</span>
                </div>
              ))}
              <div style={N.divider} />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: 'var(--font-display)' }}>Latest report preview</div>
              <div style={N.previewRow}>
                <RiTimeLine size={12} color="var(--accent-t)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Product Review — 42 min · 3 action items</span>
              </div>
              <div style={N.previewRow}>
                <RiBarChartLine size={12} color="var(--accent-t)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Q2 Planning — 61 min · 7 action items</span>
              </div>
              <div style={N.previewRow}>
                <RiTimeLine size={12} color="var(--accent-t)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>Team Standup — 18 min · 2 action items</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-pad" style={N.section}>
        <div style={N.container}>
          <p style={N.eyebrow}>How it works</p>
          <h2 style={N.h2}>From recording to report<br />in three steps</h2>
          <div className="steps-grid" style={N.stepsGrid}>
            {steps.map((s, i) => (
              <div key={i} style={N.stepCard}>
                <div style={N.stepN}>{s.n}</div>
                <div style={N.goldLine} />
                <h3 style={N.stepTitle}>{s.title}</h3>
                <p style={N.stepBody}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section-pad" style={{ ...N.section, background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={N.container}>
          <p style={N.eyebrow}>Features</p>
          <h2 style={N.h2}>Everything you need<br />to run more effective meetings</h2>
          <div className="features-grid" style={N.featGrid}>
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={N.featCard}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-r)'; e.currentTarget.style.background = 'var(--card2)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={N.featIconBox}>
                    <Icon size={16} color="var(--accent-t)" />
                  </div>
                  <h3 style={N.featTitle}>{f.title}</h3>
                  <p style={N.featBody}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={N.ctaSection}>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
          <p style={N.eyebrow}>Get started today</p>
          <h2 style={{ ...N.h2, marginBottom: 16 }}>Ready to make every<br />meeting count?</h2>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 32 }}>
            Join professionals who capture decisions, actions, and insights from every meeting — automatically.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg" style={{ gap: 8 }}>
            Create free account <RiArrowRightLine size={15} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer" style={N.footer}>
        <span style={N.logo}>Meet<span style={{ color: 'var(--accent)' }}>IQ</span></span>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>Copyright © 2025 MeetIQ. All rights reserved by SparkUp.</span>
        <a href="#" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>Terms of Service</a>
      </footer>
    </div>
  );
}

const N = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
    background: 'var(--nav-bg)',
  },
  inner: {
    maxWidth: 1100, margin: '0 auto', padding: '0 28px',
    height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: {
    fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 800,
    letterSpacing: '-0.04em', color: 'var(--text)', userSelect: 'none',
  },

  hero: { paddingTop: 100, paddingBottom: 80, paddingLeft: 28, paddingRight: 28 },
  heroInner: {
    maxWidth: 1100, margin: '0 auto',
    display: 'grid', gridTemplateColumns: '1fr 380px', gap: 60, alignItems: 'center',
  },
  heroLeft: {},
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: 'var(--accent-t)', background: 'var(--accent-s)',
    border: '1px solid var(--accent-r)', padding: '4px 12px',
    borderRadius: 4, marginBottom: 24,
    fontFamily: 'var(--font-display)',
  },
  h1: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(34px,5vw,56px)',
    fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.04em',
    color: 'var(--text)', marginBottom: 22,
  },
  heroBody: {
    fontSize: 15.5, color: 'var(--text2)', lineHeight: 1.75,
    marginBottom: 30, maxWidth: 500,
  },
  caveat: { fontSize: 12, color: 'var(--text3)' },

  statPanel: {
    background: 'var(--card)', border: '1px solid var(--border2)',
    borderRadius: 'var(--r-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-xl), 0 0 0 1px var(--accent-r)',
  },
  statPanelHead: {
    display: 'flex', alignItems: 'center', gap: 7,
    marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border)',
  },
  statPanelDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  statPanelLabel: { fontSize: 12, color: 'var(--text3)', fontWeight: 600, fontFamily: 'var(--font-display)' },
  statRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    padding: '9px 0', borderBottom: '1px solid var(--border)',
  },
  statValue: { fontSize: 24, fontWeight: 800, color: 'var(--accent-t)', letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' },
  statLabel: { fontSize: 12.5, color: 'var(--text3)', fontWeight: 400 },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  previewRow: { display: 'flex', gap: 7, alignItems: 'center', marginBottom: 8 },

  section: { padding: '80px 28px' },
  container: { maxWidth: 1100, margin: '0 auto' },
  eyebrow: {
    fontSize: 11, fontWeight: 700, color: 'var(--accent-t)',
    textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 10,
    fontFamily: 'var(--font-display)',
  },
  h2: {
    fontFamily: 'var(--font-display)', fontSize: 'clamp(24px,3.5vw,38px)',
    fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.03em',
    color: 'var(--text)', marginBottom: 48,
  },

  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 },
  stepCard: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: 28,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  stepN: {
    fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 800,
    color: 'var(--accent)', opacity: 0.22, lineHeight: 1, marginBottom: 12, letterSpacing: '-0.06em',
  },
  goldLine: { height: 2, width: 32, background: 'linear-gradient(90deg, var(--accent), transparent)', borderRadius: 2, marginBottom: 14 },
  stepTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' },
  stepBody:  { fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7 },

  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 },
  featCard: {
    background: 'var(--card)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: 22,
    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s', cursor: 'default',
  },
  featIconBox: {
    width: 36, height: 36, borderRadius: 'var(--r-sm)',
    background: 'var(--accent-s)', border: '1px solid var(--accent-r)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  featTitle: { fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' },
  featBody:  { fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 },

  ctaSection: { padding: '90px 28px', textAlign: 'center' },

  footer: {
    borderTop: '1px solid var(--border)', padding: '22px 28px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    maxWidth: 1100, margin: '0 auto',
  },
};
