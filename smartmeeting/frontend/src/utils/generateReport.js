/**
 * generateReport — Creates a professional meeting report and opens it
 * in a new tab ready to Print / Save as PDF. No external libraries needed.
 */
export function generateReport(meeting, userName = '') {
  const fmt = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const actionItemsHtml = (meeting.action_items || []).length > 0
    ? (meeting.action_items || []).map((a, i) => `
        <tr>
          <td class="ai-num">${i + 1}</td>
          <td>${esc(a)}</td>
        </tr>`).join('')
    : '<tr><td colspan="2" class="empty-cell">No action items detected.</td></tr>';

  const tagsHtml = (meeting.tags || []).length > 0
    ? (meeting.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')
    : '<span class="empty-cell">No topics extracted.</span>';

  const transcriptHtml = meeting.transcript?.trim()
    ? esc(meeting.transcript.trim()).replace(/\n/g, '<br>')
    : '<em class="empty-cell">No transcript available.</em>';

  const summaryHtml = meeting.summary?.trim()
    ? esc(meeting.summary.trim()).replace(/\n/g, '<br>')
    : '<em class="empty-cell">No summary was generated for this meeting.</em>';

  const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Meeting Report — ${esc(meeting.title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:#111827;font-size:13.5px;line-height:1.65;-webkit-font-smoothing:antialiased}
.page{max-width:820px;margin:0 auto;padding:48px 56px}

.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #6366f1;margin-bottom:36px}
.brand{font-family:'Plus Jakarta Sans',sans-serif;font-size:24px;font-weight:800;color:#6366f1;letter-spacing:-0.03em}
.brand em{color:#111827;font-style:normal}
.report-tag{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#9ca3af;margin-top:3px}
.header-right{text-align:right;font-size:12px;color:#6b7280;line-height:1.9}
.header-right b{color:#374151;font-weight:600}

.meeting-title{font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.025em;line-height:1.2;margin-bottom:16px}
.pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:32px}
.pill{display:inline-flex;align-items:center;gap:5px;padding:4px 13px;border-radius:99px;font-size:12px;font-weight:500;border:1px solid}
.p-blue{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe}
.p-green{background:#f0fdf4;color:#15803d;border-color:#bbf7d0}
.p-amber{background:#fffbeb;color:#b45309;border-color:#fde68a}
.p-slate{background:#f8fafc;color:#475569;border-color:#e2e8f0}

.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:36px}
.stat{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;text-align:center}
.stat-val{font-family:'Plus Jakarta Sans',sans-serif;font-size:26px;font-weight:800;color:#6366f1;line-height:1;margin-bottom:5px}
.stat-lbl{font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.07em}

.section{margin-bottom:32px;page-break-inside:avoid}
.sh{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1.5px solid #e5e7eb;margin-bottom:16px}
.si{width:28px;height:28px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.st{font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.1em}

.summary-box{background:#f5f3ff;border-left:4px solid #6366f1;border-radius:0 10px 10px 0;padding:18px 22px;font-size:14px;line-height:1.8;color:#374151}

table{width:100%;border-collapse:collapse;font-size:13.5px}
thead th{background:#f3f4f6;padding:10px 14px;text-align:left;font-weight:600;color:#374151;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em}
tbody tr{border-bottom:1px solid #f3f4f6}
tbody tr:last-child{border-bottom:none}
tbody td{padding:11px 14px;color:#374151}
tbody tr:nth-child(even) td{background:#fafafa}
.ai-num{width:36px;font-weight:700;color:#6366f1;font-size:12px}

.tags-wrap{display:flex;flex-wrap:wrap;gap:8px}
.tag{padding:5px 13px;background:#eef2ff;color:#4338ca;border-radius:99px;font-size:12px;font-weight:500;border:1px solid #c7d2fe}

.transcript-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:22px;font-size:13px;line-height:1.9;color:#4b5563;white-space:pre-wrap;word-break:break-word}

.empty-cell{color:#9ca3af;font-style:italic}

.footer{margin-top:48px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#9ca3af}
.footer-brand{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;color:#6366f1;font-size:13px}
.footer-brand em{color:#9ca3af;font-style:normal}

@media print{
  body{font-size:12px}
  .page{padding:20px 30px}
  .transcript-box{max-height:none;overflow:visible}
  @page{margin:1.2cm}
}
</style>
</head>
<body>
<div class="page">

<div class="header">
  <div>
    <div class="brand">Meet<em>IQ</em></div>
    <div class="report-tag">Meeting Intelligence Report</div>
  </div>
  <div class="header-right">
    <div><b>Generated:</b> ${now}</div>
    ${userName ? `<div><b>Prepared for:</b> ${esc(userName)}</div>` : ''}
    <div><b>Report ID:</b> ${esc((meeting.id || '').slice(0, 8).toUpperCase())}</div>
  </div>
</div>

<div class="meeting-title">${esc(meeting.title)}</div>
<div class="pills">
  <span class="pill p-slate">📅 ${fmt(meeting.created_at)}</span>
  <span class="pill p-blue">⏱ ${meeting.duration_min ? Number(meeting.duration_min).toFixed(1) : '0'} min</span>
  <span class="pill p-green">💬 ${(meeting.word_count || 0).toLocaleString()} words</span>
  ${(meeting.action_items || []).length > 0
    ? `<span class="pill p-amber">✅ ${meeting.action_items.length} action item${meeting.action_items.length !== 1 ? 's' : ''}</span>`
    : ''}
</div>

<div class="stats-grid">
  <div class="stat">
    <div class="stat-val">${meeting.duration_min ? Number(meeting.duration_min).toFixed(1) : '0'}</div>
    <div class="stat-lbl">Duration (min)</div>
  </div>
  <div class="stat">
    <div class="stat-val">${(meeting.word_count || 0).toLocaleString()}</div>
    <div class="stat-lbl">Words Spoken</div>
  </div>
  <div class="stat">
    <div class="stat-val">${(meeting.action_items || []).length}</div>
    <div class="stat-lbl">Action Items</div>
  </div>
</div>

<div class="section">
  <div class="sh"><div class="si">📋</div><div class="st">Executive Summary</div></div>
  <div class="summary-box">${summaryHtml}</div>
</div>

<div class="section">
  <div class="sh"><div class="si">✅</div><div class="st">Action Items</div></div>
  <table>
    <thead><tr><th style="width:44px">#</th><th>Task</th></tr></thead>
    <tbody>${actionItemsHtml}</tbody>
  </table>
</div>

<div class="section">
  <div class="sh"><div class="si">🏷️</div><div class="st">Key Topics</div></div>
  <div class="tags-wrap">${tagsHtml}</div>
</div>

<div class="section">
  <div class="sh"><div class="si">📝</div><div class="st">Full Transcript</div></div>
  <div class="transcript-box">${transcriptHtml}</div>
</div>

<div class="footer">
  <div class="footer-brand">Meet<em>IQ</em></div>
  <div>Confidential &mdash; For internal use only</div>
  <div>Page 1 of 1</div>
</div>

</div>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=960,height=750,scrollbars=yes');
  if (!w) {
    alert('Pop-up blocked! Please allow pop-ups for this site, then click Download Report again.');
    return;
  }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 900);
}
