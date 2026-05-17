/* ============================================
   /api/track-open?id=<tracking_id>
   Returns a 1×1 transparent GIF and logs the open event to
   Vercel function logs (a single-line JSON record that's grep-able
   in the Vercel UI).

   Note: storage is intentionally log-only for now (see /outreach/
   README — "tracking" section). Wire Vercel KV or Upstash later if
   you want the local dashboard to read open counts directly.
   ============================================ */

const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

module.exports = async function handler(req, res) {
  const id = (req.query && req.query.id) || '';
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             null;
  const ts = new Date().toISOString();

  console.log(JSON.stringify({ event: 'open', id, ts, ua, ip }));

  // No-cache so every open really fires.
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', PIXEL.length);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.status(200).end(PIXEL);
};
