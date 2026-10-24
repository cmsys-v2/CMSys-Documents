#!/usr/bin/env node
/**
 * =============================================================================
 * CMSys Documents — LOCAL PREVIEW SERVER  (development tooling only)
 * =============================================================================
 * The production application is a zero-build, PHP-served bundle.  This tiny
 * Node server exists purely so the Command Deck UI can be opened and reviewed
 * on a workstation without Apache / PHP / MySQL / Firebase.
 *
 *   node dev/preview-server.mjs            → http://0.0.0.0:8080
 *   PORT=3000 node dev/preview-server.mjs
 *
 * It serves the static bundle and answers `api.php?action=…` with representative
 * fixture data. Nothing here is deployed to Firebase Hosting (the hosting
 * ignore list excludes *.php but this folder is dev-only by convention).
 * =============================================================================
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';

/* --------------------------------------------------------------------------
   Fixture data
   -------------------------------------------------------------------------- */
const iso = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
};

let seq = 46;
const nextRef = (pattern = 'CCED/NHQ/{YYYY}/{SEQ}') =>
    pattern.replace('{YYYY}', '2026').replace('{YY}', '26').replace('{MM}', '10').replace('{M}', '10')
        .replace('{SEQ}', String(seq++).padStart(4, '0'));

const DOCUMENTS = [
    {
        id: 'doc-001', office_section: 'cced_writer', flow_type: 'INCOMING',
        sender_source_category: 'NHQ', ref_no: 'CCED/NHQ/2026/0012', sender_ref_no: 'NHQ/CE/05/2026/042',
        sender_or_recipient: 'Naval Headquarters — Directorate of Civil Engineering',
        contact_no: '011-2445000', date_letter: iso(16), date_recorded: iso(14),
        subject: 'Reconstruction of water distribution network at Wardroom Complex — SLNS Tissa',
        scope_description: 'A-Zone · plumbing & structural', directed_to: 'A-Zone',
        project_name: 'Water Supply Upgrade', file_no: 'CE/EAST/ADM/05',
        present_position: 'Under Scrutiny by CCEO', priority: 'High',
        position_trail: [
            { action_status: 'Received / In Registry', officer_from: 'Registry', to_officer: 'CCED Writer', timestamp: `${iso(14)} 08:40`, remarks: 'Registered inward post' },
            { action_status: 'Under Scrutiny by CCEO', officer_from: 'CCED Writer', to_officer: 'CCEO (East)', timestamp: `${iso(12)} 10:05`, remarks: 'Forwarded with file note' }
        ]
    },
    {
        id: 'doc-002', office_section: 'cced_writer', flow_type: 'OUTGOING',
        sender_source_category: 'Outside', ref_no: 'CCED/ENA/2026/0045', sender_ref_no: '',
        sender_or_recipient: 'The Director General Civil Engineering, NHQ',
        contact_no: '', date_letter: iso(9), date_recorded: iso(9),
        subject: 'Submission of structural adequacy report — Boat Repair Shed, SLN Dockyard',
        scope_description: 'D-Zone · structural', directed_to: 'D-Zone',
        project_name: 'Boat Repair Shed', file_no: 'CE/STR/02',
        present_position: 'Dispatched / Outed', priority: 'Normal',
        position_trail: [{ action_status: 'Dispatched / Outed', officer_from: 'CCED Writer', to_officer: 'Navy Mail', timestamp: `${iso(9)} 15:20`, remarks: 'Dispatch book DB/2026/0142' }]
    },
    {
        id: 'doc-003', office_section: 'cced_writer', flow_type: 'INCOMING',
        sender_source_category: 'Bases & Ships in ENA', ref_no: 'CCED/ENA/2026/0031', sender_ref_no: 'SLNS-TISSA/ADM/2026/18',
        sender_or_recipient: 'Commanding Officer, SLNS Tissa',
        contact_no: '026-2222384', date_letter: iso(23), date_recorded: iso(21),
        subject: 'Urgent repair of galley drainage line and grease trap — SLNS Tissa',
        scope_description: 'A-Zone · sanitary', directed_to: 'A-Zone',
        project_name: '', file_no: 'CE/EAST/ADM/05',
        present_position: 'Directed to Zone Officer', priority: 'Urgent',
        position_trail: [
            { action_status: 'Received / In Registry', officer_from: 'Registry', to_officer: 'CCED Writer', timestamp: `${iso(21)} 09:10`, remarks: '' },
            { action_status: 'Directed to Zone Officer', officer_from: 'CCEO (East)', to_officer: 'Zone Officer A', timestamp: `${iso(18)} 11:30`, remarks: 'Site inspection directed' }
        ]
    },
    {
        id: 'doc-004', office_section: 'cced_writer', flow_type: 'INCOMING',
        sender_source_category: 'Miscellaneous', ref_no: 'CCED/ENA/2026/0027', sender_ref_no: '',
        sender_or_recipient: 'Command Logistics Officer (East)',
        contact_no: '', date_letter: iso(6), date_recorded: iso(5),
        subject: 'Allocation of plumbing fittings for quarter rehabilitation programme — Phase II',
        scope_description: 'BC-Zone · procurement', directed_to: 'BC-Zone',
        project_name: '', file_no: 'CE/PROC/07',
        present_position: 'Pending Material Procurement', priority: 'Normal',
        position_trail: [{ action_status: 'Pending Material Procurement', officer_from: 'Zone Officer BC', to_officer: 'Logistics (East)', timestamp: `${iso(5)} 14:00`, remarks: 'Indent forwarded' }]
    },
    {
        id: 'doc-005', office_section: 'admin_office', flow_type: 'INCOMING',
        sender_source_category: 'NHQ, VNF Commandant etc', ref_no: 'CCED/ADM/NHQ/2026/0114', sender_ref_no: 'NHQ/ADM/2026/221',
        sender_or_recipient: 'Naval Headquarters — Administration Branch',
        contact_no: '', date_letter: iso(3), date_recorded: iso(2),
        subject: 'Annual reconciliation of capital vote expenditure — 2026',
        scope_description: 'Vote 223-1-01-2104', directed_to: '', project_name: '', file_no: 'CE/ADM/01',
        present_position: 'Received / In Registry', priority: 'High',
        position_trail: [{ action_status: 'Received / In Registry', officer_from: 'Registry', to_officer: 'Admin Office', timestamp: `${iso(2)} 08:15`, remarks: '' }]
    },
    {
        id: 'doc-006', office_section: 'admin_office', flow_type: 'OUTGOING',
        sender_source_category: 'Bases & Ships in ENA', ref_no: 'ADM/1026/007', sender_ref_no: '',
        sender_or_recipient: 'All Zone Officers — Eastern Naval Area',
        contact_no: '', date_letter: iso(1), date_recorded: iso(1),
        subject: 'Circular: standard filing procedure for physical files and folio reconciliation',
        scope_description: 'Administrative circular', directed_to: '', project_name: '', file_no: 'CE/ADM/04',
        present_position: 'Forwarded to Executive Officer', priority: 'Normal',
        position_trail: [{ action_status: 'Forwarded to Executive Officer', officer_from: 'Admin Office', to_officer: 'XO (East)', timestamp: `${iso(1)} 12:10`, remarks: '' }]
    },
    {
        id: 'doc-007', office_section: 'drawing_office', flow_type: 'INCOMING',
        sender_source_category: 'Bases & Ships in ENA', ref_no: 'CCED/DRG/2026/0058', sender_ref_no: 'SLNS-VID/ENG/14',
        sender_or_recipient: 'Commanding Officer, SLNS Vidura',
        contact_no: '', date_letter: iso(19), date_recorded: iso(17),
        subject: 'Approval of revised drawing — vehicle park canopy at SLNS Vidura',
        scope_description: 'D-Zone · drawings', directed_to: 'D-Zone',
        project_name: 'Vehicle Park Canopy', file_no: 'CE/DRG/09',
        present_position: 'Estimate Submitted for Approval', priority: 'Normal',
        position_trail: [{ action_status: 'Estimate Submitted for Approval', officer_from: 'Drawing Office', to_officer: 'CCEO (East)', timestamp: `${iso(17)} 16:45`, remarks: 'Rev B drawings attached' }]
    },
    {
        id: 'doc-008', office_section: 'drawing_office', flow_type: 'OUTGOING',
        sender_source_category: 'Outside', ref_no: 'CCED/DRG/2026/0061', sender_ref_no: '',
        sender_or_recipient: 'State Engineering Corporation',
        contact_no: '', date_letter: iso(0), date_recorded: iso(0),
        subject: 'Issue of tender drawings — slipway hangar structural package',
        scope_description: 'Capital project NP-001', directed_to: 'D-Zone',
        project_name: 'No.03 Slipway Hangar', file_no: 'CE/DRG/11',
        present_position: 'Work in Progress on Site', priority: 'High',
        position_trail: [{ action_status: 'Work in Progress on Site', officer_from: 'Drawing Office', to_officer: 'SEC', timestamp: `${iso(0)} 09:30`, remarks: '' }]
    },
    {
        id: 'doc-009', office_section: 'minute_sheet', flow_type: 'INCOMING',
        sender_source_category: 'Dockyard & ENA Departments', ref_no: 'CCED/A/10/2216/26', sender_ref_no: '',
        sender_or_recipient: 'Commander (CE) — Command Civil Engineering Office (East)',
        contact_no: '', date_letter: iso(11), date_recorded: iso(11),
        subject: 'Minute M 01 — technical submission on pipeline replacement at SLNS Tissa',
        scope_description: 'Minute sheet · M01/M02', directed_to: 'A-Zone',
        project_name: '', file_no: 'CE/MIN/2026',
        present_position: 'Under Scrutiny by CCEO', priority: 'High',
        position_trail: [{ action_status: 'Under Scrutiny by CCEO', officer_from: 'Minute Sheet Section', to_officer: 'CCEO (East)', timestamp: `${iso(11)} 10:20`, remarks: 'M02 endorsement pending' }]
    },
    {
        id: 'doc-010', office_section: 'cced_writer', flow_type: 'INCOMING',
        sender_source_category: 'NHQ', ref_no: 'CCED/NHQ/2026/0009', sender_ref_no: 'NHQ/DCE/2026/87',
        sender_or_recipient: 'Naval Headquarters — Directorate of Civil Engineering',
        contact_no: '', date_letter: iso(34), date_recorded: iso(31),
        subject: 'Quarterly progress report — ongoing civil engineering works, Eastern Naval Area',
        scope_description: 'Reporting cycle Q3', directed_to: '', project_name: '', file_no: 'CE/EAST/ADM/01',
        present_position: 'Estimate Formulation in Progress', priority: 'Normal',
        position_trail: [{ action_status: 'Estimate Formulation in Progress', officer_from: 'Registry', to_officer: 'CCED Writer', timestamp: `${iso(31)} 09:00`, remarks: '' }]
    },
    {
        id: 'doc-011', office_section: 'admin_office', flow_type: 'INCOMING',
        sender_source_category: 'Related Signals', ref_no: 'ADM/SIG/1026/311', sender_ref_no: '',
        sender_or_recipient: 'COMEN — Eastern Naval Area Command',
        contact_no: '', date_letter: iso(27), date_recorded: iso(26),
        subject: 'Signal: priority tasking for waterfront facility repairs before monsoon',
        scope_description: 'Signal DTG 150830Z OCT 26', directed_to: 'D-Zone', project_name: '', file_no: 'CE/SIG/02',
        present_position: 'Directed to Zone Officer', priority: 'Urgent',
        position_trail: [{ action_status: 'Directed to Zone Officer', officer_from: 'Admin Office', to_officer: 'Zone Officer D', timestamp: `${iso(26)} 07:55`, remarks: '' }]
    },
    {
        id: 'doc-012', office_section: 'minute_sheet', flow_type: 'OUTGOING',
        sender_source_category: 'NHQ Directives', ref_no: 'CCED/A/10/2241/26', sender_ref_no: '',
        sender_or_recipient: 'Executive Officer, SLN Dockyard',
        contact_no: '', date_letter: iso(4), date_recorded: iso(4),
        subject: 'Minute M 02 — endorsement for emergent carpentry works at Wardroom',
        scope_description: 'Minute sheet · endorsed', directed_to: 'BC-Zone', project_name: '', file_no: 'CE/MIN/2026',
        present_position: 'Completed / Handed Over', priority: 'Normal',
        position_trail: [{ action_status: 'Completed / Handed Over', officer_from: 'CCEO (East)', to_officer: 'XO Dockyard', timestamp: `${iso(4)} 13:40`, remarks: 'Work completed and handed over' }]
    }
];

