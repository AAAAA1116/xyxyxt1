-- Storage bucket: listing-images（公开读）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 仅登录用户可上传
CREATE POLICY "listing_images_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images');

-- 公开读（bucket 已设为 public，object 默认可读）
CREATE POLICY "listing_images_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-images');
