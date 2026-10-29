// migrate_to_cmsys_v2.js
// Migrates data from legacy endpoints (cmsys-projects, cmsys-v2-1fb05) into cmsys-v2 target

const https = require('https');

const TARGET_DB = 'https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app';
const PROJECTS_DB = 'https://cmsys-projects-default-rtdb.asia-southeast1.firebasedatabase.app';
const LOGISTICS_DB = 'https://cmsys-v2-1fb05-default-rtdb.asia-southeast1.firebasedatabase.app';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            resolve({ error: `HTTP ${res.statusCode}: ${data}` });
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          resolve({ error: e.message, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function httpPut(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: body.slice(0, 100) });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== CMSYS-V2 FIREBASE CONSOLIDATION RUNNER ===\n');

  // 1. Projects Data from cmsys-projects
  const projectCollections = ['naval_projects', 'procurement_files', 'special_projects', 'special_project_attachments'];
  for (const col of projectCollections) {
    console.log(`Fetching '${col}' from cmsys-projects...`);
    const data = await httpGet(`${PROJECTS_DB}/${col}.json`);
    if (data && !data.error) {
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      console.log(`  Fetched ${count} items. Writing to cmsys-v2/${col}.json...`);
      const res = await httpPut(`${TARGET_DB}/${col}.json`, data);
      console.log(`  Target response: HTTP ${res.statusCode}`);
    } else {
      console.log(`  Could not fetch ${col}:`, data?.error || 'empty');
    }
  }

  // 2. Logistics Data from cmsys-v2-1fb05
  console.log('\nFetching logistics from cmsys-v2-1fb05...');
  const logData = await httpGet(`${LOGISTICS_DB}/logistics.json`);
  if (logData && !logData.error) {
    console.log(`  Fetched logistics sub-nodes: ${Object.keys(logData).join(', ')}. Writing to cmsys-v2/logistics.json...`);
    const res = await httpPut(`${TARGET_DB}/logistics.json`, logData);
    console.log(`  Target response: HTTP ${res.statusCode}`);
  } else {
    console.log('  Could not fetch logistics:', logData?.error);
  }

  // 3. Document Templates & Rules from CMSys Documents if needed
  console.log('\nChecking naval letters / minute templates in cmsys-v2...');
  const letterCheck = await httpGet(`${TARGET_DB}/naval_letters.json?shallow=true`);
  console.log('  naval_letters in cmsys-v2:', letterCheck);

  console.log('\n=== MIGRATION COMPLETE ===');
}

run().catch(console.error);