const FILES = [
    { id: 'f1', file_no: 'CE/EAST/ADM/05', subject: 'Wardroom & residential quarters — general administration', office_section: 'cced_writer', cabinet_location: 'Cabinet 02 / Rack B', file_box_ref: 'Box 14', folder_no: 'F-08', current_volume: 'Vol II', total_folios: 186 },
    { id: 'f2', file_no: 'CE/ADM/01', subject: 'Annual estimates & capital vote reconciliation', office_section: 'admin_office', cabinet_location: 'Cabinet 01 / Rack A', file_box_ref: 'Box 03', folder_no: 'F-02', current_volume: 'Vol I', total_folios: 92 },
    { id: 'f3', file_no: 'CE/DRG/11', subject: 'Slipway hangar — structural drawings', office_section: 'drawing_office', cabinet_location: 'Drawing Cabinet / Rack D', file_box_ref: 'Tube 07', folder_no: 'D-14', current_volume: 'Vol I', total_folios: 41 },
    { id: 'f4', file_no: 'CE/MIN/2026', subject: 'Annual minute sheet compilation', office_section: 'minute_sheet', cabinet_location: 'Cabinet 03 / Rack A', file_box_ref: 'Box 21', folder_no: 'M-01', current_volume: 'Vol III', total_folios: 254 },
    { id: 'f5', file_no: 'CE/PROC/07', subject: 'Material indents & procurement', office_section: 'cced_writer', cabinet_location: 'Cabinet 02 / Rack C', file_box_ref: 'Box 18', folder_no: 'F-11', current_volume: 'Vol I', total_folios: 77 },
    { id: 'f6', file_no: 'CE/STR/02', subject: 'Structural adequacy reports', office_section: 'drawing_office', cabinet_location: 'Drawing Cabinet / Rack B', file_box_ref: 'Box 09', folder_no: 'D-05', current_volume: 'Vol II', total_folios: 133 }
];

