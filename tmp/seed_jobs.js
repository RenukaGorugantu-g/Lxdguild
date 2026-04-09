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

// Use service role key to bypass RLS for seeding if needed, or anon if safe
const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL, 
    envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function seed() {
    const demoJobs = [
        {
            title: "Senior Instructional Designer",
            company: "TechLearn Global",
            description: "We are looking for a Senior ID to lead our enterprise learning strategy. Experience with ADDIE, SAM, and Articulate Storyline 360 is required.",
            location: "Remote (USA/India)",
            source: "LXD Guild",
            apply_url: "https://example.com/apply/senior-id"
        },
        {
            title: "eLearning Developer (Contract)",
            company: "Creative Media Studio",
            description: "Build interactive modules from existing storyboards. Proficiency in Adobe Captivate and Javascript for custom triggers is a plus.",
            location: "Mumbai, India",
            source: "LXD Guild",
            apply_url: "https://example.com/apply/elearning-dev"
        },
        {
            title: "Learning Experience Designer",
            company: "HealthCore Systems",
            description: "Design patient-facing education materials. Focus on accessibility and mobile-first learning experiences.",
            location: "Remote",
            source: "LXD Guild",
            apply_url: "https://example.com/apply/lxd-health"
        }
    ];

    console.log("Seeding demo jobs...");
    for (const job of demoJobs) {
        const { error } = await supabase.from('jobs').insert(job);
        if (error) {
            console.error(`Error inserting ${job.title}:`, error.message);
        } else {
            console.log(`Successfully added: ${job.title}`);
        }
    }
    console.log("Seeding complete.");
}

seed();
