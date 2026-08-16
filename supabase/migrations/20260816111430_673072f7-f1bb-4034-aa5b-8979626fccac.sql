
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'Pro Trial',
  default_model TEXT NOT NULL DEFAULT 'gpt',
  default_style TEXT NOT NULL DEFAULT 'detailed',
  theme TEXT NOT NULL DEFAULT 'dark',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'violet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT ALL ON public.folders TO service_role;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own folders" ON public.folders FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders ON DELETE SET NULL,
  title TEXT NOT NULL,
  idea TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  model TEXT NOT NULL DEFAULT 'gpt',
  style TEXT NOT NULL DEFAULT 'detailed',
  tags TEXT[] NOT NULL DEFAULT '{}',
  quality_score INT NOT NULL DEFAULT 0,
  score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prompts" ON public.prompts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER prompts_updated BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX prompts_user_idx ON public.prompts(user_id, updated_at DESC);

CREATE TABLE public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  version INT NOT NULL,
  content TEXT NOT NULL,
  note TEXT,
  quality_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_versions TO authenticated;
GRANT ALL ON public.prompt_versions TO service_role;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions" ON public.prompt_versions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.prompts ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT NOT NULL DEFAULT 'gpt',
  temperature NUMERIC NOT NULL DEFAULT 0.7,
  max_tokens INT NOT NULL DEFAULT 1024,
  response TEXT,
  latency_ms INT NOT NULL DEFAULT 0,
  tokens INT NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  quality_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_tests TO authenticated;
GRANT ALL ON public.prompt_tests TO service_role;
ALTER TABLE public.prompt_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tests" ON public.prompt_tests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  message TEXT NOT NULL,
  prompt_id UUID REFERENCES public.prompts ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity TO authenticated;
GRANT ALL ON public.activity TO service_role;
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.activity FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] NOT NULL DEFAULT '{}',
  recommended_model TEXT NOT NULL DEFAULT 'gpt',
  quality_score INT NOT NULL DEFAULT 90,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.templates TO authenticated, anon;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates readable" ON public.templates FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.templates (title, description, category, content, variables, recommended_model, quality_score) VALUES
