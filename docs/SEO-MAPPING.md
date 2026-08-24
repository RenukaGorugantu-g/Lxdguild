# LXD Marketplace SEO Map

This document maps the existing public routes to one primary intent. Query-filtered job URLs remain canonicalized to `/jobs` and noindexed; they are navigation states, not separate landing pages.

| Page | Primary keyword | Secondary keywords | Search intent | Current opportunity | Recommended title | Recommended H1 | H2 topics |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | LXD Marketplace | Learning Experience Design, Learning Experience Designer, Instructional Designer, Instructional Design, L&D professionals, eLearning professionals, eLearning developers, L&D jobs | Marketplace discovery | Strong content and live jobs; reinforce the marketplace identity and role pathways | LXD Marketplace | LXD Marketplace for your next L&D job or hire | How the L&D marketplace works; Featured L&D roles; For instructional designers and eLearning developers; For employers hiring L&D talent |
| `/jobs` | L&D jobs | Instructional Design jobs, Instructional Designer jobs, Learning Experience Design jobs, LXD jobs, eLearning jobs, Learning Designer jobs, LMS jobs, Learning Technology jobs, remote L&D jobs | Job search | Real job inventory supports this page; filtered URLs should stay consolidated | L&D Jobs in India \| Instructional Design, LXD & eLearning Roles | L&D jobs in India for instructional designers, eLearning developers, and learning teams | Explore L&D job searches; Featured L&D roles; Latest L&D job openings; How to get discovered |
| `/jobs/[slug]` | Job-specific query | Job title, company, location, employment type, skills, L&D jobs | Apply or evaluate a role | Strong dynamic metadata and JobPosting schema; add skills only when real job data exists | `{job title} at {company} \| L&D Jobs India` | `{job title}` | Job description; Role snapshot; Why apply with LXD Guild; Related L&D opportunities |
| `/candidate` | Learning Experience Designer | Instructional Designer, eLearning Developer, Learning Designer, L&D professional, LXD professional, L&D careers, Instructional Design careers, LXD careers, eLearning careers, L&D jobs | Career development and profile creation | Strong tools and FAQ content; connect profile creation directly to jobs and membership | Instructional Designer Career Growth \| AI Tools & Job Matching | Accelerate your instructional design career with AI-powered tools | Build your L&D professional profile; Validate instructional design skills; Discover L&D jobs; Learning design career paths |
| `/employer` | Hire Instructional Designer | Hire Learning Experience Designer, hire eLearning Developer, hire Learning Designer, hire L&D professionals, find L&D talent, L&D talent marketplace, Instructional Design talent, eLearning talent | Commercial hiring | Strong hiring workflow; make role-specific hiring language and job discovery more prominent | Hire Verified Instructional Designers & L&D Talent \| India | Hire verified instructional designers and L&D professionals in India | Find L&D talent; Evaluate Instructional Design talent; Hire eLearning talent; Employer workflow |
| `/membership` | LXD Marketplace membership | L&D professional membership, Learning Experience Design community, Instructional Design community, L&D resources, LXD resources, professional L&D network | Membership evaluation | Substantial benefits and resources exist; avoid promising indexable resource pages until public content exists | L&D Membership: AI Tools & 180+ Premium Resources \| INR 499/Year | Premium L&D Membership: AI Tools, Resources & Networking | L&D professional network; L&D resources; LXD resources; Community and career tools |
| `/contact` | Contact LXD Guild | L&D marketplace support, hiring partnerships, membership support | Support, partnership, commercial inquiry | Correctly canonicalized; limited search value and should remain a utility page | Contact \| LXD Guild | Contact LXD Guild | Hiring support; Partnerships; Membership and product support |

## Technical audit

### Fixed in this pass

- Homepage, candidate, employer, and membership structured-data URLs now use `getSiteUrl()` so metadata, sitemap, canonical URLs, and JSON-LD agree across environments.
- Added a custom root 404 with links to the homepage, L&D jobs, and contact support.
- Homepage live job cards now link to canonical public job detail pages for anonymous visitors; registration remains part of the application flow.
- Added visible internal links between jobs, candidate, employer, and membership surfaces.
- Removed anonymous footer links to dashboard-only destinations that were crawlable but not useful public landing pages.
- Added visible job search links for L&D, Instructional Design, LXD, eLearning, LMS, Learning Technology, and remote searches. These remain consolidated query states.

### Verified or intentionally retained

- Public job detail pages use dynamic titles, descriptions, canonical URLs, permanent redirects for stale slugs, `notFound()` for invalid jobs, and `JobPosting` JSON-LD.
- Filtered `/jobs` query URLs canonicalize to `/jobs` and use `noindex, follow`.
- `public/robots.txt` allows public pages, blocks APIs and dashboard areas, and declares the production sitemap.
- `src/app/sitemap.ts` includes the public static pages and real public job detail URLs.
- Auth and dashboard routes are noindexed and are not candidate profile landing pages.
- No public candidate profile route currently exists. Empty or private profiles are therefore not exposed to search engines.
- Public image alt text is present on the inspected marketing pages. The homepage video wall would benefit from captions or a transcript for accessibility and content understanding.

### Remaining technical checks

- Run Search Console URL inspection after deployment to confirm canonical and sitemap host behavior in production.
- Measure Core Web Vitals with field data. The homepage video wall and external video assets are the main performance risk; defer, compress, or provide lighter poster assets if LCP or INP is weak.
- Audit external links and imported job descriptions periodically. Only real, active jobs should remain in the sitemap and JobPosting schema.
- Add breadcrumbs to jobs, employer, membership, and contact JSON-LD only if the site benefits from that hierarchy; this is optional and not a substitute for useful page content.

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
