WITH bucket_levels AS (
  SELECT * FROM (
    VALUES
      ('Beginner', 'Level 1'),
      ('Intermediate', 'Level 2'),
      ('Senior', 'Level 4'),
      ('Leader', 'Level 5')
  ) AS buckets(designation_bucket, designation_level)
),
set1_questions AS (
  SELECT * FROM (
    VALUES
      (
        'Needs Analysis',
        'Needs Analysis',
        'Your manager asks you to build a 45-minute training on company values because employees just do not seem to care. Before opening any authoring tool, what should you do first?',
        '["Start building the course because the topic is clear enough","Run a needs analysis to find out whether training will actually fix the problem","Ask the manager for the slide deck they already have","Check whether there is an existing course you can repurpose"]'::jsonb,
        'Run a needs analysis to find out whether training will actually fix the problem'
      ),
      (
        'Learning Theory',
        'Learning Theory',
        'A new hire tells you she learns best by just doing things and finds lectures boring. Which adult learning principle best explains her preference?',
        '["Pedagogy - structured teacher-led instruction works for all ages","Andragogy - adults are self-directed learners who prefer experience-based learning","Bloom''s Taxonomy - she is at the application level","Kirkpatrick Level 2 - she is focused on knowledge transfer"]'::jsonb,
        'Andragogy - adults are self-directed learners who prefer experience-based learning'
      ),
      (
        'ID Fundamentals',
        'ID Fundamentals',
        'You have just finished a draft module and your SME has sent back 47 revision comments, many of them adding more content. Your module is already 35 minutes long. What is your best next move?',
        '["Accept all changes to keep the SME happy","Ignore content additions and only fix factual errors","Go back to the learning objectives and use them as a filter - only add content that serves an objective","Split the module into two parts and double the length"]'::jsonb,
        'Go back to the learning objectives and use them as a filter - only add content that serves an objective'
      ),
      (
        'Learning Objectives',
        'Learning Objectives',
        'You are writing a learning objective for a customer service training. Which version is the strongest?',
        '["Learners will understand how to handle difficult customers","Learners will be aware of the company''s complaint resolution policy","Learners will demonstrate 3 de-escalation techniques when responding to a simulated irate customer call","Learners will know the steps to resolve a complaint"]'::jsonb,
        'Learners will demonstrate 3 de-escalation techniques when responding to a simulated irate customer call'
      ),
      (
        'Evaluation',
        'Evaluation',
        'After your course launches, your manager asks: Did people like it? You collect post-training survey ratings, 4.2 out of 5 on average. What Kirkpatrick level are you measuring, and what is the limitation?',
        '["Level 2 - Learning; it only tells you what people remembered","Level 1 - Reaction; it tells you learner satisfaction but not whether they actually learned anything","Level 3 - Behavior; it shows on-the-job performance","Level 4 - Results; it confirms the training had business impact"]'::jsonb,
        'Level 1 - Reaction; it tells you learner satisfaction but not whether they actually learned anything'
      ),
      (
        'eLearning Tech',
        'eLearning Tech',
        'Your eLearning module plays perfectly on your laptop but breaks when the client uploads it to their LMS. What is the most likely cause?',
        '["The course was built with too many images","The LMS does not support the SCORM version or HTML5 package the course was published in","The client''s internet connection is too slow","The voiceover audio format is incompatible"]'::jsonb,
        'The LMS does not support the SCORM version or HTML5 package the course was published in'
      ),
      (
        'ID Fundamentals',
        'ID Fundamentals',
        'A subject matter expert hands you a 60-slide PowerPoint and says turn this into eLearning. What is the most important thing to do before you start building?',
        '["Redesign all the slides into an eLearning template","Add interactions and animations to every slide","Identify the actual performance goal - what should learners be able to do after this?","Reduce the slides to 30 so the course is not too long"]'::jsonb,
        'Identify the actual performance goal - what should learners be able to do after this?'
      ),
      (
        'ID Fundamentals',
        'ID Fundamentals',
        'You are designing a compliance course on data privacy. The legal team wants you to include every clause of the policy verbatim. What is the instructional design concern with this approach?',
        '["It will make the course too visually complex","Verbatim policy text creates information overload without helping learners know what to actually do differently","Legal content should only be delivered in classroom settings","You cannot add quizzes to policy content"]'::jsonb,
        'Verbatim policy text creates information overload without helping learners know what to actually do differently'
      ),
      (
        'Learning Science',
        'Learning Science',
        'You want learners to retain the key steps of a process after training ends. Which strategy is best supported by learning science?',
        '["A detailed PDF reference guide they can print out","One long module that covers everything in depth","Spaced practice - short follow-up activities or check-ins distributed over days or weeks","A single end-of-course quiz with 50 questions"]'::jsonb,
        'Spaced practice - short follow-up activities or check-ins distributed over days or weeks'
      ),
      (
        'eLearning Tech',
        'eLearning Tech',
        'A learner emails you saying the eLearning module does not work on her phone. She can see the content but the click interactions do not respond. What is the most likely issue?',
        '["The course file is too large","She needs to update her browser","The course was built without responsive or mobile-first design - interactions may be mouse-click dependent","Her phone does not support audio"]'::jsonb,
        'The course was built without responsive or mobile-first design - interactions may be mouse-click dependent'
      ),
      (
        'Project Management',
        'Project Management',
        'You are a junior ID and your manager has approved a storyboard. Later, during development, the SME asks for major changes to the content. What should you do?',
        '["Make the changes immediately - the SME knows the content best","Refuse, since the storyboard was already approved","Flag the changes, assess scope impact, and bring it back to stakeholders - approved storyboards are the change-control baseline","Make the changes but do not tell your manager"]'::jsonb,
        'Flag the changes, assess scope impact, and bring it back to stakeholders - approved storyboards are the change-control baseline'
      )
  ) AS questions(section_name, skill_tag, question, options, correct_answer)
)
INSERT INTO exam_questions (
  designation_level,
  designation_bucket,
  question_set,
  set_weight,
  section_name,
  skill_tag,
  question,
  options,
  correct_answer
)
SELECT
  buckets.designation_level,
  buckets.designation_bucket,
  'set1',
  25,
  questions.section_name,
  questions.skill_tag,
  questions.question,
  questions.options,
  questions.correct_answer
FROM bucket_levels AS buckets
CROSS JOIN set1_questions AS questions
WHERE NOT EXISTS (
  SELECT 1
  FROM exam_questions existing
  WHERE existing.designation_bucket = buckets.designation_bucket
    AND COALESCE(existing.question_set, 'set1') = 'set1'
    AND existing.question = questions.question
);
