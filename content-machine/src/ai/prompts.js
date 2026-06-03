// ============================================
// prompts.js — 12 caption prompt templates.
//
// Each function takes structured context and returns a string ready
// to pass into generateCaption(). Keeping the templates literal
// (template strings, no templating engine) makes the prompts
// transparent and easy to tweak per-template without leaking through
// abstractions.
//
// Style contract is enforced by SYSTEM_PROMPT in claude.js — these
// per-template prompts just supply the situation + the desired
// outcome.
//
// Hook seeding: each template draws one suggested opening hook from
// the matching category in strategy/hooks.js so Claude has a punchy
// anchor it can adopt verbatim or rewrite. Pass `{ seed }` (typically
// the calendar dateKey) so the same day always seeds the same hook.
// ============================================

import { pickHook } from '../strategy/hooks.js';
import { getAngle, hookFromAngle } from '../strategy/angles.js';

function hookBlock(category, seed) {
  const hook = pickHook(category, { seed });
  if (!hook) return '';
  return `\n\nHook sugerido (úsalo verbatim como apertura del caption, o reescríbelo en la misma voz):\n  "${hook}"`;
}

// Inject narrative angle context — voice + a sample hook in the
// angle's tone. When the caller passes `angle: 'rebellion'` (or any
// of the 12 ANGLE_IDS) the prompt picks up the angle's voice card
// AND a deterministic hook from that angle's hook bank.
function angleBlock(angleId, seed) {
  if (!angleId) return '';
  const angle = getAngle(angleId);
  if (!angle) return '';
  const hook = hookFromAngle(angle, seed);
  return `

Ángulo narrativo: ${angle.title}
Voz del ángulo: ${angle.voice}${hook ? `\nHook ejemplo (en esta voz): "${hook}"` : ''}
Mantén ese ángulo a lo largo del caption — no mezcles con otros ángulos.`;
}

// Length + structure contracts per surface. Drop these into a prompt
// to ask Claude for a specific shape of caption. Stories stay short,
// feed posts get a real narrative arc, carousel captions tease the
// deck without spoilers.
const KIND_CONTRACTS = {
  post: `
ESTRUCTURA OBLIGATORIA (caption de feed post · 500–800 caracteres):
1. HOOK — una sola frase punzante, scroll-stopper. Apertura sin tildes de marketing.
2. BODY — 3–5 líneas cortas que cuenten la historia o el argumento. Storytelling, no listado.
3. CTA — una línea, acción concreta (link en bio, escribir DM, etc.).
4. (línea en blanco)
5. HASHTAGS — 5–8 separados por espacios, primero los de marca, luego los de tema.

No uses bullet points. Voz natural colombiana, no español neutro.`,

  story: `
ESTRUCTURA (story · 50–150 caracteres):
Una sola línea punzante. Sin hashtags. Hook + emoji opcional. Texto cortito porque va sobre el visual.`,

  carouselSlide: `
ESTRUCTURA (slide individual · 100–300 caracteres):
Una idea por slide. Frase clara + microcontexto. Sin hashtags en slides individuales.`,

  carouselGlobal: `
ESTRUCTURA (caption global del carrusel · 300–500 caracteres):
1. HOOK — línea 1, scroll-stopper.
2. TEASE — 1–2 líneas prometiendo lo que viene en los slides sin spoilear.
3. CTA — "Desliza para ver" / "Link en bio" / etc.
4. (línea en blanco)
5. HASHTAGS — 3–5.`,
};

function contractFor(kind) { return KIND_CONTRACTS[kind] || ''; }

const EDITION_HINTS = {
  'la-capitana': {
    color: 'amarilla',
    role: 'Home · #10 Titular',
    hook: 'El amarillo eterno de la Tricolor.',
  },
  'la-portera': {
    color: 'azul',
    role: 'Away · #01 Arquera',
    hook: 'El azul retro que todas quieren.',
  },
  'oro-negro': {
    color: 'negro con detalles dorados',
    role: 'Premium · #07 Estrella',
    hook: 'Negro premium. Para la noche.',
  },
  'la-cafetera': {
    color: 'rojo',
    role: 'Alterna · #09 Goleadora',
    hook: 'Rojo pasión cafetera.',
  },
};

