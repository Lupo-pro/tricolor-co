/* ============================================
   /api/track-click?id=<tracking_id>&url=<encoded_destination>
   Logs the click event, then 302-redirects to the destination URL.
   ============================================ */

const ALLOWED_HOSTS = new Set([
  'latricolor.co',
  'www.latricolor.co',
  'tricolor-co.vercel.app',
  // wa.me + Instagram + TikTok common click destinations
  'wa.me',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
]);

module.exports = async function handler(req, res) {
  const id = (req.query && req.query.id) || '';
  const targetRaw = (req.query && req.query.url) || '';
  const ts = new Date().toISOString();
  const ua = req.headers['user-agent'] || '';

  let target = '';
  try {
    target = decodeURIComponent(targetRaw);
    const u = new URL(target);
    // Safety net: refuse to redirect anywhere that isn't on the
    // allowlist. Prevents the tracker from becoming an open redirect.
    if (!ALLOWED_HOSTS.has(u.hostname)) {
      console.warn(JSON.stringify({ event: 'click_rejected_host', id, ts, host: u.hostname }));
      return res.status(400).json({ error: 'host_not_allowed' });
    }
  } catch (_) {
    console.warn(JSON.stringify({ event: 'click_bad_url', id, ts, targetRaw }));
    return res.status(400).json({ error: 'bad_url' });
  }

  console.log(JSON.stringify({ event: 'click', id, target, ts, ua }));

  res.setHeader('Cache-Control', 'no-store');
  res.writeHead(302, { Location: target });
  res.end();
};
