/* ============================================
   LATRICOLOR.CO — V5 HINCHADA CHAOS
   Sé Fuerte. Sé Fiera. Sé Tricolor.
   ============================================ */

// Single source of truth for the WhatsApp number.
// Format: 57 + 10-digit Colombian national number, no `+`, no spaces.
// ⚠️ Placeholder — replace when the real line is ready.
const WHATSAPP_NUMBER = '34604828758';

// Divarte × LATRICOLOR collab bags route to Nay's own WhatsApp line
// (+33 7 80 66 05 34), separate from the main LATRICOLOR number above.
// Used ONLY for the 2 Divarte bag links/modals — everything else stays
// on WHATSAPP_NUMBER.
const DIVARTE_WHATSAPP_NUMBER = '33780660534';

const DEFAULT_WA_MSG = 'Hola! Quiero pedir mi body de La Tricolor 🇨🇴';

// Map each promo code to its display percentage. TRICOLOR15 is awarded
// by the exit-intent modal and REPLACES TRICOLOR10 in the same session
// keys — they never stack.
const PROMO_PCT = { TRICOLOR10: '-10%', TRICOLOR15: '-15%' };

// Append the promo code line to ANY WhatsApp message when a promo is
// active AND hasn't expired. Reads sessionStorage live so the same
// href compute path naturally flips on/off (and switches code) as the
// promo lifecycle changes.
function applyPromoToMsg(msg) {
  try {
    const promo = sessionStorage.getItem('tricolor_promo');
    const expires = parseInt(sessionStorage.getItem('tricolor_promo_expires') || '0', 10);
    if (promo === 'ACTIVE' && Date.now() < expires) {
      const code = sessionStorage.getItem('tricolor_promo_code') || 'TRICOLOR10';
      const pct = PROMO_PCT[code] || '-10%';
      return msg + '\n\n' + '🎁 Tengo código ' + code + ' (' + pct + ')';
    }
  } catch (_) {}
  return msg;
}

// `number` defaults to the main LATRICOLOR line; pass DIVARTE_WHATSAPP_NUMBER
// for the collab bags.
const buildWaUrl = (msg, number) =>
  `https://wa.me/${number || WHATSAPP_NUMBER}?text=${encodeURIComponent(applyPromoToMsg(msg || DEFAULT_WA_MSG))}`;

// ============================================
// TIKTOK PIXEL — safe track wrapper. Pixel base code loads in <head>;
// if it hasn't initialized (network failure, ad blocker), every call
// no-ops instead of throwing.
// ============================================
function ttqTrack(event, params) {
  if (window.ttq && typeof window.ttq.track === 'function') {
    try { window.ttq.track(event, params); } catch (_) {}
  }
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// WHATSAPP LINK INJECTION
// Every <a data-wa data-wa-msg="..."> gets its href built from the constant
// above. Keep the number in one place to avoid drift. Brand reference
// inside the message bodies is "La Tricolor" (the way Colombians say it)
// even though the domain + logo render as LATRICOLOR.CO.
//
// Factored into a function so the splash + promo-bar can re-run it
// whenever the promo state flips (activate or expire), keeping every
// data-wa link's href in sync with the live promo state.
// ============================================
function refreshAllWaLinks() {
  document.querySelectorAll('[data-wa]').forEach((el) => {
    // Links inside the #divarte section (bag CTAs + "Escríbile a Nay")
    // route to Nay's Divarte line; everything else stays on LATRICOLOR.
    const number = el.closest('#divarte') ? DIVARTE_WHATSAPP_NUMBER : undefined;
    el.href = buildWaUrl(el.dataset.waMsg, number);
    if (!el.target) el.target = '_blank';
    el.rel = 'noopener';
  });
}
refreshAllWaLinks();
window.__refreshWaLinks = refreshAllWaLinks;

// TikTok ClickButton — fire on any click that resolves to a WhatsApp
// link or our yellow CTA class. Delegated at document level so it
// covers dynamically-rebuilt hrefs (data-wa) and future elements.
// Doesn't preventDefault — the WhatsApp window still opens normally.
document.addEventListener('click', (e) => {
  const el = e.target.closest('a[href*="wa.me"], a[href*="whatsapp"], .cta-yellow');
  if (!el) return;
  ttqTrack('ClickButton', {
    content_name: 'WhatsApp CTA',
    content_id: 'whatsapp_pedir',
    description: 'User clicked PEDIR EL MÍO or WhatsApp link'
  });
}, { capture: true });

// /api/track price_cta_click for the homepage 1/2/3 quantity CTAs.
// variant tag = HOME (organic homepage, kept distinct from A/B/C landings).
// Best-effort, never blocks the WhatsApp hop.
document.addEventListener('click', (e) => {
  const el = e.target.closest('.qty-cta');
  if (!el) return;
  try {
    const p = JSON.stringify({ variant: 'HOME', event: 'price_cta_click', meta: { msg: el.dataset.waMsg || '' } });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([p], { type: 'application/json' }));
    else fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: p, keepalive: true });
  } catch (_) {}
}, { capture: true });

// ============================================
// STOCK URGENCY — randomized scarcity number per card.
// Each [data-stock] element gets a fresh 8-23 unit count at page load.
// Stock is psychological, not inventory truth — keeps the soft urgency
// feeling fresh on every visit without lying about specific numbers.
// ============================================
(function injectStockNumbers() {
  document.querySelectorAll('[data-stock]').forEach((el) => {
    const n = 8 + Math.floor(Math.random() * 16); // 8..23 inclusive
    const strong = el.querySelector('strong');
    if (strong) strong.textContent = String(n);
  });
})();

