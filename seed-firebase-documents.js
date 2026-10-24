/**
 * Sri Lanka Navy — CMSys Documents Firebase Seed & Deployment Script
 * Seeds the complete database topology, initial registry entries, file index,
 * prefixes, minute sheet templates, and Navy BR 7 letter templates to cmsys-documents RTDB.
 */

const https = require('https');

const DB_ENDPOINTS = [
    'https://cmsys-documents-default-rtdb.asia-southeast1.firebasedatabase.app',
    'https://cmsys-documents-default-rtdb.firebaseio.com',
    'https://cmsys-documents.firebaseio.com'
];

function httpRequest(url, method, data) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: body });
            });
        });

        req.on('error', err => resolve({ statusCode: 500, error: err.message }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ statusCode: 408, error: 'Timeout' });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runSeed() {
    console.log("=== Sri Lanka Navy CMSys Documents — Firebase Seeder ===");
    console.log("Targeting Firebase Project: cmsys-documents\n");

    let activeEndpoint = null;
    for (const ep of DB_ENDPOINTS) {
        process.stdout.write(`Testing endpoint: ${ep}... `);
        const res = await httpRequest(ep + '/system_status.json', 'GET');
        console.log(`HTTP ${res.statusCode}`);
        if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404) {
            if (res.statusCode !== 404) {
                activeEndpoint = ep;
                break;
            }
        }
    }

    if (!activeEndpoint) {
        console.log("\n[Notice] Realtime Database has not been initialized yet in Firebase Console for cmsys-documents.");
        console.log("Please create Realtime Database at: https://console.firebase.google.com/u/4/project/cmsys-documents/overview");
        console.log("Select location: 'asia-southeast1' (Singapore) and click 'Create Database'.\n");
        activeEndpoint = DB_ENDPOINTS[0]; // Proceed to attempt write to Asia-Southeast1
    }

    console.log(`\nActive Cloud Target: ${activeEndpoint}`);

    const payload = {
        system_status: {
            system: "Sri Lanka Navy Civil Engineering — CMSys Documents",
            version: "1.0.0",
            status: "online",
            project: "cmsys-documents",
            ecosystem: "CMSys Interconnected Network",
            last_sync: new Date().toISOString()
        },
        registry_prefixes: {
            "pfx_cced_nhq": {
                id: "pfx_cced_nhq",
                office_section: "cced_writer",
                category: "NHQ",
                flow_type: "OUTGOING",
                prefix_pattern: "CCED/NHQ/{YYYY}/{SEQ}",
                next_sequence: 14,
                padding_length: 4,
                description: "NHQ Outgoing Letters",
                is_default: 1
            },
            "pfx_cced_ena": {
                id: "pfx_cced_ena",
                office_section: "cced_writer",
                category: "Bases & Ships in ENA",
                flow_type: "OUTGOING",
                prefix_pattern: "CCED/ENA/{YYYY}/{SEQ}",
                next_sequence: 1,
                padding_length: 4,
                description: "ENA Bases & Ships Outgoing",
                is_default: 0
            },
            "pfx_min_std": {
                id: "pfx_min_std",
                office_section: "minute_sheet",
                category: "Dockyard & ENA Departments",
                flow_type: "OUTGOING",
                prefix_pattern: "CCED/A/{MM}/{SEQ}/{YY}",
                next_sequence: 2218,
                padding_length: 4,
                description: "Standard CE Job Minute Number",
                is_default: 1
            }
        },
        file_registry: {
            "fil_ce_01_01": {
                id: "fil_ce_01_01",
                file_no: "CE/01/01",
                subject: "Naval Headquarters (NHQ) Directives & DGCE Correspondence",
                office_section: "cced_writer",
                category: "NHQ",
                file_box_ref: "CAB-01/DRAWER-A",
                cabinet_location: "CCED Writer Office, Rack 01",
                current_volume: "Vol IV",
                total_folios: 142,
                status: "Active"
            },
            "fil_ce_02_01": {
                id: "fil_ce_02_01",
                file_no: "CE/02/01",
                subject: "SLN Dockyard Berth & Waterfront Infrastructure Maintenance",
                office_section: "cced_writer",
                category: "Minute Sheets from Dockyard & ENA",
                file_box_ref: "CAB-01/DRAWER-B",
                cabinet_location: "CCED Writer Office, Rack 02",
                current_volume: "Vol V",
                total_folios: 210,
                status: "Active"
            }
        }
    };

    console.log("Pushing initial seed data to Cloud Firebase...");
    const writeRes = await httpRequest(activeEndpoint + '/.json', 'PATCH', payload);
    console.log(`Cloud Seed Result: HTTP ${writeRes.statusCode}`);
    if (writeRes.statusCode === 200) {
        console.log("SUCCESS: Cloud database populated successfully!");
    } else {
        console.log("Cloud response:", writeRes.body || writeRes.error);
    }
}

runSeed();