const PREFIXES = [
    { id: 'pfx_cced_nhq', office_section: 'cced_writer', category: 'NHQ', flow_type: 'OUTGOING', prefix_pattern: 'CCED/NHQ/{YYYY}/{SEQ}', next_sequence: 12, padding_length: 4, separator_char: '/', description: 'CCED Writer — NHQ', is_default: 1 },
    { id: 'pfx_cced_ena', office_section: 'cced_writer', category: 'Bases & Ships in ENA', flow_type: 'OUTGOING', prefix_pattern: 'CCED/ENA/{YYYY}/{SEQ}', next_sequence: 46, padding_length: 4, separator_char: '/', description: 'CCED Writer — Eastern Naval Area', is_default: 1 },
    { id: 'pfx_adm_nhq', office_section: 'admin_office', category: 'NHQ, VNF Commandant etc', flow_type: 'OUTGOING', prefix_pattern: 'CCED/ADM/NHQ/{YYYY}/{SEQ}', next_sequence: 19, padding_length: 4, separator_char: '/', description: 'Admin Office — NHQ / VNF', is_default: 1 },
    { id: 'pfx_minute', office_section: 'minute_sheet', category: 'Dockyard & ENA Departments', flow_type: 'OUTGOING', prefix_pattern: 'CCED/A/{MM}/{SEQ}/{YY}', next_sequence: 2217, padding_length: 0, separator_char: '/', description: 'Minute sheets', is_default: 1 },
    { id: 'pfx_sig', office_section: 'admin_office', category: 'Related Signals', flow_type: 'OUTGOING', prefix_pattern: 'ADM/SIG/{MM}{YY}/{SEQ}', next_sequence: 312, padding_length: 0, separator_char: '/', description: 'Signals register', is_default: 1 }
];