// ============================================
// COUNTDOWN — Mundial 2026 kickoff (11 jun 2026, 16:00 COL)
// ============================================
const MUNDIAL_DATE = new Date('2026-06-11T16:00:00-05:00').getTime();
const cdEls = {
  d: document.getElementById('cd-days'),
  h: document.getElementById('cd-hours'),
  m: document.getElementById('cd-mins'),
  s: document.getElementById('cd-secs'),
};
// Mirror set on the splash screen — same numbers, different layout.
const splashCdEls = {
  d: document.getElementById('splash-days'),
  h: document.getElementById('splash-h'),
  m: document.getElementById('splash-m'),
  s: document.getElementById('splash-s'),
};
function updateCountdown() {
  const diff = MUNDIAL_DATE - Date.now();
  if (diff <= 0) {
    Object.values(cdEls).forEach((el) => { if (el) el.textContent = '00'; });
    Object.values(splashCdEls).forEach((el) => { if (el) el.textContent = '00'; });
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (cdEls.d) cdEls.d.textContent = String(d).padStart(2, '0');
  if (cdEls.h) cdEls.h.textContent = String(h).padStart(2, '0');
  if (cdEls.m) cdEls.m.textContent = String(m).padStart(2, '0');
  if (cdEls.s) cdEls.s.textContent = String(s).padStart(2, '0');
  // Splash uses unpadded days ("EMPIEZA EN 27 DÍAS"), padded HH:MM:SS.
  if (splashCdEls.d) splashCdEls.d.textContent = String(d);
  if (splashCdEls.h) splashCdEls.h.textContent = String(h).padStart(2, '0');
  if (splashCdEls.m) splashCdEls.m.textContent = String(m).padStart(2, '0');
  if (splashCdEls.s) splashCdEls.s.textContent = String(s).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================
// DAILY COUNTDOWN — "Oferta válida solo hoy: HH:MM:SS"
// Counts down to midnight in the user's local timezone. The "today"
// boundary is per-user — easier and more relatable than forcing COL
// time on a buyer who's already on latricolor.co.
// ============================================
const dcEls = {
  h: document.getElementById('dc-hours'),
  m: document.getElementById('dc-mins'),
  s: document.getElementById('dc-secs'),
};
function updateDailyCountdown() {
  if (!dcEls.h) return;
  const now = new Date();
  const eod = new Date(now);
  eod.setHours(23, 59, 59, 999);
  const diff = eod - now;
  if (diff <= 0) {
    dcEls.h.textContent = '00';
    dcEls.m.textContent = '00';
    dcEls.s.textContent = '00';
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  dcEls.h.textContent = String(h).padStart(2, '0');
  dcEls.m.textContent = String(m).padStart(2, '0');
  dcEls.s.textContent = String(s).padStart(2, '0');
}
updateDailyCountdown();
setInterval(updateDailyCountdown, 1000);

// ============================================
// COMBINED SCROLL HANDLER (nav + sticky WA)
// One rAF-throttled listener instead of two passive ones.
// ============================================
const nav = document.getElementById('nav');
const waFloat = document.getElementById('waFloat');
waFloat.style.opacity = '0';
waFloat.style.transform = 'translateY(20px)';
waFloat.style.transition = 'opacity 0.4s ease, transform 0.4s ease, background 0.3s, box-shadow 0.15s';

let scrollTicking = false;
let inlineWaInView = false;
let stickyBarVisible = false;
let scrollHooks = [];
function registerScrollHook(fn) { scrollHooks.push(fn); }
function applyWaFloatVisibility() {
  const y = window.scrollY;
  const visible = y > 300 && !inlineWaInView && !stickyBarVisible;
  waFloat.style.opacity = visible ? '1' : '0';
  waFloat.style.transform = visible ? 'translateY(0)' : 'translateY(20px)';
  waFloat.style.pointerEvents = visible ? 'auto' : 'none';
}
function onScroll() {
  const y = window.scrollY;
  if (y > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
  applyWaFloatVisibility();
  scrollHooks.forEach((fn) => fn(y));
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(onScroll);
    scrollTicking = true;
  }
}, { passive: true });

// Hide the sticky WA float whenever an inline WhatsApp CTA enters the viewport.
// Two same-color CTAs side by side dilute the funnel and the sticky button
// physically overlaps the inline ones near the bottom of the .how and
// .cta-final sections.
const inlineWaCtas = document.querySelectorAll('.btn-wa, .mobile-cta');
if (inlineWaCtas.length) {
  const visibleSet = new Set();
  const waInlineObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) visibleSet.add(e.target);
      else visibleSet.delete(e.target);
    });
    inlineWaInView = visibleSet.size > 0;
    applyWaFloatVisibility();
  }, { threshold: 0 });
  inlineWaCtas.forEach((el) => waInlineObs.observe(el));
}