function editionLabel(key) {
  const map = { 'la-capitana': 'La Capitana', 'la-portera': 'La Portera', 'oro-negro': 'Oro Negro', 'la-cafetera': 'La Cafetera' };
  return map[key] || key;
}

// ─── 1. Drop announcement ───
export function capDrop({ edition = 'la-capitana', stockLeft = 47, priceK = 99, seed = '', angle = '' } = {}) {
  const e = EDITION_HINTS[edition] || EDITION_HINTS['la-capitana'];
  const name = editionLabel(edition);
  return `Caption de Instagram para anunciar el drop de la edición "${name}" (${e.color}, ${e.role}).
Contexto:
- Stock inicial limitado, quedan ${stockLeft} unidades.
- Precio: $${priceK}.000 COP, contraentrega a toda Colombia.
- Hook de marca: "${e.hook}"
- Esta es una de las 4 ediciones del Mundial 2026.

Objetivo: generar deseo + sentido de urgencia. La voz debe sonar a alguien que conoce a su hinchada, no a una marca corporativa.${angleBlock(angle, seed)}${hookBlock('interrogatifs', seed)}
${contractFor('post')}`;
}

// ─── 2. Manifesto quote ───
export function capManifesto({ seed = '', angle = '' } = {}) {
  return `Caption de Instagram que arranca con una frase del manifiesto de LATRICOLOR.CO:

"Nacimos amarillas, azules y rojas. Crecimos cantando el himno con la mano en el pecho. Lloramos cuando ganamos. Gritamos cuando perdemos. Somos tribuna, somos sala, somos calle. Este body no es ropa. Es bandera."

Tarea:
- Toma UNA línea del manifiesto.
- Construye un caption que la haga aterrizar (qué significa para nuestra hinchada hoy).
- No expliques el manifiesto entero, sólo amplifica la línea elegida.
- CTA suave, sin pedir compra directa — esto es contenido de marca, no de venta.${angleBlock(angle, seed)}${hookBlock('provocateurs', seed)}
${contractFor('post')}`;
}

// ─── 3. Match day ───
export function capMatchDay({ opponent = 'Uzbekistán', kickoffTime = '22:00', stadium = 'Estadio Azteca, CDMX', seed = '', angle = '' } = {}) {
  return `Caption de Instagram para el día del partido de Colombia vs ${opponent} (kickoff ${kickoffTime} hora Colombia, ${stadium}).

Contexto:
- Es el día del partido. La energía es 100% tribuna.
- Mencionar implicitamente que es momento de vestir Tricolor.
- No spoilear ningún pronóstico, solo apoyo.

Objetivo: hacer que la hinchada femenina se sienta parte del momento + visualice su outfit.${angleBlock(angle, seed)}${hookBlock('interrogatifs', seed)}
${contractFor('post')}

Hashtag obligatorio: #${opponent.toLowerCase().replace(/[^a-z]/g, '')}colombia (además de los de marca).`;
}

// ─── 4. Customer review / testimonial ───
export function capReview({ clientName = 'Valentina', city = 'Bogotá', edition = 'la-capitana', quote, seed = '', angle = '' } = {}) {
  const name = editionLabel(edition);
  return `Caption de Instagram para repostear una reseña real de cliente.

Contexto:
- Cliente: ${clientName} de ${city}.
- Pidió la edición "${name}".
- ${quote ? `Su cita: "${quote}"` : 'Cita textual no dada — inventa una creíble, corta, en voz de la cliente colombiana.'}

Objetivo: social proof. La voz del caption es la nuestra (marca), no la de la cliente. Agradecer breve + amplificar la cita.${angleBlock(angle, seed)}${hookBlock('provocateurs', seed)}
${contractFor('post')}`;
}

