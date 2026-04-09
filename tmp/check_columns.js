
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cnufvsfzbjibcaydvacj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudWZ2c2Z6YmppYmNheWR2YWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NzU4NiwiZXhwIjoyMDkxMDQzNTg2fQ.7D5eqT5SnVEjpG0J1EbsLMCxGfNhw-khC3CfmZ3BPnQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase
    .from("profiles")
    .select("headline, bio, location, skills, experience_years")
    .limit(1);
  
  if (error) {
    console.log("ERROR - columns likely missing:", error.message);
    console.log("\nPlease run this SQL in your Supabase Dashboard > SQL Editor:");
    console.log(`
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS headline TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS experience_years NUMERIC(4,1);

ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS file_name TEXT;

ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS resume_id UUID;
    `.trim());
  } else {
    console.log("SUCCESS - all profile columns exist!");
    console.log("Data:", data);
  }
}

checkColumns().catch(console.error);
