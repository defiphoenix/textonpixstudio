CREATE TABLE public.bulk_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled project',
  prompt text NOT NULL DEFAULT '',
  texts jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_count integer NOT NULL DEFAULT 0,
  generated_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulk_projects TO authenticated;
GRANT ALL ON public.bulk_projects TO service_role;
ALTER TABLE public.bulk_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY bulk_projects_manage_own ON public.bulk_projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER bulk_projects_updated_at BEFORE UPDATE ON public.bulk_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.design_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_presets TO authenticated;
GRANT ALL ON public.design_presets TO service_role;
ALTER TABLE public.design_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY design_presets_manage_own ON public.design_presets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER design_presets_updated_at BEFORE UPDATE ON public.design_presets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();