// ============================================
// angles.js — Narrative angles for the content machine.
//
// An "angle" is the storytelling lens the post/story/carousel is
// shot through. Different from a content "type" (product / educational
// / manifesto): two posts can both be "manifesto" but one uses the
// rebellion angle and the other uses the confession angle and they
// read completely differently.
//
// 12 angles total, each with:
//   - id        : stable slug used in seeds, manifests, prefs
//   - title     : human label
//   - voice     : two-line description of the speaking persona
//   - hooks     : 3+ scroll-stoppers in the angle's voice
//   - use       : where this angle naturally fits (advisory)
//
// Callers:
//   pickAngle(seed)            — one deterministic angle
//   anglesForDay(date, n=3)    — N distinct angles, no repeats
//   hookFromAngle(id, seed)    — pick a hook from a specific angle
// ============================================

export const ANGLES = [
  {
    id: 'rebellion',
    title: 'Rebellion / Outsider',
    voice: 'Para las que no pertenecen — voz de quien rompe la puerta',
    hooks: [
      'LA CAMISETA QUE NO IBAS A COMPRAR',
      'DECÍAN QUE LAS MUJERES NO ENTENDÍAMOS DE FÚTBOL',
      'HASTA QUE LLEGAMOS NOSOTRAS',
      'NO PEDIMOS PERMISO PARA SER TRIBUNA',
      'NO ES UN BODY · ES UNA RESPUESTA',
    ],
    use: ['manifesto', 'hero-post', 'quote-fullbg', 'split-screen'],
  },
  {
    id: 'memory',
    title: 'Memoria / Nostalgia',
    voice: 'Tu abuela te decía — tres generaciones en una frase',
    hooks: [
      'MI ABUELA VIO EL 90',
      'MI MAMÁ VIO EL 14',
      'YO VOY A VER EL 26',
      'EL AMARILLO PASA DE GENERACIÓN',
      'TENGO LA CAMISETA DE MI PAPÁ EN EL CAJÓN',
    ],
    use: ['carousel-storytelling', 'carousel-story-arc', 'quote-crema'],
  },
  {
    id: 'ritual',
    title: 'Ritual / Sacred',
    voice: 'Antes del partido — algo se prepara',
    hooks: [
      'MI RITO ANTES DEL KICK-OFF',
      '3 COSAS QUE HAGO ANTES DEL PARTIDO',
      'EL RITUAL DE LA HINCHA TRICOLOR',
      'A LAS 21:55 EMPIEZA TODO',
      'ME PONGO EL BODY · ABRO LA CERVEZA · RESPIRO',
    ],
    use: ['match-day-stories', 'match-prep-day', 'bts'],
  },
  {
    id: 'confession',
    title: 'Confesión / Vulnerable',
    voice: 'Te voy a contar algo — voz baja, primera persona',
    hooks: [
      'CONFIESO QUE LLORÉ CUANDO PERDIMOS',
      'NO SABÍA NADA DE FÚTBOL HASTA QUE...',
      'LA PRIMERA VEZ QUE ENTRÉ A UN ESTADIO',
      'CREÍA QUE EL FÚTBOL NO ERA PARA MÍ',
      'NUNCA HABÍA GRITADO UN GOL HASTA EL 2014',
    ],
    use: ['manifesto', 'bts', 'story-confession', 'mini-documental'],
  },
  {
    id: 'comedy',
    title: 'Comedy / Self-deprecating',
    voice: 'POV: tu novio cuando — meme-aware, paisa wit',
    hooks: [
      'POV: TU NOVIO CUANDO TE VE CON EL BODY',
      '3 COSAS QUE SOLO ENTENDEMOS LAS CAFETERAS',
      'TIPOS DE HINCHAS EN UNA SALITA EN PEREIRA',
      'CUANDO TU GRUPO DE WHATSAPP EMPIEZA A AVISAR DEL GOL',
      'POV: ESTÁS EN UNA REUNIÓN Y LA TRICOLOR JUEGA',
    ],
    use: ['reels', 'story-pov', 'carousel-listicle', 'sticker-placeholder'],
  },
  {
    id: 'data',
    title: 'Data / Insight',
    voice: '¿Sabías que...? — autoridad amable, no académica',
    hooks: [
      '¿SABÍAS QUE COLOMBIA NUNCA PASÓ DE CUARTOS?',
      '5 DATOS QUE NO CONOCÍAS DEL MUNDIAL 2026',
      'LA ESTADÍSTICA QUE CAMBIA TODO',
      '48 SELECCIONES · 3 PAÍSES · 1 SOLA CAFETERA',
      'LO QUE NO TE DICEN DEL MUNDIAL',
    ],
    use: ['carousel-educational', 'carousel-listicle', 'story-numbers'],
  },
  {
    id: 'tribute',
    title: 'Tribute / Hero',
    voice: 'Esta es para — homenaje sin caer en el cliché',
    hooks: [
      'ESTA ES PARA JAMES',
      'ESTA ES PARA LA PORTERA QUE NADIE RECONOCÍA',
      'ESTA ES PARA NUESTRAS ABUELAS',
      'ESTA ES PARA LOS QUE NO LLEGARON AL MUNDIAL',
      'GRACIAS, 10',
    ],
    use: ['post-quote-attributed', 'quote-fullbg', 'carousel-storytelling'],
  },
  {
    id: 'comparison',
    title: 'Comparison / Then vs Now',
    voice: 'Antes / Ahora — dos imágenes, una historia',
    hooks: [
      'HINCHA 1990 VS HINCHA 2026',
      'LA CAMISETA DE MI PAPÁ VS MI BODY',
      'LO QUE CAMBIÓ ENTRE ITALIA 90 Y MÉXICO 26',
      'ANTES: 1 PARTIDO EN BAR · AHORA: TIKTOK EN VIVO',
      'OTROS BODIES VS LOS NUESTROS',
    ],
    use: ['post-comparison', 'carousel-comparison'],
  },
  {
    id: 'urgency',
    title: 'Urgency / Scarcity',
    voice: 'Última oportunidad — sincera, no scam-y',
    hooks: [
      'SOLO 12 CAFETERAS LO TENDRÁN',
      'QUEDAN 47 HORAS',
      'ANTES QUE EL MUNDIAL EMPIECE',
      'CIERRA HOY A LAS 22:00',
      'NO QUIERO QUE TE PILLE TARDE',
    ],
    use: ['fomo-countdown', 'numbers', 'hook-split'],
  },
  {
    id: 'community',
    title: 'Community / Tribuna',
    voice: 'Somos parte de algo — voz colectiva',
    hooks: [
      'NO ESTÁS SOLA EN LA TRIBUNA',
      'CAFETERAS UNIDAS',
      'BANDERA · SANGRE · BODY',
      'SOMOS LA TRIBUNA QUE NO SE VE',
      'AQUÍ NADIE CANTA SOLA',
    ],
    use: ['hero-post', 'manifesto', 'social-proof'],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle / Aspirational',
    voice: 'Look del día — fashion-fluency without abandoning fútbol',
    hooks: [
      'OUTFIT DEL PARTIDO VS UZBEKISTÁN',
      'BODY + DENIM + TINTO DEL QUINDÍO',
      '3 LOOKS PARA EL MUNDIAL',
      'CÓMO COMBINARLO SIN VERTE COMO HINCHA-MOLLY',
      'PARA EL ESTADIO Y PARA DESPUÉS',
    ],
    use: ['outfit-del-match', 'photo-placeholder', 'carousel-mood'],
  },
  {
    id: 'origin',
    title: 'Origin / Why we exist',
    voice: 'Esto empezó porque — fundadora hablando, no PR',
    hooks: [
      'POR QUÉ CREAMOS LATRICOLOR',
      'LA NOCHE QUE SE ME OCURRIÓ',
      'NO HABÍA BODIES PARA NOSOTRAS · HASTA AHORA',
      'EMPEZÓ EN UNA COCINA DE PEREIRA',
      '2024 · UN MOLDE · UN GRITO',
    ],
    use: ['mini-documental', 'post-quote-attributed', 'quote-crema'],
  },
];