// ============================================
// MOBILE MENU
// ============================================
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
function closeMobileMenu() {
  burger.classList.remove('active');
  mobileMenu.classList.remove('active');
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
burger.setAttribute('aria-expanded', 'false');
burger.setAttribute('aria-controls', 'mobileMenu');
burger.addEventListener('click', () => {
  const open = !mobileMenu.classList.contains('active');
  burger.classList.toggle('active', open);
  mobileMenu.classList.toggle('active', open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});
mobileMenu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

// ============================================
// REVEAL ON SCROLL
// ============================================
const reveals = document.querySelectorAll('.reveal');
if (prefersReducedMotion) {
  reveals.forEach((el) => el.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el) => revealObserver.observe(el));
}

// ============================================
// PRODUCT DATA
// Visual edition names match the V5 Panini-card direction.
// Color keys stay semantic (capitana/portera/oronegro/cafetera) so app.js
// stays decoupled from CSS class renames.
// ============================================
// Each product carries an ordered `photos` array of file basenames
// under /images/products/ (without extension). The modal renders a
// <picture> per photo (WebP + JPG) and exposes prev/next arrows + dots
// when length > 1. To add a second / third angle later, just push the
// new basename onto the array — no JS or HTML changes required.
const productData = {
  capitana: {
    name: 'La Capitana',
    desc: 'El amarillo eterno de la Tricolor. Titular #10, edición Home Mundial 2026. Tela técnica AEROREADY, costuras planas reforzadas, detalles bordados exclusivos. La pieza icónica que toda cafetera necesita.',
    tag: 'Home · Titular #10',
    price: '$89.000',
    old: '$149.000',
    color: 'capitana',
    photos: ['product-capitana'],
  },
  portera: {
    name: 'La Portera',
    desc: 'Arquera #01, edición Away con estética vintage de los 90s reinterpretada. Azul retro con detalles geométricos exclusivos. Stock muy limitado, solo para las que entienden.',
    tag: 'Away · Arquera #01',
    price: '$89.000',
    old: '$149.000',
    color: 'portera',
    photos: ['product-portera'],
  },
  oronegro: {
    name: 'Oro Negro',
    desc: 'Estrella #07, edición Premium en negro absoluto con detalles dorados. Para la mujer que no necesita pedir permiso. Máxima elegancia, mínimo esfuerzo.',
    tag: 'Premium · Estrella #07',
    price: '$89.000',
    old: '$149.000',
    color: 'oronegro',
    photos: ['product-oro-negro'],
  },
  cafetera: {
    name: 'La Cafetera',
    desc: 'Goleadora #09, edición Alterna con la energía y pasión cafetera. Rojo vibrante que captura la atención. Para las que sienten la Tricolor a flor de piel.',
    tag: 'Alterna · Goleadora #09',
    price: '$89.000',
    old: '$149.000',
    color: 'cafetera',
    photos: ['product-cafetera'],
  },
  // Divarte × LATRICOLOR collab bags — reuse the modal carousel, but their
  // photos live in /images/divarte/ (dir) and they track as bags, not
  // bodies. ctaMsg mirrors each card's WhatsApp reservation message.
  lahincha: {
    name: 'La Hincha',
    desc: 'Bolso tricolor crochet hecho a mano, edición Mundial Divarte × LATRICOLOR. Tejido en hilo grueso con banderola amarilla, azul y roja. Para ir al estadio sin perder elegancia. Solo 5 unidades en el mundo. Cada bolso viene con un body LATRICOLOR de regalo, en el color que elijas. El look tricolor completo.',
    tag: 'Bolso Crochet · Edición #01',
    price: '$200.000',
    old: '',
    color: 'lahincha',
    dir: '/images/divarte/',
    photos: ['bag-hincha', 'bag-hincha2', 'bag-hincha3', 'bag-hincha4', 'bag-hincha5'],
    track: { content_name: 'Bolso Divarte x LATRICOLOR', content_id: 'la-hincha', value: 200000, currency: 'COP' },
    ctaMsg: 'Hola quiero reservar LA HINCHA edición Mundial Divarte × LATRICOLOR (con body de regalo)',
    trust: '★ Pago contraentrega · Envío 24-72h',
    waNumber: DIVARTE_WHATSAPP_NUMBER,
    // Bag, not a body: no size selector, its own craft-led feature list.
    talla: false,
    features: [
      'Body LATRICOLOR de regalo · color a elección',
      'Tejido a mano en hilo grueso',
      'Banderola amarilla, azul y roja',
      'Cada pieza tarda 2-3 días en hacerse',
      'Solo 5 unidades en el mundo · Edición #01',
    ],
  },
  latribu: {
    name: 'La Tribu',
    desc: 'Bolso tricolor crochet hecho a mano, edición Mundial Divarte × LATRICOLOR. Más grande, más bandera, más memoria. Tejido en hilo grueso con banderola amarilla, azul y roja. Solo 5 unidades en el mundo. Cada bolso viene con un body LATRICOLOR de regalo, en el color que elijas. El look tricolor completo.',
    tag: 'Bolso Crochet · Edición #02',
    price: '$280.000',
    old: '',
    color: 'latribu',
    dir: '/images/divarte/',
    photos: ['bag-tribu', 'bag-tribu2', 'bag-tribu3', 'bag-tribu4'],
    track: { content_name: 'Bolso Divarte x LATRICOLOR', content_id: 'la-tribu', value: 280000, currency: 'COP' },
    ctaMsg: 'Hola quiero reservar LA TRIBU edición Mundial Divarte × LATRICOLOR (con body de regalo)',
    trust: '★ Pago contraentrega · Envío 24-72h',
    waNumber: DIVARTE_WHATSAPP_NUMBER,
    // Bag, not a body: no size selector, its own craft-led feature list.
    talla: false,
    features: [
      'Body LATRICOLOR de regalo · color a elección',
      'Tejido a mano en hilo grueso',
      'Banderola amarilla, azul y roja',
      'Cada pieza tarda 2-3 días en hacerse',
      'Solo 5 unidades en el mundo · Edición #02',
    ],
  },
};

// ============================================
// MODAL — entire block guarded so /mundial and other pages without
// the product modal in their DOM don't throw on first-paint.
// ============================================
const modal = document.getElementById('modal');
if (modal) {
const modalDialog = modal.querySelector('.modal');
const modalClose = document.getElementById('modalClose');
const modalVisual = document.getElementById('modalVisual');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTag = document.getElementById('modalTag');
const modalPriceNow = document.getElementById('modalPriceNow');
const modalPriceOld = document.getElementById('modalPriceOld');
const modalCta = document.getElementById('modalCta');
// Body-only blocks — captured once so we can restore them after a
// non-body product (the Divarte bag) swapped/hid them.
const modalTallaEl = modalDialog.querySelector('.modal-talla');
const modalFeaturesEl = modalDialog.querySelector('.modal-features');
const modalSaveEl = modalDialog.querySelector('.mp-save');
const modalTrustEl = modalDialog.querySelector('.modal-trust');
const FEATURES_DEFAULT_HTML = modalFeaturesEl ? modalFeaturesEl.innerHTML : null;
const TRUST_DEFAULT = modalTrustEl ? modalTrustEl.textContent : null;

let modalReturnFocus = null;

function focusableInModal() {
  return modalDialog.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  const f = focusableInModal();
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// Carousel state — the modal renders one product's photos at a time.
// Reset every openModal(); arrows + dots only show when length > 1.
let modalPhotos = [];
let modalPhotoIdx = 0;
// Image folder for the current product's photos. Bodies live in
// /images/products/; the Divarte bag overrides this via data.dir.
let modalDir = '/images/products/';
const modalNavPrev = document.getElementById('modalNavPrev');
const modalNavNext = document.getElementById('modalNavNext');
const modalDots    = document.getElementById('modalDots');

function renderModalPhoto() {
  if (!modalPhotos.length) return;
  const file = modalPhotos[modalPhotoIdx];
  const picture = modalVisual.querySelector('.modal-photo');
  if (!picture) return;
  const source = picture.querySelector('source');
  const img    = picture.querySelector('img');
  if (source) source.srcset = modalDir + file + '.webp';
  if (img)    img.src       = modalDir + file + '.jpg';
  if (modalDots) {
    modalDots.querySelectorAll('.modal-dot').forEach((d, i) => {
      const active = i === modalPhotoIdx;
      d.setAttribute('aria-selected', active ? 'true' : 'false');
      d.classList.toggle('active', active);
    });
  }
}

function renderModalDots(count) {
  if (!modalDots) return;
  modalDots.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modal-dot';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', 'Foto ' + (i + 1) + ' de ' + count);
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    if (i === 0) btn.classList.add('active');
    btn.addEventListener('click', () => { modalPhotoIdx = i; renderModalPhoto(); });
    modalDots.appendChild(btn);
  }
}

function cyclePhoto(delta) {
  if (modalPhotos.length < 2) return;
  modalPhotoIdx = (modalPhotoIdx + delta + modalPhotos.length) % modalPhotos.length;
  renderModalPhoto();
}

// Bind carousel controls once at boot — handlers are no-ops when
// modalPhotos has fewer than 2 entries.
if (modalNavPrev) modalNavPrev.addEventListener('click', (e) => { e.stopPropagation(); cyclePhoto(-1); });
if (modalNavNext) modalNavNext.addEventListener('click', (e) => { e.stopPropagation(); cyclePhoto(1); });

// Swipe support — pointerType=touch only so desktop mouse drags don't
// fire it. 50px threshold, single-axis.
let touchStartX = null;
modalVisual.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  touchStartX = e.clientX;
});
modalVisual.addEventListener('pointerup', (e) => {
  if (touchStartX === null) return;
  const dx = e.clientX - touchStartX;
  touchStartX = null;
  if (Math.abs(dx) > 50) cyclePhoto(dx < 0 ? 1 : -1);
});

