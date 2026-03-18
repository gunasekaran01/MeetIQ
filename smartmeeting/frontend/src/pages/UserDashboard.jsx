import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../supabaseClient';
import ThemeToggle from '../components/ThemeToggle';
import { generateReport } from '../utils/generateReport';
import {
  RiFolderLine, RiMicLine, RiDeleteBin6Line, RiDownloadLine,
  RiRefreshLine, RiAddLine, RiTimeLine, RiFileTextLine,
  RiCheckboxCircleLine, RiLogoutBoxRLine, RiAlertLine,
  RiStopCircleLine, RiPlayCircleLine, RiCloseLine,
  RiUpload2Line, RiVideoLine, RiFileMusicLine,
  RiArrowRightLine, RiMenuLine,
} from 'react-icons/ri';

const ACCEPTED = '.mp4,.webm,.mov,.avi,.mkv,.flv,.wmv,.mp3,.wav,.m4a,.ogg,.opus';
const ACCEPTED_LABEL = 'MP4, WebM, MOV, AVI, MKV, FLV, WMV, MP3, WAV, M4A, OGG, OPUS';
const MAX_SIZE_MB = 500;

export default function UserDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [meetings,     setMeetings]     = useState([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [selected,     setSelected]     = useState(null);
  const [tab,          setTab]          = useState('meetings');
  const [addMode,      setAddMode]      = useState('live');
  const [error,        setError]        = useState('');
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [progress,     setProgress]     = useState('');
  const [title,        setTitle]        = useState('');
  const [recording,    setRecording]    = useState(false);
  const [videoUrl,     setVideoUrl]     = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview,  setFilePreview]  = useState(null);
  const [dragOver,     setDragOver]     = useState(false);

  const mrRef        = useRef(null);
  const chunksRef    = useRef([]);
  const tokenRef     = useRef(token);
  const titleRef     = useRef(title);
  const stoppingRef  = useRef(false);
  const fileInputRef = useRef(null);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setSidebarOpen(false); setSelected(null); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const fetchMeetings = useCallback(async (tok) => {
    const t = tok || tokenRef.current;
    if (!t) { setLoadingList(false); return; }
    setLoadingList(true); setError('');
    try {
      const res = await axios.get(`${API_BASE}/meetings`, { headers: { Authorization: `Bearer ${t}` }, timeout: 15000 });
      setMeetings(res.data?.meetings || []);
    } catch (err) {
      setError(`Could not load meetings: ${err.response?.data?.detail || err.message}`);
      setMeetings([]);
    } finally { setLoadingList(false); }
  }, []);

  useEffect(() => { if (token) fetchMeetings(token); }, [token, fetchMeetings]);

  const submitToBackend = async (fileBlob, fileName, meetingTitle) => {
    const tok = tokenRef.current;
    if (!tok) { setError('Session expired. Please log in again.'); setUploading(false); return; }
    const finalTitle = (meetingTitle || '').trim() || `Meeting — ${new Date().toLocaleDateString()}`;
    const fd = new FormData();
    fd.append('file', fileBlob, fileName);
    fd.append('title', finalTitle);
    setUploading(true); setProgress('Uploading file to server…');
    try {
      setProgress('Transcribing with Whisper AI — this may take 1–3 min…');
      const res = await axios.post(`${API_BASE}/meetings/upload`, fd, {
        headers: { Authorization: `Bearer ${tok}` }, timeout: 900000,
      });
      setUploadResult(res.data); setProgress(''); setUploading(false);
      await fetchMeetings(tok);
    } catch (err) {
      setError(`Processing failed: ${err.response?.data?.detail || err.message}`);
      setUploading(false); setProgress('');
    }
  };

  const startRecording = async () => {
    setError(''); setUploadResult(null); setVideoUrl(null);
    chunksRef.current = []; stoppingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      mrRef.current = mr; mr.mediaStream = stream;
      mr.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => handleRecordingStop(titleRef.current);
      mr.start(1000); setRecording(true);
      stream.getTracks().forEach(t => { t.onended = () => stopRecording(); });
    } catch (err) { setError('Screen sharing denied: ' + err.message); }
  };

  const stopRecording = () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      if (mrRef.current?.state !== 'inactive') mrRef.current?.stop();
      mrRef.current?.mediaStream?.getTracks().forEach(t => t.stop());
    } catch (e) { console.warn(e); }
    setRecording(false);
  };

  const handleRecordingStop = async (meetingTitle) => {
    if (!chunksRef.current.length) { setError('No recording data captured.'); return; }
    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    setVideoUrl(URL.createObjectURL(blob));
    await submitToBackend(blob, 'meeting.webm', meetingTitle);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) { setError(`File too large. Max ${MAX_SIZE_MB} MB.`); return; }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED.split(',').includes(ext)) { setError(`Unsupported type "${ext}".`); return; }
    setError(''); setSelectedFile(file); setUploadResult(null);
    if (file.type.startsWith('video/')) setFilePreview(URL.createObjectURL(file));
    else setFilePreview(null);
  };

  const handleFileDrop   = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); };
  const handleFileChange = (e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; };
  const submitFile       = async () => { if (!selectedFile) { setError('Please select a file first.'); return; } await submitToBackend(selectedFile, selectedFile.name, title); };
  const clearFile        = () => { setSelectedFile(null); setFilePreview(null); setUploadResult(null); setError(''); };
  const resetAddView     = () => { setUploadResult(null); setVideoUrl(null); setFilePreview(null); setSelectedFile(null); setTitle(''); stoppingRef.current = false; setError(''); };

  const deleteMeeting = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this meeting? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/meetings/${id}`, { headers: { Authorization: `Bearer ${tokenRef.current}` } });
      setMeetings(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) { setError('Delete failed: ' + (err.response?.data?.detail || err.message)); }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };
  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const navItems = [
    { id: 'meetings', Icon: RiFolderLine, label: 'Meetings' },
    { id: 'add',      Icon: RiAddLine,    label: 'Add Meeting' },
  ];

  const ResultPanel = () => (
    <div style={{ textAlign: 'left' }}>
      <div style={S.successBar}>
        <RiCheckboxCircleLine size={17} color="var(--success)" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: 'var(--success)', fontSize: 14 }}>Meeting processed successfully</span>
      </div>
      <Block label="Summary"><p style={S.body2}>{uploadResult.summary?.trim() || 'No summary generated.'}</p></Block>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Stat value={uploadResult.duration_min ? Number(uploadResult.duration_min).toFixed(1) : '0'} label="minutes" />
        <Stat value={(uploadResult.word_count || 0).toLocaleString()} label="words" />
        <Stat value={(uploadResult.action_items || []).length} label="action items" />
      </div>
      {uploadResult.action_items?.length > 0 && (
        <Block label="Action Items">
          {uploadResult.action_items.map((a, i) => (
            <div key={i} style={S.aiRow}>
              <RiCheckboxCircleLine size={13} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={S.body2}>{a}</span>
            </div>
          ))}
        </Block>
      )}
      {uploadResult.tags?.length > 0 && (
        <Block label="Topics">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {uploadResult.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
          </div>
        </Block>
      )}
      {uploadResult.transcript?.trim() && (
        <Block label="Transcript"><div style={S.transcriptBox}>{uploadResult.transcript.trim()}</div></Block>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ gap: 6 }} onClick={() => { resetAddView(); setTab('meetings'); }}>
          View in Meetings <RiArrowRightLine size={14} />
        </button>
        <button className="btn btn-success" style={{ gap: 6 }}
          onClick={() => generateReport({ ...uploadResult, title: title || 'Meeting' }, user?.full_name || user?.email)}>
          <RiDownloadLine size={14} /> Download Report
        </button>
        <button className="btn btn-outline" onClick={resetAddView}>Process another</button>
      </div>
    </div>
  );

  return (
    <div className="dash-shell" style={S.shell}>

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div style={S.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={S.sidebar}>
        <div style={S.goldBar} />
        <div style={S.sideInner}>
          <div style={S.sideTop}>
            <div style={S.logoRow}>
              <span style={S.logo}>Meet<span style={{ color: 'var(--accent)' }}>IQ</span></span>
              <ThemeToggle />
            </div>
            <div style={S.userChip}>
              <div style={S.avatar}>{(user?.full_name || user?.email || 'U')[0].toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div style={S.userName}>{user?.full_name || 'User'}</div>
                <div style={S.userEmail}>{user?.email}</div>
              </div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {navItems.map(({ id, Icon, label }) => (
                <button key={id}
                  style={{ ...S.navBtn, ...(tab === id ? S.navActive : {}) }}
                  onClick={() => { setTab(id); if (id === 'add') resetAddView(); setSidebarOpen(false); }}>
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

        {/* Mobile top bar */}
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
            <RiCloseLine size={13} style={{ opacity: 0.5, cursor: 'pointer', flexShrink: 0 }} />
          </div>
        )}

        {/* ══ MEETINGS TAB ══ */}
        {tab === 'meetings' && (
          <div className="dash-content" style={S.content}>
            <div className="page-head" style={S.pageHead}>
              <div>
                <h1 style={S.pageTitle}>Meetings</h1>
                <p style={S.pageSub}>{meetings.length} recording{meetings.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="page-head-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={() => fetchMeetings(token)} style={{ gap: 5 }}>
                  <RiRefreshLine size={13} /> Refresh
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => { resetAddView(); setTab('add'); }} style={{ gap: 5 }}>
                  <RiAddLine size={14} /> Add Meeting
                </button>
              </div>
            </div>

            {loadingList && (
              <div style={S.centreBox}>
                <div className="spinner" style={{ margin: '0 auto 14px' }} />
                <p style={{ color: 'var(--text3)', fontSize: 13.5 }}>Loading meetings…</p>
              </div>
            )}

            {!loadingList && meetings.length === 0 && !error && (
              <div style={S.emptyBox}>
                <RiFolderLine size={40} color="var(--text4)" style={{ marginBottom: 16 }} />
                <h3 style={S.emptyTitle}>No recordings yet</h3>
                <p style={S.emptySub}>Record a live session or upload an existing video / audio file to get started.</p>
                <button className="btn btn-primary" onClick={() => { resetAddView(); setTab('add'); }} style={{ gap: 6 }}>
                  <RiAddLine size={14} /> Add Meeting
                </button>
              </div>
            )}

            {!loadingList && meetings.length > 0 && (
              <div className="meetings-grid" style={S.grid}>
                {meetings.map(m => (
                  <div key={m.id} style={S.card} onClick={() => setSelected(m)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-r)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={S.cardTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.cardTitle}>{m.title}</div>
                        <div style={S.cardDate}>{fmt(m.created_at)}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4, color: 'var(--text3)', flexShrink: 0 }}
                        onClick={e => deleteMeeting(m.id, e)} title="Delete">
                        <RiDeleteBin6Line size={14} />
                      </button>
                    </div>
                    <p style={S.cardSummary}>{m.summary?.trim() || 'No summary available.'}</p>
                    <div style={S.cardMeta}>
                      <span style={S.metaItem}><RiTimeLine size={11} /> {m.duration_min ? Number(m.duration_min).toFixed(1) : '0'} min</span>
                      <span style={S.metaItem}><RiFileTextLine size={11} /> {(m.word_count || 0).toLocaleString()} words</span>
                    </div>
                    {m.tags?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                        {m.tags.slice(0, 4).map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
                      </div>
                    )}
                    <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', gap: 5 }}
                      onClick={e => { e.stopPropagation(); generateReport(m, user?.full_name || user?.email); }}>
                      <RiDownloadLine size={13} /> Download Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ADD MEETING TAB ══ */}
        {tab === 'add' && (
          <div className="dash-content" style={S.content}>
            <div className="page-head" style={S.pageHead}>
              <div>
                <h1 style={S.pageTitle}>Add Meeting</h1>
                <p style={S.pageSub}>Record a live session or upload an existing file.</p>
              </div>
            </div>
            <div style={{ maxWidth: 660 }}>

              {!uploading && !uploadResult && (
                <div className="mode-switcher" style={S.modeSwitcher}>
                  <button style={{ ...S.modeBtn, ...(addMode === 'live' ? S.modeBtnActive : {}) }}
                    onClick={() => { setAddMode('live'); clearFile(); setError(''); }}>
                    <RiMicLine size={15} /> Live Recording
                  </button>
                  <button style={{ ...S.modeBtn, ...(addMode === 'upload' ? S.modeBtnActive : {}) }}
                    onClick={() => { setAddMode('upload'); setError(''); }}>
                    <RiUpload2Line size={15} /> Upload File
                  </button>
                </div>
              )}

              {!uploadResult && (
                <div style={{ ...S.inputCard, marginBottom: 14 }}>
                  <label className="input-label">Meeting title</label>
                  <input className="input" value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={`Meeting — ${new Date().toLocaleDateString()}`}
                    disabled={recording || uploading} />
                </div>
              )}

              {/* LIVE MODE */}
              {addMode === 'live' && (
                <div style={{ ...S.inputCard, textAlign: 'center', padding: '44px 32px' }}>
                  {!recording && !uploading && !uploadResult && (
                    <>
                      <div style={S.recIconWrap}><RiMicLine size={26} color="var(--accent-t)" /></div>
                      <h3 style={S.recHead}>Ready to record</h3>
                      <p style={S.recSub}>Click <strong>Start</strong>, choose the window to share, and enable <strong>Share system audio</strong>.</p>
                      <button className="btn btn-primary btn-lg" onClick={startRecording} style={{ gap: 8 }}>
                        <RiPlayCircleLine size={17} /> Start Screen Recording
                      </button>
                    </>
                  )}
                  {recording && !uploading && (
                    <>
                      <div style={S.recLive}><span className="rec-dot" /> Recording in progress</div>
                      <p style={{ ...S.recSub, marginBottom: 26 }}>Click <strong>Stop</strong> when your meeting ends.</p>
                      <button className="btn btn-lg" style={{ background: 'var(--danger)', color: '#fff', border: 'none', minWidth: 190, gap: 8 }} onClick={stopRecording}>
                        <RiStopCircleLine size={17} /> Stop & Process
                      </button>
                    </>
                  )}
                  {uploading && (
                    <>
                      <div className="spinner" style={{ margin: '0 auto 18px' }} />
                      <p style={{ color: 'var(--text)', fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>{progress}</p>
                      <p style={{ color: 'var(--text3)', fontSize: 12.5 }}>Do not close this tab.</p>
                    </>
                  )}
                  {!uploading && uploadResult && <ResultPanel />}
                </div>
              )}

              {addMode === 'live' && videoUrl && !uploading && !uploadResult && (
                <div style={{ ...S.inputCard, marginTop: 12, padding: 14 }}>
                  <p style={S.smallLabel}>Recorded preview</p>
                  <video controls src={videoUrl} style={{ width: '100%', maxHeight: 220, borderRadius: 6, background: '#000' }} />
                </div>
              )}

              {/* UPLOAD MODE */}
              {addMode === 'upload' && (
                <>
                  {!uploading && uploadResult && <div style={S.inputCard}><ResultPanel /></div>}
                  {uploading && (
                    <div style={{ ...S.inputCard, textAlign: 'center', padding: '44px 32px' }}>
                      <div className="spinner" style={{ margin: '0 auto 18px' }} />
                      <p style={{ color: 'var(--text)', fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>{progress}</p>
                      <p style={{ color: 'var(--text3)', fontSize: 12.5 }}>Do not close this tab.</p>
                    </div>
                  )}
                  {!uploading && !uploadResult && (
                    <>
                      <input ref={fileInputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={handleFileChange} />
                      {!selectedFile && (
                        <div style={{ ...S.dropZone, ...(dragOver ? S.dropZoneActive : {}) }}
                          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={handleFileDrop}
                          onClick={() => fileInputRef.current?.click()}>
                          <div style={S.dropIconWrap}><RiUpload2Line size={24} color="var(--accent-t)" /></div>
                          <p style={S.dropTitle}>{dragOver ? 'Drop your file here' : 'Drag & drop or click to browse'}</p>
                          <p style={S.dropSub}>Supported: {ACCEPTED_LABEL}</p>
                          <p style={S.dropSub}>Max size: {MAX_SIZE_MB} MB</p>
                          <button className="btn btn-outline btn-sm" style={{ marginTop: 16, gap: 5, pointerEvents: 'none' }}>
                            <RiUpload2Line size={13} /> Browse files
                          </button>
                        </div>
                      )}
                      {selectedFile && (
                        <div style={S.fileCard}>
                          <div style={S.fileCardIcon}>
                            {selectedFile.type.startsWith('video/')
                              ? <RiVideoLine size={20} color="var(--accent-t)" />
                              : <RiFileMusicLine size={20} color="var(--accent-t)" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={S.fileName}>{selectedFile.name}</div>
                            <div style={S.fileMeta}>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB · {selectedFile.type || 'unknown'}</div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 5, flexShrink: 0 }} onClick={clearFile}><RiCloseLine size={15} /></button>
                        </div>
                      )}
                      {filePreview && (
                        <div style={{ ...S.inputCard, marginTop: 12, padding: 14 }}>
                          <p style={S.smallLabel}>File preview</p>
                          <video controls src={filePreview} style={{ width: '100%', maxHeight: 220, borderRadius: 6, background: '#000' }} />
                        </div>
                      )}
                      {selectedFile && (
                        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center', gap: 8, minWidth: 180 }} onClick={submitFile} disabled={uploading}>
                            <RiPlayCircleLine size={17} /> Process with AI
                          </button>
                          <button className="btn btn-outline" onClick={clearFile}>Change file</button>
                        </div>
                      )}
                      {!selectedFile && (
                        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
                          All processing happens on your local server — files are never sent to third parties.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── DETAIL DRAWER ── */}
      {selected && (
        <aside className="dash-drawer" style={S.drawer}>
          <div style={S.goldBar} />
          <div style={{ padding: '20px' }}>
            <div style={S.drawerHead}>
              <h2 style={S.drawerTitle}>{selected.title}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ padding: 6, flexShrink: 0 }}>
                <RiCloseLine size={15} />
              </button>
            </div>
            <div style={S.drawerMeta}>
              <span style={S.metaItem}><RiTimeLine size={11} /> {fmt(selected.created_at)}</span>
              <span style={S.metaItem}><RiTimeLine size={11} /> {selected.duration_min ? Number(selected.duration_min).toFixed(1) : '0'} min</span>
              <span style={S.metaItem}><RiFileTextLine size={11} /> {(selected.word_count || 0).toLocaleString()} words</span>
            </div>
            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 20, gap: 6 }}
              onClick={() => generateReport(selected, user?.full_name || user?.email)}>
              <RiDownloadLine size={13} /> Download PDF Report
            </button>
            <DSection title="Summary"><p style={S.body2}>{selected.summary?.trim() || 'No summary generated.'}</p></DSection>
            <DSection title="Action Items">
              {!selected.action_items?.length
                ? <p style={S.muted}>No action items detected.</p>
                : selected.action_items.map((a, i) => (
                  <div key={i} style={S.aiRow}>
                    <RiCheckboxCircleLine size={13} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={S.body2}>{a}</span>
                  </div>
                ))}
            </DSection>
            <DSection title="Topics">
              {!selected.tags?.length
                ? <p style={S.muted}>No topics extracted.</p>
                : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {selected.tags.map(t => <span key={t} className="badge badge-indigo">{t}</span>)}
                  </div>}
            </DSection>
            <DSection title="Transcript">
              <div style={S.transcriptBox}>{selected.transcript?.trim() || 'No transcript available.'}</div>
            </DSection>
          </div>
        </aside>
      )}
    </div>
  );
}

function DSection({ title, children }) {
  return <div style={{ marginBottom: 24 }}><div className="section-label">{title}</div>{children}</div>;
}
function Block({ label, children }) {
  return <div style={{ marginBottom: 16 }}><div className="section-label">{label}</div>{children}</div>;
}
function Stat({ value, label }) {
  return (
    <div style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 10px', textAlign: 'center', minWidth: 80 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent-t)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
    </div>
  );
}

const S = {
  shell: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', position: 'relative' },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    zIndex: 149, backdropFilter: 'blur(2px)',
  },

  sidebar: {
    width: 220, flexShrink: 0,
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
  },
  goldBar: { height: 3, background: 'linear-gradient(90deg, var(--accent), transparent)', flexShrink: 0 },
  sideInner: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 12px 18px' },
  sideTop:   { display: 'flex', flexDirection: 'column', gap: 16 },
  logoRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' },
  logo:      { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' },
  userChip:  { display: 'flex', gap: 9, alignItems: 'center', padding: 9, background: 'var(--bg3)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' },
  avatar:    { width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#F59E0B,#D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#111827' },
  userName:  { fontSize: 12.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 10.5, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  navBtn:    {display: 'flex', gap: 8, alignItems: 'center', width: '100%',padding: '9px 10px',borderRadius: 'var(--r-sm)',border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, textAlign: 'left', borderLeft: '2px solid transparent', paddingLeft: 10,  transition: 'none'},
  navActive: {background: 'var(--accent-s)',color: 'var(--accent-t)',fontWeight: 700,borderLeft: '2px solid var(--accent)'},
  
  /* Mobile top bar — shown via CSS @media */
  mobileBar: { display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 56, background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 },
  hamburger: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--bg3)', border: '1px solid var(--border2)', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 },
  mobileLogo:{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text)' },
  main:      { flex: 1, overflowY: 'auto', minWidth: 0 },
  errorBar:  { display: 'flex', gap: 8, alignItems: 'flex-start', background: 'var(--danger-s)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '10px 20px', color: 'var(--danger)', fontSize: 13, cursor: 'pointer' },
  content:   { padding: '28px 32px', maxWidth: 1060 },
  pageHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' },
  pageTitle: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' },
  pageSub:   { color: 'var(--text3)', fontSize: 13, marginTop: 3 },
  centreBox: { textAlign: 'center', padding: 64 },

  emptyBox:   { textAlign: 'center', padding: '64px 32px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font-display)' },
  emptySub:   { color: 'var(--text3)', fontSize: 13.5, maxWidth: 340, margin: '0 auto 20px', lineHeight: 1.65 },

  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 },
  card:        { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 18, cursor: 'pointer', transition: 'border-color 0.18s, box-shadow 0.18s' },
  cardTop:     { display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 9 },
  cardTitle:   { fontSize: 13.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35, wordBreak: 'break-word', fontFamily: 'var(--font-display)' },
  cardDate:    { fontSize: 11, color: 'var(--text3)', marginTop: 2 },
  cardSummary: { fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 9, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardMeta:    { display: 'flex', gap: 12, marginBottom: 9 },
  metaItem:    { display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: 11.5, color: 'var(--text3)' },

  modeSwitcher: { display: 'flex', marginBottom: 16, background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: 3, border: '1px solid var(--border)' },
  modeBtn:      { flex: 1, display: 'flex', gap: 7, alignItems: 'center', justifyContent: 'center', padding: '8px 14px', borderRadius: 5, border: 'none', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, transition: 'all 0.14s' },
  modeBtnActive:{ background: 'var(--card)', color: 'var(--accent-t)', boxShadow: 'var(--shadow-sm)', fontWeight: 700, border: '1px solid var(--accent-r)' },

  inputCard:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: 20 },
  smallLabel: { fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: 'var(--font-display)' },

  recIconWrap: { width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-s)', border: '1px solid var(--accent-r)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' },
  recHead:     { fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 10, fontFamily: 'var(--font-display)' },
  recSub:      { color: 'var(--text2)', fontSize: 13.5, lineHeight: 1.7, maxWidth: 380, margin: '0 auto 26px' },
  recLive:     { display: 'inline-flex', gap: 7, alignItems: 'center', padding: '6px 16px', background: 'var(--danger-s)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 99, color: 'var(--danger)', fontSize: 13, fontWeight: 600, marginBottom: 16 },

  dropZone:      { border: '1.5px dashed var(--border2)', borderRadius: 'var(--r-lg)', padding: '40px 32px', textAlign: 'center', cursor: 'pointer', background: 'var(--card)', transition: 'border-color 0.15s, background 0.15s' },
  dropZoneActive:{ borderColor: 'var(--accent)', background: 'var(--accent-s)' },
  dropIconWrap:  { width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-s)', border: '1px solid var(--accent-r)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
  dropTitle:     { fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6, fontFamily: 'var(--font-display)' },
  dropSub:       { fontSize: 12.5, color: 'var(--text3)', lineHeight: 1.6 },
  fileCard:      { display: 'flex', gap: 12, alignItems: 'center', background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 'var(--r-lg)', padding: '14px 16px' },
  fileCardIcon:  { width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'var(--accent-s)', border: '1px solid var(--accent-r)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fileName:      { fontSize: 13.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 },
  fileMeta:      { fontSize: 11.5, color: 'var(--text3)' },

  successBar:    { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--success-s)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 6, marginBottom: 18 },
  aiRow:         { display: 'flex', gap: 7, padding: '6px 0', borderBottom: '1px solid var(--border)' },
  body2:         { fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 },
  muted:         { fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' },
  transcriptBox: { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px', fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.85, maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap' },

  drawer:      { width: 380, flexShrink: 0, background: 'var(--sidebar-bg)', borderLeft: '1px solid var(--border)', overflowY: 'auto', position: 'sticky', top: 0, height: '100vh' },
  drawerHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 },
  drawerTitle: { fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, flex: 1, color: 'var(--text)', lineHeight: 1.3 },
  drawerMeta:  { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 },
};
