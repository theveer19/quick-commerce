# OneT India — Fashion Quick-Commerce (Gwalior)

Try-then-buy fashion, delivered in minutes. Next.js 14 + Supabase + Razorpay + Tailwind + Framer Motion.

> **It runs immediately on demo data (no keys needed).** Add your Supabase + Razorpay keys to go live. Nothing is faked away — the same code path switches from demo to real automatically once keys are present.

---

## 1. Run locally

```bash
npm install
cp .env.example .env.local   # fill in keys later; app runs without them
npm run dev                  # http://localhost:3000
```

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`  → demo login password: **`onet-admin`** (only in demo mode)

## 2. Wire up Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste everything from `supabase/schema.sql`, run it.
3. Copy from **Project Settings → API** into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
4. Create an admin user: **Authentication → Users → Add user** (email + password). That's your admin login.
5. (Optional) Storage → create a public bucket `products` for image uploads; put image URLs in the product's Image field.

Once these keys exist, the storefront + admin read/write real Supabase data instead of demo data.

## 3. Wire up Razorpay

1. Razorpay Dashboard → **Settings → API Keys** → generate keys.
2. Add to `.env.local`:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_ID` (same Key ID)
   - `RAZORPAY_KEY_SECRET` (server-only)
3. Payment flow is already secure: order is created server-side (`/api/razorpay/order`) and the signature is verified server-side (`/api/razorpay/verify`) before the order is saved. Never expose the secret to the client.
4. Set up the **webhook** (reliable paid-confirmation): Razorpay Dashboard → Settings → Webhooks → add URL `https://your-domain.com/api/razorpay/webhook`, select events `payment.captured` and `order.paid`, set a secret, and put the same secret in env as `RAZORPAY_WEBHOOK_SECRET`.
5. Test with Razorpay **test mode** keys first (test card: 4111 1111 1111 1111, any future expiry/CVV).

## 4. Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add all `.env.local` variables in **Vercel → Project → Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your live domain.
5. Deploy.

---

## Project map

```
app/
  page.js                 Home (hero, categories, trending, how-it-works)
  products/               Listing + category filter + search
  product/[id]/           Product detail + size + add to cart
  cart/                   Cart + summary
  checkout/               Address + Try&Buy / Razorpay payment
  order/[code]/           Live order tracking timeline
  track/                  Order lookup by code
  how-it-works/           Try & Buy explainer
  help/                   Support + FAQ
  refund-policy/ return-policy/ shipping-policy/ privacy-policy/ terms/
  admin/                  Auth-guarded panel
    login/  page(dashboard)  products/  orders/  inventory/
  api/razorpay/order/     Create Razorpay order (server)
  api/razorpay/verify/    Verify payment signature (server)
lib/
  config.js  data.js  cart.js  auth.js  supabase-*.js  seed.js  format.js
supabase/schema.sql       Tables + RLS policies
```

## Features

- Storefront: browse, search, filter, product detail, cart, checkout.
- Payments: Razorpay (prepaid) + Try & Buy (pay at door), server-verified.
- Order tracking: unique codes, live-refreshing status timeline.
- Admin: Supabase auth, dashboard stats, product CRUD, order status control, inventory management.
- Fully responsive, motion via Framer Motion, keyboard focus + reduced-motion respected, SEO metadata.

---


## Customer accounts, login-gated checkout & order history

- Customers **sign up / log in** at `/login` (email + password via Supabase Auth; demo mode accepts anything).
- **Checkout requires login** — guests are sent to `/login?next=/checkout`.
- Each order is tied to the user (`user_id`), and they see their history at **`/orders`**.
- **Roles:** a `profiles` table separates `customer` vs `admin`. RLS makes sure a logged-in customer can only read *their own* orders, while admins (and the server) can see all. This is important now that real customer accounts exist.

### After running `supabase/schema.sql` — make yourself admin
1. Create your admin user (Authentication → Users → Add user, or just sign up in the app).
2. In SQL Editor run (use your email):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
   Without this, the admin panel won't show orders/products (RLS blocks non-admins).

> Note: the schema was updated (profiles/roles/user_id). Re-run `supabase/schema.sql` once — it resets only `products`/`orders` and leaves your users intact.

## Security — what's already handled in code

- **Prices & totals are computed on the server** (`/api/orders` + `lib/pricing.js`) from the database/seed. The browser cannot set a price — no "₹1 order" exploit.
- **Stock is checked server-side** and decremented with a guarded SQL function (`decrement_stock`) so it never goes negative.
- **Payments are verified server-side** (HMAC signature, constant-time compare) and the order is marked paid by the server, not the client.
- **Webhook** (`/api/razorpay/webhook`) marks orders paid even if the customer closes the tab — the reliable source of truth.
- **Row Level Security**: the anon/public role has **no access to orders**. Customers reach their order only through the server (random order codes); admins read/write via Supabase Auth.
- **Server-side input validation** (name, 10-digit phone, 6-digit pincode, item quantities) and **basic rate limiting** on order/verify endpoints.
- **Secrets stay server-only** — service role key and Razorpay secret are never sent to the browser.

## Still on you (only you can do these)

- Run `supabase/schema.sql` and add all keys (anon + **service role** + Razorpay + webhook secret).
- Place one real **test order end-to-end** in Razorpay test mode and confirm it shows as paid (via handler *and* by triggering the webhook).
- Add real products; update `BRAND` in `lib/config.js`.
- Rate limiting here is in-memory (best-effort on serverless). For hard limits, add Upstash/Redis.
- Optional hardening: gate order lookup with phone last-4, add order-notification (WhatsApp/SMS), and a serviceable-pincode check.

## Go-live checklist (do these before real customers)

- [ ] Supabase schema run; anon + service keys in env.
- [ ] Admin user created in Supabase Auth; demo password path no longer used.
- [ ] Razorpay live keys added; a real ₹1 test order placed and verified end-to-end.
- [ ] Real products added (replace demo catalog); images uploaded.
- [ ] Update `BRAND` in `lib/config.js` (phone, email, address, delivery fee, ETA, free-delivery threshold).
- [ ] Serviceable pincode check added to checkout if you want to hard-limit to Gwalior.
- [x] Order reads run through a server route with the service role key (done). Codes are random.
- [ ] Test the full flow on a real phone (add → checkout → pay → track).
- [ ] Legal pages reviewed by you; contact details correct.
- [ ] Custom domain + HTTPS on Vercel; env `NEXT_PUBLIC_SITE_URL` set.
- [ ] Add order-notification (WhatsApp/SMS to admin) — hook into `/api/orders` / the webhook.

## Honest notes

- Payment, pricing and access-control are now server-authoritative. It's a solid, security-conscious **foundation** — but "guaranteed unhackable" is something no one can honestly promise. Final verification with your live keys + a real test order is the step only you can do.
- Rider live-GPS tracking is simulated by admin status updates. True map/GPS tracking needs a rider app + a maps provider — a good v2.