// ─── 5. Bundle "El Once Inicial" ───
export function capBundle({ savings = '267.000', seed = '', angle = '' } = {}) {
  return `Caption de Instagram para promocionar el pack "El Once Inicial" — las 4 ediciones juntas con descuento.

Contexto:
- Pack incluye: La Capitana (amarilla), La Portera (azul), Oro Negro (premium), La Cafetera (roja).
- Precio: $329.000 (en vez de $596.000 sueltas). Ahorro de $${savings}.
- Bonus: 2 gorras tricolor gratis con cada pack.
- El nombre "Once Inicial" hace guiño a los 11 titulares de un equipo.

Objetivo: posicionar el pack como la decisión inteligente para la fan completa. Tono: orgullo + sentido de pertenencia, no "oferta agresiva".${angleBlock(angle, seed)}${hookBlock('valeur', seed)}
${contractFor('post')}`;
}

// ─── 6. FOMO countdown ───
export function capFOMO({ edition = 'la-capitana', stockLeft = 12, hoursLeft = 4, seed = '', angle = '' } = {}) {
  const name = editionLabel(edition);
  return `Caption de Instagram con urgencia real para la edición "${name}".

Contexto:
- Quedan ${stockLeft} unidades.
- Quedan ${hoursLeft} horas antes del próximo drop / cierre.
- Esto no es urgencia falsa, es stock real.

Objetivo: empujar a las indecisas sin sonar a "BUY NOW SCAM". La urgencia debe sentirse personal — "no quiero que se te pase a ti específicamente".${angleBlock(angle, seed)}${hookBlock('fomo', seed)}
${contractFor('story')}`;
}

// ─── 7. UGC repost ───
export function capUGC({ creditUsername = '@cliente_username', seed = '', angle = '' } = {}) {
  return `Caption de Instagram para repostear contenido generado por una cliente (foto / video llevando un body Tricolor).

Contexto:
- Cliente original: ${creditUsername}.
- Su contenido nos hace orgullo.

Objetivo:
- Reconocer públicamente y dar gracias.
- Invitar a otras a hacer lo mismo ("etiquétanos @latricolor.co").
- Mostrar que la marca celebra a su hinchada, no solo le vende.${angleBlock(angle, seed)}${hookBlock('provocateurs', seed)}
${contractFor('post')}

Importante: NO empezar con "Repost desde…". Empezar con la emoción.`;
}

// ─── 8. Behind the scenes ───
export function capBTS({ theme = 'empaque del pedido', seed = '', angle = '' } = {}) {
  return `Caption de Instagram para un Behind The Scenes — tema: "${theme}".

Contexto:
- Marca pequeña, hecha en el Eje Cafetero (Pereira/Armenia).
- Cada pedido se empaca a mano por la fundadora.
- El BTS humaniza la marca y construye confianza.

Objetivo: contraste con marcas grandes / impersonales. Mostrar la cercanía + el cuidado.${angleBlock(angle, seed)}${hookBlock('valeur', seed)}
${contractFor('post')}`;
}

// ─── 9. Countdown to Mundial ───
export function capCountdown({ daysToMundial = 25, seed = '', angle = '' } = {}) {
  return `Caption de Instagram para el countdown al Mundial 2026.

Contexto:
- Quedan ${daysToMundial} días para el primer partido de Colombia.
- Cada día que pasa, el momento se hace más real.
- LATRICOLOR.CO quiere que su hinchada vaya lista — outfit incluido.

Objetivo: construir anticipación colectiva. La voz dice "estamos contando contigo".${angleBlock(angle, seed)}${hookBlock('fomo', seed)}
${contractFor('post')}`;
}

