ALTER TABLE resources
ADD COLUMN IF NOT EXISTS category_slug TEXT;

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS source_file_link TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS resources_file_link_unique_idx
ON public.resources (file_link);

CREATE TABLE IF NOT EXISTS resource_category_map (
  file_url TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  updated_file_url TEXT
);

CREATE OR REPLACE FUNCTION public.resource_title_from_url(resource_url TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    regexp_replace(
      regexp_replace(
        replace(
          replace(
            replace(
              regexp_replace(split_part(resource_url, '/', array_length(string_to_array(resource_url, '/'), 1)), '\?.*$', ''),
              '_',
              ' '
            ),
            '%20',
            ' '
          ),
          '-',
          ' '
        ),
        '\.(docx|pptx|xlsx|pdf)(\.(docx|pptx|xlsx|pdf))*$',
        '',
        'i'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.resource_member_url_from_url(resource_url TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'https://lxdguild.com/members/resources/' ||
    split_part(resource_url, '/', array_length(string_to_array(resource_url, '/'), 1));
$$;

INSERT INTO public.resource_category_map (file_url, category, category_slug)
VALUES
-- Talent Strategy and Management
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/To-Source-In-House-or-Out-of-House_.docx.pdf', 'Talent Strategy and Management', 'talent-strategy-and-management'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Information-to-Include-in-an-RFP.docx.pdf', 'Talent Strategy and Management', 'talent-strategy-and-management'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Moderated-Remote-Usability-Script-Guidance.docx.pdf', 'Talent Strategy and Management', 'talent-strategy-and-management'),

-- Learning Sciences
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/creating-engaged-employees-advance-organizer-templates-and-tools-final.docx-1.pdf', 'Learning Sciences', 'learning-sciences'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/learning-action-plan-template.docx.pdf', 'Learning Sciences', 'learning-sciences'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/learning-design-checklist.docx.pdf', 'Learning Sciences', 'learning-sciences'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/designing-for-attention-and-learning-templates-and-tools-final.docx.pdf', 'Learning Sciences', 'learning-sciences'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/training-for-expertise-job-aid-final.docx.pdf', 'Learning Sciences', 'learning-sciences'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/writing-better-learning-objectives-templates-and-tools-final.docx.pdf', 'Learning Sciences', 'learning-sciences'),

-- Organization Development and Culture
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/staff-engagement-survey-templates-and-tools-final.docx.pdf', 'Organization Development and Culture', 'organization-development-and-culture'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/positive-performance-checklist-job-aid-final.docx.pdf', 'Organization Development and Culture', 'organization-development-and-culture'),

-- Communication & Evaluating Impact
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/persuasion-preparation-worksheet.docx.pdf', 'Communication & Evaluating Impact', 'communication-evaluating-impact'),

-- Collaboration,Leadership & Business Insight
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Three-bold-steps.docx.pdf', 'Collaboration,Leadership & Business Insight', 'collaboration-leadership-business-insight'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/measuring-internal-leadership-team-effectiveness-job-aid-final.pptx-1.pdf', 'Collaboration,Leadership & Business Insight', 'collaboration-leadership-business-insight'),

-- Instructional Design
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Thinking-of-Prototyping_.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-the-six-steps-of-needs-assessment.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-the-ropes-in-action.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-the-3-cs.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-more-about-blooms-taxonomy.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-kirkpatricks-four-levels-of-evaluation.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-influential-learning-models.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-implementation-plan-components.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-guide-to-designing-assessments.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-evaluating-existing-content.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-design-thinking-tools.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/atd-data-collection-methods.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/training-needs-analysis-job-aid-002.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/skills-gap-action-plan-checklist.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Business-Benefits-to-Using-Social-Media.docx-1.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/rating-scale-template.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/population-analysis-matrix.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/data-collection-plan.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/audit-questions.docx-1.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/training-stakeholder-analysis.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/course-maintenance-plan-template.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Using-ADDIE-for-Face-to-Face-Virtual-and-Online-Learning.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/template-for-design-document.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Is-It-Knowledge-a-Skill-or-an-Attitude_.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/instructional-design-models.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/guidelines-for-designing-learning-materials.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/how-creative-is-your-training.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/guide-learning-design-final.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/sample-design-meeting-agenda-final.docx.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/CREATE-AN-ACTIONABLE-E-LEARNING-STORYBOARD.docx-1.pdf', 'Instructional Design', 'instructional-design'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/E-Learning-Project-Kickoff-Meeting-Checklist.docx.pdf', 'Instructional Design', 'instructional-design'),

-- Technology Application
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Learning-Technology-Needs-Assessment.docx-2.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Checklist-for-Leveraging-Social-Media-For-Learning.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Checklist-for-Methods-and-Techniques-for-Testing-Learning-Technologies.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Considerations-for-Creating-a-Data-Governance-Practice.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Guiding-Questions-for-Using-Social-Media.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Identifying-and-Articulating-Technology-System-Requirements.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Improve-Formal-Learning-Checklist.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/UI_UX-Design-Best-Practices.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Tips-for-Creating-Accessible-Learning-Experiences.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Getting-Started-With-AI-and-MR.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Checklist-for-Evaluating-and-Selecting-E-Learning-Software-Tools-By-ATD-Staff.docx.pdf', 'Technology Application', 'technology-application'),
('https://oldlxd.lxdguild.com/wp-content/uploads/2024/09/Checklist-for-Administering-a-Learning-Technology-Ecosystem.docx.pdf', 'Technology Application', 'technology-application')
ON CONFLICT (file_url) DO UPDATE
SET category = EXCLUDED.category,
    category_slug = EXCLUDED.category_slug,
    updated_file_url = EXCLUDED.updated_file_url;

UPDATE public.resources AS r
SET category = m.category,
    category_slug = m.category_slug,
    source_file_link = COALESCE(r.source_file_link, COALESCE(m.updated_file_url, m.file_url), r.file_link),
    file_link = public.resource_member_url_from_url(COALESCE(m.updated_file_url, m.file_url))
FROM public.resource_category_map AS m
WHERE r.file_link = m.file_url
   OR r.file_link = COALESCE(m.updated_file_url, m.file_url)
   OR r.source_file_link = m.file_url
   OR r.source_file_link = COALESCE(m.updated_file_url, m.file_url);

UPDATE public.resources
SET source_file_link = COALESCE(source_file_link, file_link),
    file_link = public.resource_member_url_from_url(COALESCE(source_file_link, file_link))
WHERE file_link NOT LIKE 'https://lxdguild.com/members/resources/%';

INSERT INTO public.resources (category, category_slug, title, file_link, source_file_link, premium_only)
SELECT
  m.category,
  m.category_slug,
  initcap(public.resource_title_from_url(COALESCE(m.updated_file_url, m.file_url))),
  public.resource_member_url_from_url(COALESCE(m.updated_file_url, m.file_url)),
  COALESCE(m.updated_file_url, m.file_url),
  true
FROM public.resource_category_map AS m
ON CONFLICT (file_link) DO UPDATE
SET category = EXCLUDED.category,
    category_slug = EXCLUDED.category_slug,
    source_file_link = EXCLUDED.source_file_link;
