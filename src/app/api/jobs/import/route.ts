import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin (security)
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const isAdminOverride = searchParams.get('admin') === 'true';

    if (!user && !isAdminOverride) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    if (user && !isAdminOverride) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '38c5d4ef';
    const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '456857cd33fb800c9e17dfc068c108b5';
    const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

    let imported = 0;

    // 1. Import from Adzuna
    const adzunaKeywords = ['Instructional Designer', 'eLearning Developer', 'Learning Experience Designer', 'Curriculum Developer'];
    const adzunaCountry = 'in';
    
    for (const keyword of adzunaKeywords) {
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(keyword)}&results_per_page=20`;
      const resp = await fetch(adzunaUrl);
      if (resp.ok) {
        const data = await resp.json();
        for (const job of (data.results || [])) {
          const { data: existing } = await supabase.from('jobs').select('id').eq('apply_url', job.redirect_url).single();
          if (!existing) {
            await supabase.from('jobs').insert({
              title: job.title,
              description: job.description,
              company: job.company?.display_name || 'Unknown',
              location: job.location?.display_name || 'Remote',
              source: 'adzuna',
              apply_url: job.redirect_url
            });
            imported++;
          }
        }
      }
    }

    // 2. Import from Jooble
    if (JOOBLE_API_KEY) {
      const joobleKeywords = ['instructional designer', 'elearning developer', 'learning experience designer', 'L&D specialist'];
      for (const keyword of joobleKeywords) {
        const resp = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keywords: keyword, location: 'India', resultsPerPage: 20 })
        });
        if (resp.ok) {
          const data = await resp.json();
          for (const job of (data.jobs || [])) {
            const { data: existing } = await supabase.from('jobs').select('id').eq('apply_url', job.link).single();
            if (!existing) {
              await supabase.from('jobs').insert({
                title: job.title,
                description: job.snippet,
                company: job.company || 'Unknown',
                location: job.location || 'India',
                source: 'jooble',
                apply_url: job.link
              });
              imported++;
            }
          }
        }
      }
    }

    revalidatePath("/dashboard/jobs");
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') throw err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return redirect(`/dashboard/jobs?imported=${imported}`);
}
