import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADZUNA_APP_ID = typeof Deno !== 'undefined' ? Deno.env.get('ADZUNA_APP_ID') || '38c5d4ef' : '';
const ADZUNA_APP_KEY = typeof Deno !== 'undefined' ? Deno.env.get('ADZUNA_APP_KEY') || '456857cd33fb800c9e17dfc068c108b5' : '';
const supabaseUrl = typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_URL')! : '';
const supabaseServiceKey = typeof Deno !== 'undefined' ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! : '';

const keywords = ['Instructional', 'eLearning'];
const country = 'in'; // or map array similar to jooble

serve(async (req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let imported = 0;

    for (const keyword of keywords) {
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(keyword)}&results_per_page=50`;
      
      const resp = await fetch(adzunaUrl);
      if (!resp.ok) {
        console.error('Adzuna API Error', await resp.text());
        continue;
      }

      const data = await resp.json();
      const jobs = data.results || [];

      for (const job of jobs) {
        const title = job.title || '';
        const applyUrl = job.redirect_url || '';
        const company = job.company?.display_name || 'Unknown';
        const jobLocation = job.location?.display_name || 'Remote';
        const desc = job.description || '';

        if (!title || !applyUrl) continue;

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
            source: 'adzuna',
            apply_url: applyUrl
          });
          imported++;
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