// Map internal color keys to the public product slugs used in
// analytics events (oronegro → oro-negro, others passthrough).
const PRODUCT_SLUG_MAP = { oronegro: 'oro-negro' };

function openModal(color, returnTo) {
  const data = productData[color];
  if (!data) return;
  // TikTok AddToCart — fires every time a product modal opens. Bodies
  // report as 'Body Tricolor' @ 89000; products carrying their own
  // `track` (the Divarte bag) report their real name / id / value.
  ttqTrack('AddToCart', data.track || {
    content_name: 'Body Tricolor',
    content_id: PRODUCT_SLUG_MAP[color] || color,
    content_type: 'product',
    value: 89000,
    currency: 'COP'
  });
  modalReturnFocus = returnTo || document.activeElement;
  modalVisual.className = 'modal-visual color-' + data.color;
  // Photos may live in a different folder (Divarte bag → /images/divarte/).
  modalDir = data.dir || '/images/products/';
  // Build the carousel content fresh on every open. The color-X class
  // keeps the per-edition radial-gradient as a tinted fallback while
  // the photo loads / if it 404s.
  modalPhotos = (data.photos && data.photos.length) ? data.photos.slice() : [];
  modalPhotoIdx = 0;
  const alt = data.name + ' — ' + data.tag;
  const first = modalPhotos[0] || 'product-capitana';
  modalVisual.innerHTML =
    '<picture class="modal-photo">' +
      '<source type="image/webp" srcset="' + modalDir + first + '.webp">' +
      '<img src="' + modalDir + first + '.jpg" alt="' + alt + '" decoding="async">' +
    '</picture>';
  // Re-attach the carousel controls inside .modal-visual every time —
  // innerHTML wipe above removes them otherwise. They live in the
  // static index.html as siblings of <picture>, so we re-append them.
  if (modalNavPrev) modalVisual.appendChild(modalNavPrev);
  if (modalNavNext) modalVisual.appendChild(modalNavNext);
  if (modalDots)    modalVisual.appendChild(modalDots);
  const multi = modalPhotos.length > 1;
  if (modalNavPrev) modalNavPrev.hidden = !multi;
  if (modalNavNext) modalNavNext.hidden = !multi;
  if (modalDots)    modalDots.hidden    = !multi;
  if (multi) renderModalDots(modalPhotos.length);
  modalTitle.textContent = data.name;
  modalDesc.textContent = data.desc;
  modalTag.textContent = data.tag;
  modalPriceNow.textContent = data.price;
  modalPriceOld.textContent = data.old;
  // Body-only blocks: hide the size selector + discount badge for the bag,
  // and swap in its craft-led feature list (restore defaults for bodies).
  if (modalTallaEl) modalTallaEl.style.display = (data.talla === false) ? 'none' : '';
  if (modalSaveEl)  modalSaveEl.style.display  = data.old ? '' : 'none';
  if (modalFeaturesEl) {
    if (data.features && data.features.length) {
      modalFeaturesEl.innerHTML = data.features.map((f) =>
        '<li><svg class="ic"><use href="#ic-check"/></svg> ' + f + '</li>').join('');
    } else if (FEATURES_DEFAULT_HTML != null) {
      modalFeaturesEl.innerHTML = FEATURES_DEFAULT_HTML;
    }
  }
  // Trust line: handmade bags drop the 7-day guarantee (doesn't apply to
  // limited handmade pieces); bodies keep the default line.
  if (modalTrustEl && TRUST_DEFAULT != null) modalTrustEl.textContent = data.trust || TRUST_DEFAULT;
  updateModalCta(data.name, data.price, data.ctaMsg, data.waNumber);
  modal.classList.add('active');
  modal.inert = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', trapFocus);
  // Focus the close button first — least disruptive landing.
  setTimeout(() => modalClose.focus(), 50);
}

