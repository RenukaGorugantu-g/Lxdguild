-- Enable RLS read access for exam_questions
CREATE POLICY "Anyone can view exam questions" ON exam_questions 
    FOR SELECT USING (true);

-- Enable RLS insert access for exam_attempts
CREATE POLICY "Candidates can insert exam attempts" ON exam_attempts 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS insert/update access for candidates (since candidate status updates upon exam finish)
CREATE POLICY "Candidates can insert candidate data" ON candidates 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update candidate data" ON candidates 
    FOR UPDATE USING (auth.uid() = user_id);

-- Add more sample questions for Level 1 to test the exam workflow properly
-- Currently, we only have 1 question for Level 1, which makes testing pass/fail awkward.
INSERT INTO exam_questions (designation_level, question, options, correct_answer, skill_tag) VALUES
('Level 1', 'Which principle states that adults learn best when the topic is of immediate value?', '["Andragogy", "Pedagogy", "Behaviorism"]'::jsonb, 'Andragogy', 'Adult learning theory'),
('Level 1', 'What is the primary purpose of a storyboard in LXD?', '["To write down the final code", "To visualize the course flow and media before building", "To collect user feedback post-launch"]'::jsonb, 'To visualize the course flow and media before building', 'Storyboarding'),
('Level 1', 'In the SAM model, which phase replaces ADDIE''s linear design phase?', '["Iterative Design", "Preparation", "Savvy Planning"]'::jsonb, 'Iterative Design', 'Instructional Design Models');
