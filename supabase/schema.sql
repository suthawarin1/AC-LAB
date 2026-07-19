-- ============================================================
-- AC Lab X shop — Supabase schema
-- Run this once in your Supabase project's SQL editor
-- (same project the main AC Lab site already uses).
-- ============================================================

-- PRODUCTS -----------------------------------------------------
create table if not exists shop_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_th text,
  category text default 'supplement',
  price numeric not null default 0,
  compare_price numeric default 0,
  is_new boolean default false,
  is_bestseller boolean default false,
  images jsonb default '[]',
  short_desc text,
  short_desc_th text,
  benefits jsonb default '[]',
  benefits_th jsonb default '[]',
  ingredients text,
  ingredients_th text,
  size text,
  fda_no text,
  research jsonb default '[]',
  stock integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- REVIEWS --------------------------------------------------------
create table if not exists shop_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references shop_products(id) on delete cascade,
  name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  status text default 'pending',  -- pending | approved | rejected
  created_at timestamptz default now()
);

-- DISCOUNT CODES ---------------------------------------------------
create table if not exists shop_discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null default 'percent',   -- percent | fixed
  value numeric not null default 0,
  min_order numeric default 0,
  max_uses integer,
  used_count integer default 0,
  expires_at date,
  active boolean default true
);

-- ORDERS -----------------------------------------------------------
create table if not exists shop_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  name text not null,
  phone text not null,
  email text,
  address text not null,
  district text not null,
  province text not null,
  postal_code text not null,
  note text,
  subtotal numeric not null default 0,
  discount_code text,
  discount_amount numeric default 0,
  shipping_fee numeric default 0,
  total numeric not null default 0,
  payment_method text default 'qr',
  payment_slip text,               -- base64 image or a Storage URL
  status text default 'pending',   -- pending | paid | preparing | shipped | delivered | cancelled
  tracking_carrier text,
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references shop_orders(id) on delete cascade,
  product_id uuid,
  product_name text,
  qty integer not null default 1,
  unit_price numeric not null default 0,
  image text
);

create index if not exists idx_shop_orders_lookup on shop_orders(order_no, phone);
create index if not exists idx_shop_reviews_product on shop_reviews(product_id, status);

-- ============================================================
-- ROW LEVEL SECURITY
-- Starter policies: public (anon) can read active products and
-- approved reviews, and can create orders/reviews/order-items.
-- Only signed-in admin accounts (the same ones used on the main
-- AC Lab site) can edit products, discounts, orders and moderate
-- reviews. Review and tighten before going live — see notes below.
-- ============================================================
alter table shop_products enable row level security;
alter table shop_reviews enable row level security;
alter table shop_discounts enable row level security;
alter table shop_orders enable row level security;
alter table shop_order_items enable row level security;

-- products: public read (active only), admin write
create policy "public read active products" on shop_products for select using (active = true);
create policy "admin write products" on shop_products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- reviews: public read approved, public insert (pending), admin moderate
create policy "public read approved reviews" on shop_reviews for select using (status = 'approved');
create policy "public insert reviews" on shop_reviews for insert with check (true);
create policy "admin moderate reviews" on shop_reviews for update using (auth.role() = 'authenticated');
create policy "admin delete reviews" on shop_reviews for delete using (auth.role() = 'authenticated');

-- discounts: public read active (to validate a typed code), admin write
create policy "public read active discounts" on shop_discounts for select using (active = true);
create policy "admin write discounts" on shop_discounts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- orders: public insert (checkout), public select (order tracking by
-- phone + order_no pair — treat the order number as a private token
-- and do not print it anywhere public), admin update/select-all.
create policy "public create orders" on shop_orders for insert with check (true);
create policy "public read own order" on shop_orders for select using (true);
create policy "admin update orders" on shop_orders for update using (auth.role() = 'authenticated');

-- order items: public insert at checkout + read (needed for tracking)
create policy "public create order items" on shop_order_items for insert with check (true);
create policy "public read order items" on shop_order_items for select using (true);
create policy "admin manage order items" on shop_order_items for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Optional: a couple of sample discount codes to test checkout
-- ============================================================
insert into shop_discounts (code, type, value, min_order, active)
values ('WELCOME10', 'percent', 10, 0, true)
on conflict (code) do nothing;
