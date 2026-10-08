alter table public.orders
  add column if not exists expiration_warning_sent boolean not null default false;

create index if not exists idx_orders_package_warning
  on public.orders(package_expires_at)
  where status = 'paid' and expiration_warning_sent = false;
