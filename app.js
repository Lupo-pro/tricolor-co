/* ============================================
   TRICOLOR.CO — Interactions
   Sé Fuerte. Sé Fiera. Sé Tricolor.
   ============================================ */

// Single source of truth for the WhatsApp number.
// Format: 57 + 10-digit Colombian national number, no `+`, no spaces.
// ⚠️ Placeholder — replace when the real line is ready.
const WHATSAPP_NUMBER = '573000000000';

const DEFAULT_WA_MSG = '¡Hola! Quiero pedir mi body Tricolor 🇨🇴';

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
function onScroll() {
  const y = window.scrollY;
  if (y > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');

  if (y > 300) {
    waFloat.style.opacity = '1';
    waFloat.style.transform = 'translateY(0)';
  } else {
    waFloat.style.opacity = '0';
    waFloat.style.transform = 'translateY(20px)';
  }
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    requestAnimationFrame(onScroll);
    scrollTicking = true;
  }
}, { passive: true });

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
  const msg = `¡Hola! Quiero pedir el body ${productName} 🇨🇴\n\nTalla: ${size}\nPrecio: ${price}\n\n¿Está disponible?`;
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
    const msg = `¡Hola! Me interesa ${product} 🇨🇴\n\n¿Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?`;
    window.open(buildWaUrl(msg), '_blank', 'noopener');
  });
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
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
