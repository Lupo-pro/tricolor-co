// ============================================
// send.js — 3-touch outreach sender with warm-up.
//
// On each run:
//   1. Reads data/validated.json (approved + premium) + data/sent.json
//   2. Computes who needs email #1 (never sent), #2 (J+3 from #1, no reply),
//      #3 (J+7 from #1, no reply). Email 4+ is "done".
//   3. Premium-priority queue, capped by today's warm-up limit.
//   4. Sends through Resend from SENDER_EMAIL (fallback to hola@ if the
//      nay@ alias bounces / isn't verified — logged clearly).
//   5. Appends every attempt to data/sent.json.
//   6. Sleeps 60-180s between sends so the pattern looks human.
//
// Warm-up curve (overrides DAILY_SEND_LIMIT if curve is lower):
//   Day 1-2 → 10
//   Day 3-4 → 15
//   Day 5-6 → 20
//   Day 7+  → 40
// ============================================

import 'dotenv/config';
import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const TEMPLATES_DIR = join(__dirname, 'templates');

const CONFIG = {
  apiKey: process.env.RESEND_API_KEY,
  primarySender: process.env.SENDER_EMAIL || 'nay@latricolor.co',
  fallbackSender: 'hola@latricolor.co',
  senderName: process.env.SENDER_NAME || 'Nay - La Tricolor',
  replyTo: process.env.REPLY_TO_EMAIL || process.env.SENDER_EMAIL || 'nay@latricolor.co',
  dailyLimit: parseInt(process.env.DAILY_SEND_LIMIT || '10', 10),
  publicSite: process.env.PUBLIC_SITE_URL || 'https://latricolor.co',
};

if (!CONFIG.apiKey || CONFIG.apiKey.startsWith('re_xxx')) {
  console.error('✗ RESEND_API_KEY missing or placeholder. Fill /outreach/.env first.');
  process.exit(1);
}

const resend = new Resend(CONFIG.apiKey);

// ============================================
// Warm-up curve
// ============================================
function curveLimitForDay(daysElapsed) {
  if (daysElapsed <= 2) return 10;
  if (daysElapsed <= 4) return 15;
  if (daysElapsed <= 6) return 20;
  return 40;
}

async function loadWarmupState() {
  try {
    const t = await readFile(join(DATA_DIR, 'warmup-day.json'), 'utf-8');
    return JSON.parse(t);
  } catch {
    return { startDate: new Date().toISOString().slice(0, 10), daysElapsed: 1, sentToday: 0, currentDate: new Date().toISOString().slice(0, 10) };
  }
}
async function saveWarmupState(state) {
  await writeFile(join(DATA_DIR, 'warmup-day.json'), JSON.stringify(state, null, 2));
}

function todayKey() { return new Date().toISOString().slice(0, 10); }

function daysBetween(startKey, endKey) {
  return Math.round((new Date(endKey).getTime() - new Date(startKey).getTime()) / 86_400_000);
}

