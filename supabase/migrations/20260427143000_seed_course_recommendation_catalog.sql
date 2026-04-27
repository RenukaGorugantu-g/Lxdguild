DELETE FROM courses
WHERE course_code = 'C5'
   OR title = 'C5 - Prototype Course'
   OR title ILIKE '%Prototype%'
   OR title ILIKE '%Process Design & Dev%';

INSERT INTO courses (
  designation_level,
  skill_focus,
  title,
  external_link,
  recommendation_type,
  designation_bucket,
  target_role,
  course_code
) VALUES
('Level 1'::public.designation_level, 'AI in Instructional Design', 'Mastering AI in Instructional Design', 'https://lxdguildacademy.com/mastering-ai-in-instructional-design/', 'improvement', 'Beginner', NULL, 'C1'),
('Level 2'::public.designation_level, 'AI in Instructional Design', 'Mastering AI in Instructional Design', 'https://lxdguildacademy.com/mastering-ai-in-instructional-design/', 'next_level', 'Intermediate', NULL, 'C1'),
('Level 4'::public.designation_level, 'AI in Instructional Design', 'Mastering AI in Instructional Design', 'https://lxdguildacademy.com/mastering-ai-in-instructional-design/', 'next_level', 'Senior', NULL, 'C1'),
('Level 5'::public.designation_level, 'AI in Instructional Design', 'Mastering AI in Instructional Design', 'https://lxdguildacademy.com/mastering-ai-in-instructional-design/', 'next_level', 'Leader', NULL, 'C1'),

('Level 1'::public.designation_level, 'Certified LXD Boot Camp', 'Certified Learning Experience Designer (CLXD)', 'https://lxdguildacademy.com/certified-learning-experience-designerclxd/', 'improvement', 'Beginner', NULL, 'C2'),
('Level 2'::public.designation_level, 'Certified LXD Boot Camp', 'Certified Learning Experience Designer (CLXD)', 'https://lxdguildacademy.com/certified-learning-experience-designerclxd/', 'improvement', 'Intermediate', NULL, 'C2'),
('Level 4'::public.designation_level, 'Certified LXD Boot Camp', 'Certified Learning Experience Designer (CLXD)', 'https://lxdguildacademy.com/certified-learning-experience-designerclxd/', 'improvement', 'Senior', NULL, 'C2'),
('Level 5'::public.designation_level, 'Certified LXD Boot Camp', 'Certified Learning Experience Designer (CLXD)', 'https://lxdguildacademy.com/certified-learning-experience-designerclxd/', 'improvement', 'Leader', NULL, 'C2'),

('Level 1'::public.designation_level, 'ID Authoring Tools', 'Mastering Instructional Design Authoring Tools', 'https://lxdguildacademy.com/id-authoring-tools/', 'improvement', 'Beginner', NULL, 'C3'),
('Level 2'::public.designation_level, 'ID Authoring Tools', 'Mastering Instructional Design Authoring Tools', 'https://lxdguildacademy.com/id-authoring-tools/', 'improvement', 'Intermediate', NULL, 'C3'),

('Level 2'::public.designation_level, 'CLXD Capstone', 'CLXD Capstone', 'https://lxdguildacademy.com/capstone/', 'next_level', 'Intermediate', NULL, 'C4'),
('Level 4'::public.designation_level, 'CLXD Capstone', 'CLXD Capstone', 'https://lxdguildacademy.com/capstone/', 'next_level', 'Senior', NULL, 'C4'),
('Level 5'::public.designation_level, 'CLXD Capstone', 'CLXD Capstone', 'https://lxdguildacademy.com/capstone/', 'next_level', 'Leader', NULL, 'C4')
ON CONFLICT (external_link) DO NOTHING;
