// Server-ONLY. Sends Expo push notifications to the customer's phone(s).
// Tokens are linked to a phone when the customer logs in on the app
// (see /api/push/register), so an order's customer.phone finds them.
const EXPO_URL = 'https://exp.host/--/api/v2/push/send';

/** Resolve within `ms` no matter what — never let a notification hold up an order. */
export function withTimeout(p, ms = 5000) {
  return Promise.race([Promise.resolve(p).catch(() => null), new Promise((r) => setTimeout(r, ms))]);
}

export async function expoSend(admin, messages) {
  if (!messages.length) return { sent: 0, failed: 0 };
  const headers = {
    Accept: 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json',
    ...(process.env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
  };
  let sent = 0, failed = 0;
  const dead = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    try {
      const r = await fetch(EXPO_URL, { method: 'POST', headers, body: JSON.stringify(batch) });
      const j = await r.json().catch(() => ({}));
      (Array.isArray(j.data) ? j.data : []).forEach((t, k) => {
        if (t?.status === 'ok') sent += 1;
        else { failed += 1; if (t?.details?.error === 'DeviceNotRegistered') dead.push(batch[k].to); }
      });
    } catch { failed += batch.length; }
  }
  if (dead.length && admin) {
    try { await admin.from('push_tokens').update({ active: false }).in('token', dead); } catch {}
  }
  return { sent, failed };
}

const first = (name) => String(name || '').trim().split(/\s+/)[0] || '';

// What the customer sees at each step. Short, warm, and says what happens next.
function orderMessage(status, o) {
  const hi = first(o.customer?.name) ? `${first(o.customer?.name)}, ` : '';
  const rider = o.delivery_partner?.name ? ` ${o.delivery_partner.name} is bringing it.` : '';
  switch (status) {
    case 'placed': return { title: '🛍️ Order placed!', body: `${hi}we've got your order ${o.code}. We'll confirm it in a moment.` };
    case 'confirmed': return { title: '✅ Order confirmed', body: `${hi}your order ${o.code} is confirmed — we're picking your items now.` };
    case 'packed': return { title: '📦 Packed & ready', body: `Your order ${o.code} is packed. A rider will pick it up shortly.` };
    case 'out_for_delivery': return { title: '🛵 On the way!', body: `Your order is out for delivery and arriving in minutes.${rider}` };
    case 'delivered': return { title: '🎉 Delivered', body: `${hi}enjoy your new fits! Try them on and keep what you love.` };
    case 'cancelled': return { title: 'Order cancelled', body: `Your order ${o.code} was cancelled. Need help? Call or WhatsApp us.` };
    default: return null;
  }
}

/** Push the current order status to the customer's phone(s). Silent if none. */
export async function notifyOrderStatus(admin, order, status) {
  try {
    if (!admin || !order) return;
    const phone = String(order.customer?.phone || '').replace(/\D/g, '').slice(-10);
    const msg = orderMessage(status, order);
    if (phone.length !== 10 || !msg) return;
    const { data } = await admin.from('push_tokens').select('token').eq('phone', phone).eq('active', true).limit(10);
    const tokens = (data || []).map((r) => r.token);
    if (!tokens.length) return;
    await expoSend(admin, tokens.map((to) => ({
      to, ...msg, sound: 'default', priority: 'high', channelId: 'orders',
      data: { url: `/order/${order.code}` },
    })));
  } catch { /* a missing push table or network blip must never break an order */ }
}
