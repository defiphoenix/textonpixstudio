CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  image_path text NOT NULL,
  text_content text NOT NULL DEFAULT '',
  font text NOT NULL DEFAULT '',
  font_size integer NOT NULL DEFAULT 48,
  color text NOT NULL DEFAULT '#ffffff',
  align text NOT NULL DEFAULT 'center',
  bold boolean NOT NULL DEFAULT true,
  italic boolean NOT NULL DEFAULT false,
  underline boolean NOT NULL DEFAULT false,
  shadow boolean NOT NULL DEFAULT true,
  pos_x numeric NOT NULL DEFAULT 50,
  pos_y numeric NOT NULL DEFAULT 45,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edits TO authenticated;
GRANT ALL ON public.edits TO service_role;
ALTER TABLE public.edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edits_manage_own" ON public.edits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX edits_user_created_idx ON public.edits (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER edits_updated_at BEFORE UPDATE ON public.edits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "edits_storage_select_own" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'edits' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "edits_storage_insert_own" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'edits' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "edits_storage_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'edits' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "edits_storage_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'edits' AND auth.uid()::text = (storage.foldername(name))[1]);