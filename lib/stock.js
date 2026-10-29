// Stock rules shared by every customer-facing screen.
//
// Customers never see how many pieces are left — only whether they can buy it.
// A missing/blank stock value counts as out of stock, exactly like the server
// (lib/pricing.js), so the button and the checkout always agree.
export const outOfStock = (p) => !(Number(p?.stock) > 0);

/** Most a customer may put in the bag in one go (never more than we have). */
export const maxQty = (p) => Math.max(1, Math.min(10, Number(p?.stock) || 0));