const MINUTE_TEMPLATES = [
    { id: 'mt1', lang: 'si', category: 'Technical Submission', title: 'තාක්ෂණික ඉදිරිපත් කිරීම — M 01', subject: 'ගොඩනැගිලි ප්‍රතිසංස්කරණ ඇස්තමේන්තුව සකස් කිරීම පිළිබඳව', originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්', recommendation: 'ඉදිරි කටයුතු සඳහා කාරුණිකව ඉදිරිපත් කරමි.', sign_title: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)', m02_enabled: 1, m02_addressee: 'විධායක නිලධාරී — ශ්‍රීලංනෞ තිස්ස', m02_originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්', m02_text: 'නිර්දේශ කර ඉදිරිපත් කරමි.', m02_sign_title: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)', paragraphs: [{ num: '01.', text: 'SLNS තිස්ස ආයතනයේ ප්‍රධාන ජල නල පද්ධතියෙහි ගැල්වනික් විඛාදන තත්ත්වය පිළිබඳව පරීක්ෂණයක් සිදු කරන ලදී.' }, { num: '02.', text: 'අලුත්වැඩියා කටයුතු සඳහා රු. 1,485,000.00 ක් ඇස්තමේන්තු කර ඇත.' }] },
    { id: 'mt2', lang: 'si', category: 'Inspection Report', title: 'පරීක්ෂණ වාර්තාව — M 01', subject: 'ශ්‍රීලංනෞ විදුර පරිශ්‍රයේ වාහන නැවතුම් ස්ථානය පරීක්ෂාව', originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්', recommendation: 'අනුමැතිය සඳහා ඉදිරිපත් කරමි.', sign_title: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)', m02_enabled: 0, paragraphs: [{ num: '01.', text: 'වාහන නැවතුම් ස්ථානයේ වහලයෙහි ජල කාන්දුවක් නිරීක්ෂණය විය.' }] },
    { id: 'mt3', lang: 'en', category: 'Technical Submission', title: 'Technical submission — M 01', subject: 'Pipeline replacement at SLNS Tissa — recommendation', originator: 'Through: Command Civil Engineering Officer (East)', recommendation: 'Submitted for kind approval, please.', sign_title: 'Command Civil Engineering Officer (East)', m02_enabled: 1, m02_addressee: 'Executive Officer, SLN Dockyard', m02_originator: 'Command Civil Engineering Officer (East)', m02_text: 'Recommended and forwarded.', m02_sign_title: 'Executive Officer, SLN Dockyard', paragraphs: [{ num: '01.', text: 'An inspection of the water distribution network at SLNS Tissa was carried out.' }, { num: '02.', text: 'Replacement of the 150mm ductile iron trunk line is recommended.' }] },
    { id: 'mt4', lang: 'en', category: 'Estimate Approval', title: 'Estimate approval — M 01', subject: 'Approval of structural estimate — boat repair shed', originator: 'Through: Command Civil Engineering Officer (East)', recommendation: 'Estimate forwarded for approval.', sign_title: 'Command Civil Engineering Officer (East)', m02_enabled: 0, paragraphs: [{ num: '01.', text: 'The structural estimate for the boat repair shed has been finalised at Rs. 4,820,000.00.' }] }
];

