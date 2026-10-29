// Server-ONLY. Signed customer sessions for phone-OTP logins.
//
// Phone login goes through MSG91, which only tells us "this OTP is right" — it
// gives us no session. Before this file existed the server trusted whatever
// phone number the client sent, so anyone could POST someone else's number to
// /api/my-orders and read their name, address and orders.
//
// Now /api/otp/verify hands back a short token signed with a server secret, and
// any endpoint that returns personal data derives the phone FROM THAT TOKEN,
// never from the request body.
import crypto from 'crypto';

const TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days, then the customer logs in again

function secret() {
  // Prefer a dedicated secret; fall back to the service-role key (also
  // server-only) so this works before SESSION_SECRET is added on Vercel.
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

const b64 = (buf) => Buffer.from(buf).toString('base64url');

export function signSession(phone) {
  const key = secret();
  if (!key) return null;
  const payload = b64(JSON.stringify({ p: phone, exp: Date.now() + TTL_MS }));
  const sig = b64(crypto.createHmac('sha256', key).update(payload).digest());
  return `${payload}.${sig}`;
}

/** Returns the verified 10-digit phone for a token, or null. */
export function verifySession(token) {
  const key = secret();
  if (!key || typeof token !== 'string' || token.length > 512) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = b64(crypto.createHmac('sha256', key).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const { p, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!/^[6-9]\d{9}$/.test(p) || !exp || Date.now() > exp) return null;
    return p;
  } catch { return null; }
}

/** Reads the `x-onet-session` header and returns the verified phone, or null. */
export function phoneFromRequest(req) {
  const h = req.headers.get('x-onet-session') || '';
  return verifySession(h.trim());
}
