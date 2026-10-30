// Server-ONLY. Transactional email via Resend (https://resend.com).
//
// Env on Vercel:
//   RESEND_API_KEY    — required
//   ORDER_EMAIL_FROM  — e.g. "OneT India <orders@onet.co.in>". Customer emails
//                       need a VERIFIED domain in Resend; the test sender
//                       (onboarding@resend.dev) can only mail the account owner.
import { BRAND, PLAY_STORE_URL } from '@/lib/config';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.onet.co.in').replace(/\/$/, '');
export const EMAIL_RE = /^[^\s@<>"']{1,64}@[^\s@<>"']{1,190}\.[a-z]{2,}$/i;

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

/** Send one email. Never throws; logs Resend's reason on failure. */
export async function sendMail({ to, subject, html, tag = 'mail' }) {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) { console.error(`[${tag}] RESEND_API_KEY is not set — email skipped`); return false; }
    if (!to || !EMAIL_RE.test(String(to))) return false;
    const from = process.env.ORDER_EMAIL_FROM || 'OneT India <onboarding@resend.dev>';
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject, html, reply_to: BRAND.email }),
    });
    if (!r.ok) { console.error(`[${tag}] Resend refused`, r.status, await r.text().catch(() => '')); return false; }
    return true;
  } catch (e) { console.error(`[${tag}] failed`, e?.message); return false; }
}

const first = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

/** "Thank you for shopping" email sent when an order is marked delivered. */
export function deliveredEmail(o) {
  const items = (o.items || []).map((i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #EEEAF6;">
        <div style="font-size:14px;font-weight:700;color:#1A1530;">${esc(i.name || 'Item')}</div>
        <div style="font-size:12px;color:#7A7390;margin-top:2px;">${[i.size && 'Size ' + esc(i.size), i.color && esc(i.color), 'Qty ' + Number(i.qty || 1)].filter(Boolean).join(' &middot; ')}</div>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #EEEAF6;font-size:14px;font-weight:700;color:#1A1530;white-space:nowrap;">${inr(Number(i.price) * Number(i.qty || 1))}</td>
    </tr>`).join('');

  const row = (label, value, strong) => `
    <tr>
      <td style="padding:4px 0;font-size:13px;color:${strong ? '#1A1530' : '#7A7390'};${strong ? 'font-weight:800;font-size:15px;' : ''}">${label}</td>
      <td align="right" style="padding:4px 0;font-size:13px;color:#1A1530;${strong ? 'font-weight:800;font-size:15px;' : ''}">${value}</td>
    </tr>`;

  const paid = o.payment_method === 'razorpay' ? 'Paid online' : 'Paid at delivery (Try &amp; Buy)';
  const when = new Date(o.delivered_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const btn = (href, label, solid) => `<a href="${href}" style="display:inline-block;padding:13px 26px;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;${solid ? 'background:#7B33FB;color:#FFFFFF;' : 'background:#F3EEFF;color:#5B21B6;'}">${label}</a>`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Delivered</title></head>
<body style="margin:0;padding:0;background:#F5F3FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Your order ${esc(o.code)} has been delivered. Thank you for shopping with OneT India!</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FA;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#2E1065;background-image:linear-gradient(135deg,#2E1065,#7B33FB);padding:30px 28px 34px;">
          <div style="font-size:20px;font-weight:900;letter-spacing:-0.5px;color:#FFFFFF;">OneT <span style="color:#C4B5FD;">INDIA</span></div>
          <div style="margin-top:22px;display:inline-block;background:rgba(255,255,255,0.16);color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:1.2px;padding:6px 12px;border-radius:999px;">&#10003; DELIVERED &middot; ${esc(when)}</div>
          <div style="margin-top:14px;font-size:26px;line-height:32px;font-weight:900;color:#FFFFFF;">Thank you for shopping with us, ${esc(first(o.customer?.name))}!</div>
          <div style="margin-top:8px;font-size:14px;line-height:21px;color:#E9E3FF;">Your order <b>${esc(o.code)}</b> has been delivered. We hope you love your new look.</div>
        </td></tr>

        <tr><td style="padding:26px 28px 6px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#7A7390;">ORDER SUMMARY</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">${items}</table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
            ${row('Subtotal', inr(o.subtotal))}
            ${row('Delivery', Number(o.delivery) ? inr(o.delivery) : 'FREE')}
            ${Number(o.discount) ? row('Discount' + (o.coupon ? ' (' + esc(o.coupon) + ')' : ''), '− ' + inr(o.discount)) : ''}
            ${row('Total', inr(o.total), true)}
            ${row('Payment', paid)}
          </table>
        </td></tr>

        <tr><td style="padding:18px 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5FF;border-radius:14px;">
            <tr><td style="padding:16px 18px;font-size:13px;line-height:20px;color:#3B3452;">
              <b style="color:#1A1530;">Something not right?</b> Size or fit issue — we offer same-day exchange. Just call or WhatsApp us on
              <a href="tel:${BRAND.phoneTel}" style="color:#7B33FB;font-weight:700;text-decoration:none;">${esc(BRAND.phone)}</a> and we'll sort it out.
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:24px 28px 8px;">
          ${btn(`${SITE}/order/${encodeURIComponent(o.code)}#review`, '★ Rate your order', true)}
          &nbsp;
          ${btn(`${SITE}/`, 'Shop new arrivals', false)}
        </td></tr>

        <tr><td align="center" style="padding:18px 28px 26px;font-size:13px;color:#7A7390;line-height:20px;">
          Faster checkout &amp; live order tracking on our app —
          <a href="${PLAY_STORE_URL}" style="color:#7B33FB;font-weight:700;text-decoration:none;">Get it on Google Play</a>
        </td></tr>

        <tr><td style="background:#FAF9FD;border-top:1px solid #EEEAF6;padding:20px 28px;font-size:11.5px;line-height:18px;color:#9A93AC;" align="center">
          ${esc(BRAND.name)} &middot; ${esc(BRAND.address)}<br>
          <a href="mailto:${esc(BRAND.email)}" style="color:#9A93AC;">${esc(BRAND.email)}</a> &middot; ${esc(BRAND.phone)} &middot; GSTIN ${esc(BRAND.gstin)}<br>
          You received this email because you placed an order on onet.co.in.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject: `Delivered: your OneT order ${o.code} 🎉 Thank you for shopping!`, html };
}