const NAVAL_LETTERS = [
    { id: 'nl1', letter_ref: 'CCED/NHQ/2026/0041', letter_date: '12 Oct 26', addressee_to: 'The Commander of the Navy\nNaval Headquarters, Colombo 01', subject: 'RECONSTRUCTION AND WATER SUPPLY UPGRADE AT WARDROOM — SLNS TISSA', security_class: 'RESTRICTED', status: 'Registered outgoing', is_registered_outgoing: 1 },
    { id: 'nl2', letter_ref: 'CCED/ENA/2026/0038', letter_date: '08 Oct 26', addressee_to: 'The Commander Eastern Naval Area\nEastern Naval Area Headquarters', subject: 'SUBMISSION OF STRUCTURAL ADEQUACY REPORT — BOAT REPAIR SHED', security_class: 'CONFIDENTIAL', status: 'Registered outgoing', is_registered_outgoing: 1 },
    { id: 'nl3', letter_ref: 'CCED/NHQ/2026/0046', letter_date: '23 Oct 26', addressee_to: 'The Director General Civil Engineering\nNaval Headquarters, Colombo 01', subject: 'ALLOCATION OF CAPITAL VOTE FOR SLIPWAY HANGAR — PHASE II', security_class: 'SECRET', status: 'Draft', is_registered_outgoing: 0 }
];

