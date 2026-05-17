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
// ============================================

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
export function capDrop({ edition = 'la-capitana', stockLeft = 47, priceK = 99 } = {}) {
  const e = EDITION_HINTS[edition] || EDITION_HINTS['la-capitana'];
  const name = editionLabel(edition);
  return `Caption de Instagram para anunciar el drop de la edición "${name}" (${e.color}, ${e.role}).
Contexto:
- Stock inicial limitado, quedan ${stockLeft} unidades.
- Precio: $${priceK}.000 COP, contraentrega a toda Colombia.
- Hook de marca: "${e.hook}"
- Esta es una de las 4 ediciones del Mundial 2026.

Objetivo: generar deseo + sentido de urgencia. La voz debe sonar a alguien que conoce a su hinchada, no a una marca corporativa.

Output: caption + 3-5 hashtags (#latricolorco #mundial2026 #seleccioncolombia + 1-2 específicos).`;
}

// ─── 2. Manifesto quote ───
export function capManifesto() {
  return `Caption de Instagram que arranca con una frase del manifiesto de LATRICOLOR.CO:

"Nacimos amarillas, azules y rojas. Crecimos cantando el himno con la mano en el pecho. Lloramos cuando ganamos. Gritamos cuando perdemos. Somos tribuna, somos sala, somos calle. Este body no es ropa. Es bandera."

Tarea:
- Toma UNA línea del manifiesto.
- Construye un caption corto que la haga aterrizar (qué significa para nuestra hinchada hoy).
- No expliques el manifiesto entero, sólo amplifica la línea elegida.
- CTA suave, sin pedir compra directa — esto es contenido de marca, no de venta.

Output: caption + 3-4 hashtags (#sefuerte #sefiera #setricolor + 1).`;
}

// ─── 3. Match day ───
export function capMatchDay({ opponent = 'Uzbekistán', kickoffTime = '22:00', stadium = 'Estadio Azteca, CDMX' } = {}) {
  return `Caption de Instagram para el día del partido de Colombia vs ${opponent} (kickoff ${kickoffTime} hora Colombia, ${stadium}).

Contexto:
- Es el día del partido. La energía es 100% tribuna.
- Mencionar implicitamente que es momento de vestir Tricolor.
- No spoilear ningún pronóstico, solo apoyo.

Objetivo: hacer que la hinchada femenina se sienta parte del momento + visualice su outfit.

Output: caption corto (energía alta, frases cortas) + 3-5 hashtags (#vamoscolombia #mundial2026 #${opponent.toLowerCase().replace(/[^a-z]/g, '')}colombia + 1-2).`;
}

// ─── 4. Customer review / testimonial ───
export function capReview({ clientName = 'Valentina', city = 'Bogotá', edition = 'la-capitana', quote } = {}) {
  const name = editionLabel(edition);
  return `Caption de Instagram para repostear una reseña real de cliente.

Contexto:
- Cliente: ${clientName} de ${city}.
- Pidió la edición "${name}".
- ${quote ? `Su cita: "${quote}"` : 'Cita textual no dada — inventa una creíble, corta, en voz de la cliente colombiana.'}

Objetivo: social proof. La voz del caption es la nuestra (marca), no la de la cliente. Agradecer breve + amplificar la cita.

Output: caption + 3 hashtags (#latribuna #setricolor + 1).`;
}

// ─── 5. Bundle "El Once Inicial" ───
export function capBundle({ savings = '267.000' } = {}) {
  return `Caption de Instagram para promocionar el pack "El Once Inicial" — las 4 ediciones juntas con descuento.

Contexto:
- Pack incluye: La Capitana (amarilla), La Portera (azul), Oro Negro (premium), La Cafetera (roja).
- Precio: $329.000 (en vez de $596.000 sueltas). Ahorro de $${savings}.
- Bonus: 2 gorras tricolor gratis con cada pack.
- El nombre "Once Inicial" hace guiño a los 11 titulares de un equipo.

Objetivo: posicionar el pack como la decisión inteligente para la fan completa. Tono: orgullo + sentido de pertenencia, no "oferta agresiva".

Output: caption + 3-4 hashtags (#elonceinicial #mundial2026 + 1-2).`;
}

// ─── 6. FOMO countdown ───
export function capFOMO({ edition = 'la-capitana', stockLeft = 12, hoursLeft = 4 } = {}) {
  const name = editionLabel(edition);
  return `Caption de Instagram con urgencia real para la edición "${name}".

Contexto:
- Quedan ${stockLeft} unidades.
- Quedan ${hoursLeft} horas antes del próximo drop / cierre.
- Esto no es urgencia falsa, es stock real.

Objetivo: empujar a las indecisas sin sonar a "BUY NOW SCAM". La urgencia debe sentirse personal — "no quiero que se te pase a ti específicamente".

Output: caption corto + 3 hashtags (#stocklimitado #latricolorco + 1).`;
}

