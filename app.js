/* ============================================
   TRICOLOR.CO — Interactions
   Sé Fuerte. Sé Fiera. Sé Tricolor.
   ============================================ */

// ⚠️ REMPLACE par ton numéro WhatsApp (format: 57XXXXXXXXXX, sans +)
const WHATSAPP_NUMBER = '573000000000';

// ============================================
// COUNTDOWN — Mundial 2026 (11 juin 2026 16:00 COL)
// ============================================
const MUNDIAL_DATE = new Date('2026-06-11T16:00:00-05:00').getTime();

function updateCountdown() {
  const diff = MUNDIAL_DATE - Date.now();
  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('cd-days').textContent = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-mins').textContent = String(m).padStart(2,'0');
  document.getElementById('cd-secs').textContent = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================
// NAV scroll
// ============================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 30) nav.classList.add('scrolled');
  else nav.classList.remove('scrolled');
}, { passive: true });

// ============================================
// MOBILE MENU
// ============================================
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  mobileMenu.classList.toggle('active');
  document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ============================================
// REVEAL ON SCROLL
// ============================================
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => revealObserver.observe(el));

// ============================================
// PRODUCT DATA
// ============================================
const productData = {
  'capitana': {
    name: 'La Capitana',
    desc: 'El amarillo eterno de la Tricolor. Edición Home Mundial 2026. Tela técnica AEROREADY, costuras reforzadas, escudo bordado. La pieza icónica que toda cafetera necesita.',
    tag: 'Edición Home · Más Vendido',
    price: '$99.000',
    old: '$149.000',
    color: 'capitana'
  },
  'portera': {
    name: 'La Portera',
    desc: 'Edición Away con estética vintage de los 90s reinterpretada. Azul retro con detalles geométricos exclusivos. Stock muy limitado.',
    tag: 'Edición Away · Vintage',
    price: '$99.000',
    old: '$149.000',
    color: 'portera'
  },
  'oronegro': {
    name: 'Oro Negro',
    desc: 'Edición Premium en negro absoluto con detalles dorados. Para la mujer que no necesita pedir permiso. Máxima elegancia, mínimo esfuerzo.',
    tag: 'Edición Premium · Exclusivo',
    price: '$99.000',
    old: '$149.000',
    color: 'oronegro'
  },
  'cafetera': {
    name: 'La Cafetera',
    desc: 'Edición Alterna con la energía y pasión cafetera. Color vibrante que captura la atención. Para las que sienten la Tricolor a flor de piel.',
    tag: 'Edición Alterna · Pasión',
    price: '$99.000',
    old: '$149.000',
    color: 'cafetera'
  }
};

// ============================================
// MODAL
// ============================================
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const modalVisual = document.getElementById('modalVisual');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalTag = document.getElementById('modalTag');
const modalPriceNow = document.getElementById('modalPriceNow');
const modalPriceOld = document.getElementById('modalPriceOld');
const modalCta = document.getElementById('modalCta');

function openModal(color) {
  const data = productData[color];
  if (!data) return;
  modalVisual.className = 'modal-visual color-' + data.color;
  // Re-add the SVG body shape inside (it's preserved by innerHTML)
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
  document.body.style.overflow = 'hidden';
}

function updateModalCta(productName, price) {
  const size = document.querySelector('.size-btn.active')?.dataset.size || 'M';
  const msg = encodeURIComponent(`¡Hola! Quiero pedir el body ${productName} 🇨🇴\n\nTalla: ${size}\nPrecio: ${price}\n\n¿Está disponible?`);
  modalCta.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.product').forEach(card => {
  card.addEventListener('click', (e) => {
    if (e.target.closest('.product-cta')) return;
    openModal(card.dataset.color);
  });
});

document.querySelectorAll('.product-cta, [data-product]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const product = btn.dataset.product;
    if (!product) return;
    const msg = encodeURIComponent(`¡Hola! Me interesa ${product} 🇨🇴\n\n¿Me podrías ayudar con la asesoría de talla y confirmar disponibilidad?`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  });
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});

document.querySelectorAll('.size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateModalCta(modalTitle.textContent, modalPriceNow.textContent);
  });
});

// ============================================
// SMOOTH SCROLL
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const navH = nav.offsetHeight;
    const top = target.getBoundingClientRect().top + window.pageYOffset - navH - 10;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ============================================
// COUNTER ANIMATION
// ============================================
const counters = document.querySelectorAll('[data-counter]');
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.dataset.counter);
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
counters.forEach(c => counterObs.observe(c));

// ============================================
// FAQ - close others when opening one
// ============================================
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      faqItems.forEach(other => { if (other !== item) other.open = false; });
    }
  });
});

// ============================================
// FLOATING WA - show on scroll
// ============================================
const waFloat = document.getElementById('waFloat');
waFloat.style.opacity = '0';
waFloat.style.transform = 'translateY(20px)';
waFloat.style.transition = 'opacity 0.4s ease, transform 0.4s ease, background 0.3s';

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    waFloat.style.opacity = '1';
    waFloat.style.transform = 'translateY(0)';
  } else {
    waFloat.style.opacity = '0';
    waFloat.style.transform = 'translateY(20px)';
  }
}, { passive: true });

// ============================================
// HAPTIC (mobile)
// ============================================
function vibrate(d = 8) { if ('vibrate' in navigator) navigator.vibrate(d); }
document.querySelectorAll('.btn, .product-cta, .size-btn, .nav-cta').forEach(b => {
  b.addEventListener('click', () => vibrate(8));
});

// ============================================
// CONSOLE
// ============================================
console.log('%c TRICOLOR.CO ', 'background:#FCD116;color:#0A0A0A;font-weight:bold;font-size:20px;padding:8px 16px;font-family:Georgia,serif;');
console.log('%c 🇨🇴 Sé Fuerte. Sé Fiera. Sé Tricolor. ', 'background:#CE1126;color:white;font-size:14px;padding:6px 12px;');
