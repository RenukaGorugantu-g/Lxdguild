import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JOOBLE_API_KEY = typeof Deno !== 'undefined' ? Deno.env.get('JOOBLE_API_KEY') || 'efe3267d-0fb5-4d3c-b261-ec8806aa97f0' : '';
const supabaseUrl = typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL')! : '';
const supabaseServiceKey = typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! : '';

const keywords = ['elearning developer', 'course developer', 'curriculum developer', 'instructional designer'];
const locations = ['India', 'USA', 'UK'];

serve(async (req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let imported = 0;

    for (const keyword of keywords) {
      for (const location of locations) {
        let page = 1;
        let hasJobs = true;

        while (hasJobs && page <= 2) { // cap at 2 pages for testing/performance
          const joobleUrl = "https://jooble.org/api/" + JOOBLE_API_KEY;
          const body = JSON.stringify({
            keywords: keyword,
            location: location,
            page: page,
            resultsPerPage: 50
          });

          const resp = await fetch(joobleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body
          });

          if (!resp.ok) {
            console.error('Jooble API Error', await resp.text());
            break;
          }

          const data = await resp.json();
          const jobs = data.jobs || [];
          
          if (jobs.length === 0) {
            hasJobs = false;
            continue;
          }

          for (const job of jobs) {
             const title = job.title || '';
             const applyUrl = job.link || '';
             const company = job.company || 'Unknown';
             const jobLocation = job.location || location;
             const desc = job.snippet || '';

             // check duplicates
             const { data: existing } = await supabase
               .from('jobs')
               .select('id')
               .eq('apply_url', applyUrl)
               .single();

             if (!existing) {
               await supabase.from('jobs').insert({
                 title,
                 description: desc,
                 company,
                 location: jobLocation,
                 source: 'jooble',
                 apply_url: applyUrl
               });
               imported++;
             }
          }
          page++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, imported }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
