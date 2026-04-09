
const ADZUNA_APP_ID = '38c5d4ef';
const ADZUNA_APP_KEY = '456857cd33fb800c9e17dfc068c108b5';
const adzunaKeywords = ['Instructional Designer', 'eLearning Developer'];
const adzunaCountry = 'in';

async function testFetch() {
  for (const keyword of adzunaKeywords) {
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&what=${encodeURIComponent(keyword)}&results_per_page=5`;
    console.log(`Fetching from Adzuna for ${keyword}...`);
    try {
      const resp = await fetch(adzunaUrl);
      if (resp.ok) {
        const data = await resp.json();
        console.log(`Found ${data.results?.length || 0} jobs for ${keyword}`);
        if (data.results && data.results.length > 0) {
          console.log(`First job: ${data.results[0].title} at ${data.results[0].company?.display_name}`);
        }
      } else {
        console.error(`Adzuna API Error: ${resp.status} - ${await resp.text()}`);
      }
    } catch (err) {
      console.error(`Fetch error: ${err.message}`);
    }
  }
}

testFetch();
