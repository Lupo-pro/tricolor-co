/* ============================================================
   order-form.js — LATRICOLOR embedded COD checkout (Phase 1).

   Loaded by index.html + oferta(-2/-3).html. It:
   - injects the #pedido order form (offer cards → per-unit variant rows
     → fields → live summary → COD button),
   - loads the local Colombia departamentos→municipios dataset (no
     runtime external API) for the dependent dropdowns,
   - submits via fetch POST /api/order then redirects to /gracias,
   - fires the TikTok pixel (InitiateCheckout / AddToCart / SubmitForm),
   - injects a unified sticky CTA and the exit-recovery −$10.000 popup,
   - routes the page's primary CTAs to smooth-scroll into #pedido.

   No native <form> submit; everything is JS. Closing marks only in copy.
   ============================================================ */
(function () {
  'use strict';

  /* ---- Global image fallback (all funnel pages load this file) ----
     Every <img> on the site references a .webp. If a .webp fails to decode
     (old Android System WebView / the TikTok in-app browser without WebP) or
     404s, swap to the .jpg twin, then .png, so an image never leaves a broken
     box. Covers every current + injected <img> (the modal offer thumbnails
     included). */
  function imgFallback(img) {
    if (!img || img.tagName !== 'IMG') return;
    // <img> inside <picture> already has native <source> webp→jpg fallback
    // (the homepage uses this). Touching its src would fight that mechanism.
    if (img.parentElement && img.parentElement.tagName === 'PICTURE') return;
    var src = img.getAttribute('src') || '';
    var step = img.getAttribute('data-imgfb') || '';
    var base = src.replace(/\.(webp|jpe?g|png)(\?.*)?$/i, '');
    if (!base || base === src) return;            // no known extension → leave it
    if (step === '' && /\.webp/i.test(src))      { img.setAttribute('data-imgfb', 'jpg'); img.src = base + '.jpg'; }
    else if (step === '' || step === 'jpg')      { img.setAttribute('data-imgfb', 'png'); img.src = base + '.png'; }
    // step === 'png' → already tried both twins; stop (avoid a loop).
  }
  // (1) Future errors — image 'error' events don't bubble, hence capture:true.
  document.addEventListener('error', function (e) { imgFallback(e.target); }, true);
  // (2) Images that ALREADY errored before this deferred script ran (e.g.
  // above-the-fold eager images that finish during HTML parse). Sweep now and
  // again at window 'load' to catch any that resolve in between.
  function sweepBrokenImgs() {
    var imgs = document.getElementsByTagName('img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete && imgs[i].naturalWidth === 0) imgFallback(imgs[i]);
    }
  }
  sweepBrokenImgs();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweepBrokenImgs);
  window.addEventListener('load', sweepBrokenImgs);

  var mount = document.getElementById('pedido');
  if (!mount) return;

  var VARIANT = window.LANDING_VARIANT || 'HOME';
  var WA = '34604828758';

  var OFFERS = {
    '1': { price: 79000, bodies: 1, gorras: 0, name: '1 Body',  note: 'Para empezar',       badge: '' },
    '2': { price: 149000, bodies: 2, gorras: 1, name: '2 Bodies', note: '+ 1 gorra gratis',  badge: 'MÁS VENDIDO' },
    '3': { price: 199000, bodies: 3, gorras: 2, name: '3 Bodies', note: '+ 2 gorras gratis', badge: 'MEJOR OFERTA 🔥' }
  };
  var PRIORITY_FEE = 5000;
  var RECOVERY_DISCOUNT = 10000;
  var COLORS = ['Amarilla', 'Azul', 'Roja', 'Negra'];
  var GORRA_COLORS = ['Amarilla', 'Roja', 'Azul', 'Blanca'];
  // Real product thumbnails per tier (1 shot for 1 body, a small cluster for 2/3).
  var OFFER_IMGS = {
    '1': ['product-capitana'],
    '2': ['product-capitana', 'product-portera'],
    '3': ['product-capitana', 'product-portera', 'product-cafetera']
  };

  // Default-selected offer is per-variant framing only (A=2, B=2, C=3).
  // Read from a page-level hook; the modal/flow/styling are unchanged.
  var DEFAULT_OFFER = (window.LANDING_DEFAULT_OFFER && OFFERS[window.LANDING_DEFAULT_OFFER])
    ? String(window.LANDING_DEFAULT_OFFER)
    : (VARIANT === 'C' ? '3' : '2');
  var state = { offer: DEFAULT_OFFER, priority: false, recovery: false, interacted: false };
  var DEPTOS = null;
  var icFired = false;

  var cop = function (n) { return '$' + Number(n).toLocaleString('es-CO'); };
  function opts(arr, ph) {
    var h = ph ? '<option value="">' + ph + '</option>' : '';
    for (var i = 0; i < arr.length; i++) h += '<option value="' + arr[i] + '">' + arr[i] + '</option>';
    return h;
  }

  /* ---- Build the form markup ---- */
  function offerCard(id) {
    var o = OFFERS[id];
    var imgs = OFFER_IMGS[id] || [];
    var thumb = '<span class="pg-o-thumb pg-o-thumb-' + imgs.length + '" aria-hidden="true">' +
      imgs.map(function (f) { return '<img src="/images/products/' + f + '.webp" alt="" loading="lazy" decoding="async" width="120" height="120">'; }).join('') +
      '</span>';
    return '<label class="pg-offer' + (id === '3' ? ' pg-hot' : '') + '">' +
      '<input type="radio" name="pg-offer" value="' + id + '"' + (id === state.offer ? ' checked' : '') + '>' +
      '<div class="pg-card">' +
        '<span class="pg-check" aria-hidden="true">✓</span>' +
        thumb +
        '<div class="pg-o-name">' + o.name + '</div>' +
        '<div class="pg-o-price">' + cop(o.price) + '</div>' +
        '<div class="pg-o-note">' + o.note + '</div>' +
        (o.badge ? '<span class="pg-o-badge">' + o.badge + '</span>' : '') +
      '</div></label>';
  }

  // The checkout lives in a modal overlay (hidden by default). #pedido is
  // the overlay; the inner .pedido sheet keeps the brand tokens + .pg-*
  // scoping so all form styles still apply unchanged.
  mount.className = 'lt-modal';
  mount.setAttribute('aria-hidden', 'true');
  mount.innerHTML =
    '<div class="lt-modal-sheet pedido" role="dialog" aria-modal="true" aria-label="Tu pedido">' +
      '<button type="button" class="lt-modal-close" id="pgClose" aria-label="Cerrar">×</button>' +
      '<div class="pedido-wrap">' +
      '<p class="pedido-kicker">★ Pedí en 1 minuto</p>' +
      '<h2 class="pedido-title">Selecciona tu <em>oferta</em></h2>' +

      '<div class="pg-step">1 · Elegí tu pack</div>' +
      '<div class="pg-offers">' + offerCard('1') + offerCard('2') + offerCard('3') + '</div>' +

      '<div class="pg-step">2 · Elegí el color</div>' +
      '<div class="pg-variants" id="pgVariants"></div>' +
      '<p class="pg-talla-note">Talla única S a XL — se adapta a tu cuerpo.</p>' +

      '<label class="pg-bump">' +
        '<svg class="pg-bump-outline" aria-hidden="true" preserveAspectRatio="none"><rect x="0" y="0" width="100%" height="100%" rx="8" ry="8"/></svg>' +
        '<input type="checkbox" id="pgPriority">' +
        '<span class="pg-bump-txt">Agrega <strong>Envío prioritario por solo $5.000</strong> — despachamos tu pedido primero.</span></label>' +

      '<div class="pg-summary" id="pgSummary"></div>' +

      '<div class="pg-step">3 · Tus datos de entrega</div>' +
      '<div class="pg-field" data-req><label>WhatsApp <span class="pg-req">*</span></label>' +
        '<input type="tel" id="pgWhatsapp" inputmode="numeric" autocomplete="tel" maxlength="12" placeholder="3001234567">' +
        '<p class="pg-help">Te escribimos para confirmar tu pedido.</p><p class="pg-err">Escribí un número válido.</p></div>' +
      '<div class="pg-two">' +
        '<div class="pg-field" data-req><label>Nombre <span class="pg-req">*</span></label><input type="text" id="pgNombre" autocomplete="given-name"><p class="pg-err">Requerido.</p></div>' +
        '<div class="pg-field" data-req><label>Apellidos <span class="pg-req">*</span></label><input type="text" id="pgApellidos" autocomplete="family-name"><p class="pg-err">Requerido.</p></div>' +
      '</div>' +
      '<div class="pg-field" data-req><label>Departamento <span class="pg-req">*</span></label>' +
        '<select id="pgDepto"><option value="">Cargando…</option></select><p class="pg-err">Elegí tu departamento.</p></div>' +
      '<div class="pg-field" data-req><label>Ciudad / Municipio <span class="pg-req">*</span></label>' +
        '<select id="pgCiudad"><option value="">Elegí primero el departamento</option></select><p class="pg-err">Elegí tu ciudad.</p></div>' +
      '<div class="pg-field" data-req><label>Dirección completa con nomenclatura <span class="pg-req">*</span></label>' +
        '<input type="text" id="pgDireccion" autocomplete="street-address" placeholder="Ej: Calle 9A #25-5, Torre 5 Apto 3"><p class="pg-err">Escribí tu dirección.</p></div>' +
      '<div class="pg-field"><label>Barrio</label><input type="text" id="pgBarrio"></div>' +
      '<div class="pg-field"><label>Correo (opcional)</label><input type="email" id="pgEmail" autocomplete="email" placeholder="tu@correo.com"></div>' +

      '<div class="pg-trust">' +
        '<span>💵 Pago contra entrega</span><span>🚚 Envío gratis a todo Colombia</span><span>👀 Revisas antes de pagar</span>' +
      '</div>' +
      '<p class="pg-trust-note">Recibirás una llamada y un mensaje de WhatsApp para confirmar tu pedido.</p>' +

      '<button type="button" class="pg-submit" id="pgSubmit" disabled>' +
        '<span class="pg-submit-main" id="pgSubmitMain">Confirma tu pedido · paga contra entrega</span>' +
        '<span class="pg-submit-sub">Pagas al recibir en tu casa</span>' +
      '</button>' +
      '<p class="pg-submit-status" id="pgStatus" role="status"></p>' +

      // ===== PHASE 2 PLACEHOLDER =====================================
      // A second button "Paga ahora con tarjeta/PSE −5%" (Wompi prepaid)
      // will be added here. Do NOT build it in Phase 1.
      // ================================================================

      '<p class="pg-secondary"><a href="https://wa.me/' + WA + '?text=' +
        encodeURIComponent('Hola! Tengo una duda antes de pedir mi body LATRICOLOR 🇨🇴') +
        '" target="_blank" rel="noopener">Dudas? Escríbenos por WhatsApp</a></p>' +
      '</div>' +   // /.pedido-wrap
    '</div>';      // /.lt-modal-sheet

  var elVariants = document.getElementById('pgVariants');
  var elSummary = document.getElementById('pgSummary');
  var elPriority = document.getElementById('pgPriority');
  var elSubmit = document.getElementById('pgSubmit');
  var elSubmitMain = document.getElementById('pgSubmitMain');
  var elStatus = document.getElementById('pgStatus');
  var elDepto = document.getElementById('pgDepto');
  var elCiudad = document.getElementById('pgCiudad');

  /* ---- Variant rows (one per body + gorra selects) ---- */
  function renderVariants() {
    var o = OFFERS[state.offer];
    var html = '';
    for (var b = 0; b < o.bodies; b++) {
      html += '<div class="pg-vrow"><div class="pg-vrow-h">Body ' + (b + 1) + ' · color</div>' +
        '<select class="pg-color" aria-label="Color body ' + (b + 1) + '">' + opts(COLORS) + '</select>' +
        '</div>';
    }
    for (var g = 0; g < o.gorras; g++) {
      html += '<div class="pg-vrow"><div class="pg-vrow-h pg-gorra-h">Gorra gratis ' + (g + 1) + ' 🎁</div>' +
        '<select class="pg-gorra" aria-label="Color gorra ' + (g + 1) + '">' + opts(GORRA_COLORS) + '</select></div>';
    }
    elVariants.innerHTML = html;
  }

  /* ---- Summary + total ---- */
  function recoveryActive() { return state.recovery && !recoveryExpired(); }
  function computeTotal() {
    var t = OFFERS[state.offer].price;
    if (state.priority) t += PRIORITY_FEE;
    if (recoveryActive()) t -= RECOVERY_DISCOUNT;
    return t < 0 ? 0 : t;
  }
  function recalc() {
    var sub = OFFERS[state.offer].price;
    var total = computeTotal();
    var rows =
      '<div class="pg-sum-row"><span>Subtotal (' + OFFERS[state.offer].name + ')</span><span>' + cop(sub) + '</span></div>' +
      '<div class="pg-sum-row"><span>Envío</span><span class="pg-free">Gratis</span></div>';
    if (state.priority) rows += '<div class="pg-sum-row"><span>Envío prioritario</span><span>+' + cop(PRIORITY_FEE) + '</span></div>';
    if (recoveryActive()) rows += '<div class="pg-sum-row pg-sum-disc"><span>Descuento</span><span>−' + cop(RECOVERY_DISCOUNT) + '</span></div>';
    rows += '<div class="pg-sum-total"><span class="pg-t-label">Total a pagar</span><span class="pg-t-val">' + cop(total) + '</span></div>';
    elSummary.innerHTML = rows;
    elSubmitMain.textContent = 'Confirma tu pedido · paga contra entrega — ' + cop(total);
    validate();
  }

  /* ---- Validation ---- */
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
  function isValid() {
    var wa = val('pgWhatsapp').replace(/\D/g, '');
    return wa.length >= 10 && wa.length <= 12 &&
      val('pgNombre') && val('pgApellidos') && val('pgDepto') && val('pgCiudad') && val('pgDireccion');
  }
  function validate() { elSubmit.disabled = !isValid(); }
  function markField(id, ok) {
    var e = document.getElementById(id); if (!e) return;
    var f = e.closest('.pg-field'); if (f) f.classList.toggle('pg-invalid', !ok);
  }

  /* ---- Pixel ---- */
  function px(ev, extra) { if (window.ttq) { try { window.ttq.track(ev, extra || {}); } catch (_) {} } }
  function fireInitiate() { if (icFired) return; icFired = true; px('InitiateCheckout', { content_name: 'pedido_' + VARIANT }); }

  function markInteracted() {
    state.interacted = true;
    fireInitiate();
  }

  /* ---- Dependent depto → municipio ---- */
  function fillDeptos() {
    if (!DEPTOS) return;
    var names = Object.keys(DEPTOS).sort();
    var h = '<option value="">Elegí tu departamento</option>';
    for (var i = 0; i < names.length; i++) h += '<option value="' + names[i] + '">' + names[i] + '</option>';
    elDepto.innerHTML = h;
  }
  function fillCiudades(depto) {
    var list = (DEPTOS && DEPTOS[depto]) || [];
    var h = '<option value="">' + (list.length ? 'Elegí tu ciudad' : 'Elegí primero el departamento') + '</option>';
    for (var i = 0; i < list.length; i++) h += '<option value="' + list[i] + '">' + list[i] + '</option>';
    elCiudad.innerHTML = h;
  }

  /* ---- Wire events ---- */
  mount.addEventListener('change', function (e) {
    if (e.target.name === 'pg-offer') {
      state.offer = e.target.value;
      renderVariants(); recalc();
      markInteracted();
      px('AddToCart', { content_name: OFFERS[state.offer].name, value: computeTotal(), currency: 'COP' });
    } else if (e.target.id === 'pgPriority') {
      state.priority = e.target.checked; recalc();
    } else if (e.target.id === 'pgDepto') {
      fillCiudades(e.target.value); markField('pgDepto', !!e.target.value); validate();
    } else if (e.target.id === 'pgCiudad') {
      markField('pgCiudad', !!e.target.value); validate();
    }
  });
  mount.addEventListener('input', function (e) {
    if (e.target.closest && e.target.closest('.pg-field')) { markInteracted(); validate(); }
  });
  mount.addEventListener('focusin', function (e) {
    if (e.target.matches && e.target.matches('input,select')) markInteracted();
  });
  // also count any selection/change as interaction (covers the variant selects)
  mount.addEventListener('change', function () { markInteracted(); });
  // inline validation on blur for required text fields
  ['pgWhatsapp', 'pgNombre', 'pgApellidos', 'pgDireccion'].forEach(function (id) {
    document.getElementById(id).addEventListener('blur', function () {
      var ok = id === 'pgWhatsapp' ? this.value.replace(/\D/g, '').length >= 10 : !!this.value.trim();
      markField(id, ok);
    });
  });

  /* ---- Submit ---- */
  elSubmit.addEventListener('click', function () {
    ['pgWhatsapp', 'pgNombre', 'pgApellidos', 'pgDepto', 'pgCiudad', 'pgDireccion'].forEach(function (id) {
      var ok = id === 'pgWhatsapp' ? val(id).replace(/\D/g, '').length >= 10 : !!val(id);
      markField(id, ok);
    });
    if (!isValid()) { elStatus.className = 'pg-submit-status err'; elStatus.textContent = 'Revisá los campos marcados.'; return; }

    var items = [];
    elVariants.querySelectorAll('.pg-color').forEach(function (sel) {
      items.push({ color: sel.value });
    });
    var gorras = [].map.call(elVariants.querySelectorAll('.pg-gorra'), function (s) { return s.value; });

    var total = computeTotal();
    var payload = {
      variant: VARIANT, offer: state.offer, items: items, gorras: gorras,
      priorityShipping: state.priority, recoveryDiscount: recoveryActive(),
      whatsapp: val('pgWhatsapp').replace(/\D/g, ''),
      nombre: val('pgNombre'), apellidos: val('pgApellidos'),
      departamento: val('pgDepto'), ciudad: val('pgCiudad'),
      direccion: val('pgDireccion'), barrio: val('pgBarrio'), email: val('pgEmail')
    };

    elSubmit.disabled = true;
    elStatus.className = 'pg-submit-status';
    elStatus.textContent = 'Enviando tu pedido…';
    var prevMain = elSubmitMain.textContent;
    elSubmitMain.textContent = 'Enviando…';

    fetch('/api/order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (data) {
        if (data && data.ok) {
          // SubmitForm = mid-funnel form signal (NOT the purchase). The
          // canonical Purchase (CompletePayment) fires once on /gracias with
          // the full payload — never here — to avoid double-counting.
          px('SubmitForm', { content_name: 'COD order' });
          // Stash identifiers for the /gracias Purchase event match quality.
          // email/phone go via sessionStorage (never the URL); total+offer
          // are non-private and ride the redirect query.
          try {
            sessionStorage.setItem('lt_lastOrder', JSON.stringify({
              ref: data.reference || '', total: total, offer: state.offer,
              email: payload.email || '', whatsapp: payload.whatsapp || ''
            }));
          } catch (_) {}
          window.location.href = '/gracias?ref=' + encodeURIComponent(data.reference || '') +
            '&t=' + encodeURIComponent(total) + '&o=' + encodeURIComponent(state.offer);
        } else { throw new Error((data && data.error) || 'error'); }
      }).catch(function () {
        elSubmit.disabled = false;
        elSubmitMain.textContent = prevMain;
        elStatus.className = 'pg-submit-status err';
        elStatus.innerHTML = 'No pudimos registrar tu pedido. Intentá de nuevo o ' +
          '<a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hola! Quiero hacer un pedido y la página me dio error 🇨🇴') +
          '" target="_blank" rel="noopener" style="color:#A8141C;text-decoration:underline">escribinos por WhatsApp</a>.';
      });
  });

  /* ---- Load Colombia dataset (local, no external API) ---- */
  fetch('/data/colombia-municipios.json').then(function (r) { return r.json(); }).then(function (data) {
    DEPTOS = data; fillDeptos();
  }).catch(function () { elDepto.innerHTML = '<option value="">No se pudo cargar — recargá la página</option>'; });

  renderVariants();
  recalc();

  function selectOffer(id) {
    if (!OFFERS[id]) return;
    state.offer = id;
    var radio = mount.querySelector('input[name="pg-offer"][value="' + id + '"]');
    if (radio) radio.checked = true;
    renderVariants(); recalc();
  }

  /* ============================================================
     MODAL OVERLAY — open/close, body scroll lock, back-button + ESC.
     ============================================================ */
  var modalOpen = false, savedScrollY = 0;
  function lockScroll() { savedScrollY = window.scrollY || 0; document.body.style.top = (-savedScrollY) + 'px'; document.body.classList.add('lt-modal-lock'); }
  function unlockScroll() { document.body.classList.remove('lt-modal-lock'); document.body.style.top = ''; window.scrollTo(0, savedScrollY); }

  function openModal(offerId) {
    if (offerId) selectOffer(offerId);
    if (modalOpen) return;
    modalOpen = true;
    mount.classList.add('open');
    mount.setAttribute('aria-hidden', 'false');
    lockScroll();
    fireInitiate();                       // pixel: InitiateCheckout on MODAL OPEN
    try { history.pushState({ ltModal: 1 }, ''); } catch (_) {}
    var c = document.getElementById('pgClose'); if (c) c.focus();
  }
  function realClose() {
    if (!modalOpen) return;
    modalOpen = false;
    mount.classList.remove('open');
    mount.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }
  // Close INTENT. If the user earned the recovery offer (interacted, not yet
  // shown this session, not expired), intercept: show recovery, keep the
  // checkout modal open underneath. Otherwise close for real.
  function attemptClose(via) {
    if (recoveryEligible()) {
      openRec();
      if (via === 'back') { try { history.pushState({ ltModal: 1 }, ''); } catch (_) {} } // re-guard
      return;
    }
    realClose();
    if (via !== 'back') { try { if (history.state && history.state.ltModal) history.back(); } catch (_) {} }
  }

  document.getElementById('pgClose').addEventListener('click', function () { attemptClose('btn'); });
  mount.addEventListener('click', function (e) { if (e.target === mount) attemptClose('backdrop'); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (rec.classList.contains('open')) closeRec();
    else if (modalOpen) attemptClose('esc');
  });
  window.addEventListener('popstate', function () { if (modalOpen) attemptClose('back'); });

  /* ============================================================
     UNIFIED STICKY CTA — injected once, hides the native stickies.
     ============================================================ */
  var sticky = document.createElement('a');
  sticky.className = 'lt-sticky';
  sticky.href = '#pedido';
  sticky.innerHTML = '<span class="lt-s-icon" aria-hidden="true">🛒</span>' +
    '<span class="lt-s-text"><span class="lt-s-main">LO QUIERO YA 🇨🇴</span>' +
    '<span class="lt-s-sub">Pago contra entrega · Envío gratis</span></span>';
  document.body.appendChild(sticky);

  /* Route EVERY bodysuit/offer purchase CTA to OPEN the checkout modal
     (WhatsApp is now the merchant's confirmation step). Only Pack El Once
     and the secondary "Dudas? WhatsApp" link keep WhatsApp; Divarte bags
     (different product/number) and the footer contact link also stay.
     Body CTAs are matched by: .lt-sticky, .qty-cta, .js-open-pedido,
     a[href="#pedido"] (the oferta CTAs were re-pointed to #pedido), and
     the index 4-ediciones .product-cta cards (handled first, with color). */
  var COLOR_BY_LABEL = { 'color-capitana': 'Amarilla', 'color-portera': 'Azul', 'color-cafetera': 'Roja', 'color-oronegro': 'Negra' };
  var COLOR_BY_PRODUCT = { 'La Capitana': 'Amarilla', 'La Portera': 'Azul', 'La Cafetera': 'Roja', 'Oro Negro': 'Negra' };

  function presetColor(color) {
    if (!color) return;
    var sel = mount.querySelector('.pg-color');
    if (sel) sel.value = color;
  }

  document.addEventListener('click', function (e) {
    // index 4-ediciones product cards → order modal (preselect 1 body + color),
    // intercepting the homepage product-detail modal.
    var pc = e.target.closest && e.target.closest('.product-cta[data-product]');
    if (pc) {
      e.preventDefault(); e.stopImmediatePropagation();
      openModal('1');
      presetColor(COLOR_BY_PRODUCT[pc.getAttribute('data-product')]);
      return;
    }
    var a = e.target.closest('.lt-sticky, .qty-cta, .js-open-pedido, a[href="#pedido"]');
    if (!a) return;
    e.preventDefault();
    var label = (a.getAttribute && a.getAttribute('data-label')) || '';
    var offerId = null, color = null;
    var m = label.match(/pack-([123])body/);
    if (m) offerId = m[1];
    else if (COLOR_BY_LABEL[label]) { offerId = '1'; color = COLOR_BY_LABEL[label]; }
    else if (a.classList.contains('qty-cta')) {
      var card = a.closest('.qty-card');
      if (card) { var idx = [].indexOf.call(card.parentNode.children, card); if (idx >= 0 && idx <= 2) offerId = String(idx + 1); }
    }
    openModal(offerId);
    if (color) presetColor(color);
  }, true);

  /* ============================================================
     SUPPRESS the older email exit-intents (kept) so they never fire.
     ============================================================ */
  (function suppressLegacyExit() {
    var d = new Date(); d.setTime(d.getTime() + 30 * 86400000);
    document.cookie = 'latricolor_exit_shown=1; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
    document.cookie = 'tricolor_exit_shown=1; expires=' + d.toUTCString() + '; path=/; SameSite=Lax';
  })();

  /* ============================================================
     EXIT-RECOVERY POPUP — −$10.000, honest persistent countdown.
     Now triggered ONLY by modal-close intent (see attemptClose), after
     the user interacted, once per session. Timer persists in localStorage
     and truly expires (no resetting trickery). No page-level exit signals.
     ============================================================ */
  var REC_KEY = 'lt_recoveryExpiresAt';
  var REC_SESSION = 'lt_recovery_shown';
  var REC_MS = 10 * 60 * 1000;
  var recInterval = null;

  function recExpiry() { var v = parseInt(localStorage.getItem(REC_KEY) || '0', 10); return isNaN(v) ? 0 : v; }
  function recoveryExpired() { var e = recExpiry(); return e > 0 && Date.now() >= e; }
  function recoveryEligible() {
    return state.interacted && sessionStorage.getItem(REC_SESSION) !== '1' && !recoveryExpired();
  }

  var rec = document.createElement('div');
  rec.className = 'lt-recovery';
  rec.innerHTML =
    '<div class="lt-rec-box" role="dialog" aria-modal="true" aria-label="Descuento de recuperación">' +
      '<button class="lt-rec-close" type="button" aria-label="Cerrar">×</button>' +
      '<div class="lt-rec-flag" aria-hidden="true">🇨🇴</div>' +
      '<h2 class="lt-rec-title">Espera... no te vayas todavía</h2>' +
      '<p class="lt-rec-body">Te guardamos <strong>$10.000</strong> en tu pedido. Solo por los próximos 10 minutos.</p>' +
      '<div class="lt-rec-timer" id="ltRecTimer">10:00</div>' +
      '<button class="lt-rec-primary" type="button" id="ltRecApply">Completar mi pedido con $10.000 menos</button>' +
      '<button class="lt-rec-dismiss" type="button" id="ltRecDismiss">No, gracias</button>' +
    '</div>';
  document.body.appendChild(rec);
  var recTimerEl = document.getElementById('ltRecTimer');

  function fmt(ms) {
    if (ms < 0) ms = 0;
    var s = Math.floor(ms / 1000); var m = Math.floor(s / 60); s = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function startRecTick() {
    if (recInterval) return;
    recInterval = setInterval(function () {
      var rem = recExpiry() - Date.now();
      if (recTimerEl) recTimerEl.textContent = fmt(rem);
      if (rem <= 0) {
        clearInterval(recInterval); recInterval = null;
        if (state.recovery) { state.recovery = false; recalc(); } // honest expiry → revert
        closeRec();
      }
    }, 1000);
  }
  // Shown layered above the open checkout modal; never closes the modal.
  function openRec() {
    if (rec.classList.contains('open')) return;
    sessionStorage.setItem(REC_SESSION, '1');
    if (recExpiry() === 0) { try { localStorage.setItem(REC_KEY, String(Date.now() + REC_MS)); } catch (_) {} }
    if (recTimerEl) recTimerEl.textContent = fmt(recExpiry() - Date.now());
    rec.classList.add('open');
    startRecTick();
  }
  function closeRec() { rec.classList.remove('open'); }

  // Primary: apply −$10.000, close recovery, RETURN to the open modal.
  document.getElementById('ltRecApply').addEventListener('click', function () {
    if (!recoveryExpired()) { state.recovery = true; recalc(); startRecTick(); }
    closeRec();
  });
  // Dismiss / X / backdrop on the recovery: close it AND close the modal.
  function dismissRecovery() {
    closeRec();
    realClose();
    try { if (history.state && history.state.ltModal) history.back(); } catch (_) {}
  }
  document.getElementById('ltRecDismiss').addEventListener('click', dismissRecovery);
  rec.querySelector('.lt-rec-close').addEventListener('click', dismissRecovery);
  rec.addEventListener('click', function (e) { if (e.target === rec) dismissRecovery(); });

  // If a non-expired timer is already running from a previous view, keep
  // counting (and keep the discount live in the summary) on this load.
  if (recExpiry() > 0 && !recoveryExpired()) startRecTick();
})();
