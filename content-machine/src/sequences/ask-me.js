// ============================================
// ask-me.js — 6-story Q&A sequence with sticker placeholders for
// IG question stickers. Brand asks, hinchada answers in DM, replies
// get reposted.
//
// Beat structure:
//   intro → Q1 → Q2 → Q3 → "DM your answer" → recap
// ============================================

export function generate(args = {}) {
  return [
    {
      step: 1,
      role: 'hook',
      layout: 'hook-center',
      offsetMin: 0,
      tag: 'PREGÚNTANOS',
      headline: 'HABLEMOS · TÚ Y NOSOTRAS',
      subline: '3 preguntas · respondes con sticker',
      bg: 'cream', accent: 'red',
    },
    {
      step: 2,
      role: 'tease',
      layout: 'sticker-placeholder',
      offsetMin: 60,
      eyebrow: 'PREGUNTA 1',
      headline: 'CUÁL EDICIÓN ERES?',
      subline: 'Toca el sticker · pega tu pick',
      stickerLabel: 'STICKER POLL',
      bg: 'yellow', accent: 'red',
    },
    {
      step: 3,
      role: 'tease',
      layout: 'sticker-placeholder',
      offsetMin: 180,
      eyebrow: 'PREGUNTA 2',
      headline: 'EN QUÉ PARCHE VES EL MUNDIAL?',
      subline: 'Casa · bar · estadio · cuenta',
      stickerLabel: 'PREGUNTA',
      bg: 'blue', accent: 'yellow',
    },
    {
      step: 4,
      role: 'tease',
      layout: 'sticker-placeholder',
      offsetMin: 300,
      eyebrow: 'PREGUNTA 3',
      headline: 'EL JUGADOR QUE TE HACE LLORAR?',
      subline: 'James · Luis Díaz · alguien más',
      stickerLabel: 'PREGUNTA',
      bg: 'red', accent: 'cream',
    },
    {
      step: 5,
      role: 'cta',
      layout: 'hook-split',
      offsetMin: 420,
      headline: 'MÁNDANOS TUS RESPUESTAS',
      subline: 'Las mejores las reposteamos',
      bg: 'ink', accent: 'yellow',
      cta: 'DM Abierto',
    },
    {
      step: 6,
      role: 'reveal',
      layout: 'quote-center',
      offsetMin: 1440, // next day recap
      headline: 'LO QUE NOS CONTARON',
      subline: 'La tribuna habló · ahora respondemos',
      bg: 'cream', accent: 'red',
      quoteSize: 130,
    },
  ];
}

export const NAME = 'ask-me';
export const DESCRIPTION = '6-story Q&A · intro + 3 sticker questions + DM CTA + recap.';
