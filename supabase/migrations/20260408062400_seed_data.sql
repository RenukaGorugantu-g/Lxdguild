-- Insert demo exam questions
INSERT INTO exam_questions (designation_level, question, options, correct_answer, skill_tag) VALUES
('Level 1', 'Which of the following describes ADDIE?', '["Analysis, Design, Development, Implementation, Evaluation", "Assessment, Design, Deployment, Implementation, Evaluation", "Analysis, Design, Development, Iteration, Evaluation"]'::jsonb, 'Analysis, Design, Development, Implementation, Evaluation', 'Adult learning theory'),
('Level 2', 'What is the primary goal of formative assessment?', '["To assign a final grade", "To evaluate student learning at the end", "To monitor student learning to provide ongoing feedback"]'::jsonb, 'To monitor student learning to provide ongoing feedback', 'Assessment design'),
('Level 3', 'Which tool is most commonly used for creating SCORM packages?', '["Microsoft Word", "Articulate Storyline", "Adobe Photoshop"]'::jsonb, 'Articulate Storyline', 'Authoring tools'),
('Level 4', 'How does Kirkpatrick’s Level 3 differ from Level 2?', '["Level 3 measures behavior change, Level 2 measures knowledge acquisition", "Level 3 measures ROI, Level 2 measures reaction", "Level 3 measures reaction, Level 2 measures learning"]'::jsonb, 'Level 3 measures behavior change, Level 2 measures knowledge acquisition', 'Evaluation'),
('Level 5', 'When designing Learning UX, cognitive load theory suggests:', '["Maximal graphics and animations", "Minimizing extraneous cognitive load", "Using only text and no images"]'::jsonb, 'Minimizing extraneous cognitive load', 'Learning UX'),
('Level 6', 'When consulting with stakeholders, the first step is usually:', '["Building the course immediately", "Needs analysis and determining business goals", "Selecting the authoring tool"]'::jsonb, 'Needs analysis and determining business goals', 'Stakeholder consulting');

-- Resources demo
INSERT INTO resources (category, title, file_link, premium_only) VALUES
('Templates', 'Storyboarding Template 2026', 'https://example.com/storyboard.pdf', true),
('Guides', 'Freelancing as an LXD', 'https://example.com/freelancing.pdf', true),
('Cheat Sheets', 'Articulate Storyline Triggers', 'https://example.com/triggers.pdf', false);
