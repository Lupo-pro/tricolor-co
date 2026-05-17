// ============================================
// story-question.js — Q&A / poll-style story.
// Question at top in big type, 2-4 answer pills below.
// descriptor: { question, answers: [string], bg, accent }
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, pillTag, getShadowColor,} from './brand.js';

const PILL_BG_CYCLE = [PALETTE.yellow, PALETTE.bg, PALETTE.red, PALETTE.blue];
const PILL_TEXT_CYCLE = [PALETTE.ink, PALETTE.ink, PALETTE.bg, PALETTE.bg];

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const bg = bgColor(descriptor.bg || 'cream');
  const accent = accentColor(descriptor.accent || 'red');
  const onDark = isDark(bg);
  const answers = (descriptor.answers || []).slice(0, 4);

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width, height,
      backgroundColor: bg,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    grainOverlay({ opacity: 0.07 }),
    flagBar({ height: 20 }),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1.3,
        padding: '100px 60px 60px',
        textAlign: 'center',
      },
    },
      el('div', {
        style: {
          fontFamily: 'Anton',
          fontSize: 160,
          lineHeight: 0.95,
          letterSpacing: '-0.02em',
          color: onDark ? PALETTE.bg : PALETTE.ink,
          textTransform: 'uppercase',
          textShadow: `7px 7px 0 ${getShadowColor(onDark ? PALETTE.bg : PALETTE.ink, accent)}`,
        },
      }, descriptor.question || descriptor.headline || ''),
    ),

    // Answers grid — wrap to 2 per row if > 2
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        flex: 1,
        padding: '0 60px',
      },
    },
      ...answers.map((ans, i) =>
        el('div', { style: { display: 'flex', width: '100%', justifyContent: 'center' } },
          pillTag(ans, {
            bg: PILL_BG_CYCLE[i % PILL_BG_CYCLE.length],
            color: PILL_TEXT_CYCLE[i % PILL_TEXT_CYCLE.length],
            border: PALETTE.ink,
            shadow: PALETTE.ink,
            fontSize: 52,
            pad: '24px 56px',
          }),
        )
      ),
    ),

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 80,
      },
    },
      logoTricolor({ size: 'lg', onDark }),
    ),
    flagBar({ height: 20, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
