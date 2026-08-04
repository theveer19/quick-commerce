// Lightweight in-memory rate limiter (best-effort).
// NOTE: on serverless (Vercel) memory isn't shared across instances, so this is
// a basic deterrent. For hard limits in production, use Upstash/Redis.
const hits = new Map();

export function rateLimit(req, { key = 'global', limit = 10, windowMs = 60000 } = {}) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon';
  const k = `${key}:${ip}`;
  const now = Date.now();
  const arr = (hits.get(k) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(k, arr);
  if (hits.size > 5000) { // avoid unbounded growth
    for (const [mk, v] of hits) { if (!v.length || now - v[v.length - 1] > windowMs) hits.delete(mk); }
  }
  return arr.length <= limit;
}