const LETTER_TEMPLATES = [
    { id: 'lt1', category: 'Submission', title: 'Submission of estimate for approval', security_class: 'RESTRICTED', subject: 'SUBMISSION OF ESTIMATE FOR KIND APPROVAL', addressee_to: 'The Commander Eastern Naval Area', channel_through: 'Through: Command Civil Engineering Officer (East)', br7_tone: 'junior_to_senior' },
    { id: 'lt2', category: 'Directive', title: 'Tasking directive to zone officer', security_class: 'RESTRICTED', subject: 'PRIORITY REPAIRS TO WATERFRONT FACILITIES', addressee_to: 'The Zone Officer, A-Zone', channel_through: '', br7_tone: 'senior_to_junior' },
    { id: 'lt3', category: 'Demi-official', title: 'DO letter — progress follow-up', security_class: 'UNCLASSIFIED', subject: 'FOLLOW-UP ON ONGOING QUARTER REHABILITATION', addressee_to: 'The Commanding Officer, SLNS Tissa', channel_through: '', br7_tone: 'do_letter' }
];

const SETTINGS = {
    minute_config: {
        si: {
            addressees: ['විධායක නිලධාරී — ශ්‍රීලංනෞ තිස්ස', 'අණදෙන නිලධාරී — ශ්‍රීලංනෞ විදුර', 'ප්‍රධාන සිවිල් ඉංජිනේරු', 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)'],
            originators: ['කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්', 'ප්‍රධාන සිවිල් ඉංජිනේරු මඟින්'],
            signatoryTitles: ['කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)', 'ප්‍රධාන සිවිල් ඉංජිනේරු'],
            endorsements: ['නිර්දේශ කර ඉදිරිපත් කරමි.', 'අනුමැතිය සඳහා ඉදිරිපත් කරමි.', 'ඉදිරි කටයුතු සඳහා යොමු කරමි.']
        },
        en: {
            addressees: ['Executive Officer, SLN Dockyard', 'Commanding Officer, SLNS Tissa', 'Director General Civil Engineering'],
            originators: ['Through: Command Civil Engineering Officer (East)'],
            signatoryTitles: ['Command Civil Engineering Officer (East)', 'Staff Officer Civil Engineering'],
            endorsements: ['Recommended and forwarded.', 'Submitted for approval, please.', 'Directed for implementation.']
        }
    },
    letter_config: {
        addressees: ['The Commander of the Navy\nNaval Headquarters, Colombo 01', 'The Commander Eastern Naval Area\nEastern Naval Area Headquarters', 'The Director General Civil Engineering\nNaval Headquarters, Colombo 01', 'The Commanding Officer, SLNS Tissa'],
        signatories: [
            { name: 'K A KAHANDAWA', rank: 'Commander', appointment: 'Command Civil Engineering Officer (East)', post_nominals: 'psc, CEng' },
            { name: 'S M WEERASINGHE', rank: 'Lieutenant Commander', appointment: 'Staff Officer Civil Engineering (East)', post_nominals: 'psc' }
        ],
        distribution_presets: ['The Director General Civil Engineering, NHQ', 'The Command Logistics Officer (East)', 'The Commanding Officer, SLNS Tissa', 'Office Copy'],
        tones: {}
    }
};

