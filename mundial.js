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
