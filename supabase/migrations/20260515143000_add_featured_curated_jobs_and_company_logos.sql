ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS featured_rank INTEGER;

CREATE INDEX IF NOT EXISTS jobs_featured_rank_sort_idx
ON jobs (featured_rank, COALESCE(external_posted_at, imported_at, created_at) DESC);

UPDATE jobs
SET featured_rank = NULL
WHERE featured_rank IS NOT NULL
  AND apply_url NOT IN (
    'internal://lxd-guild/jobs/featured-r00287068',
    'internal://lxd-guild/jobs/featured-r00287065',
    'internal://lxd-guild/jobs/featured-r00287060'
  );

DELETE FROM jobs
WHERE source = 'accenture_curated'
  AND source_job_id IN ('R00287068', 'R00287065', 'R00287060');

INSERT INTO jobs (
  title,
  description,
  company,
  location,
  source,
  apply_url,
  source_job_id,
  search_keyword,
  work_mode,
  employment_type,
  job_kind,
  is_active,
  imported_at,
  external_posted_at,
  expires_at,
  featured_rank
) VALUES
(
  'Instructional Design - Senior Analyst - T&O- (S&C GN)',
  $$<p><strong>Job Title:</strong> Instructional Design - Senior Analyst - T&amp;O- (S&amp;C GN)</p><p><strong>Management Level:</strong> 10 - Senior Analyst</p><p><strong>Location:</strong> Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai</p><p><strong>Must have skills:</strong> Instructional Design OR Storyboarding OR Articulate Storyline</p><p><strong>Good to have skills:</strong> Whatfix, WalkMe, ADDIE model</p><p><strong>Experience:</strong> Minimum 3-5 year(s) of experience is required</p><p><strong>Educational Qualification:</strong> Any Bachelors Fulltime</p><p><strong>Priority Skill:</strong> Instructional Design</p><h4>Job Summary</h4><p>As a Talent &amp; Organization (T&amp;O) professional in the S&amp;C Global Network, you'll help clients across a variety of industries in the areas of Learning Design and Development, Change Management and HR Transformation. You'll use your expertise to develop exciting new learning strategies and solutions. You'll help clients manage organizational change and smooth the transition process. Essentially, you'll be part of the team that is creating the workforce of the future!</p><h4>Roles &amp; Responsibilities</h4><ul><li>Support team/project through various phases of learning design and development based on the identified business problem, audience profile, and evaluation methodology.</li><li>Help develop standards and templates for the proposed learning solution.</li><li>Create effective training materials mapping the client's needs using learning modalities such as Instructor-led training, Web-based training, virtual Instructor-led training, simulations, videos, interactive learning nuggets, and performance support materials.</li><li>Collaborate with stakeholders such as Subject Matter Experts, team leads, media and technology teams to support iterations to the learning material for improved business outcomes.</li><li>Creatively visualize the content and work with the visual design team to convey the course content/key messages impactfully.</li><li>Write impactful storyboards by understanding the raw content and repurposing it based on audience, content, modality, and other considerations.</li><li>Perform quality checks on the training deliverables to meet the standard quality benchmarks.</li></ul><h4>Bring your best skills forward to excel in the role</h4><ul><li>Proficiency in content development and instructional design, research and information gathering, content analysis, and knowledge of latest trends in the learning industry.</li><li>Understanding of industry standard design/rapid authoring tools such as Articulate, Captivate, Lectora, Camtasia, SAP Enable Now, and WalkMe and comfort with client proprietary authoring tools. An ideal candidate should be well-versed with the technical functionalities and limitations of these tools.</li><li>Work in a problem-solving global environment with cross cultural competence.</li><li>Possess excellent interpersonal and writing skills with a strong business acumen.</li></ul><h4>Professional &amp; Technical Skills</h4><ul><li>Graduate/Post Graduate in any specialization, preferably Journalism, Mass Communication, English Literature, Advertising, or Public Relations.</li><li>Desired work experience: 3-5 years in instructional design and content development with an understanding of training and design strategy.</li><li>Adept at gathering and understanding source content to create engaging courses based on the target audience.</li><li>Experience in applying proven learning methodologies and emerging technologies for adult learning.</li></ul><h4>Job Details</h4><ul><li>Job Requisition ID: R00287068</li><li>Location: Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai</li><li>Posting Date: 15/05/2026</li><li>Job Family: Management Consulting Delivery</li><li>Time Type: Full time</li><li>Job Type: Regular</li><li>Supervisory Organization: Talent Development &amp; Learning (Aman Kalra)</li></ul>$$,
  'Accenture',
  'Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai',
  'accenture_curated',
  'internal://lxd-guild/jobs/featured-r00287068',
  'R00287068',
  'instructional design',
  'onsite',
  'full_time',
  'standard',
  true,
  timezone('utc'::text, now()),
  TIMESTAMPTZ '2026-05-15 00:00:00+05:30',
  TIMESTAMPTZ '2026-08-31 23:59:59+05:30',
  1
),
(
  'Instructional Design - Associate Manager - T&O- (S&C GN)',
  $$<p><strong>Job Title:</strong> Instructional Design - Associate Manager - T&amp;O- (S&amp;C GN)</p><p><strong>Management Level:</strong> 8 - Associate Manager</p><p><strong>Location:</strong> Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai</p><p><strong>Must have skills:</strong> Instructional Design OR Storyboarding OR Articulate Storyline</p><p><strong>Good to have skills:</strong> Whatfix, WalkMe, ADDIE model</p><p><strong>Experience:</strong> Minimum 8 to 10 year(s) of experience is required</p><p><strong>Educational Qualification:</strong> Any Bachelors Fulltime</p><p><strong>Priority Skill:</strong> Instructional Design</p><h4>Job Summary</h4><p>As a Talent &amp; Organization (T&amp;O) professional in the S&amp;C Global Network, you'll help clients across a variety of industries in the areas of Learning Design and Development, Change Management and HR Transformation. You'll use your expertise to develop exciting new learning strategies and solutions. You'll help clients manage organizational change and smooth the transition process. Essentially, you'll be part of the team that is creating the workforce of the future!</p><h4>Roles &amp; Responsibilities</h4><ul><li>Together with the Functional Manager and Subject Matter Experts, understand the business problem, target audiences, learning needs, and develop learning and change objectives to implement in the proposed learning solution.</li><li>Effectively collaborate with the client team to identify the solution approach and design, and work through the design, development, and delivery phases.</li><li>Understand the overall learning solution design and create effective training materials that map to the client's business needs.</li><li>Support the Functional Manager to develop/identify and take client buy-in on Critical-to-Quality (CTQ) measures for the project such as language style guide, guidelines, checklists, templates, and branding guidelines based on project requirements.</li><li>Conduct Training Need Analysis (TNA) and develop the training curriculum.</li><li>Develop high-level and detailed content outlines as per the curriculum.</li><li>Design and create standards, guidelines, templates, and checklists for the proposed learning solution.</li><li>Develop and review training deliverables as per the agreed upon quality standards and ensure that deliverable quality is as per the project quality parameters and industry standards.</li><li>Provide team members clear and effective feedback based on your reviews with the intent to develop their instructional design skills.</li><li>Collaborate with different internal and client stakeholders to design and develop relevant and effective training deliverables.</li><li>Ensure that the project meets all productivity targets as per the project plans.</li><li>Identify and share risks with the Project Leads/Functional Manager to discuss possible solutions, mitigations, and alternatives.</li><li>Contribute to users/client organization through the learning process.</li><li>Brief and coach instructional designers and content developers to prepare materials for Instructor Development Workshops and Train the Trainers.</li><li>Identify opportunities to implement new and innovative learning strategies into the solution.</li></ul><h4>Professional &amp; Technical Skills</h4><ul><li>Education: Graduate/Post Graduate preferable with background in HR/Learning.</li><li>Professional Background - Desirable - MA/Diploma in Instructional Design or MA in Learning Sciences, MBA.</li><li>8+ years of proven experience in content development and instructional designing.</li><li>Extensive experience in developing, reviewing and delivering different training modalities like Instructor-Led Trainings (ILTs), Web-Based Trainings (WBTs), application simulations, job aids, and quick reference guides.</li><li>Experience in working with global teams.</li><li>Experience in leading and coaching small teams independently.</li></ul><h4>Job Details</h4><ul><li>Job Requisition ID: R00287065</li><li>Location: Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai</li><li>Posting Date: 15/05/2026</li><li>Job Family: Management Consulting Delivery</li><li>Time Type: Full time</li><li>Job Type: Regular</li><li>Supervisory Organization: Talent Development &amp; Learning (Aman Kalra)</li></ul>$$,
  'Accenture',
  'Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai',
  'accenture_curated',
  'internal://lxd-guild/jobs/featured-r00287065',
  'R00287065',
  'instructional design',
  'onsite',
  'full_time',
  'standard',
  true,
  timezone('utc'::text, now()),
  TIMESTAMPTZ '2026-05-15 00:00:00+05:30',
  TIMESTAMPTZ '2026-08-31 23:59:59+05:30',
  2
),
(
  'Instructional Design - Senior Manager - T&O- (S&C GN)',
  $$<p><strong>Job Title:</strong> Instructional Design - Senior Manager - T&amp;O- (S&amp;C GN)</p><p><strong>Management Level:</strong> 6 - Senior Manager</p><p><strong>Location:</strong> Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai</p><p><strong>Must have skills:</strong> AI-enabled talent solutions; talent and learning strategy design; stakeholder management; solutioning; project management; platform transformation adoption</p><p><strong>Good to have skills:</strong> Change Management, Talent Management Thought Leadership, Learning Technology, Prompt Engineering and AI Agent Design, Digital HR Literacy, Industry/Domain specialization</p><p><strong>Experience:</strong> Minimum 15 year(s) of relevant experience is required</p><p><strong>Educational Qualification:</strong> Any Bachelor's Degree Fulltime</p><p><strong>Priority Skill:</strong> Instructional Design</p><h4>Job Summary</h4><p>As a Talent &amp; Organization (T&amp;O) professional in the S&amp;C Global Network, you'll partner with clients across industries to shape workforce strategies, enable AI-driven transformation, and deliver innovative talent solutions. You'll help organizations navigate change, optimize talent ecosystems, and build capabilities that define the future of work. This role is at the intersection of strategy, technology, and human potential helping clients unlock agility, embed intelligent solutions, and build future-ready capabilities. If you're passionate about driving innovation and creating talent ecosystems that thrive in the age of AI, this is your opportunity to make an impact.</p><h4>Roles &amp; Responsibilities</h4><ul><li>Lead talent development strategy initiatives for large-scale and niche business transformation programs, leveraging AI-enabled tools and insights.</li><li>Design and implement workforce enablement strategies aligned with client business objectives, driving agility, innovation, and measurable impact.</li><li>Collaborate with senior leadership to define talent priorities, identify capability gaps, and co-create AI-powered solutions for workforce optimization.</li><li>Partner with clients to design and implement workforce enablement strategies aligned with client business objectives, driving agility, innovation, and measurable impact.</li><li>Oversee project delivery, ensuring scope, budget, timelines, quality, and risk management are effectively handled; monitor impact and recommend data-driven enhancements.</li><li>Demonstrate strong stakeholder management across internal and external networks, influencing decisions and fostering collaboration.</li><li>Drive AI adoption in talent processes to enhance workforce effectiveness.</li><li>Manage multiple talent development programs for global clients across the portfolio, ensuring alignment with strategic goals and organizational resilience.</li><li>Support practice leadership in building high-performing, future-ready teams, ensuring resources and capabilities are in place.</li><li>Lead business development efforts by shaping proposals, cultivating client relationships, and positioning AI-enabled talent solutions as differentiators.</li><li>Champion organizational initiatives that promote adaptability and agility, aligning with evolving market and technology trends.</li><li>Be recognized as a thought leader in talent strategy and AI-driven transformation, bringing fresh perspectives and expertise in emerging technologies.</li></ul><h4>Preferred Skills &amp; Experience</h4><ul><li>Strong foundation in Talent Strategy, Workforce Transformation, and Organizational Effectiveness, with exposure to AI-powered tools and analytics.</li><li>Expertise in Human Performance Optimization, Instructional Design, and Capability Development, with a focus on driving measurable business outcomes.</li><li>Familiarity with Operating Models and Continuous Improvement frameworks, such as Agile, Lean, and Six Sigma.</li><li>Experience in building agile, data-driven talent ecosystems and leveraging technology to enhance workforce performance.</li><li>Proven ability to operate in global, complex environments, collaborating across cultures and geographies to deliver scalable solutions.</li></ul><h4>Desirable Professional Background</h4><ul><li>MA/Diploma in Instructional Design or MA in Learning Sciences, Cognitive Science, MBA, PMP certification.</li><li>15+ years of expertise in talent development strategy, workforce transformation, and technology-enabled solutions, driving measurable business impact.</li><li>8+ years of proven leadership in managing large, diverse teams and delivering talent and performance management programs for global clients aligned with growth objectives in complex, matrixed environments.</li><li>Strong background in consulting and advisory roles, shaping scalable talent solutions and embedding AI-powered insights into decision-making.</li><li>Deep understanding of human performance optimization, competency frameworks, and capability development, with experience in designing agile, future-ready learning programs.</li><li>Collaborative experience in change management, talent strategy, and organizational effectiveness, leveraging data-driven approaches.</li><li>Demonstrated success in building strategic business relationships, identifying opportunities, and driving business development through innovative talent strategies.</li><li>Experience in digital and technology transformation adoption programs, leadership development, and behavioral capability building at scale.</li><li>Proven ability to lead agile programs in fast-paced environments, ensuring adaptability and responsiveness to evolving business needs.</li><li>Strong track record in solution design and consulting, including proposal development, financial modeling, and client presentations.</li><li>Exposure to advanced technologies and analytics for talent optimization, including innovative applications of digital platforms and intelligent automation.</li><li>Excellent interpersonal skills with Business leaders, team members, and vendors.</li><li>Empathetic leader with expert communication, mediation, influencing, and coaching skills.</li></ul><h4>Professional &amp; Technical Skills</h4><ul><li>Education: Graduate/Post Graduate.</li><li>Proven experience in designing and delivering innovative talent transformation strategies for global clients.</li></ul><h4>Job Details</h4><ul><li>Job Requisition ID: R00287060</li><li>Location: Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai</li><li>Posting Date: 15/05/2026</li><li>Job Family: Management Consulting Delivery</li><li>Time Type: Full time</li><li>Job Type: Regular</li><li>Supervisory Organization: Talent Development &amp; Learning (Aman Kalra)</li></ul>$$,
  'Accenture',
  'Gurugram, Bangalore, Mumbai, Pune, Hyderabad, Kolkata and Chennai',
  'accenture_curated',
  'internal://lxd-guild/jobs/featured-r00287060',
  'R00287060',
  'instructional design',
  'onsite',
  'full_time',
  'standard',
  true,
  timezone('utc'::text, now()),
  TIMESTAMPTZ '2026-05-15 00:00:00+05:30',
  TIMESTAMPTZ '2026-08-31 23:59:59+05:30',
  3
)
ON CONFLICT (apply_url) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  company = EXCLUDED.company,
  location = EXCLUDED.location,
  source = EXCLUDED.source,
  source_job_id = EXCLUDED.source_job_id,
  search_keyword = EXCLUDED.search_keyword,
  work_mode = EXCLUDED.work_mode,
  employment_type = EXCLUDED.employment_type,
  job_kind = EXCLUDED.job_kind,
  is_active = EXCLUDED.is_active,
  imported_at = EXCLUDED.imported_at,
  external_posted_at = EXCLUDED.external_posted_at,
  expires_at = EXCLUDED.expires_at,
  featured_rank = EXCLUDED.featured_rank;