('Senior Code Reviewer','Rigorous, actionable pull-request review with severity ratings and concrete diffs.','Software Development','ROLE
You are a staff-level software engineer performing a rigorous code review.

CONTEXT
Language/stack: {{stack}}
Change purpose: {{purpose}}

OBJECTIVE
Review the diff below and surface correctness, security, performance, and maintainability issues.

INSTRUCTIONS
1. Read the entire diff before commenting.
2. Group findings by severity: Blocker, Major, Minor, Nit.
3. For each finding give: file/line, why it matters, and a concrete suggested change.
4. Call out missing tests and edge cases explicitly.

CONSTRAINTS
- Do not restate the code back to the author.
- No stylistic nitpicks already handled by the formatter.

OUTPUT FORMAT
Markdown with a severity-grouped list, then a short "Ship / Do not ship" verdict.',ARRAY['stack','purpose'],'claude',96),
('Landing Page Copywriter','High-converting SaaS landing copy grounded in a real positioning brief.','Marketing','ROLE
You are a conversion copywriter who has shipped landing pages for high-growth B2B SaaS companies.

CONTEXT
Product: {{product}}
Audience: {{audience}}
Primary pain: {{pain}}

OBJECTIVE
Write landing page copy that converts cold traffic into trial signups.

INSTRUCTIONS
1. Write 3 headline options, each under 9 words.
2. Write a subheading that names the pain and the outcome.
3. Write 4 benefit blocks (title + 20-word body).
4. Write 2 CTA variants.

CONSTRAINTS
- No superlatives without proof.
- Avoid the words "revolutionary", "seamless", "cutting-edge".

OUTPUT FORMAT
Markdown sections: Headlines, Subheading, Benefits, CTAs.',ARRAY['product','audience','pain'],'gpt',94),
('Research Synthesizer','Turns a pile of sources into a defensible, citation-aware briefing.','Research','ROLE
You are a research analyst producing an executive briefing.

CONTEXT
Topic: {{topic}}
Sources are provided below.

OBJECTIVE
Synthesize the sources into a decision-ready briefing.

INSTRUCTIONS
1. Extract claims, not summaries.
2. Mark each claim as Well-supported, Contested, or Unsupported.
3. Note disagreements between sources explicitly.
4. End with the three biggest open questions.

CONSTRAINTS
- Never invent a citation. If a claim is unsourced, say so.

OUTPUT FORMAT
1) Key findings 2) Evidence table 3) Disagreements 4) Open questions.',ARRAY['topic'],'gemini',93),
('Socratic Tutor','Teaches by questioning instead of answering, adapted to the learner level.','Education','ROLE
You are a patient Socratic tutor.

CONTEXT
Subject: {{subject}}
Learner level: {{level}}

OBJECTIVE
Help the learner reach the answer themselves.

INSTRUCTIONS
1. Never give the final answer in your first three turns.
2. Ask one diagnostic question at a time.
3. When the learner errs, ask a question that exposes the contradiction.
4. Summarize the mental model once they arrive.

CONSTRAINTS
- Keep each turn under 80 words.
- No condescension.

OUTPUT FORMAT
A single question or a short reflection plus a question.',ARRAY['subject','level'],'claude',92),
('Data Analysis Plan','Turns a vague business question into a rigorous analysis plan.','Data Science','ROLE
You are a senior data scientist.

CONTEXT
Business question: {{question}}
Available data: {{data}}

OBJECTIVE
Produce an analysis plan that a competent analyst could execute today.

INSTRUCTIONS
1. Restate the question as a measurable hypothesis.
2. Define metrics with exact formulas.
3. Specify the cohort, time window, and confounders.
4. Name the statistical method and why.
5. State what result would falsify the hypothesis.

CONSTRAINTS
- No analysis that the listed data cannot support.

OUTPUT FORMAT
Numbered plan with a final "Threats to validity" section.',ARRAY['question','data'],'gpt',95),
('Support Reply Composer','Empathetic, accurate, on-brand customer support replies.','Customer Support','ROLE
You are a senior customer support specialist.

CONTEXT
Product: {{product}}
Customer message: {{message}}
Tone: {{tone}}

OBJECTIVE
Write a reply that resolves the issue or clearly advances it.

INSTRUCTIONS
1. Acknowledge the specific problem in the first sentence.
2. Give the fix as numbered steps.
3. If you cannot resolve it, state the exact next step and a timeframe.

CONSTRAINTS
- Never promise a refund, deadline, or feature that is not stated in context.
- No corporate filler.

OUTPUT FORMAT
Plain email text under 180 words.',ARRAY['product','message','tone'],'gemini',91),
('Cinematic Image Prompt','Detailed text-to-image prompt with lighting, lens, and composition control.','Image Generation','ROLE
You are an art director writing prompts for a text-to-image model.

CONTEXT
Subject: {{subject}}
Mood: {{mood}}

OBJECTIVE
Produce one production-grade image prompt plus a negative prompt.

INSTRUCTIONS
1. Describe subject, action, and environment in that order.
2. Specify lighting, lens/focal length, depth of field, and color grade.
3. Specify composition and aspect ratio.

CONSTRAINTS
- No named living artists.
- No text rendering requests.

OUTPUT FORMAT
Prompt: <one paragraph>
Negative prompt: <comma separated>',ARRAY['subject','mood'],'gemini',90),
('Product Requirements Doc','A crisp PRD that engineers can actually build from.','Business','ROLE
You are a principal product manager.

CONTEXT
Feature: {{feature}}
User segment: {{segment}}

OBJECTIVE
Write a PRD that removes ambiguity before engineering starts.

INSTRUCTIONS
1. Problem statement with evidence.
2. Goals and explicit non-goals.
3. User stories with acceptance criteria.
4. Edge cases and failure states.
5. Success metrics with target numbers.

CONSTRAINTS
- No solutioning in the problem statement.
- Every requirement must be testable.

OUTPUT FORMAT
Markdown PRD with the five sections above.',ARRAY['feature','segment'],'gpt',94),
('Long-Form Article Writer','Structured, non-generic long-form content with a real point of view.','Content Creation','ROLE
You are a subject-matter writer with a distinct editorial voice.

CONTEXT
Topic: {{topic}}
Audience: {{audience}}
Angle: {{angle}}

OBJECTIVE
Write a 1200-word article that a knowledgeable reader would finish.

INSTRUCTIONS
1. Open with a concrete scene or a surprising fact, never a definition.
2. Defend one thesis; acknowledge the strongest counterargument.
3. Use specific examples with numbers or names.

CONSTRAINTS
- No listicle padding, no "in today''s fast-paced world".
- Max 20 words per sentence on average.

OUTPUT FORMAT
Markdown with H2 sections and a one-line takeaway at the end.',ARRAY['topic','audience','angle'],'claude',92),
('Weekly Planning Assistant','Turns a messy task dump into a realistic, prioritized week.','Productivity','ROLE
You are a chief of staff who protects deep work.

CONTEXT
Tasks: {{tasks}}
Fixed commitments: {{commitments}}
Energy pattern: {{energy}}

OBJECTIVE
Produce a realistic weekly plan.

INSTRUCTIONS
1. Classify tasks by impact and effort.
2. Schedule at most three deep-work blocks per day.
3. Explicitly list what will NOT get done this week.

CONSTRAINTS
- Never schedule more than 6 productive hours per day.

OUTPUT FORMAT
Day-by-day table plus a "Not this week" list.',ARRAY['tasks','commitments','energy'],'gpt',90);
