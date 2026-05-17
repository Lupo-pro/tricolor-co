// ============================================
// _test-ig-shape.js — One-shot probe of
// apify/instagram-hashtag-scraper to verify the response shape
// BEFORE refactoring scrape.js around it.
//
// Cost: ~$0.01 (5 results on 1 hashtag).
// Run with: node src/_test-ig-shape.js
// ============================================

import 'dotenv/config';
import { ApifyClient } from 'apify-client';

const TOKEN = process.env.APIFY_API_TOKEN;
if (!TOKEN || TOKEN.startsWith('apify_api_xxx')) {
  console.error('✗ APIFY_API_TOKEN missing. Fill /outreach/.env.');
  process.exit(1);
}

const client = new ApifyClient({ token: TOKEN });

const INPUT = {
  hashtags: ['mujercolombiana'],
  resultsLimit: 5,
};

console.log('▶ Test run · apify/instagram-hashtag-scraper');
console.log('  input:', JSON.stringify(INPUT, null, 2));
console.log('  (~$0.01, takes ~30-90s)\n');

const started = Date.now();
let run;
try {
  run = await client.actor('apify/instagram-hashtag-scraper').call(INPUT);
} catch (err) {
  console.error('\n✗ Actor call failed:');
  console.error('  ', err.message || err);
  if (err.type) console.error('  type:', err.type);
  if (err.statusCode) console.error('  statusCode:', err.statusCode);
  process.exit(1);
}

const secs = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n✓ Run finished in ${secs}s`);
console.log(`  runId:    ${run.id}`);
console.log(`  status:   ${run.status}`);
console.log(`  dataset:  ${run.defaultDatasetId}`);

const { items } = await client.dataset(run.defaultDatasetId).listItems();
console.log(`  items:    ${items.length}\n`);

if (items.length === 0) {
  console.warn('⚠ Zero items — actor finished but returned nothing.');
  console.warn('  Could be: hashtag has no recent posts / rate-limited / actor schema mismatch.');
  process.exit(0);
}

console.log('══════════════════════════════════════');
console.log('FIRST ITEM — raw shape (top-level keys + values)');
console.log('══════════════════════════════════════');
console.log(JSON.stringify(items[0], null, 2));

console.log('\n══════════════════════════════════════');
console.log('KEY SUMMARY across all items');
console.log('══════════════════════════════════════');
const allKeys = new Set();
for (const it of items) Object.keys(it).forEach((k) => allKeys.add(k));
console.log('top-level keys observed:', [...allKeys].sort().join(', '));

// Spotlight: probable owner / follower / bio / latest-posts fields
console.log('\n══════════════════════════════════════');
console.log('CANDIDATE FIELD VALUES (first item)');
console.log('══════════════════════════════════════');
const it = items[0];
console.log('  username candidates:');
console.log('    .ownerUsername              →', it.ownerUsername);
console.log('    .username                   →', it.username);
console.log('    .owner?.username            →', it.owner?.username);
console.log('  followers candidates:');
console.log('    .ownerFollowersCount        →', it.ownerFollowersCount);
console.log('    .followersCount             →', it.followersCount);
console.log('    .owner?.followersCount      →', it.owner?.followersCount);
console.log('  bio candidates:');
console.log('    .ownerBiography             →', it.ownerBiography?.slice?.(0, 80));
console.log('    .biography                  →', it.biography?.slice?.(0, 80));
console.log('    .bio                        →', it.bio?.slice?.(0, 80));
console.log('  posts/latestPosts:');
console.log('    .latestPosts (count)        →', Array.isArray(it.latestPosts) ? it.latestPosts.length : '—');
console.log('    .topPosts (count)           →', Array.isArray(it.topPosts) ? it.topPosts.length : '—');
console.log('  type of item:');
console.log('    .type                       →', it.type);
console.log('    .name (hashtag?)            →', it.name);
