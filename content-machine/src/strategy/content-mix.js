// ============================================
// content-mix.js — Day → content plan resolver.
//
// Reads calendar.json once and exposes:
//   planForDay(dateKey) → { theme, sequences[], posts[], carousel, special }
//
// Each entry in sequences[] is fully hydrated with the runtime args
// generate() expects ({ edition, stockLeft, opponent, kickoff, ... }),
// so the daily pack generator (commit 7) can map directly onto
// renderStory() / sequence.generate().
//
// Day-of-week rotation when calendar has no entry for the date:
//   Mon → daily-drop (rotating edition by week)
//   Tue → manifesto
//   Wed → daily-drop (different edition)
//   Thu → behind-scenes + carousel
//   Fri → social-proof
//   Sat → fomo-countdown
//   Sun → manifesto
// ============================================

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CALENDAR_PATH = join(__dirname, 'calendar.json');

let _cal = null;
async function loadCalendar() {
  if (_cal) return _cal;
  const txt = await readFile(CALENDAR_PATH, 'utf-8');
  _cal = JSON.parse(txt);
  return _cal;
}

const EDITION_ROTATION = ['la-capitana', 'la-portera', 'oro-negro', 'la-cafetera'];

function fallbackByDayOfWeek(dateKey) {
  const dow = new Date(dateKey).getUTCDay(); // 0 = Sun
  const week = Math.floor((Date.parse(dateKey) - Date.parse('2026-05-17')) / 86_400_000 / 7);
  const editionByWeek = EDITION_ROTATION[Math.max(0, week % 4)];
  const planByDow = {
    0: { theme: 'sunday-manifesto',  sequence_primary: 'manifesto' },
    1: { theme: 'monday-drop',       sequence_primary: 'daily-drop',      edition_focus: editionByWeek },
    2: { theme: 'manifesto-tuesday', sequence_primary: 'manifesto',       sequence_secondary: 'social-proof' },
    3: { theme: 'midweek-drop',      sequence_primary: 'daily-drop',      edition_focus: EDITION_ROTATION[(week + 2) % 4] },
    4: { theme: 'behind-scenes',     sequence_primary: 'behind-scenes' },
    5: { theme: 'social-proof',      sequence_primary: 'social-proof' },
    6: { theme: 'saturday-fomo',     sequence_primary: 'fomo-countdown',  edition_focus: editionByWeek },
  };
  return planByDow[dow] || planByDow[0];
}

function buildSequenceArgs(seqName, day, cal) {
  const base = { edition: day.edition_focus, stockLeft: estimateStock(day, cal) };
  if (seqName === 'match-day' && day.sequence_match) {
    return { ...base, ...day.sequence_match };
  }
  if (seqName === 'fomo-countdown') {
    return { ...base, stockStart: 23, stockMid1: 12, stockMid2: 5 };
  }
  return base;
}

// Rough stock estimate so urgency stories aren't lying. As we approach
// the Mundial start (June 11) stock counts trend down.
function estimateStock(day, cal) {
  if (typeof day.stockLeft === 'number') return day.stockLeft;
  const start = Date.parse(cal._meta.start);
  const target = Date.parse('2026-06-11');
  const at = day._dateMs || start;
  const total = Math.max(1, target - start);
  const elapsed = Math.max(0, Math.min(total, at - start));
  const remaining = Math.round(50 - (elapsed / total) * 40); // 50 → 10 over the window
  return Math.max(8, remaining);
}

/**
 * Resolve the plan for a single day. Returns the calendar-defined plan
 * if present, otherwise a fallback derived from day-of-week.
 */
export async function planForDay(dateKey) {
  const cal = await loadCalendar();
  const day = cal.days[dateKey] || fallbackByDayOfWeek(dateKey);
  day._dateMs = Date.parse(dateKey);

  const sequences = [];
  if (day.sequence_primary) {
    sequences.push({ name: day.sequence_primary, args: buildSequenceArgs(day.sequence_primary, day, cal) });
  }
  if (day.sequence_secondary) {
    sequences.push({ name: day.sequence_secondary, args: buildSequenceArgs(day.sequence_secondary, day, cal) });
  }

  return {
    date: dateKey,
    theme: day.theme || 'general',
    edition_focus: day.edition_focus || null,
    sequences,
    posts: Array.isArray(day.posts) ? day.posts : [],
    carousel: day.carousel || null,
    special: day.special || null,
    match: day.sequence_match || null,
  };
}

/**
 * Get every match in the calendar (used by the dashboard's
 * "upcoming matches" widget).
 */
export async function upcomingMatches({ from = todayKey() } = {}) {
  const cal = await loadCalendar();
  return (cal.matches || []).filter((m) => m.date >= from);
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

export { todayKey };