// ─── 10. Poll story ───
export function capPoll({ question = 'Qué edición te llama más?', optionA = 'La Capitana 💛', optionB = 'La Cafetera ❤️', seed = '', angle = '' } = {}) {
  return `Caption de Instagram para una story con sticker de sondage.

Pregunta: "${question}"
Opción A: ${optionA}
Opción B: ${optionB}

Contexto:
- La pregunta debe sentirse genuina, no extractiva.
- Cualquiera de las dos respuestas es "buena" para la marca.

Objetivo: engagement + sentir que su opinión cuenta.${angleBlock(angle, seed)}${hookBlock('interrogatifs', seed)}
${contractFor('story')}`;
}

// ─── 11. Carousel caption ───
export function capCarousel({ type = 'las-4-ediciones', seed = '', angle = '' } = {}) {
  const themes = {
    'las-4-ediciones':       'Las 4 ediciones del Mundial 2026 — una para cada estado de ánimo de la hinchada.',
    'guia-tallas':            'Cómo encontrar tu talla perfecta (S / M / L) usando medidas reales — sin adivinar.',
    'como-funciona':          'Cómo funciona el pedido — escríbenos por WhatsApp, te asesoramos, llega contraentrega.',
    'por-que-tricolor':       'Por qué ser Tricolor — manifesto storytelling en 5 slides.',
    'once-inicial':           'El pack El Once Inicial: 4 bodies + 2 gorras gratis, ahorro $267.000.',
    'mundial-en-5-datos':     'El Mundial 2026 explicado en 5 datos clave que tu hinchada necesita saber.',
    'las-3-sedes':            'Las 3 sedes del Mundial 2026 — México, USA, Canadá.',
    'por-que-amamos-james':   'Por qué amamos a James — homenaje en 5 slides al 10 eterno.',
    'historia-amarillo':      'La historia del amarillo Selección — evolución del jersey.',
    'como-prepararse-partido':'Cómo prepararse para el partido — snacks, outfit, ritual, ambiance.',
    'hinchas-mas-locos':      'Los hinchas más locos del mundo — top 5 culturas de tribuna.',
    'los-3-partidos-clave':   'Los 3 partidos clave de Colombia: vs Uzbekistán, RD Congo, Portugal.',
  };
  const theme = themes[type] || themes['las-4-ediciones'];
  // Educational carousels lean on the "valeur" bucket; product-focused
  // ones lean on "interrogatifs".
  const educationalSet = new Set([
    'mundial-en-5-datos', 'las-3-sedes', 'por-que-amamos-james',
    'historia-amarillo', 'como-prepararse-partido', 'hinchas-mas-locos',
    'los-3-partidos-clave',
  ]);
  const category = educationalSet.has(type) ? 'valeur' : 'interrogatifs';
  return `Caption de Instagram para un carrusel (varios slides).
Tema del carrusel: "${type}"
Pitch del carrusel: ${theme}

Objetivo:
- El caption introduce el carrusel sin spoilear todos los slides.
- Invita explícitamente a deslizar.
- Cerrar con una CTA: link en bio / DM / lo que aplique.${angleBlock(angle, seed)}${hookBlock(category, seed)}
${contractFor('carouselGlobal')}`;
}

// ─── 12. Q&A ───
export function capQA({ question = 'Pago contraentrega de verdad?', seed = '', angle = '' } = {}) {
  return `Caption de Instagram para responder una pregunta frecuente.

Pregunta de la cliente: "${question}"

Contexto:
- LATRICOLOR.CO ofrece pago contraentrega real (efectivo, Nequi, Daviplata).
- Envío 24-72h con Interrapidísimo o Servientrega.
- Garantía 7 días.

Objetivo: responder con autoridad + humanidad. La respuesta tiene que matar la duda en una frase.${angleBlock(angle, seed)}${hookBlock('valeur', seed)}
${contractFor('post')}`;
}

// Convenience export — register every prompt under a stable id.
export const PROMPTS = {
  drop: capDrop,
  manifesto: capManifesto,
  matchDay: capMatchDay,
  review: capReview,
  bundle: capBundle,
  fomo: capFOMO,
  ugc: capUGC,
  bts: capBTS,
  countdown: capCountdown,
  poll: capPoll,
  carousel: capCarousel,
  qa: capQA,
};
