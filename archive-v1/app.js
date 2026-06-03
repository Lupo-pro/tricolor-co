/* ============================================
   TRICOLOR.CO — Interactions
   Sé Fuerte. Sé Fiera. Sé Tricolor.
   ============================================ */

// Single source of truth for the WhatsApp number.
// Format: 57 + 10-digit Colombian national number, no `+`, no spaces.
// ⚠️ Placeholder — replace when the real line is ready.
const WHATSAPP_NUMBER = '573000000000';

const DEFAULT_WA_MSG = 'Hola! Quiero pedir mi body Tricolor 🇨🇴';

const buildWaUrl = (msg) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg || DEFAULT_WA_MSG)}`;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// WHATSAPP LINK INJECTION
// Every <a data-wa data-wa-msg="..."> gets its href built from the constant
// above. Keep the number in one place to avoid drift.
// ============================================
document.querySelectorAll('[data-wa]').forEach((el) => {
  el.href = buildWaUrl(el.dataset.waMsg);
  if (!el.target) el.target = '_blank';
  el.rel = 'noopener';
});

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
function updateCountdown() {
  const diff = MUNDIAL_DATE - Date.now();
  if (diff <= 0) {
    Object.values(cdEls).forEach((el) => { if (el) el.textContent = '00'; });
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
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================
// COMBINED SCROLL HANDLER (nav + sticky WA)
// One rAF-throttled listener instead of two passive ones.
// ============================================
const nav = document.getElementById('nav');
const waFloat = document.getElementById('waFloat');
waFloat.style.opacity = '0';
waFloat.style.transform = 'translateY(20px)';
waFloat.style.transition = 'opacity 0.4s ease, transform 0.4s ease, background 0.3s';

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
// physically overlaps the inline ones near the bottom of the .how, .cta-final
// and .faq sections.
const inlineWaCtas = document.querySelectorAll('.btn-wa, .mobile-cta');
if (inlineWaCtas.length) {
  const visibleSet = new Set();
  // Trigger on any pixel entering view — the goal is to never have two green
  // WhatsApp CTAs visible simultaneously, even if the inline one is only peeking
  // at the bottom edge where the sticky float lives.
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
// ============================================
const productData = {
  capitana: {
    name: 'La Capitana',
    desc: 'El amarillo eterno de la Tricolor. Edición Home Mundial 2026. Tela técnica AEROREADY, costuras reforzadas, escudo bordado. La pieza icónica que toda cafetera necesita.',
    tag: 'Edición Home · Más Vendido',
    price: '$99.000',
    old: '$149.000',
    color: 'capitana',
  },
  portera: {
    name: 'La Portera',
    desc: 'Edición Away con estética vintage de los 90s reinterpretada. Azul retro con detalles geométricos exclusivos. Stock muy limitado.',
    tag: 'Edición Away · Vintage',
    price: '$99.000',
    old: '$149.000',
    color: 'portera',
  },
  oronegro: {
    name: 'Oro Negro',
    desc: 'Edición Premium en negro absoluto con detalles dorados. Para la mujer que no necesita pedir permiso. Máxima elegancia, mínimo esfuerzo.',
    tag: 'Edición Premium · Exclusivo',
    price: '$99.000',
    old: '$149.000',
    color: 'oronegro',
  },
  cafetera: {
    name: 'La Cafetera',
    desc: 'Edición Alterna con la energía y pasión cafetera. Color vibrante que captura la atención. Para las que sienten la Tricolor a flor de piel.',
    tag: 'Edición Alterna · Pasión',
    price: '$99.000',
    old: '$149.000',
    color: 'cafetera',
  },
};

// ============================================
// MODAL
// ============================================
const modal = document.getElementById('modal');
const modalDialog = modal.querySelector('.modal');
const modalClose = document.getElementById('modalClose');
const modalVisual = document.getElementById('modalVisual');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTag = document.getElementById('modalTag');
const modalPriceNow = document.getElementById('modalPriceNow');
const modalPriceOld = document.getElementById('modalPriceOld');
const modalCta = document.getElementById('modalCta');

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

function openModal(color, returnTo) {
  const data = productData[color];
  if (!data) return;
  modalReturnFocus = returnTo || document.activeElement;
  modalVisual.className = 'modal-visual color-' + data.color;
  if (!modalVisual.querySelector('svg')) {
    modalVisual.innerHTML = '<svg class="body-svg" viewBox="0 0 200 280" aria-hidden="true"><use href="#body-shape"/></svg>';
  }
  modalTitle.textContent = data.name;
  modalDesc.textContent = data.desc;
  modalTag.textContent = data.tag;
  modalPriceNow.textContent = data.price;
  modalPriceOld.textContent = data.old;
  updateModalCta(data.name, data.price);
  modal.classList.add('active');
  modal.inert = false;
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', trapFocus);
  // Focus the close button first — least disruptive landing.
  setTimeout(() => modalClose.focus(), 50);
}

function updateModalCta(productName, price) {
  const size = document.querySelector('.size-btn.active')?.dataset.size || 'M';
  const msg = `Hola! Quiero pedir el body ${productName} 🇨🇴\n\nTalla: ${size}\nPrecio: ${price}\n\nEstá disponible?`;
  modalCta.href = buildWaUrl(msg);
  modalCta.target = '_blank';
  modalCta.rel = 'noopener';
}

function closeModal() {
  modal.classList.remove('active');
  modal.inert = true;
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

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  // Don't intercept ESC when the lightbox is active — it owns ESC first and
  // closes itself, leaving the modal context intact for the user to continue.
  const lb = document.getElementById('lightbox');
  if (lb && lb.classList.contains('active')) return;
  if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});

document.querySelectorAll('.size-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    updateModalCta(modalTitle.textContent, modalPriceNow.textContent);
  });
});

// ============================================
// LIGHTBOX (product photo gallery — SVG placeholders for now)
// Three views per product (front, side, detail) shown as thumbnails + a
// swipeable main viewer. Triggered from the modal so users can keep their
// current product context (color/edition) when they zoom in.
// ============================================
const VIEW_NAMES = ['Front', 'Side', 'Detalle'];

(function initLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const overlay = document.getElementById('lbOverlay');
  const closeBtn = document.getElementById('lbClose');
  const thumbs = lb.querySelectorAll('.lb-thumb');
  const slides = document.getElementById('lbSlides');
  const prev = document.getElementById('lbPrev');
  const next = document.getElementById('lbNext');
  const titleEl = document.getElementById('lbTitle');
  const viewNameEl = document.getElementById('lbViewName');
  const trigger = document.getElementById('modalGalleryBtn');

  let currentIndex = 0;
  let returnFocus = null;

  function goTo(index, animate = true) {
    currentIndex = (index + 3) % 3;
    slides.style.transition = animate ? '' : 'none';
    slides.style.transform = `translateX(-${currentIndex * (100 / 3)}%)`;
    if (!animate) requestAnimationFrame(() => { slides.style.transition = ''; });
    thumbs.forEach((t, i) => t.setAttribute('aria-selected', String(i === currentIndex)));
    viewNameEl.textContent = `${VIEW_NAMES[currentIndex]} · ${currentIndex + 1} / 3`;
  }

  function setProduct(color, name) {
    lb.dataset.color = color || 'capitana';
    titleEl.textContent = name || 'TRICOLOR';
  }

  function open() {
    // The currently active modal product tells the lightbox which color +
    // name to render. Fall back to La Capitana if opened in isolation.
    const color = (document.querySelector('.modal-visual') || {}).classList?.value.match(/color-(\w+)/)?.[1] || 'capitana';
    const name = modalTitle?.textContent || 'TRICOLOR';
    setProduct(color, name);
    goTo(0, false);
    returnFocus = document.activeElement;
    lb.inert = false;
    lb.classList.add('active');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    setTimeout(() => closeBtn.focus(), 50);
  }

  function close() {
    lb.classList.remove('active');
    lb.inert = true;
    lb.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKey);
    // If the modal is still open behind the lightbox, scroll lock stays on it.
    if (!modal.classList.contains('active')) document.body.style.overflow = '';
    if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
    returnFocus = null;
  }

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(currentIndex - 1); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(2); }
  }

  thumbs.forEach((t, i) => t.addEventListener('click', () => goTo(i)));
  prev.addEventListener('click', () => goTo(currentIndex - 1));
  next.addEventListener('click', () => goTo(currentIndex + 1));
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  // Touch swipe (horizontal). Track delta and snap when released.
  let touchStartX = null;
  let touchDelta = 0;
  slides.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchDelta = 0;
    slides.style.transition = 'none';
  }, { passive: true });
  slides.addEventListener('touchmove', (e) => {
    if (touchStartX == null) return;
    touchDelta = e.touches[0].clientX - touchStartX;
    const base = -currentIndex * (100 / 3);
    const pct = (touchDelta / window.innerWidth) * (100 / 3);
    slides.style.transform = `translateX(${base + pct}%)`;
  }, { passive: true });
  slides.addEventListener('touchend', () => {
    if (touchStartX == null) return;
    slides.style.transition = '';
    const threshold = 50;
    if (touchDelta < -threshold) goTo(currentIndex + 1);
    else if (touchDelta > threshold) goTo(currentIndex - 1);
    else goTo(currentIndex);
    touchStartX = null;
    touchDelta = 0;
  });

  if (trigger) {
    trigger.addEventListener('click', () => {
      open();
    });
  }

  // Expose for any other surfaces that want to open the gallery.
  window.__lightboxOpen = open;
})();

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
    const navH = nav.offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - navH - 10;
    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  });
});

// ============================================
// COUNTER ANIMATION
// ============================================
const counters = document.querySelectorAll('[data-counter]');
if (prefersReducedMotion) {
  counters.forEach((c) => { c.textContent = c.dataset.counter; });
} else {
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.counter, 10);
        const duration = 1800;
        const start = Date.now();
        const animate = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          entry.target.textContent = Math.floor(target * eased);
          if (progress < 1) requestAnimationFrame(animate);
          else entry.target.textContent = target;
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
  capitana: { name: 'La Capitana', price: '$99.000', old: '$149.000', msg: 'Hola! Me interesa La Capitana 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
  portera:  { name: 'La Portera',  price: '$99.000', old: '$149.000', msg: 'Hola! Me interesa La Portera 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
  oronegro: { name: 'Oro Negro',   price: '$99.000', old: '$149.000', msg: 'Hola! Me interesa Oro Negro 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
  cafetera: { name: 'La Cafetera', price: '$99.000', old: '$149.000', msg: 'Hola! Me interesa La Cafetera 🇨🇴 Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?' },
};
const STICKY_BAR_DEFAULT = {
  name: 'El Once Inicial',
  price: '$329.000',
  old: '$596.000',
  msg: 'Hola! Quiero pedir el Once Inicial (Pack 4 ediciones) 🇨🇴 Está disponible?',
};

const stickyBuy = document.getElementById('stickyBuy');

(function initStickyBuyBar() {
  if (!stickyBuy) return;
  const sbName = document.getElementById('sbName');
  const sbPrice = document.getElementById('sbPrice');
  const sbOld = document.getElementById('sbOld');
  const sbCta = document.getElementById('sbCta');

  const collection = document.getElementById('collection');
  const footer = document.querySelector('footer');
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
    sbPrice.textContent = p.price;
    sbOld.textContent = p.old;
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
      // Pick the product with the highest visibility above a threshold.
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
    // Defer class toggle to next frame so the transition fires.
    requestAnimationFrame(() => stickyBuy.classList.toggle('visible', show));
    applyWaFloatVisibility();
  }

  registerScrollHook(update);
  window.addEventListener('resize', update, { passive: true });
  update();
})();

// ============================================
// SIZE GUIDE CALCULATOR
// Maps busto/cintura/cadera (cm) → S/M/L. Each measurement is scored
// independently and the recommended size is the largest match — bodywear
// must accommodate the dominant constraint, so when measurements straddle
// sizes the larger one wins. This matches the chart note in the UI.
// ============================================
const SIZE_RANGES = {
  busto:   { S: [80, 87],  M: [88, 95],  L: [96, 104] },
  cintura: { S: [60, 67],  M: [68, 75],  L: [76, 84] },
  cadera:  { S: [86, 93],  M: [94, 101], L: [102, 110] },
};
const SIZE_ORDER = ['S', 'M', 'L'];

function sizeForMeasurement(metric, value) {
  if (!Number.isFinite(value)) return null;
  const ranges = SIZE_RANGES[metric];
  // Below smallest range → still S; above largest → still L; otherwise pick the
  // bucket that contains the value (or the nearest if it falls between).
  if (value < ranges.S[0]) return { size: 'S', flag: 'below' };
  if (value > ranges.L[1]) return { size: 'L', flag: 'above' };
  for (const s of SIZE_ORDER) {
    if (value >= ranges[s][0] && value <= ranges[s][1]) return { size: s, flag: 'in' };
  }
  // Falls in a gap between two ranges → round up to the larger size.
  for (let i = 0; i < SIZE_ORDER.length - 1; i++) {
    const a = SIZE_ORDER[i], b = SIZE_ORDER[i + 1];
    if (value > ranges[a][1] && value < ranges[b][0]) return { size: b, flag: 'between' };
  }
  return null;
}

function maxSize(sizes) {
  return sizes.reduce((acc, s) => (SIZE_ORDER.indexOf(s) > SIZE_ORDER.indexOf(acc) ? s : acc), 'S');
}

(function initSizeCalc() {
  const form = document.getElementById('sizeCalc');
  if (!form) return;
  const result = document.getElementById('scResult');
  const empty = result.querySelector('.sc-result-empty');
  const filled = result.querySelector('.sc-result-filled');
  const sizeEl = document.getElementById('scSize');
  const detailEl = document.getElementById('scDetail');
  const rangesEl = document.getElementById('scRanges');
  const cta = document.getElementById('scCta');
  const inputs = {
    busto: document.getElementById('sc-busto'),
    cintura: document.getElementById('sc-cintura'),
    cadera: document.getElementById('sc-cadera'),
  };

  function compute() {
    const vals = {};
    let provided = 0;
    for (const [k, el] of Object.entries(inputs)) {
      const v = parseFloat(el.value);
      if (Number.isFinite(v) && v > 0) {
        vals[k] = v;
        provided += 1;
      }
    }
    if (provided === 0) {
      result.dataset.state = 'empty';
      empty.hidden = false;
      filled.hidden = true;
      return;
    }

    const matches = {};
    for (const [k, v] of Object.entries(vals)) {
      const m = sizeForMeasurement(k, v);
      if (m) matches[k] = m;
    }
    const sizes = Object.values(matches).map((m) => m.size);
    if (!sizes.length) {
      result.dataset.state = 'empty';
      empty.hidden = false;
      filled.hidden = true;
      return;
    }
    const recommended = maxSize(sizes);

    sizeEl.textContent = recommended;
    const all = ['busto', 'cintura', 'cadera'].filter((k) => k in matches);
    const diverging = all.filter((k) => matches[k].size !== recommended);
    if (provided < 3) {
      detailEl.innerHTML = `Con esas medidas te queda <em>fiera</em> en talla <strong>${recommended}</strong>. Completa las 3 para una recomendación más precisa.`;
    } else if (diverging.length === 0) {
      detailEl.innerHTML = `Tu cuerpo está alineado: te queda <em>perfecto</em> en talla <strong>${recommended}</strong>.`;
    } else {
      detailEl.innerHTML = `Recomendamos talla <strong>${recommended}</strong> porque privilegia la zona más amplia — el body abraza sin apretar.`;
    }

    rangesEl.innerHTML = '';
    all.forEach((k) => {
      const m = matches[k];
      const mismatch = m.size !== recommended;
      const label = k.charAt(0).toUpperCase() + k.slice(1);
      rangesEl.insertAdjacentHTML(
        'beforeend',
        `<span class="sc-range-pill${mismatch ? ' mismatch' : ''}">${label} ${vals[k]}cm · ${m.size}</span>`
      );
    });

    const ctaMsg = [
      'Hola! Quiero asesoría de talla 🇨🇴',
      '',
      `Mis medidas:`,
      vals.busto != null ? `- Busto: ${vals.busto} cm` : null,
      vals.cintura != null ? `- Cintura: ${vals.cintura} cm` : null,
      vals.cadera != null ? `- Cadera: ${vals.cadera} cm` : null,
      '',
      `La calculadora me sugiere talla ${recommended}. Me confirmas?`,
    ].filter((l) => l !== null).join('\n');
    cta.href = buildWaUrl(ctaMsg);
    cta.dataset.waMsg = ctaMsg;

    result.dataset.state = 'filled';
    empty.hidden = true;
    filled.hidden = false;
  }

  Object.values(inputs).forEach((el) => {
    el.addEventListener('input', compute);
    el.addEventListener('blur', compute);
  });
})();

// ============================================
// HAPTIC (mobile)
// ============================================
function vibrate(d = 8) { if ('vibrate' in navigator) navigator.vibrate(d); }
document.querySelectorAll('.btn, .product-cta, .size-btn, .nav-cta').forEach((b) => {
  b.addEventListener('click', () => vibrate(8));
});

// ============================================
// CONSOLE
// ============================================
console.log('%c TRICOLOR.CO ', 'background:#FCD116;color:#0A0A0A;font-weight:bold;font-size:20px;padding:8px 16px;font-family:Georgia,serif;');
console.log('%c 🇨🇴 Sé Fuerte. Sé Fiera. Sé Tricolor. ', 'background:#CE1126;color:white;font-size:14px;padding:6px 12px;');