// ============================================
// Helpers
// ============================================
function firstNameFromUsername(username) {
  if (!username) return 'cafetera';
  // Split on common separators, take the first chunk that looks like a name
  const parts = String(username).split(/[._\-0-9]+/).filter(Boolean);
  const first = parts[0] || username;
  if (first.length < 2) return 'cafetera';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function platformLabel(platforms) {
  if (!Array.isArray(platforms)) return 'Instagram';
  if (platforms.includes('instagram') && platforms.includes('tiktok')) return 'Instagram + TikTok';
  if (platforms.includes('tiktok')) return 'TikTok';
  return 'Instagram';
}

function makeTrackingId(handle, emailNumber) {
  return crypto
    .createHash('sha256')
    .update(`${handle}::${emailNumber}::${Date.now()}::${Math.random()}`)
    .digest('hex')
    .slice(0, 16);
}

function buildPixelUrl(id)  { return `${CONFIG.publicSite}/api/track-open?id=${id}`; }
function buildClickPrefix(id) {
  return `${CONFIG.publicSite}/api/track-click?id=${id}&url=`;
}
function buildUnsubUrl(email, id) {
  const e = encodeURIComponent(email);
  return `${CONFIG.publicSite}/api/unsubscribe?id=${id}&email=${e}`;
}

async function loadTemplate(emailNumber) {
  const file = {
    1: 'email-1-pitch.html',
    2: 'email-2-relance.html',
    3: 'email-3-lastcall.html',
  }[emailNumber];
  return readFile(join(TEMPLATES_DIR, file), 'utf-8');
}

function renderTemplate(html, vars) {
  let out = html;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  // Rewrite raw links through the click-tracker. Anything containing
  // {{TRACK_CLICK}}https://... becomes the tracker URL + encoded
  // destination.
  out = out.replace(/\{\{TRACK_CLICK\}\}([^"'\s]+)/g, (_m, url) => {
    return vars._TRACK_CLICK_PREFIX + encodeURIComponent(url);
  });
  return out;
}

function subjectFor(emailNumber, firstname) {
  return ({
    1: `Bodysuit Tricolor para ${firstname} 🇨🇴`,
    2: `${firstname}, se me olvidó decirte algo 🤍`,
    3: `Última vez ${firstname} 🙏`,
  })[emailNumber];
}

function sleepMs(min, max) {
  const ms = min + Math.random() * (max - min);
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================
// Queue planning
// ============================================
function planNextEmail(history, now = Date.now()) {
  // history: array of { email_number, sent_at } for THIS handle, oldest first
  const sent1 = history.find((h) => h.email_number === 1);
  const sent2 = history.find((h) => h.email_number === 2);
  const sent3 = history.find((h) => h.email_number === 3);

  if (sent3) return { send: null, reason: 'done' };
  if (!sent1) return { send: 1, reason: 'first-touch' };

  const t1 = new Date(sent1.sent_at).getTime();
  if (!sent2) {
    if (now - t1 >= 3 * 86_400_000) return { send: 2, reason: 'J+3' };
    return { send: null, reason: 'wait-for-J+3' };
  }
  if (now - t1 >= 7 * 86_400_000) return { send: 3, reason: 'J+7' };
  return { send: null, reason: 'wait-for-J+7' };
}

// ============================================
// Sender (with nay@ → hola@ fallback)
// ============================================
async function sendEmail({ to, subject, html, replyTo }) {
  // Try primary sender first.
  let lastError = null;
  for (const sender of [CONFIG.primarySender, CONFIG.fallbackSender]) {
    const from = `${CONFIG.senderName} <${sender}>`;
    try {
      const r = await resend.emails.send({
        from,
        to,
        subject,
        html,
        replyTo: replyTo || sender,
      });
      if (r.error) throw new Error(r.error.message || JSON.stringify(r.error));
      return { id: r.data?.id || null, used_sender: sender };
    } catch (err) {
      lastError = err;
      const msg = (err && err.message) || '';
      const isDomainIssue = /domain|verify|verified|sender|forbidden|451|403/i.test(msg);
      if (sender === CONFIG.primarySender && isDomainIssue) {
        console.warn(`  ⚠ Primary sender ${sender} rejected (${msg}). Falling back to ${CONFIG.fallbackSender}.`);
        continue; // try fallback
      }
      throw err; // other errors → propagate up
    }
  }
  throw lastError || new Error('send_failed');
}

// ============================================
// Main
// ============================================
async function main() {
  // Load state
  const validated = await readFile(join(DATA_DIR, 'validated.json'), 'utf-8')
    .then((t) => JSON.parse(t))
    .catch(() => null);
  if (!validated) {
    console.error('✗ No validated.json yet. Run npm run admin and save the validation first.');
    process.exit(1);
  }

  const sent = await readFile(join(DATA_DIR, 'sent.json'), 'utf-8')
    .then((t) => JSON.parse(t))
    .catch(() => []);
  const sentByHandle = new Map();
  for (const s of sent) {
    const arr = sentByHandle.get(s.username) || [];
    arr.push(s);
    sentByHandle.set(s.username, arr);
  }

  // Warm-up state
  const warm = await loadWarmupState();
  const today = todayKey();
  if (warm.currentDate !== today) {
    warm.daysElapsed = Math.max(1, daysBetween(warm.startDate, today) + 1);
    warm.sentToday = 0;
    warm.currentDate = today;
  }
  const curveCap = curveLimitForDay(warm.daysElapsed);
  const dailyCap = Math.min(curveCap, CONFIG.dailyLimit);
  const todayBudget = Math.max(0, dailyCap - warm.sentToday);

  // Build contact list. Premium first, then approved.
  const pool = [
    ...(validated.premium  || []).map((c) => ({ ...c, tier: 'premium' })),
    ...(validated.approved || []).map((c) => ({ ...c, tier: 'approved' })),
  ];
  // Only contacts with an email can receive a send.
  const eligible = pool.filter((c) => c.email && !c.dm_only);

  // Plan each contact's next email.
  const queue = [];
  for (const c of eligible) {
    const history = (sentByHandle.get(c.username) || []).sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
    );
    const plan = planNextEmail(history);
    if (plan.send) queue.push({ contact: c, emailNumber: plan.send, reason: plan.reason });
  }
  // Premium first inside the queue.
  queue.sort((a, b) => (b.contact.tier === 'premium') - (a.contact.tier === 'premium'));

  console.log('▶ Outreach send');
  console.log(`  Day ${warm.daysElapsed} of warm-up → curve cap ${curveCap}/day, env cap ${CONFIG.dailyLimit}`);
  console.log(`  Sent today already: ${warm.sentToday}. Budget remaining: ${todayBudget}`);
  console.log(`  Eligible contacts: ${eligible.length}. Queue this run: ${queue.length}.`);
  if (todayBudget === 0) {
    console.log('  Daily cap reached. Skip.');
    return;
  }

  // Send loop
  const slice = queue.slice(0, todayBudget);
  if (slice.length === 0) {
    console.log('  Nothing to send today (everyone is waiting for J+3 / J+7 or done).');
    return;
  }

  console.log(`\n  Sending ${slice.length} email(s) now (60-180s between each)...\n`);

  for (let i = 0; i < slice.length; i++) {
    const { contact, emailNumber } = slice[i];
    const firstname = firstNameFromUsername(contact.username);
    const trackingId = makeTrackingId(contact.username, emailNumber);
    const html = renderTemplate(await loadTemplate(emailNumber), {
      FIRSTNAME: firstname,
      USERNAME: contact.username,
      PLATFORM: platformLabel(contact.platforms),
      TRACKING_PIXEL: `<img src="${buildPixelUrl(trackingId)}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;">`,
      UNSUBSCRIBE_URL: buildUnsubUrl(contact.email, trackingId),
      _TRACK_CLICK_PREFIX: buildClickPrefix(trackingId),
    });
    const subject = subjectFor(emailNumber, firstname);

    process.stdout.write(`  [${i + 1}/${slice.length}] → ${contact.email.padEnd(40)} #${emailNumber} `);
    try {
      const result = await sendEmail({
        to: contact.email,
        subject,
        html,
        replyTo: CONFIG.replyTo,
      });
      console.log(`✓ ${result.id || ''} (${result.used_sender})`);
      sent.push({
        username: contact.username,
        email: contact.email,
        email_number: emailNumber,
        sent_at: new Date().toISOString(),
        resend_id: result.id,
        status: 'sent',
        used_sender: result.used_sender,
        tracking_id: trackingId,
        tier: contact.tier,
      });
      warm.sentToday += 1;
      // Persist after every send so a crash mid-batch doesn't lose state.
      await writeFile(join(DATA_DIR, 'sent.json'), JSON.stringify(sent, null, 2));
      await saveWarmupState(warm);
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.log(`✗ ${msg}`);
      sent.push({
        username: contact.username,
        email: contact.email,
        email_number: emailNumber,
        sent_at: new Date().toISOString(),
        status: 'failed',
        error: msg,
        tier: contact.tier,
      });
      await writeFile(join(DATA_DIR, 'sent.json'), JSON.stringify(sent, null, 2));
      if (/rate.?limit/i.test(msg)) {
        console.log('  Rate limit hit. Stopping.');
        break;
      }
    }

    // Human-paced pause between sends.
    if (i < slice.length - 1) {
      await sleepMs(60_000, 180_000);
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log(`✓ Send run complete · sent today: ${warm.sentToday}/${dailyCap}`);
  console.log('══════════════════════════════════════');
}

main().catch((e) => { console.error('send failed:', e); process.exit(1); });
