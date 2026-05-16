/* ============================================
   LATRICOLOR.CO — /mundial page
   Calendar, countdown, email capture form.
   Shares the page with app.js (audio, promo bar, WA injection).
   ============================================ */

(function initMundialNextCountdown() {
  // First Colombia kickoff used as the "next match" countdown anchor.
  // Calendar component (commit 2) refines this once the JSON is loaded.
  const FALLBACK_KICKOFF = new Date('2026-06-11T16:00:00-05:00').getTime();
  const els = {
    d: document.getElementById('mn-days'),
    h: document.getElementById('mn-hours'),
    m: document.getElementById('mn-mins'),
  };
  let target = FALLBACK_KICKOFF;

  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) {
      if (els.d) els.d.textContent = '0';
      if (els.h) els.h.textContent = '0';
      if (els.m) els.m.textContent = '0';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (els.d) els.d.textContent = String(d);
    if (els.h) els.h.textContent = String(h);
    if (els.m) els.m.textContent = String(m);
  }
  tick();
  setInterval(tick, 60000);

  // Expose so the calendar component can swap the target to the actual
  // next Colombia match once it parses the JSON.
  window.__mundialSetNext = (timestamp) => {
    target = timestamp;
    tick();
  };
})();

// ============================================
// FORM CAPTURE — POST email to /api/subscribe
// ============================================
(function initMundialForm() {
  const form = document.getElementById('mundialForm');
  if (!form) return;
  const emailInput = document.getElementById('mfEmail');
  const submitBtn = document.getElementById('mfSubmit');
  const feedback = document.getElementById('mfFeedback');

  function setState(state) {
    if (feedback) feedback.dataset.state = state;
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (emailInput?.value || '').trim();
    if (!EMAIL_RE.test(email)) {
      setState('invalid');
      emailInput?.focus();
      return;
    }
    setState('loading');
    submitBtn.disabled = true;
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'mundial' }),
      });
      if (res.ok) {
        setState('success');
        emailInput.value = '';
      } else {
        const data = await res.json().catch(() => ({}));
        setState(data.error === 'invalid' ? 'invalid' : 'error');
      }
    } catch (_) {
      setState('error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  emailInput?.addEventListener('input', () => {
    if (feedback?.dataset.state !== 'idle') setState('idle');
  });
})();

// ============================================
// CALENDAR — load /assets/mundial-2026.json and render match cards.
// Colombia matches get a styled card with outfit recommendation; other
// notable matches get a compact card. Status: upcoming / live / played.
// ============================================
(function initCalendar() {
  const container = document.getElementById('mundialMatches');
  if (!container) return;

  const COL_TZ = 'America/Bogota';
  const NOW = () => Date.now();
  const HOUR = 3600000;

  function fmtDate(d) {
    return d.toLocaleDateString('es-CO', {
      timeZone: COL_TZ,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('es-CO', {
      timeZone: COL_TZ,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  function fmtCountdown(diffMs) {
    if (diffMs <= 0) return null;
    const d = Math.floor(diffMs / 86400000);
    const h = Math.floor((diffMs % 86400000) / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function statusFor(match) {
    const start = new Date(match.date).getTime();
    const end = start + 2 * HOUR; // ~120min match window
    const now = NOW();
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'live';
    return 'played';
  }

  function teamLabel(t) {
    return `<span class="m-team"><span class="m-flag" aria-hidden="true">${t.flag || '🏁'}</span>${escapeHtml(t.name)}</span>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function renderCard(match) {
    const dt = new Date(match.date);
    const status = statusFor(match);
    const isCol = !!match.is_colombia;
    const cls = [
      'm-card',
      isCol ? 'm-card-col' : 'm-card-other',
      `m-status-${status}`,
      match.outfit ? `m-outfit-${match.outfit}` : '',
    ].filter(Boolean).join(' ');

    const dateLine = `
      <div class="m-when">
        <span class="m-date">${fmtDate(dt)}</span>
        <span class="m-time">${fmtTime(dt)} <small>COL</small></span>
      </div>`;

    const statusBadge =
      status === 'live'     ? '<span class="m-status m-status-live"><span class="m-live-dot"></span> EN VIVO</span>' :
      status === 'played'   ? '<span class="m-status m-status-played">JUGADO</span>' :
      `<span class="m-status m-status-upcoming">${fmtCountdown(dt.getTime() - NOW()) || 'Próximo'}</span>`;

    const scoreLine = (status !== 'upcoming' && match.score_home != null && match.score_away != null)
      ? `<div class="m-score">${match.score_home} <span>—</span> ${match.score_away}</div>`
      : '';

    const phaseTag = `<span class="m-phase">${escapeHtml(match.phase)}${match.group ? ' · Grupo ' + match.group : ''}</span>`;

    const outfit = isCol && match.outfit ? `
      <div class="m-outfit">
        <span class="m-outfit-tag">★ Outfit Recomendado ★</span>
        <span class="m-outfit-name">${escapeHtml(match.outfit_label || match.outfit)}</span>
        <a href="/#collection" class="m-outfit-cta">Pedir esta edición →</a>
      </div>` : '';

    const note = match.note ? `<p class="m-note">${escapeHtml(match.note)}</p>` : '';

    return `
      <article class="${cls}" data-id="${escapeHtml(match.id)}">
        <div class="m-head">
          ${phaseTag}
          ${statusBadge}
        </div>
        ${dateLine}
        <div class="m-teams">
          ${teamLabel(match.team_home)}
          <span class="m-vs">vs</span>
          ${teamLabel(match.team_away)}
        </div>
        ${scoreLine}
        <p class="m-stadium">${escapeHtml(match.stadium)}</p>
        ${note}
        ${outfit}
      </article>`;
  }

  function pickUrgency(matches) {
    const now = NOW();
    return matches.find((m) =>
      m.is_colombia &&
      new Date(m.date).getTime() > now &&
      new Date(m.date).getTime() - now < 72 * HOUR
    );
  }

  function activateUrgencyBanner(match) {
    const banner = document.getElementById('mundialUrgency');
    if (!banner) return;
    const rivalEl = document.getElementById('muRival');
    const inEl = document.getElementById('muIn');
    const rival = match.team_home.code === 'COL' ? match.team_away : match.team_home;
    const dt = new Date(match.date);
    if (rivalEl) rivalEl.textContent = `vs ${rival.name}`;
    if (inEl) inEl.textContent = fmtCountdown(dt.getTime() - NOW()) || 'Próximamente';
    banner.removeAttribute('hidden');
    banner.classList.add('visible');
  }

  function setHeroNext(matches) {
    const now = NOW();
    const nextCol = matches
      .filter((m) => m.is_colombia && new Date(m.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    if (nextCol && typeof window.__mundialSetNext === 'function') {
      window.__mundialSetNext(new Date(nextCol.date).getTime());
    }
  }

  fetch('/assets/mundial-2026.json', { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('json load failed');
      return res.json();
    })
    .then((data) => {
      const matches = (data && data.matches) || [];
      // Visible set: all Colombia matches + all highlight matches.
      // Other matches stay in JSON for future expansion but don't
      // clutter the page.
      const visible = matches.filter((m) => m.is_colombia || m.is_highlight);
      container.innerHTML = visible.map(renderCard).join('');
      setHeroNext(matches);
      const urgent = pickUrgency(matches);
      if (urgent) activateUrgencyBanner(urgent);
    })
    .catch(() => {
      container.innerHTML = '<p class="mm-loading">No pudimos cargar el calendario. Recargá la página en un momento.</p>';
    });
})();
