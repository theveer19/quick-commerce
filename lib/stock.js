// Stock rules shared by every customer-facing screen (and the server).
//
// Customers never see how many pieces are left — only whether they can buy it.
// A product can be tracked per size (size_stock = {"S": 3, "M": 0}) or just as
// one total (size_stock = {}). A size at 0 cannot be picked or ordered.

/** True when this product's stock is kept per size. */
export const hasSizeStock = (p) =>
  Boolean(p && p.size_stock && typeof p.size_stock === 'object' && !Array.isArray(p.size_stock) && Object.keys(p.size_stock).length > 0);

/** Pieces available for one size (or the total when not tracked per size). */
export function sizeQty(p, size) {
  if (!p) return 0;
  if (hasSizeStock(p)) {
    if (size == null) return 0;
    return Math.max(0, Math.floor(Number(p.size_stock[String(size)]) || 0));
  }
  return Math.max(0, Math.floor(Number(p.stock) || 0));
}

export const sizeOut = (p, size) => sizeQty(p, size) <= 0;

/** The whole product is out of stock (every size sold out). */
export const outOfStock = (p) => {
  if (hasSizeStock(p)) {
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : Object.keys(p.size_stock);
    return !sizes.some((s) => sizeQty(p, s) > 0);
  }
  return !(Number(p?.stock) > 0);
};

/** First size a customer can actually buy, or null. */
export function firstAvailableSize(p) {
  const sizes = Array.isArray(p?.sizes) ? p.sizes : [];
  if (!sizes.length) return null;
  return sizes.find((s) => !sizeOut(p, s)) ?? null;
}

/** Most a customer may put in the bag in one go (never more than we have). */
export const maxQty = (p, size) => Math.max(1, Math.min(10, hasSizeStock(p) ? sizeQty(p, size) : (Number(p?.stock) || 0)));
