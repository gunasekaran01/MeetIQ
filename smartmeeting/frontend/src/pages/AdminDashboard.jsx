import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../supabaseClient';
import ThemeToggle from '../components/ThemeToggle';
import {
  RiDashboardLine, RiGroupLine, RiFolderLine,
  RiRefreshLine, RiLogoutBoxRLine,
  RiAlertLine, RiCloseLine, RiTimeLine, RiFileTextLine,
  RiShieldUserLine, RiCheckboxCircleLine, RiMenuLine,
} from 'react-icons/ri';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [stats,           setStats]           = useState(null);
  const [users,           setUsers]           = useState([]);
  const [meetings,        setMeetings]        = useState([]);
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [userMeetings,    setUserMeetings]    = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [tab,             setTab]             = useState('overview');
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [sidebarOpen,     setSidebarOpen]     = useState(false);

  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const loadAll = useCallback(async (tok) => {
    const t = tok || tokenRef.current;
    if (!t) return;
    setLoading(true); setError('');
    try {
      const h = { Authorization: `Bearer ${t}` };
      const [sr, ur, mr] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats`,    { headers: h, timeout: 15000 }),
        axios.get(`${API_BASE}/admin/users`,    { headers: h, timeout: 15000 }),
        axios.get(`${API_BASE}/admin/meetings`, { headers: h, timeout: 15000 }),
      ]);
      setStats(sr.data);
      setUsers(ur.data.users    || []);
      setMeetings(mr.data.meetings || []);
    } catch (err) {
      setError('Failed to load data: ' + (err.response?.data?.detail || err.message));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) loadAll(token); }, [token, loadAll]);

  const loadUserMeetings = async (u) => {
    setSelectedUser(u); setSelectedMeeting(null);
    try {
      const res = await axios.get(`${API_BASE}/admin/users/${u.id}/meetings`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      setUserMeetings(res.data.meetings || []);
    } catch { setUserMeetings([]); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const navItems = [
    { id: 'overview', Icon: RiDashboardLine, label: 'Overview' },
    { id: 'users',    Icon: RiGroupLine,     label: 'Users' },
    { id: 'meetings', Icon: RiFolderLine,    label: 'All Meetings' },
  ];

  const StatCard = ({ label, value, color }) => (
    <div style={{ ...S.statCard, borderColor: color + '30' }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, margin: '-1px -1px 14px', borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }} />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8, fontFamily: 'var(--font-display)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.05em' }}>{value ?? '—'}</div>
    </div>
  );

  return (
    <div className="dash-shell" style={S.shell}>

      {/* Mobile Overlay */}
      {sidebarOpen && <div style={S.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={S.sidebar}>
        <div style={S.goldBar} />
        <div style={S.sideInner}>
          <div style={S.sideTop}>
            <div style={S.logoRow}>
              <div>
                <div style={S.logo}>Meet<span style={{ color: 'var(--accent)' }}>IQ</span></div>
                <div style={S.adminTag}><RiShieldUserLine size={10} /> Admin</div>
              </div>
              <ThemeToggle />
            </div>

            <div style={S.userChip}>
              <div style={{ ...S.avatar, background: 'var(--danger)' }}>A</div>
              <div style={{ minWidth: 0 }}>
                <div style={S.userName}>Administrator</div>
                <div style={S.userEmail}>{user?.email}</div>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {navItems.map(({ id, Icon, label }) => (
                <button key={id}
                  style={{ ...S.navBtn, ...(tab === id ? S.navActive : {}) }}
                  onClick={() => { setTab(id); setSelectedUser(null); setSelectedMeeting(null); setSidebarOpen(false); }}>
                  <Icon size={15} style={{ flexShrink: 0 }} />{label}
                </button>
              ))}
            </nav>
          </div>

          <button className="btn btn-ghost btn-sm" onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'center', gap: 6, color: 'var(--text3)' }}>
            <RiLogoutBoxRLine size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="dash-main" style={S.main}>

        {/* Mobile Top Bar */}
        <div className="mobile-topbar" style={S.mobileBar}>
          <button className="hamburger" style={S.hamburger} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <RiMenuLine size={18} />
          </button>
          <span style={S.mobileLogo}>Meet<span style={{ color: 'var(--accent)' }}>IQ</span></span>
          <ThemeToggle />
        </div>

        {error && (
          <div style={S.errorBar} onClick={() => setError('')}>
            <RiAlertLine size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
            <RiCloseLine size={13} style={{ opacity: 0.5 }} />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 14 }}>
            <div className="spinner" />
            <span style={{ color: 'var(--text3)', fontSize: 13.5 }}>Loading admin data…</span>
          </div>
        ) : (
          <div className="dash-content" style={S.content}>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <>
                <div className="page-head" style={S.pageHead}>
                  <div>
                    <h1 style={S.pageTitle}>Overview</h1>
                    <p style={S.pageSub}>Platform-wide statistics</p>
                  </div>
                  <div className="page-head-actions" style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => loadAll(token)} style={{ gap: 5 }}>
                      <RiRefreshLine size={13} /> Refresh
                    </button>
                  </div>
                </div>

                <div className="stats-grid" style={S.statsGrid}>
                  <StatCard label="Total users"       value={stats?.total_users}                               color="var(--accent-t)" />
                  <StatCard label="Total meetings"    value={stats?.total_meetings}                            color="var(--success)" />
                  <StatCard label="Minutes processed" value={stats?.total_minutes_processed}                   color="var(--warning)" />
                  <StatCard label="Words transcribed" value={stats?.total_words_transcribed?.toLocaleString()} color="var(--info)" />
                </div>

                <div className="section-label" style={{ marginBottom: 12 }}>Recent meetings</div>
                <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
                  <div style={S.table}>
                    <div className="admin-table-row" style={S.tableHead}>
                      <span style={{ flex: 2 }}>Title</span>
                      <span style={{ flex: 2 }}>User</span>
                      <span style={{ flex: 1 }}>Duration</span>
                      <span style={{ flex: 1 }}>Date</span>
                    </div>
                    {meetings.length === 0 && <div style={S.emptyRow}>No meetings recorded yet.</div>}
                    {meetings.slice(0, 10).map(m => (
                      <div key={m.id} className="admin-table-row"
                        style={{ ...S.tableRow, ...(selectedMeeting?.id === m.id ? S.tableRowActive : {}) }}
                        onClick={() => setSelectedMeeting(selectedMeeting?.id === m.id ? null : m)}
                        onMouseEnter={e => { if (selectedMeeting?.id !== m.id) e.currentTarget.style.background = 'var(--bg3)'; }}
                        onMouseLeave={e => { if (selectedMeeting?.id !== m.id) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ flex: 2, fontWeight: 600, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-display)' }}>{m.title}</span>
                        <span style={{ flex: 2, color: 'var(--text3)', fontSize: 12.5 }}>{m.user_email || m.user_id?.slice(0, 8)}</span>
                        <span style={{ flex: 1, color: 'var(--text3)', fontSize: 12.5 }}>{m.duration_min ? Number(m.duration_min).toFixed(1) : '0'} min</span>
                        <span style={{ flex: 1, color: 'var(--text3)', fontSize: 12.5 }}>{fmt(m.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedMeeting && <MeetingDetail m={selectedMeeting} onClose={() => setSelectedMeeting(null)} fmt={fmt} />}
              </>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <>
                <div className="page-head" style={S.pageHead}>
                  <div>
                    <h1 style={S.pageTitle}>Users</h1>
                    <p style={S.pageSub}>{users.length} user{users.length !== 1 ? 's' : ''} with recordings</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? 'repeat(auto-fit,minmax(280px,1fr))' : '1fr', gap: 18 }}>
                  <div>
                    {users.length === 0
                      ? <div style={S.emptyRow}>No users have recorded meetings yet.</div>
                      : users.map(u => (
                        <div key={u.id}
                          style={{ ...S.userCard, ...(selectedUser?.id === u.id ? S.userCardActive : {}) }}
                          onClick={() => loadUserMeetings(u)}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 9 }}>
                            <div style={S.avatarSm}>{(u.email || 'U')[0].toUpperCase()}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-display)' }}>{u.email}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Last active: {fmt(u.last_activity)}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                            <span style={S.userStat}><strong>{u.total_meetings}</strong> recordings</span>
                            <span style={S.userStat}><strong>{Math.round(u.total_minutes || 0)}</strong> min</span>
                            <span style={S.userStat}><strong>{(u.total_words || 0).toLocaleString()}</strong> words</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  {selectedUser && (
                    <div style={S.detailPanel}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontFamily: 'var(--font-display)' }}>{selectedUser.email}</h3>
                        <button className="btn btn-ghost btn-sm" style={{ padding: 5 }} onClick={() => setSelectedUser(null)}><RiCloseLine size={14} /></button>
                      </div>
                      <div className="section-label" style={{ marginBottom: 10 }}>Recordings ({userMeetings.length})</div>
                      {userMeetings.length === 0
                        ? <p style={{ color: 'var(--text3)', fontSize: 13 }}>No recordings yet.</p>
                        : userMeetings.map(m => (
                          <div key={m.id}
                            style={{ ...S.miniCard, ...(selectedMeeting?.id === m.id ? { borderColor: 'var(--accent)' } : {}) }}
                            onClick={() => setSelectedMeeting(selectedMeeting?.id === m.id ? null : m)}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, fontFamily: 'var(--font-display)' }}>{m.title}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{fmt(m.created_at)} · {m.duration_min ? Number(m.duration_min).toFixed(1) : '0'} min</div>
                            {selectedMeeting?.id === m.id && (
                              <div style={{ marginTop: 10 }}>
                                <div className="section-label" style={{ marginBottom: 6 }}>Summary</div>
                                <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65 }}>{m.summary || 'No summary.'}</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── ALL MEETINGS ── */}
            {tab === 'meetings' && (
              <>
                <div className="page-head" style={S.pageHead}>
                  <div>
                    <h1 style={S.pageTitle}>All Meetings</h1>
                    <p style={S.pageSub}>{meetings.length} recordings across all users</p>
                  </div>
                </div>
                <div className="admin-table-wrap" style={{ overflowX: 'auto' }}>
                  <div style={S.table}>
                    <div className="admin-table-row" style={S.tableHead}>
                      <span style={{ flex: 2 }}>Title</span>
                      <span style={{ flex: 2 }}>User</span>
                      <span style={{ flex: 1 }}>Duration</span>
                      <span style={{ flex: 1 }}>Words</span>
                      <span style={{ flex: 1 }}>Date</span>
                    </div>
                    {meetings.length === 0 && <div style={S.emptyRow}>No meetings yet.</div>}
                    {meetings.map(m => (
                      <div key={m.id} className="admin-table-row"
                        style={{ ...S.tableRow, ...(selectedMeeting?.id === m.id ? S.tableRowActive : {}) }}
                        onClick={() => setSelectedMeeting(selectedMeeting?.id === m.id ? null : m)}
                        onMouseEnter={e => { if (selectedMeeting?.id !== m.id) e.currentTarget.style.background = 'var(--bg3)'; }}
                        onMouseLeave={e => { if (selectedMeeting?.id !== m.id) e.currentTarget.style.background = 'transparent'; }}>
                        <span style={{ flex: 2, fontWeight: 600, color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-display)' }}>{m.title}</span>
                        <span style={{ flex: 2, color: 'var(--text3)', fontSize: 12.5 }}>{m.user_email || m.user_id?.slice(0, 8)}</span>
                        <span style={{ flex: 1, color: 'var(--text3)', fontSize: 12.5 }}>{m.duration_min ? Number(m.duration_min).toFixed(1) : '0'} min</span>
                        <span style={{ flex: 1, color: 'var(--text3)', fontSize: 12.5 }}>{(m.word_count || 0).toLocaleString()}</span>
                        <span style={{ flex: 1, color: 'var(--text3)', fontSize: 12.5 }}>{fmt(m.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedMeeting && <MeetingDetail m={selectedMeeting} onClose={() => setSelectedMeeting(null)} fmt={fmt} />}
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

function MeetingDetail({ m, onClose, fmt }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20, marginTop: 16 }}>
      <div style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)', margin: '-1px -1px 16px', borderRadius: 'var(--r-lg) var(--r-lg) 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{m.title}</h3>
        <button className="btn btn-ghost btn-sm" style={{ padding: 5 }} onClick={onClose}><RiCloseLine size={14} /></button>
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'var(--text3)', marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><RiTimeLine size={11} />{fmt(m.created_at)}</span>
        <span>{m.user_email || '—'}</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><RiTimeLine size={11} />{m.duration_min ? Number(m.duration_min).toFixed(1) : '0'} min</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><RiFileTextLine size={11} />{(m.word_count || 0).toLocaleString()} words</span>
      </div>
      <DL label="Summary"><p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{m.summary || 'No summary.'}</p></DL>
      {m.action_items?.length > 0 && (
        <DL label="Action Items">
          {m.action_items.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <RiCheckboxCircleLine size={13} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12.5, color: 'var(--text2)' }}>{a}</span>
            </div>
          ))}
        </DL>
      )}
      {m.tags?.length > 0 && (
        <DL label="Topics">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {m.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
          </div>
        </DL>
      )}
    </div>
  );
}

function DL({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-t)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'var(--font-display)' }}>{label}</div>
      {children}
    </div>
  );
}

const S = {
  shell:   { display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 149, backdropFilter: 'blur(2px)' },

  sidebar: {
    width: 220, flexShrink: 0,
    background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
  },
  goldBar:   { height: 3, background: 'linear-gradient(90deg, var(--accent), transparent)', flexShrink: 0 },
  sideInner: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 12px 18px' },
  sideTop:   { display: 'flex', flexDirection: 'column', gap: 16 },
  logoRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '2px 4px' },
  logo:      { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 4 },
  adminTag:  { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--accent-t)', background: 'var(--accent-s)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 3, padding: '1px 7px', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' },
  userChip:  { display: 'flex', gap: 9, alignItems: 'center', padding: 9, background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' },
  avatar:    { width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0, color: '#fff' },
  avatarSm:  { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, color: '#111827' },
  userName:  { fontSize: 12.5, fontWeight: 600, color: 'var(--text)' },
  userEmail: { fontSize: 10.5, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  navBtn:    {display: 'flex', gap: 8, alignItems: 'center', width: '100%',padding: '9px 10px',borderRadius: 'var(--r-sm)',border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, textAlign: 'left', borderLeft: '2px solid transparent', paddingLeft: 10,  transition: 'none'},
  navActive: {background: 'var(--accent-s)',color: 'var(--accent-t)',fontWeight: 700,borderLeft: '2px solid var(--accent)'},

  mobileBar:  { display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 },
  hamburger:  { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 },
  mobileLogo: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' },

  main:      { flex: 1, overflowY: 'auto', minWidth: 0 },
  errorBar:  { display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--danger-s)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '10px 20px', color: 'var(--danger)', fontSize: 13, cursor: 'pointer' },
  content:   { padding: '28px 32px' },
  pageHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' },
  pageSub:   { color: 'var(--text3)', fontSize: 13, marginTop: 3 },

  statsGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 32 },
  statCard:      { background: 'var(--card)', border: '1.5px solid', borderRadius: 'var(--r-lg)', padding: '0 16px 18px', overflow: 'hidden' },

  table:         { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', minWidth: 480 },
  tableHead:     { display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: 10.5, fontWeight: 700, color: 'var(--accent-t)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--bg3)', fontFamily: 'var(--font-display)' },
  tableRow:      { display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s', background: 'transparent' },
  tableRowActive:{ background: 'var(--accent-s)' },
  emptyRow:      { padding: '22px 16px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' },

  userCard:       { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 14, marginBottom: 9, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' },
  userCardActive: { borderColor: 'var(--accent)', boxShadow: 'var(--shadow-gold)' },
  userStat:       { fontSize: 12.5, color: 'var(--text3)' },
  detailPanel:    { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 },
  miniCard:       { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.15s' },
};