const metaCachePath = path.join(ROOT, 'meta_cache.json');
let meta = { zones: [], workshops: [], projects: [], sailors: [], stats: { sailors: 0, projects: 0 } };
try {
    const raw = JSON.parse(fs.readFileSync(metaCachePath, 'utf8'));
    meta = {
        zones: raw.zones || [],
        workshops: raw.workshops || [],
        projects: raw.projects || [],
        approved_projects: raw.approved_projects || [],
        sailors: raw.sailors || [],
        stats: {
            sailors: (raw.sailors || []).length,
            projects: (raw.projects || []).length,
            approved_projects: (raw.approved_projects || []).length
        }
    };
} catch (e) {
    console.warn('[preview] meta_cache.json unavailable:', e.message);
}

/* --------------------------------------------------------------------------
   API
   -------------------------------------------------------------------------- */
function json(res, payload, status = 200) {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(body);
}

function handleApi(req, res, url) {
    const action = url.searchParams.get('action') || '';
    const method = req.method || 'GET';

    const body = [];
    req.on('data', (chunk) => body.push(chunk));
    req.on('end', () => {
        let input = {};
        try { input = JSON.parse(Buffer.concat(body).toString() || '{}'); } catch { /* empty body */ }

        switch (action) {
            case 'meta':
                return json(res, { success: true, data: meta });

            case 'settings':
                if (method === 'POST' && input.key) {
                    SETTINGS[input.key] = input.value;
                    return json(res, { success: true });
                }
                return json(res, { success: true, data: SETTINGS });

            case 'documents':
            case 'get_documents': {
                if (method === 'POST') {
                    const doc = {
                        id: `doc-${Date.now()}`,
                        office_section: input.office_section,
                        flow_type: input.flow_type,
                        sender_source_category: input.sender_source_category,
                        ref_no: input.ref_no || nextRef(),
                        sender_ref_no: input.sender_ref_no,
                        sender_or_recipient: input.sender_or_recipient,
                        date_letter: input.date_letter,
                        date_recorded: input.date_recorded || iso(0),
                        priority: input.priority || 'Normal',
                        subject: input.subject,
                        directed_to: input.directed_to,
                        file_no: input.file_no,
                        present_position: input.present_position || 'Received / In Registry',
                        position_trail: [{ action_status: 'Received / In Registry', officer_from: 'Registry', to_officer: 'CCED Writer', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '), remarks: 'Created from workstation' }]
                    };
                    DOCUMENTS.unshift(doc);
                    return json(res, { success: true, data: doc });
                }
                const section = url.searchParams.get('section') || 'ALL';
                const flow = url.searchParams.get('flow_type') || 'ALL';
                const category = url.searchParams.get('category') || 'ALL';
                const search = (url.searchParams.get('search') || '').toLowerCase();
                let rows = DOCUMENTS.slice();
                if (section !== 'ALL') rows = rows.filter((d) => d.office_section === section);
                if (flow !== 'ALL') rows = rows.filter((d) => d.flow_type === flow);
                if (category !== 'ALL') rows = rows.filter((d) => d.sender_source_category === category);
                if (search) {
                    rows = rows.filter((d) =>
                        [d.ref_no, d.subject, d.sender_or_recipient, d.file_no, d.sender_ref_no]
                            .filter(Boolean).join(' ').toLowerCase().includes(search));
                }
                return json(res, { success: true, data: rows });
            }

            case 'update_position': {
                const doc = DOCUMENTS.find((d) => d.id === input.id);
                if (!doc) return json(res, { success: false, error: 'Document not found' }, 404);
                doc.present_position = input.present_position || doc.present_position;
                doc.position_trail = doc.position_trail || [];
                doc.position_trail.push({
                    action_status: input.present_position,
                    officer_from: input.officer_from || 'Registry',
                    to_officer: input.to_officer || 'Officer',
                    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    remarks: input.remarks || ''
                });
                return json(res, { success: true, data: doc });
            }

            case 'save_outing': {
                const doc = DOCUMENTS.find((d) => d.id === input.id);
                if (!doc) return json(res, { success: false, error: 'Document not found' }, 404);
                Object.assign(doc, {
                    dispatch_mode: input.dispatch_mode,
                    dispatch_book_ref: input.dispatch_book_ref,
                    messenger: input.messenger,
                    folio_no: input.folio_no,
                    present_position: 'Dispatched / Outed'
                });
                doc.position_trail = doc.position_trail || [];
                doc.position_trail.push({
                    action_status: 'Dispatched / Outed',
                    officer_from: 'Registry',
                    to_officer: input.dispatch_mode || 'Dispatch',
                    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    remarks: input.remarks || ''
                });
                return json(res, { success: true, data: doc });
            }

            case 'prefixes':
                if (method === 'POST') {
                    const idx = PREFIXES.findIndex((p) => p.id === input.id);
                    if (idx >= 0) PREFIXES[idx] = { ...PREFIXES[idx], ...input };
                    else PREFIXES.push({ ...input, id: `pfx_${Date.now()}` });
                    return json(res, { success: true });
                }
                return json(res, { success: true, data: PREFIXES });

            case 'generate_ref': {
                const section = url.searchParams.get('section') || 'cced_writer';
                const category = url.searchParams.get('category') || '';
                const pfx = PREFIXES.find((p) => p.office_section === section && (!category || p.category === category))
                    || PREFIXES.find((p) => p.office_section === section)
                    || PREFIXES[0];
                const pad = pfx.padding_length || 0;
                const ref = pfx.prefix_pattern
                    .replace('{YYYY}', '2026').replace('{YY}', '26')
                    .replace('{MM}', '10').replace('{M}', '10')
                    .replace('{SEQ}', pad ? String(pfx.next_sequence).padStart(pad, '0') : String(pfx.next_sequence));
                pfx.next_sequence += 1;
                return json(res, { success: true, ref_no: ref });
            }

            case 'files':
                if (method === 'POST') {
                    FILES.push({ ...input, id: `f-${Date.now()}` });
                    return json(res, { success: true });
                }
                return json(res, { success: true, data: FILES });

            case 'minute_templates':
                if (method === 'POST') {
                    MINUTE_TEMPLATES.unshift({ ...input, id: `mt-${Date.now()}` });
                    return json(res, { success: true });
                }
                return json(res, { success: true, data: MINUTE_TEMPLATES });

            case 'naval_letters':
                if (method === 'POST') {
                    const letter = { ...input, id: input.id || `nl-${Date.now()}`, status: input.status || 'Draft' };
                    const idx = NAVAL_LETTERS.findIndex((l) => l.id === letter.id);
                    if (idx >= 0) NAVAL_LETTERS[idx] = { ...NAVAL_LETTERS[idx], ...letter };
                    else NAVAL_LETTERS.unshift(letter);
                    return json(res, { success: true, data: letter });
                }
                return json(res, { success: true, data: NAVAL_LETTERS });

            case 'naval_letter_templates':
                if (method === 'POST') {
                    LETTER_TEMPLATES.unshift({ ...input, id: `lt-${Date.now()}` });
                    return json(res, { success: true });
                }
                return json(res, { success: true, data: LETTER_TEMPLATES });

            case 'job_minutes':
                if (method === 'POST') return json(res, { success: true, data: { ...input, id: `jm-${Date.now()}` } });
                return json(res, { success: true, data: [] });

            case 'sync_status':
                return json(res, { success: true, data: { mode: 'preview-fixtures', clusters: { docs: 'ok', core: 'ok', sailors: 'ok', projects: 'ok' } } });

            default:
                return json(res, { success: false, error: `Unknown action: ${action || '(none)'}`, preview: true }, 404);
        }
    });
}

/* --------------------------------------------------------------------------
   Static files
   -------------------------------------------------------------------------- */
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.endsWith('api.php')) return handleApi(req, res, url);

    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/' || pathname === '') pathname = '/workstation.html';

    const target = path.resolve(ROOT, `.${pathname}`);
    if (!target.startsWith(ROOT)) {
        res.writeHead(403).end('Forbidden');
        return;
    }

    fs.stat(target, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(`Not found: ${pathname}`);
        }
        res.writeHead(200, {
            'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        fs.createReadStream(target).pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`\n  CMSys Documents — Command Deck preview`);
    console.log(`  → http://localhost:${PORT}/  (serving workstation.html)`);
    console.log(`  → mock API: /api.php?action=…`);
    console.log(`  → fixtures: ${DOCUMENTS.length} registry files, ${meta.sailors.length} sailors\n`);
});
