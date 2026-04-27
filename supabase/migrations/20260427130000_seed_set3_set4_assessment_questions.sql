WITH senior_set3_questions AS (
  SELECT * FROM (
    VALUES
      (
        'Performance Consulting',
        'Performance Consulting',
        'A VP of Sales tells you: Our reps know the product cold but still are not closing deals. We need a product knowledge refresh. What is your response as a performance consultant?',
        '["Agree and begin designing the product knowledge course","Ask to observe a few sales calls and review CRM data first - knowledge may not be the real gap","Recommend a blended learning program combining eLearning and role-play","Survey the sales team to find out what content they want"]'::jsonb,
        'Ask to observe a few sales calls and review CRM data first - knowledge may not be the real gap'
      ),
      (
        'L&D Strategy',
        'L&D Strategy',
        'You are mapping out a learning ecosystem for a 500-person organisation. The CEO wants one platform for everything. What is the key risk in a single-platform approach?',
        '["It will be too expensive","A single platform optimises for formal learning but often fails to support informal learning, peer knowledge-sharing, and performance support at the moment of need","Employees prefer multiple tools","It creates data privacy issues"]'::jsonb,
        'A single platform optimises for formal learning but often fails to support informal learning, peer knowledge-sharing, and performance support at the moment of need'
      ),
      (
        'Evaluation & ROI',
        'Evaluation & ROI',
        'Six months after a leadership program, managers report satisfaction scores of 4.6/5 and knowledge scores of 85%. Yet 360 feedback shows no change in leadership behaviour. What does this most likely indicate?',
        '["The training content was incorrect","The evaluation was done too soon","There is a transfer gap - managers learned it but the environment (manager support, accountability structures) did not enable behaviour change on the job","The 360 tool is unreliable"]'::jsonb,
        'There is a transfer gap - managers learned it but the environment (manager support, accountability structures) did not enable behaviour change on the job'
      ),
      (
        'Consulting Skills',
        'Consulting Skills',
        'A client wants to add 4 more modules to a program that is already cognitively dense. You believe it will hurt learning outcomes. How do you handle this conversation?',
        '["Add the modules - client knows their business","Build the modules but warn them in writing","Present the evidence: show how cognitive load affects retention, offer alternative solutions like job aids or performance support tools, and make the trade-off explicit","Escalate to your manager to deliver the message"]'::jsonb,
        'Present the evidence: show how cognitive load affects retention, offer alternative solutions like job aids or performance support tools, and make the trade-off explicit'
      ),
      (
        'Design Thinking',
        'Design Thinking',
        'You are redesigning an onboarding program using Design Thinking. During the Empathise phase, you interview 10 new hires from the last cohort. Three of them mention feeling overwhelmed in week 2 but you did not plan to address week 2. What do you do?',
        '["Stay within the original project scope - redesign only what you were asked to","Dismiss it as individual adjustment issues","Surface the finding to stakeholders - Design Thinking requires following the human experience, not just the brief, and week 2 friction is clearly part of the onboarding experience","Add more content to week 2 to fill the gap"]'::jsonb,
        'Surface the finding to stakeholders - Design Thinking requires following the human experience, not just the brief, and week 2 friction is clearly part of the onboarding experience'
      ),
      (
        'Competency Design',
        'Competency Design',
        'You are building a competency framework for a new Digital Learning Producer role at your company. An SME insists on including 22 competencies. What is the instructional risk of this approach?',
        '["It makes the job description too long","22 competencies dilutes focus - without prioritisation, everything becomes equally important and nothing gets meaningfully developed or assessed","It is more than one person can learn","It will take too long to design learning for each one"]'::jsonb,
        '22 competencies dilutes focus - without prioritisation, everything becomes equally important and nothing gets meaningfully developed or assessed'
      ),
      (
        'AI in L&D',
        'AI in L&D',
        'Your team wants to use an AI tool to auto-generate persona profiles for typical learners in your next program. What is the key risk you should flag before proceeding?',
        '["AI-generated personas may look unprofessional","AI personas built from biased training data can misrepresent real learner needs - especially for underrepresented groups - and lead to exclusionary design decisions","It will make the project take longer","Personas are not useful in instructional design"]'::jsonb,
        'AI personas built from biased training data can misrepresent real learner needs - especially for underrepresented groups - and lead to exclusionary design decisions'
      ),
      (
        'Agile L&D',
        'Agile L&D',
        'Your organisation has just adopted an agile delivery model. A business unit asks for a 3-hour eLearning course on change management. How do you apply agile principles to this request?',
        '["Build the full course and deliver it in one release","Refuse - agile does not work for eLearning","Decompose the request into smaller learning assets, prioritise by business impact, release iteratively, and gather feedback before building the next sprint","Follow the standard ADDIE process but call it agile"]'::jsonb,
        'Decompose the request into smaller learning assets, prioritise by business impact, release iteratively, and gather feedback before building the next sprint'
      ),
      (
        'L&D Strategy',
        'L&D Strategy',
        'A learning path and a curriculum both include the same 6 courses. A learner asks: What is the difference? What is the most accurate answer?',
        '["They are the same thing with different names","A curriculum is a fixed sequence everyone follows; a learning path is adaptive - it adjusts based on role, experience, or assessment results","A curriculum is longer","A learning path is only for self-paced digital content"]'::jsonb,
        'A curriculum is a fixed sequence everyone follows; a learning path is adaptive - it adjusts based on role, experience, or assessment results'
      ),
      (
        'Project Management',
        'Project Management',
        'You are onboarding a new freelance eLearning developer for a client project. What is the single most important thing to align on before they write a single line of code?',
        '["Their hourly rate","The visual design style guide","The review and revision process, acceptance criteria, and SCORM output requirements - misalignment here causes the most costly rework","Whether they use the same authoring tool as you"]'::jsonb,
        'The review and revision process, acceptance criteria, and SCORM output requirements - misalignment here causes the most costly rework'
      ),
      (
        'Performance Consulting',
        'Performance Consulting',
        'A business unit head says: We just need a quick e-learning - nothing fancy. Two weeks into build, you discover the actual performance problem requires a coaching process, not a course. What do you do?',
        '["Finish the eLearning since you are already two weeks in","Stop, surface the finding, and recommend pivoting to the right solution - even if it delays the project","Add a coaching section at the end of the eLearning","Complete the eLearning and note the limitation in your handover document"]'::jsonb,
        'Stop, surface the finding, and recommend pivoting to the right solution - even if it delays the project'
      )
  ) AS questions(section_name, skill_tag, question, options, correct_answer)
),
leader_set4_questions AS (
  SELECT * FROM (
    VALUES
      (
        'Org Learning',
        'Org Learning',
        'Your CHRO asks you to build a learning culture. Three months in, you have a new LMS, a refreshed course catalog, and 94% completion rates. The CHRO says she is still not seeing the impact she hoped for. What is the core issue?',
        '["The LMS is the wrong platform","94% completion is exceptional - the CHRO''s expectations are unrealistic","Course consumption metrics do not indicate a learning culture. Real culture change requires psychological safety, manager reinforcement, and learning embedded into how work happens - not just courses completed","You need more content in the catalog"]'::jsonb,
        'Course consumption metrics do not indicate a learning culture. Real culture change requires psychological safety, manager reinforcement, and learning embedded into how work happens - not just courses completed'
      ),
      (
        'Strategic Impact',
        'Strategic Impact',
        'The CFO asks you to prove the ROI of your leadership development program before approving next year''s budget. You have satisfaction scores and knowledge assessments. What additional data do you need?',
        '["Number of training hours per employee","Learner NPS scores","Isolated performance data tied to business outcomes - productivity, retention, promotion rates - and a cost-benefit calculation using Phillips ROI methodology","A benchmark comparison to industry training spend"]'::jsonb,
        'Isolated performance data tied to business outcomes - productivity, retention, promotion rates - and a cost-benefit calculation using Phillips ROI methodology'
      ),
      (
        'Future of Work',
        'Future of Work',
        'Your organisation is moving to a skills-based model. The HRBP team wants to map every role to a skills taxonomy. As the L&D leader, what is your most critical contribution to this initiative?',
        '["Building a course for every skill in the taxonomy","Ensuring skills are validated against actual job performance data - not just what managers think people need - and designing varied development pathways beyond formal training","Recommending the skills taxonomy software","Creating a skills assessment quiz for each role"]'::jsonb,
        'Ensuring skills are validated against actual job performance data - not just what managers think people need - and designing varied development pathways beyond formal training'
      ),
      (
        'Governance',
        'Governance',
        'Two senior leaders are arguing about L&D investment priorities: one wants compliance training modernised, the other wants leadership development scaled. You have budget for one. What governance mechanism should be in place to make this decision?',
        '["You decide based on your L&D expertise","The one with the bigger budget gets priority","A Learning Advisory Board or Steering Committee with defined criteria for prioritisation tied to strategic business goals","Survey employees to see what they prefer"]'::jsonb,
        'A Learning Advisory Board or Steering Committee with defined criteria for prioritisation tied to strategic business goals'
      ),
      (
        'Transfer of Learning',
        'Transfer of Learning',
        'Research shows that 70% of leadership development does not result in behaviour change on the job. A junior L&D team member asks you why. What is your answer?',
        '["Leadership skills are inherently difficult to teach","Most programs are too short","The training event itself is rarely the problem - failure to change happens because the environment back at work does not support or reinforce new behaviours after the program ends","Learner motivation is low"]'::jsonb,
        'The training event itself is rarely the problem - failure to change happens because the environment back at work does not support or reinforce new behaviours after the program ends'
      ),
      (
        'L&D Tech Strategy',
        'L&D Tech Strategy',
        'A vendor pitches you an AI-powered adaptive learning platform for $400K annually. The demo is impressive. What is your evaluation process before making a recommendation to the board?',
        '["If the demo is impressive, it is worth the investment","Ask for a pilot with a small cohort first","Assess total cost of ownership, integration with your existing HR tech stack, data privacy compliance, vendor stability, and whether the problem it solves justifies the cost versus alternative solutions","Compare it to one other vendor and pick the cheaper one"]'::jsonb,
        'Assess total cost of ownership, integration with your existing HR tech stack, data privacy compliance, vendor stability, and whether the problem it solves justifies the cost versus alternative solutions'
      ),
      (
        'Org Learning',
        'Org Learning',
        'Amy Edmondson''s research shows psychological safety is the strongest predictor of team learning. As an L&D leader, what does this mean for how you design team-based learning experiences?',
        '["Ensure all content is delivered online so no one feels put on the spot","Create conditions where people can ask questions, surface failures, and experiment without fear of judgment - learning design must account for the social and emotional environment, not just content","Use anonymous quizzes so learners feel safe","Only use experienced facilitators"]'::jsonb,
        'Create conditions where people can ask questions, surface failures, and experiment without fear of judgment - learning design must account for the social and emotional environment, not just content'
      ),
      (
        'Talent Strategy',
        'Talent Strategy',
        'Your organisation just acquired a smaller company. The integration team asks L&D to create onboarding for 200 new employees. What is the strategic L&D question you need to answer first?',
        '["What LMS will the new employees use?","How long should the onboarding be?","What do these employees need to know, do, and feel to be productive and retained - and how does that differ from our existing onboarding?","Will the content be eLearning or instructor-led?"]'::jsonb,
        'What do these employees need to know, do, and feel to be productive and retained - and how does that differ from our existing onboarding?'
      ),
      (
        'Strategic Impact',
        'Strategic Impact',
        'Your CEO says: Everyone talks about L&D being strategic, but I still see it as a cost centre. What is the most powerful shift you can make to change this perception?',
        '["Rebrand the L&D team as Talent Enablement","Publish monthly reports on training hours and completion rates","Co-create learning solutions with business unit leaders tied to their specific KPIs, then report on measurable business outcomes - not learning activity","Increase the training budget to show L&D is taken seriously"]'::jsonb,
        'Co-create learning solutions with business unit leaders tied to their specific KPIs, then report on measurable business outcomes - not learning activity'
      ),
      (
        'L&D Strategy',
        'L&D Strategy',
        'You discover that a high-performing team in your organisation barely uses any formal training - yet their capability growth is outstanding. What does this suggest for your L&D strategy?',
        '["Formal training is unnecessary and should be reduced","That team is an anomaly","Informal learning, peer collaboration, and stretch assignments are powerful development drivers - your L&D strategy should enable and amplify these, not just build more courses","You should investigate why they are not using the LMS"]'::jsonb,
        'Informal learning, peer collaboration, and stretch assignments are powerful development drivers - your L&D strategy should enable and amplify these, not just build more courses'
      ),
      (
        'Talent Strategy',
        'Talent Strategy',
        'A business unit leader says: Just hire someone with the skills we need - it is faster than training. How do you respond strategically?',
        '["Agree - external hiring is always more efficient","Disagree - training is always better for morale","Reframe the decision: hiring solves the immediate gap but does not build organisational capability. The right answer depends on whether the skill is rare externally, how long capability-building takes, and the strategic importance of developing it internally","Ask HR to handle the conversation"]'::jsonb,
        'Reframe the decision: hiring solves the immediate gap but does not build organisational capability. The right answer depends on whether the skill is rare externally, how long capability-building takes, and the strategic importance of developing it internally'
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
  'Level 4',
  'Senior',
  'set3',
  25,
  questions.section_name,
  questions.skill_tag,
  questions.question,
  questions.options,
  questions.correct_answer
FROM senior_set3_questions AS questions
WHERE NOT EXISTS (
  SELECT 1
  FROM exam_questions existing
  WHERE existing.designation_bucket = 'Senior'
    AND COALESCE(existing.question_set, 'set1') = 'set3'
    AND existing.question = questions.question
)
UNION ALL
SELECT
  'Level 5',
  'Leader',
  'set4',
  25,
  questions.section_name,
  questions.skill_tag,
  questions.question,
  questions.options,
  questions.correct_answer
FROM leader_set4_questions AS questions
WHERE NOT EXISTS (
  SELECT 1
  FROM exam_questions existing
  WHERE existing.designation_bucket = 'Leader'
    AND COALESCE(existing.question_set, 'set1') = 'set4'
    AND existing.question = questions.question
);