function updateModalCta(productName, price, customMsg, waNumber) {
  const msg = customMsg || `Hola! Quiero pedir el body ${productName} 🇨🇴\n\nTalla: única (S a XL)\nPrecio: ${price}\n\nEstá disponible?`;
  modalCta.href = buildWaUrl(msg, waNumber);
  modalCta.target = '_blank';
  modalCta.rel = 'noopener';
}

function closeModal() {
  modal.classList.remove('active');
  modal.inert = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', trapFocus);
  if (modalReturnFocus && typeof modalReturnFocus.focus === 'function') {
    modalReturnFocus.focus();
  }
  modalReturnFocus = null;
}

// `inert` already set in HTML; ensure it's true at boot in case JS was deferred past CSS.
modal.inert = true;

document.querySelectorAll('.product').forEach((card) => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.product-cta')) return;
    openModal(card.dataset.color, card);
  });
  // Keyboard activation — Enter / Space on focused card opens modal too.
  card.addEventListener('keydown', (e) => {
    if (e.target.closest('.product-cta')) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(card.dataset.color, card);
    }
  });
});

document.querySelectorAll('.product-cta, [data-product]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const product = btn.dataset.product;
    if (!product) return;
    const msg = `Hola! Me interesa ${product} 🇨🇴\n\nMe podrías ayudar con la asesoría de talla y confirmar disponibilidad?`;
    window.open(buildWaUrl(msg), '_blank', 'noopener');
  });
});

// Divarte gallery visuals (La Hincha + La Tribu) open the same modal
// carousel as the body cards. Delegated at document level so a click on
// ANY descendant (badge, hint, photo) reliably resolves to the gallery —
// more robust than per-element listeners against overlays / future DOM.
document.addEventListener('click', (e) => {
  const g = e.target.closest('.divarte-gallery[data-color]');
  if (!g) return;
  openModal(g.dataset.color, g);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const g = e.target.closest && e.target.closest('.divarte-gallery[data-color]');
  if (!g) return;
  e.preventDefault();
  openModal(g.dataset.color, g);
});

// ============================================
// DIVARTE × LATRICOLOR — collab bag reservations.
// Each "Reservar el mío" CTA fires AddToCart with the bag's slug + price
// so TikTok Events Manager shows which limited bag pulls the most intent.
// The WhatsApp href itself is built by refreshAllWaLinks() (data-wa), so
// we don't preventDefault here — the chat still opens normally.
// ============================================
document.querySelectorAll('.divarte-cta').forEach((btn) => {
  btn.addEventListener('click', () => {
    ttqTrack('AddToCart', {
      content_name: 'Bolso Divarte x LATRICOLOR',
      content_id: btn.dataset.bagSlug,       // 'la-hincha' | 'la-tribu'
      content_type: 'product',
      value: Number(btn.dataset.bagPrice),   // 200000 | 280000
      currency: 'COP'
    });
  });
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (!modal.classList.contains('active')) return;
  if (e.key === 'Escape')     { closeModal(); }
  else if (e.key === 'ArrowRight') { cyclePhoto(1); }
  else if (e.key === 'ArrowLeft')  { cyclePhoto(-1); }
});


}  // end if (modal)

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    // Account for the stacked top bars (announce + nav + tribune).
    const rootStyles = getComputedStyle(document.documentElement);
    const offsetVar = rootStyles.getPropertyValue('--offset').trim();
    const offsetPx = offsetVar.endsWith('px') ? parseFloat(offsetVar) : 116;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offsetPx - 14;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });
});

