const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;
      const [key, ...rest] = trimmed.split('=');
      env[key] = rest.join('=').trim();
      return env;
    }, {});
}

const envFile = path.resolve(__dirname, '../.env.local');
const localEnv = loadEnvFile(envFile);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://cnufvsfzbjibcaydvacj.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  localEnv.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('ERROR: No Supabase key found. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment or .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Checking remote jobs table for jobs.user_id...');

  const { data, error } = await supabase.from('jobs').select('id,user_id').limit(1);

  if (error) {
    console.error('ERROR:', error.message);

    if (
      error.message.includes('column "user_id" does not exist') ||
      error.message.includes('column jobs.user_id does not exist')
    ) {
      console.log('\nThe jobs.user_id column is missing from the database schema.');
      console.log('Run this SQL in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE jobs');
      console.log('  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;');
      console.log('');
      console.log('Then refresh the schema cache / restart the app.');
      return;
    }

    if (error.message.includes('permission denied') || error.message.includes('Invalid API key')) {
      console.log('Use a SUPABASE_SERVICE_ROLE_KEY for schema checks, not an anon key.');
      return;
    }

    console.log('Unable to determine schema status from this query.');
    return;
  }

  console.log('SUCCESS: jobs.user_id appears to exist.');
  console.log('Sample row:', JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error('Unexpected error:', err.message || err);
  process.exit(1);
});