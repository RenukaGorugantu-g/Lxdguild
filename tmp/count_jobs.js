
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://cnufvsfzbjibcaydvacj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudWZ2c2Z6YmppYmNheWR2YWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0Njc1ODYsImV4cCI6MjA5MTA0MzU4Nn0.Q-YuZWvUr_e3DVGstFtE-vP9yyMgFwlWQjVpw9yHzUQ";
const supabase = createClient(supabaseUrl, supabaseKey);
async function count() {
  const { count, error } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  if (error) console.error(error);
  else console.log("Total jobs:", count);
}
count();