// ============================================
// COUNTER ANIMATION
// Supports decimal targets (e.g., 4.9) via data-counter attribute.
// ============================================
const counters = document.querySelectorAll('[data-counter]');
function formatCounter(el, value) {
  const target = parseFloat(el.dataset.counter);
  const isDecimal = !Number.isInteger(target);
  el.textContent = isDecimal ? value.toFixed(1) : Math.floor(value);
}
if (prefersReducedMotion) {
  counters.forEach((c) => { c.textContent = c.dataset.counter; });
} else {
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = parseFloat(entry.target.dataset.counter);
        const duration = 1800;
        const start = Date.now();
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          formatCounter(entry.target, target * eased);
          if (progress < 1) requestAnimationFrame(animate);
          else entry.target.textContent = String(target);
        };
        animate();
        counterObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => counterObs.observe(c));
}

// ============================================
// FAQ — close others when opening one
// ============================================
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      faqItems.forEach((other) => { if (other !== item) other.open = false; });
    }
  });
});

// ============================================
// REVIEWS MARQUEE — clone for seamless infinite loop
// The CSS animation translates to -50%, so the track must contain exactly
// two identical copies of its content.
// ============================================
(function cloneReviewsTrack() {
  const track = document.querySelector('.reviews-track');
  if (!track) return;
  const clone = track.innerHTML;
  // Mark the clone as decorative so screen readers don't repeat reviews.
  const wrapper = document.createElement('div');
  wrapper.innerHTML = clone;
  wrapper.querySelectorAll('[data-review-clone]').forEach((n) => n.remove());
  Array.from(wrapper.children).forEach((n) => {
    n.setAttribute('aria-hidden', 'true');
    n.setAttribute('data-review-clone', '');
    track.appendChild(n);
  });
})();

// ============================================
// STICKY BUY BAR (mobile only)
// Shows from the top of .collection through the bottom of .cta-final,
// then collapses before .footer. The bar reflects whichever product is
// most prominent in the viewport, falling back to the El Once Inicial pack.
// While the bar is visible the sticky #waFloat hides — same reason as the
// inline-CTA observer: one prominent WhatsApp CTA at a time.
// ============================================
const STICKY_BAR_PRODUCTS = {
  capitana: { name: 'La Capitana', price: '$89.000', old: '$149.000', msg: 'Hola! Me interesa La Capitana 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
  portera:  { name: 'La Portera',  price: '$89.000', old: '$149.000', msg: 'Hola! Me interesa La Portera 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
  oronegro: { name: 'Oro Negro',   price: '$89.000', old: '$149.000', msg: 'Hola! Me interesa Oro Negro 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
  cafetera: { name: 'La Cafetera', price: '$89.000', old: '$149.000', msg: 'Hola! Me interesa La Cafetera 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
};
const STICKY_BAR_DEFAULT = {
  name: 'Desde $89K · 🎁 Pack: 2 gorras GRATIS',
  price: '',           // empty → JS collapses the price column
  old: '',
  msg: 'Hola! Quiero pedir mi body de La Tricolor 🇨🇴',
};

const stickyBuy = document.getElementById('stickyBuy');

(function initStickyBuyBar() {
  if (!stickyBuy) return;
  const sbName = document.getElementById('sbName');
  const sbPrice = document.getElementById('sbPrice');
  const sbOld = document.getElementById('sbOld');
  const sbCta = document.getElementById('sbCta');

  const collection = document.getElementById('collection');
  const footer = document.querySelector('.footer');
  if (!collection || !footer) return;

  // Boundaries: show when bottom of viewport is past the collection top,
  // hide when bottom of viewport reaches the footer top.
  function shouldShow() {
    const cTop = collection.getBoundingClientRect().top + window.scrollY;
    const fTop = footer.getBoundingClientRect().top + window.scrollY;
    const viewBottom = window.scrollY + window.innerHeight;
    return viewBottom > cTop + 200 && window.scrollY < fTop - window.innerHeight * 0.6;
  }

  function setProduct(p) {
    sbName.textContent = p.name;
    sbPrice.textContent = p.price || '';
    sbOld.textContent = p.old || '';
    // When no price (default "Desde $89K · 🎁 Pack..." state),
    // collapse the price column so the name has the whole row.
    const priceWrap = sbPrice.parentElement;
    if (priceWrap) priceWrap.style.display = p.price ? '' : 'none';
    sbCta.dataset.waMsg = p.msg;
    sbCta.href = buildWaUrl(p.msg);
  }
  setProduct(STICKY_BAR_DEFAULT);

  // Track which product is most prominent in the viewport.
  const productEls = document.querySelectorAll('.product[data-color]');
  const productVisibility = new Map();
  if (productEls.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        productVisibility.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
      });
      let best = null;
      let bestRatio = 0.55;
      productVisibility.forEach((ratio, el) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = el;
        }
      });
      const data = best ? STICKY_BAR_PRODUCTS[best.dataset.color] : STICKY_BAR_DEFAULT;
      setProduct(data || STICKY_BAR_DEFAULT);
    }, { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] });
    productEls.forEach((el) => obs.observe(el));
  }

  function update() {
    const show = shouldShow();
    if (show === stickyBarVisible) return;
    stickyBarVisible = show;
    stickyBuy.hidden = false;
    document.body.classList.toggle('sticky-buy-on', show);
    requestAnimationFrame(() => stickyBuy.classList.toggle('visible', show));
    applyWaFloatVisibility();
  }

  registerScrollHook(update);
  window.addEventListener('resize', update, { passive: true });
  update();
})();

