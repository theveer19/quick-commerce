// Server-ONLY: take stock for an order and put it back.
// Size-tracked products move the exact size; others move the total.

/** lines: [{ id, size, qty, bySize }] → { ok, taken, failed } (failed = the line that ran out) */
export async function reserveLines(admin, lines) {
  const taken = [];
  for (const l of lines) {
    let ok = false;
    if (l.bySize) {
      const { data, error } = await admin.rpc('reserve_stock_size', { p_id: l.id, p_size: String(l.size), p_qty: l.qty });
      if (error) { await releaseLines(admin, taken); return { ok: false, taken: [], failed: l, error }; }
      ok = data === true;
    } else {
      const { data, error } = await admin.rpc('reserve_stock', { p_id: l.id, p_qty: l.qty });
      if (error) {
        // reserve_stock not installed yet — old guarded decrement
        try { await admin.rpc('decrement_stock', { p_id: l.id, p_qty: l.qty }); } catch {}
        continue;
      }
      ok = data === true;
    }
    if (!ok) { await releaseLines(admin, taken); return { ok: false, taken: [], failed: l }; }
    taken.push(l);
  }
  return { ok: true, taken };
}

/** Give pieces back. Works for order lines or order items ({ id, size, qty }). */
export async function releaseLines(admin, lines) {
  for (const l of lines || []) {
    const qty = Math.max(0, Math.floor(Number(l.qty) || 0));
    if (!l.id || !qty) continue;
    const { error } = await admin.rpc('increment_stock_size', { p_id: l.id, p_size: l.size ? String(l.size) : null, p_qty: qty });
    if (error) { try { await admin.rpc('increment_stock', { p_id: l.id, p_qty: qty }); } catch {} }
  }
}
