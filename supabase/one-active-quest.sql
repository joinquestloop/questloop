-- Enforce the MVP rule that each member can have only one active quest.
-- Keep each member's newest active membership and preserve older membership
-- history as paused. Proofs and membership rows are not deleted.
with ranked_active_memberships as (
  select
    id,
    row_number() over (
      partition by user_id
      order by joined_at desc, id desc
    ) as active_rank
  from public.quest_memberships
  where status = 'active'
)
update public.quest_memberships
set status = 'paused'
where id in (
  select id
  from ranked_active_memberships
  where active_rank > 1
);

-- Completed or paused memberships are not affected by this index.
create unique index if not exists one_active_quest_per_user
on public.quest_memberships (user_id)
where status = 'active';