// ============================================
// CAP PICKER PACK — pick 2 cap colors for the El Once Inicial pack.
// FIFO replace if user clicks a 3rd unselected option. CTA stays in
// .is-disabled state until exactly 2 are picked, then unlocks with
// the colors injected into the WhatsApp message.
// ============================================
(function initCapPickerPack() {
  const root    = document.getElementById('capPickerPack');
  const cta     = document.getElementById('bundleCta');
  const label   = document.getElementById('bundleCtaLabel');
  const counter = document.getElementById('cppCount');
  if (!root || !cta || !label || !counter) return;

  const BASE_MSG = 'Hola! Quiero el pack El Once Inicial (4 ediciones + 2 gorras GRATIS';
  const READY_LABEL = 'Lo Quiero Completo';
  const PENDING_LABEL = 'Elegí 2 gorras primero';
  const selected = []; // ordered list of {color, labelText} — newest at the end

  function render() {
    // Keep DOM aria-pressed in sync with the selected[] order
    root.querySelectorAll('.cpp-option').forEach((btn) => {
      const c = btn.dataset.capColor;
      btn.setAttribute('aria-pressed', selected.some((s) => s.color === c) ? 'true' : 'false');
    });
    counter.textContent = String(selected.length);
    root.dataset.selectedCount = String(selected.length);

    if (selected.length === 2) {
      const colors = selected.map((s) => s.labelText).join(' + ');
      const msg = `${BASE_MSG}: ${colors}) 🇨🇴`;
      cta.dataset.waMsg = msg;
      cta.href = buildWaUrl(msg);
      cta.classList.remove('is-disabled');
      cta.removeAttribute('aria-disabled');
      label.textContent = READY_LABEL;
    } else {
      // Reset the WA message to the placeholder so accidental clicks
      // (anchor still has a default href) don't ship a half-baked order.
      const placeholderMsg = `${BASE_MSG}) 🇨🇴%0A%0AColores de gorra que quiero: `;
      cta.dataset.waMsg = placeholderMsg;
      cta.href = buildWaUrl(placeholderMsg);
      cta.classList.add('is-disabled');
      cta.setAttribute('aria-disabled', 'true');
      label.textContent = PENDING_LABEL;
    }
  }

  root.querySelectorAll('.cpp-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.capColor;
      const labelText = btn.dataset.capLabel || color;
      const idx = selected.findIndex((s) => s.color === color);
      if (idx >= 0) {
        // Toggle off
        selected.splice(idx, 1);
      } else if (selected.length < 2) {
        selected.push({ color, labelText });
      } else {
        // Already 2 picked → FIFO: drop the oldest, append the new one.
        selected.shift();
        selected.push({ color, labelText });
      }
      render();
      if ('vibrate' in navigator) navigator.vibrate(6);
    });
  });

  // Guard against clicks on the CTA while disabled — don't open WhatsApp
  // with the placeholder message; gently nudge the user to pick first.
  cta.addEventListener('click', (e) => {
    if (cta.classList.contains('is-disabled')) {
      e.preventDefault();
      root.scrollIntoView({ behavior: 'smooth', block: 'center' });
      root.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' },
         { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 280, easing: 'ease-in-out' }
      );
      return;
    }
    // TikTok InitiateCheckout — only on the real pack order (2 caps picked).
    // Highest-intent event on the site; cart value = full pack.
    ttqTrack('InitiateCheckout', {
      content_name: 'Pack El Once Inicial',
      content_id: 'pack_once_inicial',
      content_type: 'bundle',
      value: 329000,
      currency: 'COP'
    });
  });

  render();
})();

// ============================================
// HAPTIC (mobile)
// ============================================
function vibrate(d = 8) { if ('vibrate' in navigator) navigator.vibrate(d); }
document.querySelectorAll('.cta, .product-cta, .nav-cta, .bundle-cta, .card-cta, .sb-cta, .cpp-option')
  .forEach((b) => b.addEventListener('click', () => vibrate(8)));

// ============================================
// STADIUM ANTHEM — floating audio player
// Three-state toggle (muted → playing → paused → playing → ...).
// Browsers block autoplay without user interaction, so the player
// always starts in "muted" — visual cue to the user that they have to
// opt in. Once opted in for the session, the state survives refresh
// inside the same tab via sessionStorage, but on refresh we drop back
// to "paused" so the user re-confirms playback.
// ============================================
(function initAudioPlayer() {
  const audio = document.getElementById('anthem');
  const btn = document.getElementById('audioPlayer');
  if (!audio || !btn) return;

  const STORAGE_KEY = 'tricolor_audio';
  const FLASH_KEY = 'tricolor_audio_flash';
  const huge = document.querySelector('.huge');

  let resumeOnVisible = false;
  let audioReady = true;

  // Hide gracefully if the file is missing (404) or fails to decode.
  audio.addEventListener('error', () => {
    audioReady = false;
    btn.hidden = true;
  });

  function safeGet(key, fallback) {
    try { var v = sessionStorage.getItem(key); return v === null ? fallback : v; }
    catch (_) { return fallback; }
  }
  function safeSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }

  function setState(state) {
    btn.dataset.state = state;
    btn.setAttribute('aria-pressed', state === 'playing' ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      state === 'muted'   ? 'Activar música de fondo' :
      state === 'playing' ? 'Pausar música de fondo' :
                            'Reanudar música de fondo'
    );
    safeSet(STORAGE_KEY, state);
  }

  function triggerDramaFlash() {
    if (!huge) return;
    if (safeGet(FLASH_KEY, '0') === '1') return;
    huge.classList.add('stadium-flash');
    // Remove after the animation completes so it can theoretically run
    // again in a future session (sessionStorage gate handles "once per
    // session" semantics independently).
    setTimeout(() => huge.classList.remove('stadium-flash'), 600);
    safeSet(FLASH_KEY, '1');
  }

  function play() {
    audio.volume = 0.3;
    const p = audio.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        setState('playing');
        triggerDramaFlash();
      }).catch(() => {
        // Autoplay rejected — stay muted, user can try again.
        setState('muted');
      });
    } else {
      setState('playing');
      triggerDramaFlash();
    }
  }

  function pause() {
    audio.pause();
    setState('paused');
  }

  btn.addEventListener('click', () => {
    const s = btn.dataset.state;
    if (s === 'playing') pause();
    else play();
  });

  // Page Visibility — pause when tab hides, resume when it returns.
  // Don't touch the visible state: from the user's perspective the
  // music is still "on", it just goes quiet while they're elsewhere.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && btn.dataset.state === 'playing') {
      audio.pause();
      resumeOnVisible = true;
    } else if (!document.hidden && resumeOnVisible) {
      audio.play().catch(() => {});
      resumeOnVisible = false;
    }
  });

  // Restore visual state from sessionStorage. On refresh, even if the
  // user had it 'playing', we land on 'paused' — browsers won't let us
  // autoplay across a navigation without a fresh user gesture.
  const stored = safeGet(STORAGE_KEY, 'muted');
  if (stored === 'playing') setState('paused');
  else setState(stored);

  // Scroll-gated visibility, mirrors .wa-float behavior.
  function applyAudioFloatVisibility() {
    if (!audioReady) return;
    btn.classList.toggle('visible', window.scrollY > 300);
  }
  registerScrollHook(applyAudioFloatVisibility);
  applyAudioFloatVisibility();

  // Expose a minimal API so the splash gate can hand off audio control
  // before the user has ever touched the floating player directly.
  window.__tricolorAudio = { play, pause, setState, triggerDramaFlash };
})();

