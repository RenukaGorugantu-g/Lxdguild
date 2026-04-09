const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envText.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL, 
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function importJobs() {
    const ADZUNA_APP_ID = envVars.ADZUNA_APP_ID || '38c5d4ef';
    const ADZUNA_APP_KEY = envVars.ADZUNA_APP_KEY || '456857cd33fb800c9e17dfc068c108b5';
    const JOOBLE_API_KEY = envVars.JOOBLE_API_KEY;

    const keywords = ['Instructional Designer', 'eLearning Developer', 'Learning Experience Designer', 'Curriculum Developer', 'L&D specialist'];
    let totalImported = 0;

    console.log("Starting Bulk Import...");

    // 1. Adzuna
    console.log("Fetching from Adzuna...");
    for (const kw of keywords) {
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(kw)}&results_per_page=20`;
        try {
            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                for (const job of (data.results || [])) {
                    const { error } = await supabase.from('jobs').insert({
                        title: job.title,
                        description: job.description,
                        company: job.company?.display_name || 'Unknown',
                        location: job.location?.display_name || 'Remote',
                        source: 'adzuna',
                        apply_url: job.redirect_url
                    });
                    if (!error) totalImported++;
                }
            }
        } catch (e) {
            console.error(`Adzuna error for ${kw}:`, e.message);
        }
    }

    // 2. Jooble
    if (JOOBLE_API_KEY) {
        console.log("Fetching from Jooble...");
        for (const kw of keywords) {
            try {
                const resp = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keywords: kw, location: 'India', resultsPerPage: 20 })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    for (const job of (data.jobs || [])) {
                        const { error } = await supabase.from('jobs').insert({
                            title: job.title,
                            description: job.snippet,
                            company: job.company || 'Unknown',
                            location: job.location || 'India',
                            source: 'jooble',
                            apply_url: job.link
                        });
                        if (!error) totalImported++;
                    }
                }
            } catch (e) {
                console.error(`Jooble error for ${kw}:`, e.message);
            }
        }
    }

    console.log(`Import finished! Total new jobs added: ${totalImported}`);
}

importJobs();
