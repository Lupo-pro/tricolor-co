// ============================================
// educational.js — Value-add carousel decks for the Mundial 2026
// content calendar.
//
// Each export is a {layout, slides} bundle that build-day.js feeds
// straight into renderCarousel(). Slides reference the layout's
// supported variants (see src/templater/carousel-*.js):
//   educational  → cover | stat | cta
//   guide        → cover | step | cta
//   mood         → cover | mood | cta
//   storytelling → cover | narrative | cta
//   comparison   → cover | split | cta
//
// Match-day data (opponents, kickoffs, stadiums) is taken verbatim
// from the brand brief — calendar.json mirrors the same values, so
// the two sources stay aligned. Edit both together when the FIFA
// draw confirms or changes anything.
// ============================================

// ─── 1. El Mundial en 5 datos ───
export const MUNDIAL_EN_5_DATOS = {
  layout: 'educational',
  slides: [
    { variant: 'cover', eyebrow: 'Mundial 2026', headline: 'EL MUNDIAL EN 5 DATOS', subline: 'Lo que tu hinchada necesita saber', bg: 'cream', accent: 'red' },
    { variant: 'stat',  value: '48',  label: 'SELECCIONES',     subline: 'La edición más grande de la historia',     bg: 'yellow', accent: 'red' },
    { variant: 'stat',  value: '3',   label: 'PAÍSES SEDES',    subline: 'México · USA · Canadá',                    bg: 'blue',   accent: 'yellow' },
    { variant: 'stat',  value: '104', label: 'PARTIDOS',        subline: '64 más que en Qatar 2022',                 bg: 'red',    accent: 'yellow' },
    { variant: 'stat',  value: '32',  label: 'DÍAS DE FIESTA',  subline: 'Junio y julio de 2026',                    bg: 'ink',    accent: 'yellow' },
    { variant: 'cta',   headline: 'ESTÁ MÁS CERCA QUE NUNCA', subline: 'Sé Tricolor desde el silbatazo', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ],
};

// ─── 2. Las 3 sedes del Mundial 2026 ───
export const LAS_3_SEDES = {
  layout: 'educational',
  slides: [
    { variant: 'cover', eyebrow: 'Mundial 2026', headline: 'LAS 3 SEDES', subline: 'Tres países · una copa', bg: 'cream', accent: 'red' },
    { variant: 'stat',  value: 'MÉXICO',  label: '13 PARTIDOS',  subline: 'Azteca · Akron · BBVA',           bg: 'red',    accent: 'yellow' },
    { variant: 'stat',  value: 'USA',     label: '78 PARTIDOS',  subline: 'Hard Rock Miami · MetLife · y más', bg: 'blue', accent: 'yellow' },
    { variant: 'stat',  value: 'CANADÁ',  label: '13 PARTIDOS',  subline: 'Toronto · Vancouver',             bg: 'ink',    accent: 'yellow' },
    { variant: 'cta',   headline: 'COLOMBIA JUEGA EN 3 SEDES', subline: 'México · Guadalajara · Miami', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ],
};

// ─── 3. Por qué amamos a James ───
export const POR_QUE_AMAMOS_JAMES = {
  layout: 'storytelling',
  slides: [
    { variant: 'cover', headline: 'POR QUÉ AMAMOS A JAMES', subline: 'Homenaje al diez eterno', bg: 'ink', accent: 'yellow' },
    { variant: 'narrative', headline: 'EL GOL A URUGUAY',     subline: 'Brasil 2014 · pecho · volea · poesía',  bg: 'yellow', accent: 'red' },
    { variant: 'narrative', headline: 'EL CAPITÁN VOLVIÓ',    subline: 'Después de todo · sigue siendo nuestro 10', bg: 'blue', accent: 'yellow' },
    { variant: 'narrative', headline: 'LA ZURDA',             subline: 'No fue suerte · fue un país aprendiendo', bg: 'red', accent: 'yellow' },
    { variant: 'narrative', headline: 'GRACIAS JAMES',        subline: 'Por enseñarnos a soñar grande', bg: 'cream', accent: 'red' },
    { variant: 'cta',       headline: 'CON JAMES AL MUNDIAL', subline: 'Sé Tricolor para celebrar al 10', cta: 'Pedir Ahora', bg: 'yellow', accent: 'red' },
  ],
};

// ─── 4. Historia del amarillo Selección ───
export const HISTORIA_AMARILLO = {
  layout: 'comparison',
  slides: [
    { variant: 'cover', eyebrow: 'Selección Colombia', headline: 'LA HISTORIA DEL AMARILLO', subline: 'De camiseta a bandera', bg: 'cream', accent: 'red' },
    { variant: 'split', left: { label: '1962', headline: 'PRIMER MUNDIAL', bg: 'cream' }, right: { label: '1990', headline: 'EL PIBE',        bg: 'yellow' } },
    { variant: 'split', left: { label: '1994', headline: 'EL ESCORPIÓN',  bg: 'cream' }, right: { label: '2014', headline: 'CUARTOS',         bg: 'yellow' } },
    { variant: 'split', left: { label: '2018', headline: 'YEPES · JAMES', bg: 'cream' }, right: { label: '2026', headline: 'LA TRICOLOR',     bg: 'red'    } },
    { variant: 'cta',   headline: 'EL AMARILLO ES NUESTRO', cta: 'Pedir Ahora', bg: 'yellow', accent: 'red' },
  ],
};

// ─── 5. Cómo prepararse para un partido ───
export const COMO_PREPARARSE_PARTIDO = {
  layout: 'guide',
  slides: [
    { variant: 'cover', eyebrow: 'Match Day', headline: 'CÓMO PREPARARSE', subline: 'Para el partido de la Tricolor', bg: 'cream', accent: 'red' },
    { variant: 'step', step: '01', headline: 'OUTFIT TRICOLOR', subline: 'Body amarillo · gorra · trapo',       bg: 'yellow', accent: 'red' },
    { variant: 'step', step: '02', headline: 'SNACKS LISTOS',   subline: 'Empanadas · aguardiente · cerveza',   bg: 'cream',  accent: 'red' },
    { variant: 'step', step: '03', headline: 'EL RITUAL',       subline: 'Himno · pecho · grito a las 21:55',   bg: 'blue',   accent: 'yellow' },
    { variant: 'step', step: '04', headline: 'AMBIANCE',        subline: 'Pantalla grande · parche · ruido',    bg: 'red',    accent: 'yellow' },
    { variant: 'cta',  headline: 'TU PARCHE TE ESTÁ ESPERANDO', subline: 'Vestite como capitana', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ],
};

// ─── 6. Los hinchas más locos del mundo ───
export const HINCHAS_MAS_LOCOS = {
  layout: 'educational',
  slides: [
    { variant: 'cover', eyebrow: 'Cultura tribuna', headline: 'LOS HINCHAS MÁS LOCOS', subline: '5 culturas de tribuna que tienes que conocer', bg: 'ink', accent: 'yellow' },
    { variant: 'stat',  value: '01', label: 'ARGENTINA',  subline: 'La tribuna que canta 90 minutos sin parar',   bg: 'cream',  accent: 'blue' },
    { variant: 'stat',  value: '02', label: 'MÉXICO',     subline: 'Color · banda · fiesta hasta el final',       bg: 'red',    accent: 'yellow' },
    { variant: 'stat',  value: '03', label: 'INGLATERRA', subline: 'Los cánticos más antiguos del fútbol',        bg: 'cream',  accent: 'red' },
    { variant: 'stat',  value: '04', label: 'JAPÓN',      subline: 'Limpian el estadio después · ganen o pierdan', bg: 'cream', accent: 'red' },
    { variant: 'stat',  value: '05', label: 'COLOMBIA',   subline: 'Tribuna · sala · calle · todas iguales',      bg: 'yellow', accent: 'red' },
    { variant: 'cta',   headline: 'NUESTRA TRIBUNA NO SE RINDE', subline: 'Sé Tricolor', cta: 'Pedir Ahora', bg: 'cream', accent: 'red' },
  ],
};

// ─── 7. Los 3 partidos clave de Colombia ───
// Match data is taken verbatim from the brand brief (user-confirmed).
// If the FIFA group draw changes these, update calendar.json in lock.
export const LOS_3_PARTIDOS_CLAVE = {
  layout: 'educational',
  slides: [
    { variant: 'cover', eyebrow: 'Fase de Grupos', headline: 'LOS 3 PARTIDOS CLAVE', subline: 'Colombia · Mundial 2026', bg: 'yellow', accent: 'red' },
    { variant: 'stat',  value: '17/06', label: 'VS UZBEKISTÁN', subline: '22:00 · Estadio Azteca · CDMX',           bg: 'cream', accent: 'red' },
    { variant: 'stat',  value: '23/06', label: 'VS RD CONGO',   subline: '22:00 · Estadio Akron · Guadalajara',     bg: 'red',   accent: 'yellow' },
    { variant: 'stat',  value: '27/06', label: 'VS PORTUGAL',   subline: '19:30 · Hard Rock Stadium · Miami',       bg: 'blue',  accent: 'yellow' },
    { variant: 'cta',   headline: 'TRES NOCHES TRICOLORES',    subline: 'Tu outfit · tu energía · tu día', cta: 'Pedir Ahora', bg: 'ink', accent: 'yellow' },
  ],
};

// ─── Registry ───
export const EDUCATIONAL_CAROUSELS = {
  'mundial-en-5-datos':       MUNDIAL_EN_5_DATOS,
  'las-3-sedes':              LAS_3_SEDES,
  'por-que-amamos-james':     POR_QUE_AMAMOS_JAMES,
  'historia-amarillo':        HISTORIA_AMARILLO,
  'como-prepararse-partido':  COMO_PREPARARSE_PARTIDO,
  'hinchas-mas-locos':        HINCHAS_MAS_LOCOS,
  'los-3-partidos-clave':     LOS_3_PARTIDOS_CLAVE,
};

export function getEducationalDeck(name) {
  return EDUCATIONAL_CAROUSELS[name] || null;
}

export const EDUCATIONAL_THEME_KEYS = Object.keys(EDUCATIONAL_CAROUSELS);
