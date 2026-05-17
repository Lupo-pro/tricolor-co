// ============================================
// claude.js — Anthropic SDK wrapper for caption generation.
//
// Uses Claude Sonnet 4.6 by default (best price/quality for short
// caption generation as of mid-2026). Override via CLAUDE_MODEL env
// if a newer model is available.
//
// Every call enforces:
//   - es-CO Spanish (Colombian voice, not Spain Spanish)
//   - V5 fanzine tone: badass féminin, tribune energy, urgency
//   - Max 200 chars for IG captions
//   - 3-5 hashtags
//   - Emoji vocabulary kept on-brand
//
// No network call is made until generateCaption() is invoked.
// ============================================

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const MAX_TOKENS = 600; // tight cap — captions are short, no need for room

let _client = null;
function client() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('sk_xxx')) {
    throw new Error('ANTHROPIC_API_KEY missing or placeholder. Fill content-machine/.env first.');
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

const SYSTEM_PROMPT = `Eres copy editor de LATRICOLOR.CO, una marca colombiana de bodysuits inspirados en la Selección Colombia.

TU VOZ:
- Español colombiano natural (no español de España). Usa "vos" / "tú" según contexto — paisa-friendly.
- Tono V5 fanzine: badass féminin, energía tribuna, drama, urgencia.
- Lenguaje fútbol-stadium: "hinchada", "tribuna", "Sé Tricolor", "cafetera".

RESTRICCIONES INSTAGRAM:
- Máximo 200 caracteres para el caption principal.
- 3-5 hashtags relevantes al final, separados por espacios.
- Emoji moderados (1-3 max por caption): 🇨🇴 ⚡ 🔥 ✨ 💛 💙 ❤️ — nunca todos juntos, nunca emoji genéricos.
- Una sola CTA clara.
- Línea blanca antes de los hashtags.

PROHIBIDO:
- Frases hechas de marketing ("descubre nuestra colección", "no te lo pierdas")
- Emoji excesivos
- Ortografía inglesada
- Voz neutral / impersonal

OUTPUT:
- Devuelve SOLO el texto del caption + hashtags. Nada más. Sin explicaciones, sin comillas envolventes.`;

/**
 * Generate an IG caption for a given prompt template.
 * @param {string} userPrompt - The fully-formed prompt for this caption.
 * @returns {Promise<string>}
 */
export async function generateCaption(userPrompt) {
  const c = client();
  const response = await c.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  });
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
  if (!text) throw new Error('Claude returned empty content');
  return text;
}

/**
 * Generate N caption variants for the same prompt.
 * Useful for A/B testing or just giving the swipe UI options.
 */
export async function generateCaptionVariants(userPrompt, n = 3) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(await generateCaption(userPrompt + (i === 0 ? '' : `\n\n[Variante ${i + 1}, distinto enfoque pero misma intención.]`)));
  }
  return out;
}

export const CLAUDE_MODEL = MODEL;
