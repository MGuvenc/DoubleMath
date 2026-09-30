alter table blog_posts
  add column view_count bigint not null default 0 check (view_count >= 0);

create index idx_blog_posts_popular
  on blog_posts(view_count desc, published_at desc)
  where status = 'published';

create or replace function increment_blog_post_views(post_slug text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.blog_posts
  set view_count = view_count + 1
  where slug = post_slug and status = 'published';
$$;

revoke all on function increment_blog_post_views(text) from public;
grant execute on function increment_blog_post_views(text) to anon, authenticated;