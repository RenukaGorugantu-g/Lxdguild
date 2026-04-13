import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cnufvsfzbjibcaydvacj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudWZ2c2Z6YmppYmNheWR2YWNqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ2NzU4NiwiZXhwIjoyMDkxMDQzNTg2fQ.7D5eqT5SnVEjpG0J1EbsLMCxGfNhw-khC3CfmZ3BPnQ";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobsUserId() {
  console.log("Checking remote jobs table for jobs.user_id...");

  const { data, error } = await supabase.from("jobs").select("id,user_id").limit(1);

  if (error) {
    console.log("ERROR:", error.message);
    if (error.message.includes("column \"user_id\" does not exist") || error.message.includes("user_id")) {
      console.log("\nThe jobs.user_id column is missing from the database schema.");
      console.log("Run the following SQL in Supabase SQL Editor:");
      console.log(`\nALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;\n`);
      console.log("Then refresh the schema cache / restart the app.");
      return;
    }
    console.log("If this is not a user_id error, verify your Supabase credentials and network connectivity.");
    return;
  }

  console.log("SUCCESS: jobs.user_id exists.");
  console.log("Sample row:", JSON.stringify(data, null, 2));
}

checkJobsUserId().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
