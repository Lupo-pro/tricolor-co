// ============================================
// story-match-score.js — live match-day scoreboard.
// Two side-by-side team cards with score chips, eyebrow with the
// minute, optional subline (goal scorer / event note).
//
// descriptor: {
//   home: { name, score, color },
//   away: { name, score, color },
//   eyebrow: '"MINUTO 67"',
//   subline: 'James · gol al ángulo',
// }
// ============================================

import {
  PALETTE, el, flagBar, grainOverlay,
  logoTricolor, bgColor, accentColor, starLabel,
} from './brand.js';

const TEAM_BG = {
  yellow: PALETTE.yellow,
  blue:   PALETTE.blue,
  red:    PALETTE.red,
  ink:    PALETTE.ink,
  cream:  PALETTE.bg,
};

function teamCard({ name, score, color }) {
  const bg = TEAM_BG[color] || PALETTE.yellow;
  const onDark = isDark(bg);
  const ink = onDark ? PALETTE.bg : PALETTE.ink;
  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      flex: 1,
      backgroundColor: bg,
      padding: '60px 30px',
      position: 'relative',
    },
  },
    grainOverlay({ opacity: 0.05 }),
    el('div', {
      style: {
        display: 'flex',
        fontFamily: 'Anton',
        fontSize: 120,
        letterSpacing: '0.04em',
        color: ink,
        textTransform: 'uppercase',
      },
    }, name || ''),
    el('div', {
      style: {
        display: 'flex',
        fontFamily: 'Anton',
        fontSize: 420,
        lineHeight: 0.85,
        letterSpacing: '-0.04em',
        color: ink,
        textShadow: `8px 8px 0 ${onDark ? PALETTE.red : PALETTE.ink}`,
      },
    }, String(score ?? 0)),
  );
}

export function render(descriptor, { width = 1080, height = 1920 } = {}) {
  const home = descriptor.home || { name: 'COL', score: 0, color: 'yellow' };
  const away = descriptor.away || { name: 'OPP', score: 0, color: 'cream' };
  const accent = accentColor(descriptor.accent || 'red');

  return el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width, height,
      backgroundColor: PALETTE.ink,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter',
    },
  },
    flagBar({ height: 20 }),

    // Eyebrow / minute
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '70px 0 40px',
      },
    },
      starLabel(descriptor.eyebrow || 'MATCH DAY', { color: PALETTE.yellow, size: 36 }),
    ),

    // Team cards side-by-side, vertical separator strip
    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'row',
        flex: 1,
      },
    },
      teamCard(home),
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: 16,
          backgroundColor: PALETTE.ink,
        },
      }),
      teamCard(away),
    ),

    // Subline / event note
    descriptor.subline
      ? el('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 60px',
            backgroundColor: accent,
          },
        },
          el('div', {
            style: {
              display: 'flex',
              fontFamily: 'Bebas Neue',
              fontSize: 50,
              letterSpacing: '0.12em',
              color: PALETTE.ink,
              textTransform: 'uppercase',
            },
          }, descriptor.subline),
        )
      : null,

    el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 80,
        backgroundColor: PALETTE.ink,
      },
    },
      logoTricolor({ size: 'lg', onDark: true }),
    ),
    flagBar({ height: 20, reversed: true }),
  );
}

function isDark(bg) {
  return !(bg === PALETTE.bg || bg === PALETTE.bgWarm || bg === PALETTE.yellow);
}
