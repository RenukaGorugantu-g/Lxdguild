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
    envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY // Try anon if service role not found
);

async function check() {
    try {
        const { data, count, error } = await supabase.from('jobs').select('*', { count: 'exact' });
        console.log('JOB_COUNT:', count || data?.length || 0);
        if (error) console.error('Error fetching count:', error);
        console.log('SAMPLES:', JSON.stringify(data?.slice(0, 3) || []));
    } catch (e) {
        console.error('Script failed:', e);
    }
}

check();
