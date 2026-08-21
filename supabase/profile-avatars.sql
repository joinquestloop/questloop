-- Profile pictures are intentionally public because they appear on public
-- QuestLoop profiles. Other files in the private proof-images bucket remain
-- protected by their existing policies.
create policy "Public profile avatars are viewable"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'proof-images'
  and (storage.foldername(name))[2] = 'avatar'
);