// ============================================
// PROMO BAR — persistent -10% sticky bar
// Lifecycle: on load, check sessionStorage. If promo is ACTIVE and
// hasn't expired, mount the bar + start the every-minute countdown.
// When the splash activates the promo, it calls window.__activatePromoBar
// which is the same function — single source of truth.
// ============================================
(function initPromoBar() {
  const bar = document.getElementById('promoBar');
  if (!bar) return;
  const expiresEl = document.getElementById('pbExpires');
  const copyBtn = document.getElementById('pbCopy');

  function readState() {
    try {
      const promo = sessionStorage.getItem('tricolor_promo');
      const expires = parseInt(sessionStorage.getItem('tricolor_promo_expires') || '0', 10);
      return { promo, expires };
    } catch (_) {
      return { promo: null, expires: 0 };
    }
  }

  function clearPromo() {
    try {
      sessionStorage.removeItem('tricolor_promo');
      sessionStorage.removeItem('tricolor_promo_code');
      sessionStorage.removeItem('tricolor_promo_expires');
    } catch (_) {}
    document.documentElement.classList.remove('promo-active');
    // Sync every existing data-wa href back to the promo-less message.
    if (typeof window.__refreshWaLinks === 'function') {
      window.__refreshWaLinks();
    }
  }

  let countdownTimer = null;
  function tickCountdown() {
    const { promo, expires } = readState();
    if (promo !== 'ACTIVE' || Date.now() >= expires) {
      clearPromo();
      countdownTimer = null;
      return;
    }
    const left = expires - Date.now();
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    if (expiresEl) expiresEl.textContent = `${h}h ${String(m).padStart(2, '0')}m`;
    countdownTimer = setTimeout(tickCountdown, 60000);
  }

  function mount() {
    const { promo, expires } = readState();
    if (promo !== 'ACTIVE' || Date.now() >= expires) {
      // Stale or absent → make sure bar is hidden + state cleared.
      clearPromo();
      return;
    }
    document.documentElement.classList.add('promo-active');
    if (countdownTimer) clearTimeout(countdownTimer);
    tickCountdown();
  }

  // Copy to clipboard with toast feedback. Falls back to execCommand
  // for HTTP-served dev environments where clipboard API is gated.
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    // Read the live code so the bar copies TRICOLOR15 once it's
    // activated (e.g. by the exit-intent flow), not the hard-coded
    // TRICOLOR10.
    const code = sessionStorage.getItem('tricolor_promo_code') || 'TRICOLOR10';
    let copied = false;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
    } catch (_) {
      try {
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        copied = true;
      } catch (__) {}
    }
    if (copied) {
      copyBtn.classList.add('done');
      setTimeout(() => copyBtn.classList.remove('done'), 1800);
    }
  });

  // Expose for the splash IIFE.
  window.__activatePromoBar = mount;

  // Run once on load — for visitors who already activated earlier in
  // this session and just reloaded.
  mount();
})();

// ============================================
// SPLASH GATE — REMOVED.
// The arrival splash (the -10%-on-load popup) was removed. The -10% now
// lives in the desktop exit-intent email capture. has-entered is set
// unconditionally by the inline head gate so body scroll is free.
// ============================================

// ============================================
// CONSOLE EASTER EGG — V5 palette
// ============================================
console.log('%c LATRICOLOR.CO ', 'background:#FFD300;color:#0A0A0A;font-weight:bold;font-size:22px;padding:8px 16px;font-family:"Anton",sans-serif;letter-spacing:0.1em;');
console.log('%c 🇨🇴 SÉ FUERTE. SÉ FIERA. SÉ TRICOLOR. ', 'background:#E63946;color:#F0EBE0;font-size:14px;padding:6px 12px;letter-spacing:0.1em;');
console.log('%c ★ V5 HINCHADA CHAOS · EDICIÓN MUNDIAL 2026 ★ ', 'background:#0033A0;color:#FFD300;font-size:12px;padding:4px 12px;letter-spacing:0.15em;');
