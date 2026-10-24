# LXD Marketplace SEO Map

This document maps the existing public routes to one primary intent. Query-filtered job URLs remain canonicalized to `/jobs` and noindexed; they are navigation states, not separate landing pages.

| Page | Primary query intent | Supporting language (use naturally) | Search intent | Current opportunity | Implemented title | Implemented H1 | H2 topics |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | L&D jobs and instructional design talent in India | Instructional design, eLearning, L&D hiring | Marketplace discovery | Connect candidates and employers with clear pathways to live jobs and registration | L&D Jobs & Instructional Design Talent in India \| LXD Guild | L&D jobs and instructional design talent in India. | How the marketplace works; Featured jobs; For candidates; For employers |
| `/jobs` | Instructional designer jobs in India | eLearning developer roles, L&D jobs, work arrangements shown in live listings | Job search | Prioritize live inventory and usable filters; keep query-filtered URLs consolidated | Instructional Designer Jobs in India \| eLearning & L&D \| LXD Guild | Instructional Designer & L&D Jobs in India | Search roles; Featured jobs; Latest openings; Candidate resources |
| `/jobs/{role}` | Role-specific job search | Instructional Designer, eLearning Developer, LXD, Learning Designer, L&D Manager, curriculum, LMS, remote L&D | Job search | Index only when at least three live, matching job listings exist | `{role} Jobs in India` | `{role} Jobs in India` | Current openings; role-specific search guidance; city searches; related roles |
| `/jobs/{role}/{location}` | City + role job search | Hyderabad, Bengaluru, Pune, Mumbai, Delhi | Local job search | Curated role/city combinations are noindexed and excluded from the sitemap until at least three live matches exist | `{role} Jobs in {city}` | `{role} Jobs in {city}` | Current city openings; location context; related roles |
| `/jobs/[slug]` | Job-specific query | Job title, company, location, employment type, skills, L&D jobs | Apply or evaluate a role | Canonical active-job pages carry matching JobPosting schema; expired listings remain useful but are noindexed and lose JobPosting schema | `{job title} at {company} \| {location}` | `{job title}` | Job description; Role snapshot; Why apply with LXD Guild; Related L&D opportunities |
| `/candidate` | Instructional design career tools | Resume-to-job comparison, eLearning and L&D opportunities | Career development and registration | Explain useful candidate tools plainly and link them to relevant live jobs | Instructional Designer Career Tools & L&D Jobs \| LXD Guild | Build your instructional design career. | Candidate profile; Resume-to-job analysis; Skill validation; Find jobs |
| `/employer` | Hire instructional designers and L&D talent in India | eLearning developers, learning experience talent, hiring workflow | Commercial hiring | Describe the actual hiring workflow and connect employers to job posting and applicants | Hire Instructional Designers & L&D Talent in India \| LXD Guild | Hire Instructional Designers and L&D Talent in India | Find candidates; Post a role; Review applicants; Employer workflow |
| `/membership` | L&D membership and career resources | Professional resources, assessments, community benefits | Membership evaluation | Describe benefits accurately and avoid unsupported superlatives or resource counts | L&D Membership, Resources & Career Tools \| LXD Guild | Premium L&D Membership: AI Tools, Resources & Networking | Community; Resources; Assessments; Career tools |
| `/contact` | Contact LXD Guild | L&D marketplace support, hiring partnerships, membership support | Support, partnership, commercial inquiry | Correctly canonicalized; limited search value and should remain a utility page | Contact \| LXD Guild | Contact LXD Guild | Hiring support; Partnerships; Membership and product support |

Titles on pages without an absolute title use the root `"%s | LXD Guild"` template. The homepage intentionally supplies an absolute title. Titles and visible copy target distinct user needs; no ranking position or search-volume trend is guaranteed. Validate query opportunities and performance with Search Console and an available keyword-planning source.

## Technical audit

### Fixed in this pass

- Homepage, candidate, employer, and membership structured-data URLs now use `getSiteUrl()` so metadata, sitemap, canonical URLs, and JSON-LD agree across environments.
- Added a custom root 404 with links to the homepage, L&D jobs, and contact support.
- Homepage live job cards now link to canonical public job detail pages for anonymous visitors; registration remains part of the application flow.
- Added visible internal links between jobs, candidate, employer, and membership surfaces.
- Removed anonymous footer links to dashboard-only destinations that were crawlable but not useful public landing pages.
- Added visible job search links for L&D, Instructional Design, LXD, eLearning, LMS, Learning Technology, and remote searches. Curated role and remote links now lead to dedicated pages; filter-only states remain canonicalized and noindexed.
- Added curated role and city/role landing pages, with a minimum of three active matching jobs before indexation and sitemap inclusion.
- Limited `JobPosting` JSON-LD to active individual job pages; job search pages use `ItemList` links rather than embedding job postings.
- Public job listings, featured jobs, role landings, candidate recommendations, and sitemap entries exclude expired jobs. Automatically sourced listings expire from public surfaces no later than 15 days after their posting/import date; employer-posted jobs remain visible until their explicit expiry or deactivation. Expired job URLs redirect to the current job board.
- Feed synchronization retains expired/imported job records in the database; expiration controls public visibility and does not delete stored jobs.
- Added a root `WebSite` search action that points to the public job search.

### Verified or intentionally retained

- Public job detail pages use dynamic titles, descriptions, canonical URLs, permanent redirects for stale slugs, `notFound()` for invalid jobs, and active-only `JobPosting` JSON-LD.
- Filtered `/jobs` query URLs canonicalize to `/jobs` and use `noindex, follow`.
- `public/robots.txt` allows public pages, blocks APIs and dashboard areas, and declares the production sitemap.
- `src/app/sitemap.ts` includes the public static pages, real current public job URLs, and only role/location landing pages that meet the live-job threshold.
- Auth and dashboard routes are noindexed and are not candidate profile landing pages.
- No public candidate profile route currently exists. Empty or private profiles are therefore not exposed to search engines.
- Public image alt text is present on the inspected marketing pages. The homepage video wall would benefit from captions or a transcript for accessibility and content understanding.

### Remaining technical checks

- Run Search Console URL inspection after deployment to confirm canonical and sitemap host behavior in production.
- Measure Core Web Vitals with field data. The homepage video wall and external video assets are the main performance risk; defer, compress, or provide lighter poster assets if LCP or INP is weak.
- Audit external links and imported job descriptions periodically. Only real, active jobs should remain in the sitemap and JobPosting schema.
- Add breadcrumbs to employer, membership, and contact JSON-LD only if the site benefits from that hierarchy; this is optional and not a substitute for useful page content.

## Content gap recommendations

Create these only when each page can contain substantial copy, unique FAQs, useful filters, or real marketplace data:

1. Instructional Designers directory backed by verified, opt-in public profiles.
2. Learning Experience Designers directory backed by verified, opt-in public profiles.
3. eLearning Developers directory backed by verified, opt-in public profiles.
4. Instructional Design Jobs page backed by live jobs and meaningful filtering.
5. LXD Jobs page backed by live jobs and meaningful filtering.
6. eLearning Jobs page backed by live jobs and meaningful filtering.
7. Hire Instructional Designers page with employer workflow, proof, FAQs, and real talent signals.
8. Hire Learning Experience Designers page with distinct hiring guidance and marketplace data.
9. L&D Resources page containing a substantial, publicly accessible resource library.
10. Instructional Design Resources page containing original templates, examples, or expert guidance.

Do not create these routes as keyword-only copies of the current pages. Public profile pages should be indexable only when they contain a complete opt-in profile with a role, meaningful skills or specialization, and enough original information to satisfy a searcher.