// ─── 7. UGC repost ───
export function capUGC({ creditUsername = '@cliente_username' } = {}) {
  return `Caption de Instagram para repostear contenido generado por una cliente (foto / video llevando un body Tricolor).

Contexto:
- Cliente original: ${creditUsername}.
- Su contenido nos hace orgullo.

Objetivo:
- Reconocer públicamente y dar gracias.
- Invitar a otras a hacer lo mismo ("etiquétanos @latricolor.co").
- Mostrar que la marca celebra a su hinchada, no solo le vende.

Output: caption + 3 hashtags (#latribuna #setricolor + 1).
Importante: NO empezar con "Repost desde…". Empezar con la emoción.`;
}

// ─── 8. Behind the scenes ───
export function capBTS({ theme = 'empaque del pedido' } = {}) {
  return `Caption de Instagram para un Behind The Scenes — tema: "${theme}".

Contexto:
- Marca pequeña, hecha en el Eje Cafetero (Pereira/Armenia).
- Cada pedido se empaca a mano por la fundadora.
- El BTS humaniza la marca y construye confianza.

Objetivo: contraste con marcas grandes / impersonales. Mostrar la cercanía + el cuidado.

Output: caption + 3 hashtags (#hechoencolombia #ejecafetero + 1).`;
}

// ─── 9. Countdown to Mundial ───
export function capCountdown({ daysToMundial = 25 } = {}) {
  return `Caption de Instagram para el countdown al Mundial 2026.

Contexto:
- Quedan ${daysToMundial} días para el primer partido de Colombia.
- Cada día que pasa, el momento se hace más real.
- LATRICOLOR.CO quiere que su hinchada vaya lista — outfit incluido.

Objetivo: construir anticipación colectiva. La voz dice "estamos contando contigo".

Output: caption + 3-4 hashtags (#mundial2026 #vamoscolombia #latricolorco + 1).`;
}

// ─── 10. Poll story ───
export function capPoll({ question = '¿Qué edición te llama más?', optionA = 'La Capitana 💛', optionB = 'La Cafetera ❤️' } = {}) {
  return `Caption de Instagram para una story con sticker de sondage.

Pregunta: "${question}"
Opción A: ${optionA}
Opción B: ${optionB}

Contexto:
- La pregunta debe sentirse genuina, no extractiva.
- Cualquiera de las dos respuestas es "buena" para la marca.

Objetivo: engagement + sentir que su opinión cuenta.

Output: caption MUY corto (≤120 caracteres) que prepare el sticker de sondage + 2 hashtags.`;
}

// ─── 11. Carousel caption ───
export function capCarousel({ type = 'las-4-ediciones' } = {}) {
  const themes = {
    'las-4-ediciones':  'Las 4 ediciones del Mundial 2026 — una para cada estado de ánimo de la hinchada.',
    'guia-tallas':      'Cómo encontrar tu talla perfecta (S / M / L) usando medidas reales — sin adivinar.',
    'como-funciona':    'Cómo funciona el pedido — escríbenos por WhatsApp, te asesoramos, llega contraentrega.',
    'por-que-tricolor': 'Por qué ser Tricolor — manifesto storytelling en 5 slides.',
    'once-inicial':     'El pack El Once Inicial: 4 bodies + 2 gorras gratis, ahorro $267.000.',
  };
  const theme = themes[type] || themes['las-4-ediciones'];
  return `Caption de Instagram para un carrusel (varios slides).
Tema del carrusel: "${type}"
Pitch del carrusel: ${theme}

Objetivo:
- El caption introduce el carrusel sin spoilear todos los slides.
- Invita explícitamente a deslizar (→).
- Cerrar con una CTA: link en bio / DM / lo que aplique.

Output: caption + 3-4 hashtags (#latricolorco + 2-3 específicos al tema).`;
}

// ─── 12. Q&A ───
export function capQA({ question = '¿Pago contraentrega de verdad?' } = {}) {
  return `Caption de Instagram para responder una pregunta frecuente.

Pregunta de la cliente: "${question}"

Contexto:
- LATRICOLOR.CO ofrece pago contraentrega real (efectivo, Nequi, Daviplata).
- Envío 24-72h con Interrapidísimo o Servientrega.
- Garantía 7 días.

Objetivo: responder con autoridad + humanidad. La respuesta tiene que matar la duda en una frase.

Output: caption (formato "P / R" o párrafo corto) + 3 hashtags (#contraentrega #latricolorco + 1).`;
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