const BY_ID = Object.fromEntries(ANGLES.map((a) => [a.id, a]));

// ───────────────────────────────────────────
// Deterministic helpers — same seed → same answer so reruns of the
// same calendar day produce the same content (good for caches and
// for the prefs learning loop).
// ───────────────────────────────────────────
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Returns an angle object (not just its id). */
export function pickAngle(seed = '') {
  if (!seed) return ANGLES[Math.floor(Math.random() * ANGLES.length)];
  return ANGLES[hash('angle:' + seed) % ANGLES.length];
}

export function getAngle(id) { return BY_ID[id] || null; }

/**
 * N distinct angles for a single day. Used by build-day.js to rotate
 * the lens across the day's batch.
 */
export function anglesForDay(seed, n = 3) {
  const total = ANGLES.length;
  const take = Math.max(1, Math.min(total, n));
  // Deterministic permutation by hashing (seed, index) — picks `take`
  // distinct angles without reshuffling the whole array.
  const used = new Set();
  const out = [];
  let probe = 0;
  while (out.length < take && probe < total * 4) {
    const idx = hash(`angle:${seed}:${probe}`) % total;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(ANGLES[idx]);
    }
    probe++;
  }
  return out;
}

/** Pick one hook from a specific angle, deterministic per seed. */
export function hookFromAngle(angleOrId, seed = '') {
  const angle = typeof angleOrId === 'string' ? BY_ID[angleOrId] : angleOrId;
  if (!angle || !angle.hooks?.length) return '';
  if (!seed) return angle.hooks[Math.floor(Math.random() * angle.hooks.length)];
  return angle.hooks[hash(`hook:${angle.id}:${seed}`) % angle.hooks.length];
}

/**
 * Suggest an angle for a given layout/content surface. Returns the
 * first angle whose `use` list mentions the surface; falls back to a
 * deterministic pick if no match.
 */
export function suggestAngleFor(surface, seed = '') {
  if (!surface) return pickAngle(seed);
  const candidates = ANGLES.filter((a) => (a.use || []).includes(surface));
  if (candidates.length === 0) return pickAngle(seed);
  return candidates[hash(`surface:${surface}:${seed}`) % candidates.length];
}

export const ANGLE_IDS = ANGLES.map((a) => a.id);
