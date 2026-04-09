
const JOOBLE_API_KEY = 'efe3267d-0fb5-4d3c-b261-ec8806aa97f0';
const keyword = 'instructional designer';

async function testJooble() {
  console.log(`Fetching from Jooble for ${keyword}...`);
  try {
    const resp = await fetch(`https://jooble.org/api/${JOOBLE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: keyword, location: 'India', resultsPerPage: 5 })
    });
    if (resp.ok) {
      const data = await resp.json();
      console.log(`Found ${data.jobs?.length || 0} jobs`);
      if (data.jobs && data.jobs.length > 0) {
        console.log(`First job: ${data.jobs[0].title} at ${data.jobs[0].company}`);
      }
    } else {
      console.error(`Jooble API Error: ${resp.status} - ${await resp.text()}`);
    }
  } catch (err) {
    console.error(`Fetch error: ${err.message}`);
  }
}

testJooble();
