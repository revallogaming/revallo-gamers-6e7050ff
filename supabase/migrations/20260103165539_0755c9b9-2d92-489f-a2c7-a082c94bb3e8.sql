-- Create bucket for tournament banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-banners', 
  'tournament-banners', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload banners
CREATE POLICY "Authenticated users can upload tournament banners" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'tournament-banners' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to banners
CREATE POLICY "Public read access for tournament banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tournament-banners');

-- Allow users to update their own banners
CREATE POLICY "Users can update their own tournament banners" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'tournament-banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own banners
CREATE POLICY "Users can delete their own tournament banners" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'tournament-banners' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);