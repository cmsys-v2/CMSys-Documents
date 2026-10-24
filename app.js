/**
 * CMSys Documents — Master Application Engine
 * Integrates:
 *  1. Document Registry (4 Operational Offices, Incoming/Outgoing, Outing & Audit Trail)
 *  2. Naval Minute Sheet Studio (Authentic Pic 1, 2, 3 Layout, Sinhala/English, Templates, Print Studio)
 *  3. Navy BR 7 Letter Studio (Naval Military Correspondence, Tones, Numbering, Print Studio)
 *  4. Settings & Outgoing Sequential Prefixes Engine
 */

// =============================================================================
// GLOBAL STATE
// =============================================================================
const state = {
    currentMainTab: 'registry', // 'registry', 'minutesheet', 'letterstudio', 'settings'
    currentOffice: 'cced_writer', // 'cced_writer', 'admin_office', 'drawing_office', 'minute_sheet'
    currentFlowFilter: 'ALL', // 'ALL', 'INCOMING', 'OUTGOING'
    currentCategoryFilter: 'ALL',
    currentScope: 'ALL',
    searchQuery: '',
    overdueThreshold: 7,
    filterOverdueOnly: false,
    isWideTable: false,

    // Data lists
    documents: [],
    prefixes: [],
    files: [],
    minuteTemplates: [],
    minuteSaved: [],
    navalLetters: [],
    navalLetterTemplates: [],
    meta: { zones: [], projects: [], sailors: [], stats: {} },
    settings: {
        minute_config: { si: {}, en: {} },
        letter_config: { letterheads: [], addressees: [], tones: {}, signatories: [], distribution_presets: [] }
    },

    // Minute Sheet Builder State
    ms: {
        lang: 'si',
        refNo: 'CCED/A/10/2216/26',
        date: '2026 ඔක්තෝබර් මස 24',
        minuteSeq: 'M 01',
        originatorTag: 'BY CCEO(E)',
        addressees: ['කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)'],
        subject: '',
        originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
        paragraphs: [
            { num: '01.', text: '' }
        ],
        recommendation: 'ඉදිරි කටයුතු සඳහා කාරුණිකව ඉදිරිපත් කරමි.',
        signatory: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
        m02Enabled: false,
        m02Addressee: 'විධායක නිලධාරී - ශ්‍රීලංනෞ තිස්ස',
        m02Originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
        m02Text: 'නිර්දේශ කර ඉදිරිපත් කරමි.',
        m02Date: '2026 ඔක්තෝබර් මස 24',
        m02Signatory: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
        dividerWidth: 100, // percent (50% to 100%)
        rightMargin: 20, // mm
        fontFamily: "'Abhaya Libre', 'Noto Serif Sinhala', serif",
        fontSize: 11, // pt
        lineHeight: 1.65 // leading
    },

    // Letter Studio (Navy BR 7) State
    ltr: {
        securityClass: 'RESTRICTED',
        precedence: 'ROUTINE',
        copyNo: 1,
        totalCopies: 5,
        ref: 'CCED/NHQ/2026/0012',
        fileNo: 'CE/01/01',
        office: 'COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)',
        station: 'SLN DOCKYARD, TRINCOMALEE',
        tel: '026-2222384 / Ext 3144',
        email: 'cceoeast@navy.lk',
        date: '24 Oct 26',
        dateFormat: 'internal', // 'internal' (DD Mon YY) or 'external' (DDth Month YYYY)
        addresseeTo: "The Commander of the Navy\nNaval Headquarters, Colombo 01",
        channelThrough: "Through: The Commander Eastern Naval Area",
        attentionTo: 'Attention: Staff Officer Civil Engineering (East)',
        subject: '',
        subjectAlignment: 'left', // 'left' or 'center'
        references: [],
        br7Tone: 'junior_to_senior', // 'junior_to_senior', 'senior_to_junior', 'equal_to_equal', 'do_letter'
        salutation: 'Sir,',
        complimentaryClose: 'I remain, Sir, Your obedient Servant,',
        sdIncluded: true,
        includeSLN: false,
        signName: 'K A KAHANDAWA',
        postNominals: 'psc, CEng',
        signRank: 'Commander',
        signBranch: '(CE)',
        signAppointment: 'Command Civil Engineering Officer (East)',
        paragraphs: [
            { id: 'p_1', level: 1, text: 'I have the honour to submit for your kind consideration and approval please that an on-site structural and plumbing inspection was carried out at the Wardroom Complex of SLNS Tissa.' }
        ],
        enclosures: [],
        copyTo: ['The Director General Civil Engineering, NHQ', 'The Command Logistics Officer (East)', 'The Commanding Officer, SLNS Tissa', 'Office Copy']
    },

    // Print Studios State
    msPrintZoom: 100,
    ltrPrintZoom: 100
};

// Office Categories Mapping
const OFFICE_CATEGORIES = {
    cced_writer: [
        { id: 'ALL', label: 'All Categories' },
        { id: 'NHQ', label: 'a. NHQ' },
        { id: 'Bases & Ships in ENA', label: 'b. Bases & Ships in ENA' },
        { id: 'Outside', label: 'c. Outside / Civil' },
        { id: 'Minute Sheet (Dockyard/ENA)', label: 'd. Minute Sheets (Dockyard/ENA)' },
        { id: 'Miscellaneous', label: 'e. Miscellaneous' }
    ],
    admin_office: [
        { id: 'ALL', label: 'All Categories' },
        { id: 'NHQ, VNF Commandant etc', label: 'a. NHQ / VNF Commandant' },
        { id: 'Bases & Ships in ENA', label: 'b. Bases & Ships in ENA' },
        { id: 'Outside', label: 'c. Outside' },
        { id: 'Minute Sheet (Dockyard/ENA)', label: 'd. Minute Sheets' },
        { id: 'Related Signals', label: 'f. Related Signals' },
        { id: 'Miscellaneous', label: 'e. Miscellaneous' }
    ],
    drawing_office: [
        { id: 'ALL', label: 'All Categories' },
        { id: 'NHQ, VNF Commandant etc', label: 'a. NHQ / VNF Commandant' },
        { id: 'Bases & Ships in ENA', label: 'b. Bases & Ships in ENA' },
        { id: 'Outside', label: 'c. Outside' },
        { id: 'Minute Sheet (Dockyard/ENA)', label: 'd. Minute Sheets' },
        { id: 'Related Signals', label: 'f. Related Signals' },
        { id: 'Miscellaneous', label: 'e. Miscellaneous' }
    ],
    minute_sheet: [
        { id: 'ALL', label: 'All Minute Sheets' },
        { id: 'Dockyard & ENA Departments', label: 'SLN Dockyard & ENA Depts' },
        { id: 'Related Signals', label: 'Related Signals' },
        { id: 'NHQ Directives', label: 'NHQ Directives' }
    ]
};

// =============================================================================
// INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupCurrentDates();
    await fetchMetaAndSettings();
    await fetchRegistryData();
    await fetchPrefixes();
    await fetchFiles();
    await fetchMinuteTemplates();
    await fetchNavalLetters();
    await fetchNavalLetterTemplates();

    initMinuteSheetBuilder();
    initLetterStudio();
    renderOfficeCategoryPills();
    updateRegistryStats();
});

function initTheme() {
    // Default to dark mode for this naval system — professional dark-first UI
    const stored = localStorage.getItem('cmsys_theme');
    const isDark = stored === null ? true : stored === 'dark';
    if (isDark) {
        document.documentElement.classList.add('dark');
        document.getElementById('themeIcon').textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        document.getElementById('themeIcon').textContent = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('cmsys_theme', isDark ? 'dark' : 'light');
    document.getElementById('themeIcon').textContent = isDark ? '☀️' : '🌙';
}

function setupCurrentDates() {
    const today = new Date().toISOString().split('T')[0];
    const recEl = document.getElementById('docEntryDateRecorded');
    if (recEl) recEl.value = today;

    // Military formatted date
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    const ltrDateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    state.ltr.date = ltrDateStr;
    const ltrDateInput = document.getElementById('ltrInputDate');
    if (ltrDateInput) ltrDateInput.value = ltrDateStr;
}

// =============================================================================
// API CALLS
// =============================================================================
async function fetchMetaAndSettings() {
    try {
        const res = await fetch('api.php?action=meta');
        const json = await res.json();
        if (json.success && json.data) {
            state.meta = json.data;
            populateSailorsDropdowns();
        }

        const sRes = await fetch('api.php?action=settings');
        const sJson = await sRes.json();
        if (sJson.success && sJson.data) {
            if (sJson.data.minute_config) state.settings.minute_config = sJson.data.minute_config;
            if (sJson.data.letter_config) state.settings.letter_config = sJson.data.letter_config;
            populateSettingsDropdowns();
            renderSettingsLists();
        }
    } catch (e) {
        console.error('Error fetching meta/settings:', e);
    }
}

async function fetchRegistryData() {
    try {
        const params = new URLSearchParams({
            action: 'documents',
            section: state.currentOffice,
            flow_type: state.currentFlowFilter,
            category: state.currentCategoryFilter,
            zone_id: state.currentScope,
            search: state.searchQuery
        });
        const res = await fetch(`api.php?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
            state.documents = json.data || [];
            renderRegistryTable();
            updateRegistryStats();
            populateMinuteAutofillDropdown();
        }
    } catch (e) {
        console.error('Error fetching registry:', e);
    }
}

async function fetchPrefixes() {
    try {
        const res = await fetch('api.php?action=prefixes');
        const json = await res.json();
        if (json.success) {
            state.prefixes = json.data || [];
            renderPrefixesTable();
        }
    } catch (e) {
        console.error('Error fetching prefixes:', e);
    }
}

async function fetchFiles() {
    try {
        const res = await fetch('api.php?action=files');
        const json = await res.json();
        if (json.success) {
            state.files = json.data || [];
            renderFilesTable();
        }
    } catch (e) {
        console.error('Error fetching files:', e);
    }
}

async function fetchMinuteTemplates() {
    try {
        const res = await fetch('api.php?action=minute_templates');
        const json = await res.json();
        if (json.success) {
            state.minuteTemplates = json.data || [];
            renderMinuteTemplatesGrid();
        }
    } catch (e) {
        console.error('Error fetching minute templates:', e);
    }
}

async function fetchNavalLetters() {
    try {
        const res = await fetch('api.php?action=naval_letters');
        const json = await res.json();
        if (json.success) {
            state.navalLetters = json.data || [];
            renderNavalLettersTable();
        }
    } catch (e) {
        console.error('Error fetching naval letters:', e);
    }
}

async function fetchNavalLetterTemplates() {
    try {
        const res = await fetch('api.php?action=naval_letter_templates');
        const json = await res.json();
        if (json.success) {
            state.navalLetterTemplates = json.data || [];
            renderNavalLetterTemplatesGrid();
        }
    } catch (e) {
        console.error('Error fetching naval letter templates:', e);
    }
}

// =============================================================================
// MAIN NAVIGATION & SCOPE
// =============================================================================
function switchMainTab(tab) {
    state.currentMainTab = tab;
    document.querySelectorAll('.nav-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = 'none';
        b.style.color = '#8fa3bf';
        b.style.boxShadow = 'none';
    });
    const btn = document.getElementById(`tabBtn-${tab}`);
    if (btn) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg,#14b8a6,#0d9488)';
        btn.style.color = 'white';
        btn.style.boxShadow = '0 2px 10px rgba(20,184,166,0.30)';
    }

    document.getElementById('view-registry').classList.add('hidden');
    document.getElementById('view-minutesheet').classList.add('hidden');
    document.getElementById('view-letterstudio').classList.add('hidden');
    document.getElementById('view-settings').classList.add('hidden');

    const view = document.getElementById(`view-${tab}`);
    if (view) view.classList.remove('hidden');

    if (tab === 'registry') {
        renderRegistryTable();
    } else if (tab === 'minutesheet') {
        updateMinutePreview();
    } else if (tab === 'letterstudio') {
        updateLetterPreview();
    }
}

function onGlobalScopeChange(scopeVal) {
    state.currentScope = scopeVal;
    fetchRegistryData();
}

function onGlobalSearch(query) {
    state.searchQuery = query.trim();
    fetchRegistryData();
}

// =============================================================================
// 1. REGISTRY ENGINE
// =============================================================================
function switchRegistryOffice(officeId) {
    state.currentOffice = officeId;
    state.currentCategoryFilter = 'ALL';

    document.querySelectorAll('.office-pill').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#8fa3bf';
        btn.style.borderColor = 'rgba(255,255,255,0.08)';
        btn.style.boxShadow = 'none';
    });

    const activeBtn = document.getElementById(`officeTab-${officeId}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = 'linear-gradient(135deg,#14b8a6,#0d9488)';
        activeBtn.style.color = 'white';
        activeBtn.style.borderColor = 'rgba(45,212,191,0.30)';
        activeBtn.style.boxShadow = '0 2px 10px rgba(20,184,166,0.28)';
    }

    renderOfficeCategoryPills();
    fetchRegistryData();
}

function setRegistryFlowFilter(flow) {
    state.currentFlowFilter = flow;
    document.querySelectorAll('.flow-pill').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'none';
        btn.style.color = '#4e637d';
        btn.style.boxShadow = 'none';
    });
    const active = document.getElementById(`flowTab-${flow}`);
    if (active) {
        active.classList.add('active');
        active.style.background = '#111e35';
        active.style.color = '#e8edf5';
        active.style.boxShadow = '0 1px 4px rgba(0,0,0,0.40)';
    }
    fetchRegistryData();
}

function renderOfficeCategoryPills() {
    const container = document.getElementById('officeCategoryPills');
    if (!container) return;
    const cats = OFFICE_CATEGORIES[state.currentOffice] || OFFICE_CATEGORIES.cced_writer;

    container.innerHTML = cats.map(cat => {
        const isAct = state.currentCategoryFilter === cat.id;
        const activeStyle = 'padding:4px 10px;border-radius:7px;font-size:0.62rem;font-weight:700;background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;border:1px solid rgba(45,212,191,0.30);box-shadow:0 2px 8px rgba(20,184,166,0.30);cursor:pointer;transition:all 150ms;letter-spacing:0.02em';
        const inactiveStyle = 'padding:4px 10px;border-radius:7px;font-size:0.62rem;font-weight:600;background:rgba(255,255,255,0.05);color:#8fa3bf;border:1px solid rgba(255,255,255,0.08);cursor:pointer;transition:all 150ms;letter-spacing:0.02em';
        return `
            <button type="button" onclick="setOfficeCategoryFilter('${cat.id}')" style="${isAct ? activeStyle : inactiveStyle}" class="cat-pill${isAct ? ' active' : ''}">
                ${cat.label}
            </button>
        `;
    }).join('');
}

function setOfficeCategoryFilter(catId) {
    state.currentCategoryFilter = catId;
    renderOfficeCategoryPills();
    fetchRegistryData();
}

function toggleFilterOverdueOnly() {
    state.filterOverdueOnly = !state.filterOverdueOnly;
    const ind = document.getElementById('overdueActiveIndicator');
    if (ind) ind.classList.toggle('hidden', !state.filterOverdueOnly);
    renderRegistryTable();
}

function changeOverdueThreshold(val) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) {
        state.overdueThreshold = n;
        document.getElementById('statOverdueDaysBadge').textContent = n;
        renderRegistryTable();
        updateRegistryStats();
    }
}

function toggleWideTableMode() {
    state.isWideTable = !state.isWideTable;
    const tbl = document.getElementById('registryTableContainer');
    const btn = document.getElementById('btnWideTable');
    if (tbl) {
        if (state.isWideTable) {
            tbl.classList.add('w-[99vw]', 'max-w-[99vw]');
            btn.classList.add('bg-teal-600', 'text-white');
        } else {
            tbl.classList.remove('w-[99vw]', 'max-w-[99vw]');
            btn.classList.remove('bg-teal-600', 'text-white');
        }
    }
}

function calculateDaysInPosition(dateRecorded) {
    if (!dateRecorded) return 0;
    const d = new Date(dateRecorded);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

function renderRegistryTable() {
    const tbody = document.getElementById('registryTableBody');
    const empty = document.getElementById('registryTableEmptyState');
    if (!tbody) return;

    let docs = state.documents;
    if (state.filterOverdueOnly) {
        docs = docs.filter(d => {
            const days = calculateDaysInPosition(d.date_recorded);
            return days >= state.overdueThreshold && d.present_position !== 'Dispatched / Outed' && d.present_position !== 'Completed';
        });
    }

    if (docs.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');

    tbody.innerHTML = docs.map((d, index) => {
        const days = calculateDaysInPosition(d.date_recorded);
        const isOverdue = days >= state.overdueThreshold && d.present_position !== 'Dispatched / Outed' && d.present_position !== 'Completed';
        const rowCls = isOverdue ? 'row-overdue' : '';

        const flowBadge = d.flow_type === 'OUTGOING'
            ? `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:5px;letter-spacing:0.04em;background:rgba(129,140,248,0.12);color:#a5b4fc;border:1px solid rgba(129,140,248,0.25)">📤 OUTGOING</span>`
            : `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.6rem;font-weight:700;padding:2px 7px;border-radius:5px;letter-spacing:0.04em;background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.25)">📥 INCOMING</span>`;

        const overdueBadge = isOverdue
            ? `<span style="font-size:0.6rem;font-weight:700;padding:2px 6px;border-radius:4px;background:rgba(244,63,94,0.15);color:#fb7185;border:1px solid rgba(244,63,94,0.35);display:inline-block;margin-top:3px">⚠ ${days}d OVERDUE</span>`
            : (days > 0 ? `<span style="font-size:0.6rem;color:#4e637d;font-family:ui-monospace,monospace;margin-top:3px;display:inline-block">${days}d</span>` : '');

        const pos = d.present_position || 'Received';
        let posStyle = 'background:rgba(30,41,59,0.9);color:#8fa3bf;border:1px solid rgba(255,255,255,0.10)';
        if (/dispatch|outed/i.test(pos))                 posStyle = 'background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.30)';
        else if (/action|progress|implement/i.test(pos)) posStyle = 'background:rgba(20,184,166,0.15);color:#2dd4bf;border:1px solid rgba(20,184,166,0.30)';
        else if (/received|inbox/i.test(pos))            posStyle = 'background:rgba(251,191,36,0.12);color:#fbbf24;border:1px solid rgba(251,191,36,0.28)';
        else if (/complete|done|closed/i.test(pos))      posStyle = 'background:rgba(52,211,153,0.12);color:#34d399;border:1px solid rgba(52,211,153,0.28)';
        else if (/filed|archive/i.test(pos))             posStyle = 'background:rgba(148,163,184,0.10);color:#94a3b8;border:1px solid rgba(148,163,184,0.22)';
        else if (/letter|drafted|studio/i.test(pos))     posStyle = 'background:rgba(129,140,248,0.13);color:#818cf8;border:1px solid rgba(129,140,248,0.28)';
        else if (/refer|forward/i.test(pos))             posStyle = 'background:rgba(251,146,60,0.12);color:#fb923c;border:1px solid rgba(251,146,60,0.25)';

        return `
            <tr class="${rowCls}" style="border-bottom:1px solid rgba(255,255,255,0.05);transition:background 150ms ease" onmouseover="if(!this.classList.contains('row-overdue'))this.style.background='rgba(255,255,255,0.025)'" onmouseout="if(!this.classList.contains('row-overdue'))this.style.background=''">
                <td style="padding:10px 12px;text-align:center;color:#4e637d;font-family:ui-monospace,monospace;font-size:0.62rem">${index + 1}</td>
                <td style="padding:10px 12px">
                    <span style="font-family:ui-monospace,monospace;font-weight:800;color:#2dd4bf;font-size:0.7rem;display:block;letter-spacing:0.03em">${d.ref_no}</span>
                    ${d.sender_ref_no ? `<span style="font-size:0.6rem;color:#4e637d;font-family:ui-monospace,monospace">Ref: ${d.sender_ref_no}</span>` : ''}
                </td>
                <td style="padding:10px 12px">
                    ${flowBadge}
                    <span style="display:block;font-size:0.62rem;color:#8fa3bf;margin-top:4px;font-weight:500">${d.sender_source_category || d.category || 'General'}</span>
                </td>
                <td style="padding:10px 12px;font-size:0.65rem;white-space:nowrap">
                    <span style="display:block;color:#e8edf5;font-weight:600">${d.date_recorded || '—'}</span>
                    ${d.date_letter ? `<span style="display:block;color:#4e637d;font-size:0.6rem">Ltr: ${d.date_letter}</span>` : ''}
                </td>
                <td style="padding:10px 12px;font-size:0.7rem">
                    <span style="font-weight:700;color:#e8edf5;display:block">${d.sender_or_recipient || '—'}</span>
                    ${d.contact_no ? `<span style="font-size:0.6rem;color:#4e637d;font-family:ui-monospace,monospace">📞 ${d.contact_no}</span>` : ''}
                </td>
                <td style="padding:10px 12px">
                    <p style="font-weight:700;color:#e8edf5;font-size:0.7rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4">${d.subject || '—'}</p>
                    ${d.scope_description ? `<p style="font-size:0.6rem;color:#4e637d;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px">${d.scope_description}</p>` : ''}
                </td>
                <td style="padding:10px 12px">
                    <span style="font-size:0.62rem;font-weight:700;padding:2px 8px;border-radius:6px;${posStyle};display:inline-block;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${pos}">${pos}</span>
                    ${overdueBadge}
                </td>
                <td style="padding:10px 12px;font-size:0.65rem">
                    ${d.directed_to ? `<span style="font-size:0.62rem;font-weight:700;padding:2px 7px;border-radius:5px;background:rgba(20,184,166,0.10);color:#2dd4bf;border:1px solid rgba(20,184,166,0.22);display:inline-block;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${d.directed_to}">${d.directed_to}</span>` : '<span style="color:#4e637d">—</span>'}
                    ${d.project_name ? `<span style="font-size:0.6rem;color:#4e637d;display:block;margin-top:3px;max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${d.project_name}">${d.project_name}</span>` : ''}
                </td>
                <td style="padding:10px 12px;font-family:ui-monospace,monospace;font-size:0.62rem;color:#4e637d">
                    ${d.file_no || '—'}
                </td>
                <td style="padding:10px 12px">
                    <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px">
                        <button type="button" onclick="openUpdatePositionModalForDoc('${d.id}')" style="padding:5px 7px;border-radius:7px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);color:#818cf8;cursor:pointer;font-size:0.75rem;transition:all 150ms" title="Update Position" onmouseover="this.style.background='rgba(99,102,241,0.28)'" onmouseout="this.style.background='rgba(99,102,241,0.12)'">🔄</button>
                        <button type="button" onclick="openOutingModalForDoc('${d.id}')" style="padding:5px 7px;border-radius:7px;background:rgba(129,140,248,0.10);border:1px solid rgba(129,140,248,0.22);color:#a5b4fc;cursor:pointer;font-size:0.75rem;transition:all 150ms" title="Outing / Dispatch" onmouseover="this.style.background='rgba(129,140,248,0.28)'" onmouseout="this.style.background='rgba(129,140,248,0.10)'">📦</button>
                        <button type="button" onclick="createMinuteFromDoc('${d.id}')" style="padding:5px 7px;border-radius:7px;background:rgba(20,184,166,0.10);border:1px solid rgba(20,184,166,0.22);color:#2dd4bf;cursor:pointer;font-size:0.75rem;transition:all 150ms" title="Create Minute Sheet" onmouseover="this.style.background='rgba(20,184,166,0.28)'" onmouseout="this.style.background='rgba(20,184,166,0.10)'">📜</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateRegistryStats() {
    const total = state.documents.length;
    let incoming = 0;
    let outgoing = 0;
    let active = 0;
    let overdue = 0;

    state.documents.forEach(d => {
        if (d.flow_type === 'OUTGOING') outgoing++;
        else incoming++;

        if (d.present_position !== 'Dispatched / Outed' && d.present_position !== 'Completed') {
            active++;
        }

        const days = calculateDaysInPosition(d.date_recorded);
        if (days >= state.overdueThreshold && d.present_position !== 'Dispatched / Outed' && d.present_position !== 'Completed') {
            overdue++;
        }
    });

    document.getElementById('statTotalDocs').textContent = total;
    document.getElementById('statIncomingDocs').textContent = incoming;
    document.getElementById('statOutgoingDocs').textContent = outgoing;
    document.getElementById('statActiveDocs').textContent = active;
    document.getElementById('statOverdueDocs').textContent = overdue;
}

function refreshRegistryData() {
    fetchRegistryData();
}

// =============================================================================
// NEW DOCUMENT MODAL & PREFIX GENERATION
// =============================================================================
function openNewDocumentModal() {
    document.getElementById('docEntryId').value = '';
    document.getElementById('docEntrySection').value = state.currentOffice;
    onDocEntrySectionChange(state.currentOffice);
    document.getElementById('docEntryDateRecorded').value = new Date().toISOString().split('T')[0];
    document.getElementById('docEntrySubject').value = '';
    document.getElementById('docEntrySenderOrRecipient').value = '';
    document.getElementById('docEntrySenderRefNo').value = '';
    document.getElementById('docEntryFileNo').value = '';

    const modal = document.getElementById('modalNewDocument');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeNewDocumentModal() {
    const modal = document.getElementById('modalNewDocument');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function onDocEntrySectionChange(sec) {
    const catSelect = document.getElementById('docEntryCategory');
    const cats = OFFICE_CATEGORIES[sec] || OFFICE_CATEGORIES.cced_writer;
    catSelect.innerHTML = cats.filter(c => c.id !== 'ALL').map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    onDocEntryFlowTypeChange(document.getElementById('docEntryFlowType').value);
}

function onDocEntryFlowTypeChange(flow) {
    const isOut = flow === 'OUTGOING';
    document.getElementById('lblDocSenderOrRecipient').innerHTML = isOut ? 'Recipient / Addressee <span class="text-rose-500">*</span>' : 'Sender / Department <span class="text-rose-500">*</span>';
    const autoBtn = document.getElementById('btnDocEntryAutoRef');
    if (autoBtn) autoBtn.style.display = isOut ? 'inline-block' : 'none';
}

function onDocEntryCategoryChange() {
    // If outgoing, generate preview ref
}

async function generateRefForDocEntry() {
    const sec = document.getElementById('docEntrySection').value;
    const cat = document.getElementById('docEntryCategory').value;
    try {
        const res = await fetch(`api.php?action=generate_ref&section=${encodeURIComponent(sec)}&category=${encodeURIComponent(cat)}`);
        const json = await res.json();
        if (json.success && json.ref_no) {
            document.getElementById('docEntryRefNo').value = json.ref_no;
        }
    } catch (e) {
        console.error('Error generating ref:', e);
    }
}

async function submitNewDocument(e) {
    e.preventDefault();
    const payload = {
        id: document.getElementById('docEntryId').value || undefined,
        office_section: document.getElementById('docEntrySection').value,
        flow_type: document.getElementById('docEntryFlowType').value,
        sender_source_category: document.getElementById('docEntryCategory').value,
        ref_no: document.getElementById('docEntryRefNo').value.trim(),
        sender_or_recipient: document.getElementById('docEntrySenderOrRecipient').value.trim(),
        sender_ref_no: document.getElementById('docEntrySenderRefNo').value.trim(),
        date_letter: document.getElementById('docEntryDateLetter').value || null,
        date_recorded: document.getElementById('docEntryDateRecorded').value,
        priority: document.getElementById('docEntryPriority').value,
        subject: document.getElementById('docEntrySubject').value.trim(),
        directed_to: document.getElementById('docEntryDirectedTo').value,
        file_no: document.getElementById('docEntryFileNo').value.trim(),
        present_position: 'Received / In Registry'
    };

    try {
        const res = await fetch('api.php?action=documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            closeNewDocumentModal();
            fetchRegistryData();
        } else {
            alert('Error saving document: ' + (json.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error saving document:', err);
    }
}

// =============================================================================
// PRESENT POSITION & OUTING MODALS
// =============================================================================
function openUpdatePositionModalForDoc(docId) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    document.getElementById('uppDocId').value = doc.id;
    document.getElementById('uppDocRefBadge').textContent = `Ref: ${doc.ref_no} — ${doc.subject}`;
    document.getElementById('uppPositionSelect').value = doc.present_position || 'Under Scrutiny by CCEO';
    const fromInput = document.getElementById('uppOfficerFromInput');
    if (fromInput) fromInput.value = doc.action_officer || doc.directed_to || 'Registry / Current Desk';
    document.getElementById('uppOfficerInput').value = '';
    document.getElementById('uppRemarksInput').value = '';

    renderTimelineTrail(doc.position_trail || []);

    const modal = document.getElementById('modalUpdatePosition');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeUpdatePositionModal() {
    const modal = document.getElementById('modalUpdatePosition');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function renderTimelineTrail(trail) {
    const container = document.getElementById('uppTrailTimeline');
    if (!container) return;
    if (!trail || trail.length === 0) {
        container.innerHTML = '<p class="text-slate-400 italic text-center p-3">No movement logs recorded yet.</p>';
        return;
    }

    container.innerHTML = trail.slice().reverse().map(item => `
        <div class="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 shadow-2xs">
            <div class="flex items-center justify-between">
                <span class="font-bold text-blue-700 dark:text-blue-300">${escapeHtml(item.action_status || item.stage || 'Update')}</span>
                <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(item.timestamp || item.date || '')}</span>
            </div>
            ${item.officer_from || item.to_officer ? `
                <div class="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    <span class="text-slate-500">From:</span> <strong>${escapeHtml(item.officer_from || '-')}</strong>
                    <span class="text-blue-500 font-bold">➔</span>
                    <span class="text-slate-500">To:</span> <strong>${escapeHtml(item.to_officer || item.officer || '-')}</strong>
                </div>
            ` : `
                <span class="text-[10px] text-slate-400 block">Officer: ${escapeHtml(item.officer || '-')}</span>
            `}
            ${item.remarks ? `<p class="text-slate-600 dark:text-slate-400 text-[11px] italic bg-white dark:bg-slate-900/60 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">${escapeHtml(item.remarks)}</p>` : ''}
        </div>
    `).join('');
}

async function submitPositionUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('uppDocId').value;
    const pos = document.getElementById('uppPositionSelect').value;
    const officerFrom = document.getElementById('uppOfficerFromInput')?.value.trim() || '';
    const toOfficer = document.getElementById('uppOfficerInput').value.trim();
    const remarks = document.getElementById('uppRemarksInput').value.trim();

    try {
        const res = await fetch('api.php?action=update_position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                present_position: pos,
                action_officer: toOfficer,
                officer_from: officerFrom,
                to_officer: toOfficer,
                remarks
            })
        });
        const json = await res.json();
        if (json.success) {
            closeUpdatePositionModal();
            fetchRegistryData();
        } else {
            alert('Error updating position: ' + (json.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error updating position:', err);
    }
}

function openOutingModalForDoc(docId) {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;
    document.getElementById('outingDocId').value = doc.id;
    document.getElementById('outingDocRefBadge').textContent = `Ref: ${doc.ref_no} — ${doc.subject}`;
    document.getElementById('outingBookRef').value = doc.dispatch_book_ref || '';
    document.getElementById('outingFolioNo').value = doc.folio_no || '';
    document.getElementById('outingMessenger').value = '';
    document.getElementById('outingRemarks').value = '';

    const modal = document.getElementById('modalOuting');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function openOutingModal() {
    if (state.documents.length === 0) {
        alert('Please register or select a document first.');
        return;
    }
    openOutingModalForDoc(state.documents[0].id);
}

function closeOutingModal() {
    const modal = document.getElementById('modalOuting');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function submitOutingRecord(e) {
    e.preventDefault();
    const payload = {
        id: document.getElementById('outingDocId').value,
        dispatch_mode: document.getElementById('outingDispatchMode').value,
        dispatch_book_ref: document.getElementById('outingBookRef').value.trim(),
        messenger: document.getElementById('outingMessenger').value.trim(),
        folio_no: document.getElementById('outingFolioNo').value.trim(),
        remarks: document.getElementById('outingRemarks').value.trim()
    };

    try {
        const res = await fetch('api.php?action=save_outing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            closeOutingModal();
            fetchRegistryData();
        }
    } catch (err) {
        console.error('Error saving outing:', err);
    }
}

function printDispatchSlipFromModal() {
    const docId = document.getElementById('outingDocId').value;
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    const mode = document.getElementById('outingDispatchMode').value;
    const book = document.getElementById('outingBookRef').value;
    const messenger = document.getElementById('outingMessenger').value;
    const folio = document.getElementById('outingFolioNo').value;

    const slipHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #000; width: 148mm; margin: 0 auto; box-sizing: border-box;">
            <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
                <h2 style="margin: 0; font-size: 14pt; font-weight: bold;">SRI LANKA NAVY</h2>
                <h3 style="margin: 2px 0; font-size: 11pt;">OFFICIAL DISPATCH / OUTING FOLIO SLIP</h3>
                <span style="font-size: 9pt; font-family: monospace;">COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)</span>
            </div>
            <table style="width: 100%; font-size: 10pt; line-height: 1.8;">
                <tr><td><strong>Register Ref No:</strong></td><td style="font-family: monospace; font-weight: bold;">${doc.ref_no}</td></tr>
                <tr><td><strong>Dispatch Book Ref:</strong></td><td style="font-family: monospace;">${book || '-'}</td></tr>
                <tr><td><strong>Folio Slip No:</strong></td><td>${folio || '-'}</td></tr>
                <tr><td><strong>Dispatch Mode:</strong></td><td>${mode}</td></tr>
                <tr><td><strong>Addressee / Recipient:</strong></td><td><strong>${doc.sender_or_recipient || '-'}</strong></td></tr>
                <tr><td><strong>Subject:</strong></td><td>${doc.subject}</td></tr>
                <tr><td><strong>Handling Messenger:</strong></td><td>${messenger || '-'}</td></tr>
                <tr><td><strong>Date & Time:</strong></td><td>${new Date().toLocaleString()}</td></tr>
            </table>
            <div style="margin-top: 30px; display: flex; justify-content: space-between; font-size: 9pt; border-top: 1px dashed #000; padding-top: 15px;">
                <div style="text-align: center; width: 45%;">
                    <div style="height: 35px;"></div>
                    <span>_____________________________</span><br>
                    <strong>Registry Dispatch Clerk</strong>
                </div>
                <div style="text-align: center; width: 45%;">
                    <div style="height: 35px;"></div>
                    <span>_____________________________</span><br>
                    <strong>Recipient Acknowledgment Signature</strong>
                </div>
            </div>
        </div>
    `;

    printIsolatedHTML(slipHTML, "Dispatch Folio Slip - " + doc.ref_no);
}

// =============================================================================
// 2. MINUTE SHEET SECTION ENGINE
// =============================================================================
function switchMinuteSubTab(subTab) {
    document.querySelectorAll('[id^="msSubTab-"]').forEach(btn => {
        btn.classList.remove('bg-teal-600', 'text-white', 'shadow-xs', 'font-bold');
        btn.classList.add('font-medium', 'text-slate-300');
    });
    const activeBtn = document.getElementById(`msSubTab-${subTab}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-teal-600', 'text-white', 'shadow-xs', 'font-bold');
        activeBtn.classList.remove('font-medium', 'text-slate-300');
    }

    document.getElementById('msPanel-builder').classList.add('hidden');
    document.getElementById('msPanel-templates').classList.add('hidden');
    document.getElementById('msPanel-saved').classList.add('hidden');

    const panel = document.getElementById(`msPanel-${subTab}`);
    if (panel) panel.classList.remove('hidden');

    if (subTab === 'builder') updateMinutePreview();
}

function initMinuteSheetBuilder() {
    renderMinuteAddresseesInputs();
    renderMinuteParagraphsInputs();
    populateMinuteDropdowns();

    // Sync sliders with initial state
    const divSlider = document.getElementById('msDividerWidthSlider');
    if (divSlider) divSlider.value = state.ms.dividerWidth || 100;
    const divBadge = document.getElementById('msDividerWidthBadge');
    if (divBadge) divBadge.textContent = `${state.ms.dividerWidth || 100}%`;

    const rmSlider = document.getElementById('msRightMarginSlider');
    if (rmSlider) rmSlider.value = state.ms.rightMargin || 20;
    const rmBadge = document.getElementById('msRightMarginBadge');
    if (rmBadge) rmBadge.textContent = `${state.ms.rightMargin || 20} mm`;

    const fsSlider = document.getElementById('msFontSizeSlider');
    if (fsSlider) fsSlider.value = state.ms.fontSize || 11;
    const fsBadge = document.getElementById('msFontSizeBadge');
    if (fsBadge) fsBadge.textContent = `${(state.ms.fontSize || 11).toFixed(1)} pt`;

    const lhSlider = document.getElementById('msLineHeightSlider');
    if (lhSlider) lhSlider.value = state.ms.lineHeight || 1.65;
    const lhBadge = document.getElementById('msLineHeightBadge');
    if (lhBadge) lhBadge.textContent = (state.ms.lineHeight || 1.65).toFixed(2);

    const mSeqInput = document.getElementById('msInputMinuteSeq');
    if (mSeqInput) mSeqInput.value = state.ms.minuteSeq || 'M 01';

    const mOrigTagInput = document.getElementById('msInputOriginatorTag');
    if (mOrigTagInput) mOrigTagInput.value = state.ms.originatorTag || 'BY CCEO(E)';

    updateMinutePreview();
}

function setMinuteLang(lang) {
    state.ms.lang = lang;
    const isSi = lang === 'si';
    document.getElementById('btnMsLangSi').className = isSi
        ? 'px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all'
        : 'px-3 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-400 transition-all';
    document.getElementById('btnMsLangEn').className = !isSi
        ? 'px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs transition-all'
        : 'px-3 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-400 transition-all';

    populateMinuteDropdowns();
    updateMinutePreview();
}

function onMinuteDividerWidthSlider(val) {
    state.ms.dividerWidth = parseInt(val, 10);
    const badge = document.getElementById('msDividerWidthBadge');
    if (badge) badge.textContent = `${val}%`;
    updateMinutePreview();
}

function onMinuteRightMarginSlider(val) {
    state.ms.rightMargin = parseInt(val, 10);
    const badge = document.getElementById('msRightMarginBadge');
    if (badge) badge.textContent = `${val} mm`;
    updateMinutePreview();
}

function onMinuteFontSizeSlider(val) {
    state.ms.fontSize = parseFloat(val);
    const badge = document.getElementById('msFontSizeBadge');
    if (badge) badge.textContent = `${parseFloat(val).toFixed(1)} pt`;
    updateMinutePreview();
}

function onMinuteLineHeightSlider(val) {
    state.ms.lineHeight = parseFloat(val);
    const badge = document.getElementById('msLineHeightBadge');
    if (badge) badge.textContent = parseFloat(val).toFixed(2);
    updateMinutePreview();
}

function setMinuteFont(font) {
    state.ms.fontFamily = font;
    updateMinutePreview();
}

function autoShrinkMinuteToFit() {
    const paper = document.getElementById('minuteLivePaper');
    if (!paper) return;

    // A4 printable height boundary
    const maxHeight = 1040;
    let curFontSize = state.ms.fontSize || 11;
    let curLineHeight = state.ms.lineHeight || 1.65;
    let adjusted = false;

    for (let i = 0; i < 8; i++) {
        if (paper.scrollHeight <= maxHeight) break;
        if (curFontSize > 8.5) {
            curFontSize -= 0.5;
            curLineHeight = Math.max(1.4, curLineHeight - 0.05);
            adjusted = true;
            state.ms.fontSize = curFontSize;
            state.ms.lineHeight = curLineHeight;
            updateMinutePreview();
        } else {
            break;
        }
    }

    const fsSlider = document.getElementById('msFontSizeSlider');
    if (fsSlider) fsSlider.value = curFontSize;
    const fsBadge = document.getElementById('msFontSizeBadge');
    if (fsBadge) fsBadge.textContent = `${curFontSize.toFixed(1)} pt`;

    const lhSlider = document.getElementById('msLineHeightSlider');
    if (lhSlider) lhSlider.value = curLineHeight;
    const lhBadge = document.getElementById('msLineHeightBadge');
    if (lhBadge) lhBadge.textContent = curLineHeight.toFixed(2);

    updateMinutePreview();
    alert(`Auto-calibrated typography: ${curFontSize.toFixed(1)}pt with ${curLineHeight.toFixed(2)} leading to fit single A4 page.`);
}

function applyOriginatorTagPreset(val) {
    if (!val) return;
    state.ms.originatorTag = val;
    const input = document.getElementById('msInputOriginatorTag');
    if (input) input.value = val;
    updateMinutePreview();
}

function renderMinuteAddresseesInputs() {
    const container = document.getElementById('msAddresseesContainer');
    if (!container) return;

    container.innerHTML = state.ms.addressees.map((addr, idx) => `
        <div class="flex items-center gap-1.5">
            <input type="text" value="${escapeHtml(addr)}" oninput="state.ms.addressees[${idx}]=this.value; updateMinutePreview();" placeholder="Addressee Designation" class="flex-1 px-2.5 py-1.5 border border-amber-300 dark:border-amber-800 rounded-lg text-xs bg-white dark:bg-slate-900 outline-none">
            ${state.ms.addressees.length > 1 ? `
                <button type="button" onclick="removeMinuteAddresseeRow(${idx})" class="w-6 h-6 rounded bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold flex items-center justify-center">✕</button>
            ` : ''}
        </div>
    `).join('');
}

function addMinuteAddresseeRow() {
    state.ms.addressees.push('');
    renderMinuteAddresseesInputs();
    updateMinutePreview();
}

function removeMinuteAddresseeRow(idx) {
    if (state.ms.addressees.length > 1) {
        state.ms.addressees.splice(idx, 1);
        renderMinuteAddresseesInputs();
        updateMinutePreview();
    }
}

function renderMinuteParagraphsInputs() {
    const container = document.getElementById('msParagraphsContainer');
    if (!container) return;

    container.innerHTML = state.ms.paragraphs.map((p, idx) => `
        <div class="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div class="flex items-center justify-between">
                <span class="font-bold text-slate-700 dark:text-slate-300 text-xs">${p.num || `0${idx + 1}.`}</span>
                <div class="flex items-center gap-1">
                    <button type="button" onclick="formatParaText(${idx}, 'b')" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold">B</button>
                    <button type="button" onclick="formatParaText(${idx}, 'u')" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] underline">U</button>
                    ${state.ms.paragraphs.length > 1 ? `
                        <button type="button" onclick="removeMinuteParagraphRow(${idx})" class="text-rose-600 hover:text-rose-800 text-[10px] font-bold ml-1">Remove</button>
                    ` : ''}
                </div>
            </div>
            <textarea id="msParaText_${idx}" oninput="state.ms.paragraphs[${idx}].text=this.value; updateMinutePreview();" rows="2" placeholder="Enter paragraph content..." class="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 outline-none">${escapeHtml(p.text || '')}</textarea>
        </div>
    `).join('');
}

function addMinuteParagraphRow() {
    const nextNum = String(state.ms.paragraphs.length + 1).padStart(2, '0') + '.';
    state.ms.paragraphs.push({ num: nextNum, text: '' });
    renderMinuteParagraphsInputs();
    updateMinutePreview();
}

function removeMinuteParagraphRow(idx) {
    if (state.ms.paragraphs.length > 1) {
        state.ms.paragraphs.splice(idx, 1);
        renumberMinuteParagraphs();
        renderMinuteParagraphsInputs();
        updateMinutePreview();
    }
}

function renumberMinuteParagraphs() {
    state.ms.paragraphs.forEach((p, i) => {
        p.num = String(i + 1).padStart(2, '0') + '.';
    });
}

function formatParaText(paraIdx, tag) {
    const el = document.getElementById(`msParaText_${paraIdx}`);
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    if (start === end) return;
    const sel = val.substring(start, end);
    const replacement = `<${tag}>${sel}</${tag}>`;
    el.value = val.substring(0, start) + replacement + val.substring(end);
    state.ms.paragraphs[paraIdx].text = el.value;
    updateMinutePreview();
}

function toggleM02Section(enabled) {
    state.ms.m02Enabled = enabled;
    const el = document.getElementById('msM02FieldsContainer');
    if (el) el.classList.toggle('hidden', !enabled);
    updateMinutePreview();
}

function populateMinuteDropdowns() {
    const cfg = state.settings.minute_config[state.ms.lang] || {};

    // Originators
    const origSelect = document.getElementById('msOriginatorSelect');
    if (origSelect) {
        origSelect.innerHTML = '<option value="">-- Choose Originator --</option>' +
            (cfg.originators || []).map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
    }

    // Signatories
    const signSelect = document.getElementById('msSignatorySelect');
    if (signSelect) {
        signSelect.innerHTML = '<option value="">-- Presets --</option>' +
            (cfg.signatoryTitles || []).map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    }

    // M-02 Endorsement phrases
    const m02Select = document.getElementById('msM02EndorsementPreset');
    if (m02Select) {
        m02Select.innerHTML = '<option value="">-- Quick Phrases --</option>' +
            (cfg.endorsements || []).map(e => `<option value="${escapeHtml(e)}">${escapeHtml(e)}</option>`).join('');
    }
}

function applyMinuteOriginatorPreset(val) {
    if (val) {
        state.ms.originator = val;
        document.getElementById('msInputOriginator').value = val;
        updateMinutePreview();
    }
}

function applyMinuteSignatoryPreset(val) {
    if (val) {
        state.ms.signatory = val;
        document.getElementById('msInputSignatory').value = val;
        updateMinutePreview();
    }
}

function applyM02EndorsementPhrase(val) {
    if (val) {
        state.ms.m02Text = val;
        document.getElementById('msM02InputText').value = val;
        updateMinutePreview();
    }
}

function populateSailorsDropdowns() {
    const sailors = state.meta.sailors || [];
    const msSelect = document.getElementById('msSailorInsertSelect');
    if (msSelect) {
        msSelect.innerHTML = '<option value="">👤 Insert Sailor</option>' +
            sailors.slice(0, 150).map(s => `<option value="${s.official_number}">${s.official_number} - ${s.rank_rate || ''} ${s.call_name || s.full_name}</option>`).join('');
    }
}

function insertSailorIntoMinute(officialNumber) {
    if (!officialNumber) return;
    const sailor = (state.meta.sailors || []).find(s => s.official_number === officialNumber);
    if (!sailor) return;

    let insertion = `${sailor.rank_rate || ''} ${sailor.full_name || sailor.call_name} (${sailor.official_number})`;
    if (state.ms.lang === 'si') {
        const siRank = convertRankToSinhala(sailor.rank_rate || '');
        insertion = `${siRank} ${sailor.call_name || sailor.full_name} (නිල අංක ${sailor.official_number})`;
    }

    if (state.ms.paragraphs.length > 0) {
        const lastIdx = state.ms.paragraphs.length - 1;
        state.ms.paragraphs[lastIdx].text += (state.ms.paragraphs[lastIdx].text ? ' ' : '') + insertion;
        renderMinuteParagraphsInputs();
        updateMinutePreview();
    }
    document.getElementById('msSailorInsertSelect').value = '';
}

const NAVAL_RANKS_SINHALA = {
    'Commander (CE)': 'කොමදෝරු (සිවිල්)',
    'Lt Cdr (CE)': 'ලුතිනන් කොමදෝරු (සිවිල්)',
    'Lieutenant (CE)': 'ලුතිනන් (සිවිල්)',
    'Sub Lieutenant (CE)': 'උප ලුතිනන් (සිවිල්)',
    'MCPO': 'ප්‍රධාන බලලත් නිලධාරී',
    'FCPO': 'බලඇණි ප්‍රධාන බලලත් නිලධාරී',
    'CPO': 'බලලත් නිලධාරී',
    'PO': 'සුළු නිලධාරී',
    'Leading Seaman': 'නායක නාවික',
    'Leading': 'නායක නාවික',
    'Able Seaman': 'නැවැත්',
    'AB': 'නැවැත්',
    'Ordinary Seaman': 'සාමාන්‍ය නැවැත්',
    'OD': 'සාමාන්‍ය නැවැත්'
};

function convertRankToSinhala(rank) {
    if (!rank) return '';
    for (const [k, v] of Object.entries(NAVAL_RANKS_SINHALA)) {
        if (rank.toLowerCase().includes(k.toLowerCase())) return v;
    }
    return rank;
}

function onRankSelectChange(val) {
    const resInput = document.getElementById('rankSinhalaResult');
    if (!resInput) return;
    resInput.value = convertRankToSinhala(val);
}

function insertTransliteratedRankToPara() {
    const resInput = document.getElementById('rankSinhalaResult');
    const val = resInput ? resInput.value.trim() : '';
    if (!val) {
        alert('Please select or lookup a rank first.');
        return;
    }
    if (state.ms.paragraphs.length > 0) {
        const lastIdx = state.ms.paragraphs.length - 1;
        state.ms.paragraphs[lastIdx].text += (state.ms.paragraphs[lastIdx].text ? ' ' : '') + val;
        renderMinuteParagraphsInputs();
        updateMinutePreview();
    }
}

function setTransliteratedRankToSign() {
    const resInput = document.getElementById('rankSinhalaResult');
    const val = resInput ? resInput.value.trim() : '';
    if (!val) {
        alert('Please select or lookup a rank first.');
        return;
    }
    state.ms.signatory = val;
    const signInput = document.getElementById('msInputSignatory');
    if (signInput) signInput.value = val;
    updateMinutePreview();
}

function populateMinuteAutofillDropdown() {
    const sel = document.getElementById('msAutofillSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">⚡ Autofill from Registry Minute</option>' +
        state.documents.slice(0, 50).map(d => `<option value="${d.id}">${d.ref_no} — ${d.subject.substring(0, 35)}...</option>`).join('');
}

function autoFillMinuteFromRegistry(docId) {
    if (!docId) return;
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    state.ms.refNo = doc.ref_no;
    state.ms.subject = doc.subject;
    state.ms.date = doc.date_recorded || state.ms.date;
    if (doc.scope_description) {
        state.ms.paragraphs = [
            { num: '01.', text: doc.scope_description }
        ];
    }

    document.getElementById('msInputRefNo').value = state.ms.refNo;
    document.getElementById('msInputSubject').value = state.ms.subject;
    document.getElementById('msInputDate').value = state.ms.date;
    renderMinuteParagraphsInputs();
    updateMinutePreview();
}

function createMinuteFromDoc(docId) {
    switchMainTab('minutesheet');
    autoFillMinuteFromRegistry(docId);
}

function resetMinuteForm() {
    state.ms.subject = '';
    state.ms.paragraphs = [{ num: '01.', text: '' }];
    document.getElementById('msInputSubject').value = '';
    renderMinuteParagraphsInputs();
    updateMinutePreview();
}

async function autoGenerateMinuteRef() {
    try {
        const res = await fetch('api.php?action=generate_ref&section=minute_sheet&category=Dockyard+%26+ENA+Departments');
        const json = await res.json();
        if (json.success && json.ref_no) {
            state.ms.refNo = json.ref_no;
            document.getElementById('msInputRefNo').value = json.ref_no;
            updateMinutePreview();
        }
    } catch (e) {
        console.error('Error generating minute ref:', e);
    }
}

// Live Paper Rendering (Pic 1, 2, 3 Layout)
function updateMinutePreview() {
    const paper = document.getElementById('minuteLivePaper');
    if (!paper) return;

    const ref = document.getElementById('msInputRefNo')?.value || state.ms.refNo;
    const date = document.getElementById('msInputDate')?.value || state.ms.date;
    const subj = document.getElementById('msInputSubject')?.value || state.ms.subject;
    const orig = document.getElementById('msInputOriginator')?.value || state.ms.originator;
    const rec = document.getElementById('msInputRecommendation')?.value || state.ms.recommendation;
    const sign = document.getElementById('msInputSignatory')?.value || state.ms.signatory;

    const mSeq = document.getElementById('msInputMinuteSeq')?.value || state.ms.minuteSeq || 'M 01';
    const mOrigTag = document.getElementById('msInputOriginatorTag')?.value || state.ms.originatorTag || 'BY CCEO(E)';

    const divPct = state.ms.dividerWidth || 33;
    const rMargin = state.ms.rightMargin || 20;
    const fontFam = state.ms.fontFamily || "'Abhaya Libre', serif";
    const fontSz = state.ms.fontSize || 11;
    let lineLeading = state.ms.lineHeight || 1.65;
    if (state.ms.lang === 'si' && lineLeading < 1.6) {
        lineLeading = 1.6;
    }

    const addrs = state.ms.addressees.filter(a => a.trim() !== '');
    const headerTitle = state.ms.lang === 'si' ? 'සටහන් පත / MINUTE SHEET' : 'MINUTE SHEET';

    const paragraphsHtml = state.ms.paragraphs.map(p => `
        <div style="margin-bottom: 12px; display: flex; align-items: flex-start; text-align: justify; line-height: ${lineLeading};">
            <span style="font-weight: bold; width: 32px; shrink: 0;">${p.num || ''}</span>
            <div style="flex: 1;">${p.text || ''}</div>
        </div>
    `).join('');

    const m02Html = state.ms.m02Enabled ? `
        <div class="ms-m02-divider" style="border-top: 1.5px dashed #000; margin-top: 20px; padding-top: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div style="width: ${divPct}%; padding-right: 15px;">
                    <strong>${escapeHtml(document.getElementById('msM02InputAddressee')?.value || state.ms.m02Addressee)}</strong>
                </div>
                <div style="flex: 1; text-align: right;">
                    <span>${escapeHtml(document.getElementById('msM02InputOriginator')?.value || state.ms.m02Originator)}</span>
                </div>
            </div>
            <div style="margin: 10px 0; text-align: justify; line-height: ${lineLeading};">
                ${escapeHtml(document.getElementById('msM02InputText')?.value || state.ms.m02Text)}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px;">
                <div style="font-size: 9.5pt;">
                    ${escapeHtml(document.getElementById('msM02InputDate')?.value || state.ms.m02Date)}
                </div>
                <div style="text-align: right; width: 220px;">
                    <div style="height: 35px;"></div>
                    <span>............................................................</span><br>
                    <strong>${escapeHtml(document.getElementById('msM02InputSignatory')?.value || state.ms.m02Signatory)}</strong>
                </div>
            </div>
        </div>
    ` : '';

    paper.style.fontFamily = fontFam;
    paper.style.fontSize = `${fontSz}pt`;
    paper.style.lineHeight = lineLeading;
    paper.style.paddingRight = `${rMargin}mm`;

    paper.innerHTML = `
        <!-- Vertical Divider Line -->
        <div class="minute-divider-bar" style="position: absolute; top: 0; bottom: 0; left: calc(${divPct}% + 15px); width: 1.5px; background-color: #000;"></div>

        <!-- Central Minute Sequence Number Badge -->
        <div style="text-align: center; margin-bottom: 6px;">
            <span class="ms-central-badge">${escapeHtml(mSeq)}</span>
        </div>

        <!-- Official Header -->
        <div class="ms-header-title" style="text-align: center; font-weight: 800; font-size: 13pt; border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 5px;">
            ${headerTitle}
        </div>

        <!-- Underlined Originator Tag -->
        <div style="text-align: center; margin-bottom: 14px;">
            <span class="ms-originator-underlined">${escapeHtml(mOrigTag)}</span>
        </div>

        <!-- Header Grid: Addressees on Left, Ref & Date on Right -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; min-height: 80px; margin-bottom: 15px;">
            <div style="width: ${divPct}%; padding-right: 15px;">
                ${addrs.map(a => `<div style="font-weight: bold; margin-bottom: 6px;">${escapeHtml(a)}</div>`).join('')}
            </div>
            <div style="flex: 1; padding-left: 25px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                    <span>${escapeHtml(orig)}</span>
                    <span style="font-family: monospace; font-weight: bold;">${escapeHtml(ref)}</span>
                </div>
                <div style="text-align: right; font-size: 9.5pt; margin-bottom: 15px;">
                    ${escapeHtml(date)}
                </div>
            </div>
        </div>

        <!-- Subject Line -->
        <div style="margin: 15px 0 15px 0; font-weight: bold; font-size: 11.5pt; text-decoration: underline; text-underline-offset: 4px;">
            ${escapeHtml(subj)}
        </div>

        <!-- Paragraphs Content -->
        <div style="min-height: 140px;">
            ${paragraphsHtml}
        </div>

        <!-- Recommendation -->
        ${rec ? `<div style="margin: 12px 0; text-align: justify; line-height: ${lineLeading};">${escapeHtml(rec)}</div>` : ''}

        <!-- Signatory Block -->
        <div style="display: flex; justify-content: flex-end; margin-top: 30px;">
            <div style="text-align: right; width: 240px;">
                <div style="height: 35px;"></div>
                <span>............................................................</span><br>
                <strong>${escapeHtml(sign)}</strong>
            </div>
        </div>

        <!-- Optional M-02 Block -->
        ${m02Html}
    `;

    // Also sync to Studio Print preview if modal is active
    if (!document.getElementById('modalMinutePrintStudio').classList.contains('hidden')) {
        syncMinutePrintStudioPreview();
    }
}

// Minute Sheet Print Studio Modal
function openMinutePrintStudioModal() {
    updateMinutePreview();
    const modal = document.getElementById('modalMinutePrintStudio');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    syncMinutePrintStudioPreview();
}

function closeMinutePrintStudioModal() {
    const modal = document.getElementById('modalMinutePrintStudio');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function syncMinutePrintStudioPreview() {
    const canvas = document.getElementById('msStudioPaperCanvas');
    const live = document.getElementById('minuteLivePaper');
    if (!canvas || !live) return;

    canvas.innerHTML = live.innerHTML;
    canvas.style.fontFamily = live.style.fontFamily;
    canvas.style.fontSize = live.style.fontSize;

    const paperSize = document.getElementById('msPrintPaperSize')?.value || 'A4';
    if (paperSize === 'Legal') {
        canvas.style.minHeight = '356mm';
    } else {
        canvas.style.minHeight = '297mm';
    }

    const mLeft = document.getElementById('msPrintMarginLeft')?.value || 20;
    const mRight = document.getElementById('msPrintMarginRight')?.value || 20;
    const mTop = document.getElementById('msPrintMarginTop')?.value || 20;
    const mBottom = document.getElementById('msPrintMarginBottom')?.value || 20;
    canvas.style.padding = `${mTop}mm ${mRight}mm ${mBottom}mm ${mLeft}mm`;

    applyMinuteStudioZoom(state.msPrintZoom);
}

function adjustMinuteStudioZoom(delta) {
    state.msPrintZoom = Math.max(40, Math.min(200, state.msPrintZoom + delta));
    applyMinuteStudioZoom(state.msPrintZoom);
}

function setMinuteStudioZoomFit() {
    state.msPrintZoom = 85;
    applyMinuteStudioZoom(state.msPrintZoom);
}

function applyMinuteStudioZoom(zoom) {
    const canvas = document.getElementById('msStudioPaperCanvas');
    const badge = document.getElementById('msStudioZoomBadge');
    if (canvas) canvas.style.transform = `scale(${zoom / 100})`;
    if (badge) badge.textContent = `${zoom}%`;
}

function executeMinuteDirectPrint() {
    const canvas = document.getElementById('msStudioPaperCanvas');
    if (!canvas) return;
    printIsolatedHTML(canvas.innerHTML, "Naval Minute Sheet - " + state.ms.refNo);
}

async function saveMinuteRecord() {
    const payload = {
        ref_no: document.getElementById('msInputRefNo')?.value || state.ms.refNo,
        date_received: document.getElementById('msInputDate')?.value || state.ms.date,
        subject: document.getElementById('msInputSubject')?.value || state.ms.subject,
        end_user: document.getElementById('msInputOriginator')?.value || state.ms.originator,
        description: state.ms.paragraphs.map(p => `${p.num || ''} ${p.text || ''}`).join('\n\n'),
        position: 'Under Scrutiny by CCEO',
        position_trail: [
            {
                officer_from: 'Minute Sheet Studio',
                to_officer: 'CCEO(East)',
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                action_status: 'Minute Drafted & Saved',
                remarks: `Minute Sheet generated for: ${state.ms.subject}`
            }
        ]
    };

    try {
        const res = await fetch('api.php?action=job_minutes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            alert(`Minute Sheet Record (${payload.ref_no}) saved to database and registry successfully.`);
            fetchRegistryData();
        } else {
            alert('Error saving minute sheet: ' + (json.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error saving minute sheet:', e);
    }
}

function saveMinuteAsTemplatePrompt() {
    const title = prompt('Enter Template Name:', state.ms.subject || 'Standard Minute Sheet Template');
    if (!title) return;

    const payload = {
        title,
        lang: state.ms.lang,
        subject: state.ms.subject,
        addressees: state.ms.addressees,
        originator: state.ms.originator,
        paragraphs: state.ms.paragraphs,
        recommendation: state.ms.recommendation,
        sign_title: state.ms.signatory,
        m02_enabled: state.ms.m02Enabled ? 1 : 0,
        m02_addressee: state.ms.m02Addressee,
        m02_originator: state.ms.m02Originator,
        m02_text: state.ms.m02Text,
        m02_sign_title: state.ms.m02Signatory
    };

    fetch('api.php?action=minute_templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        fetchMinuteTemplates();
        alert('Template saved to inventory.');
    });
}

function renderMinuteTemplatesGrid() {
    const container = document.getElementById('msTemplatesGrid');
    if (!container) return;

    container.innerHTML = state.minuteTemplates.map(t => `
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs hover:border-teal-500 transition-all">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300">${t.category || 'General'}</span>
                <span class="text-[10px] font-mono text-slate-400">${t.lang === 'si' ? '🇱🇰 සිංහල' : '🇬🇧 English'}</span>
            </div>
            <h4 class="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">${t.title}</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2">${t.subject || 'No subject'}</p>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1">
                <button type="button" onclick="loadMinuteTemplateIntoBuilder('${t.id}')" class="px-3 py-1 rounded-lg text-xs font-bold bg-teal-600 text-white shadow-2xs">
                    Use in Builder
                </button>
            </div>
        </div>
    `).join('');
}

function loadMinuteTemplateIntoBuilder(tplId) {
    const tpl = state.minuteTemplates.find(t => t.id === tplId);
    if (!tpl) return;

    state.ms.lang = tpl.lang || 'si';
    state.ms.subject = tpl.subject || '';
    state.ms.originator = tpl.originator || state.ms.originator;
    state.ms.recommendation = tpl.recommendation || state.ms.recommendation;
    state.ms.signatory = tpl.sign_title || state.ms.signatory;
    state.ms.m02Enabled = !!tpl.m02_enabled;
    state.ms.m02Addressee = tpl.m02_addressee || state.ms.m02Addressee;
    state.ms.m02Originator = tpl.m02_originator || state.ms.m02Originator;
    state.ms.m02Text = tpl.m02_text || state.ms.m02Text;
    state.ms.m02Signatory = tpl.m02_sign_title || state.ms.m02Signatory;

    if (tpl.paragraphs && Array.isArray(tpl.paragraphs) && tpl.paragraphs.length > 0) {
        state.ms.paragraphs = tpl.paragraphs;
    }

    switchMinuteSubTab('builder');
    initMinuteSheetBuilder();
}

// =============================================================================
// 3. LETTER STUDIO (NAVY BR 7) ENGINE
// =============================================================================
function switchLetterSubTab(subTab) {
    document.querySelectorAll('[id^="ltrSubTab-"]').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-xs', 'font-bold');
        btn.classList.add('font-medium', 'text-slate-300');
    });
    const activeBtn = document.getElementById(`ltrSubTab-${subTab}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-blue-600', 'text-white', 'shadow-xs', 'font-bold');
        activeBtn.classList.remove('font-medium', 'text-slate-300');
    }

    document.getElementById('ltrPanel-drafting').classList.add('hidden');
    document.getElementById('ltrPanel-templates').classList.add('hidden');
    document.getElementById('ltrPanel-drafts').classList.add('hidden');

    const panel = document.getElementById(`ltrPanel-${subTab}`);
    if (panel) panel.classList.remove('hidden');

    if (subTab === 'drafting') updateLetterPreview();
}

function initLetterStudio() {
    renderLetterReferences();
    renderLetterParagraphs();
    renderLetterEnclosures();
    renderLetterCopyTo();
    populateLetterPresets();
    updateLetterPreview();
}

const REF_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T'];
const SUB_PARA_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => c !== 'i' && c !== 'o');

function toRomanLower(num) {
    const lookup = [
        [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']
    ];
    let roman = '';
    for (const [v, r] of lookup) {
        while (num >= v) {
            roman += r;
            num -= v;
        }
    }
    return roman || 'i';
}

function formatNavalDate(d, type = 'internal') {
    const date = d ? new Date(d) : new Date();
    const day = date.getDate();
    const year = date.getFullYear();
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (type === 'internal') {
        const dd = String(day).padStart(2, '0');
        const mon = monthsShort[date.getMonth()];
        const yy = String(year).slice(-2);
        return `${dd} ${mon} ${yy}`;
    } else {
        const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                       (day === 2 || day === 22) ? 'nd' :
                       (day === 3 || day === 23) ? 'rd' : 'th';
        const monthLong = monthsLong[date.getMonth()];
        return `${day}${suffix} ${monthLong} ${year}`;
    }
}

function setLetterDateFormat(type) {
    state.ltr.dateFormat = type;
    const formatted = formatNavalDate(new Date(), type);
    state.ltr.date = formatted;
    const input = document.getElementById('ltrInputDate');
    if (input) input.value = formatted;
    updateLetterPreview();
}

function setSubjectAlignment(align) {
    state.ltr.subjectAlign = align;
    const btnLeft = document.getElementById('btnSubjAlignLeft');
    const btnCenter = document.getElementById('btnSubjAlignCenter');
    if (align === 'center') {
        if (btnCenter) btnCenter.className = 'px-2 py-0.5 rounded bg-blue-600 text-white font-bold';
        if (btnLeft) btnLeft.className = 'px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium';
    } else {
        if (btnLeft) btnLeft.className = 'px-2 py-0.5 rounded bg-blue-600 text-white font-bold';
        if (btnCenter) btnCenter.className = 'px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium';
    }
    updateLetterPreview();
}

function setLetterTone(tone) {
    state.ltr.br7Tone = tone;
    document.querySelectorAll('.tone-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-amber-600', 'text-white', 'font-bold');
        btn.classList.add('font-medium', 'bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    });
    const active = document.getElementById(`toneBtn-${tone}`);
    if (active) {
        active.classList.add('active', 'bg-amber-600', 'text-white', 'font-bold');
        active.classList.remove('font-medium', 'bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
    }

    let salutation = '';
    let compClose = '';
    let opening = '';

    switch (tone) {
        case 'junior_to_senior':
            salutation = 'Sir,';
            compClose = 'I remain, Sir, Your obedient Servant,';
            opening = 'I have the honour to submit for your kind consideration that ';
            break;
        case 'senior_to_junior':
            salutation = ''; // Strictly omitted
            compClose = ''; // Strictly omitted
            opening = 'You are requested to ';
            break;
        case 'equal_to_equal':
            salutation = 'Sir,';
            compClose = 'Yours faithfully,';
            opening = 'I have the honour to refer to ';
            break;
        case 'do_letter':
            salutation = 'Dear Commander,';
            compClose = 'Yours aye,';
            opening = 'I am writing to you personally regarding ';
            break;
    }

    state.ltr.salutation = salutation;
    state.ltr.complimentaryClose = compClose;

    const salInput = document.getElementById('ltrInputSalutation');
    if (salInput) salInput.value = salutation;

    const closeInput = document.getElementById('ltrInputCompClose');
    if (closeInput) closeInput.value = compClose;

    if (state.ltr.paragraphs.length > 0) {
        const first = state.ltr.paragraphs[0];
        if (!first.text || first.text.trim() === '' ||
            first.text.startsWith('I have the honour') ||
            first.text.startsWith('You are requested') ||
            first.text.startsWith('I am writing to you')) {
            first.text = opening;
            renderLetterParagraphs();
        }
    }

    updateLetterPreview();
}

function sortLetterReferencesChronological() {
    const parseRefDate = (str) => {
        if (!str) return 0;
        const m = str.match(/dated\s+([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+[0-9]{2,4})/i) ||
                  str.match(/dated\s+([0-9]{1,2}[\/\-.][0-9]{1,2}[\/\-.][0-9]{2,4})/i) ||
                  str.match(/([0-9]{4}[\/\-.][0-9]{1,2}[\/\-.][0-9]{1,2})/);
        if (m) {
            const cleaned = m[1].replace(/(st|nd|rd|th)/, '');
            const timestamp = Date.parse(cleaned);
            if (!isNaN(timestamp)) return timestamp;
        }
        return 0;
    };

    state.ltr.references.sort((a, b) => {
        const da = parseRefDate(a);
        const db = parseRefDate(b);
        if (da && db) return da - db;
        return 0;
    });

    renderLetterReferences();
    updateLetterPreview();
}

function renderLetterReferences() {
    const container = document.getElementById('ltrReferencesContainer');
    if (!container) return;
    if (state.ltr.references.length === 0) {
        container.innerHTML = '<p class="text-[10px] text-slate-400 italic">No references added. Click "+ Add Ref" if referring to prior letters or signals.</p>';
        return;
    }

    container.innerHTML = state.ltr.references.map((ref, idx) => `
        <div class="flex items-center gap-1.5">
            <span class="font-bold text-[10px] font-mono text-blue-800 dark:text-blue-300 w-6">${REF_LETTERS[idx] || String.fromCharCode(65 + idx)}.</span>
            <input type="text" value="${escapeHtml(ref)}" oninput="state.ltr.references[${idx}]=this.value; updateLetterPreview();" placeholder="e.g. NHQ Letter NHQ/CE/2026/042 dated 10 Sep 26" class="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-900 outline-none">
            <button type="button" onclick="removeLetterReferenceRow(${idx})" class="w-5 h-5 rounded bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">✕</button>
        </div>
    `).join('');
}

function addLetterReferenceRow() {
    state.ltr.references.push('');
    renderLetterReferences();
    updateLetterPreview();
}

function removeLetterReferenceRow(idx) {
    state.ltr.references.splice(idx, 1);
    renderLetterReferences();
    updateLetterPreview();
}

function renumberLetterParagraphs() {
    const paras = state.ltr.paragraphs;
    if (!paras || paras.length === 0) return;

    // Single paragraph rule: if there is only 1 paragraph in total and it is level 1, it remains unnumbered
    if (paras.length === 1 && (paras[0].level || 1) === 1) {
        paras[0].num = '';
        paras[0].level = 1;
        return;
    }

    let l1Count = 0;
    let l2Count = 0;
    let l3Count = 0;
    let l4Count = 0;

    paras.forEach(p => {
        const lvl = p.level || 1;
        p.level = lvl;

        if (lvl === 1) {
            l1Count++;
            l2Count = 0;
            l3Count = 0;
            l4Count = 0;
            p.num = `${l1Count}.`;
        } else if (lvl === 2) {
            l2Count++;
            l3Count = 0;
            l4Count = 0;
            const letter = SUB_PARA_LETTERS[(l2Count - 1) % SUB_PARA_LETTERS.length] || 'a';
            p.num = `(${letter})`;
        } else if (lvl === 3) {
            l3Count++;
            l4Count = 0;
            p.num = `(${l3Count})`;
        } else if (lvl >= 4) {
            l4Count++;
            p.num = `(${toRomanLower(l4Count)})`;
        }
    });
}

function renderLetterParagraphs() {
    const container = document.getElementById('ltrParagraphsContainer');
    if (!container) return;

    renumberLetterParagraphs();

    container.innerHTML = state.ltr.paragraphs.map((p, idx) => {
        const lvl = p.level || 1;
        const indentPx = (lvl - 1) * 20;
        const lvlName = lvl === 1 ? 'Main' : lvl === 2 ? 'Sub (a)' : lvl === 3 ? 'Sub (1)' : 'Sub (i)';
        const lvlBadgeColor = lvl === 1
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
            : lvl === 2
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
            : lvl === 3
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200';

        return `
            <div class="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 transition-all" style="margin-left: ${indentPx}px;">
                <div class="flex items-center justify-between flex-wrap gap-1">
                    <div class="flex items-center gap-1.5">
                        <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${lvlBadgeColor}">${lvlName}</span>
                        <span class="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">${p.num || '(unnumbered)'}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <!-- Hierarchy Indent / Outdent -->
                        <button type="button" onclick="outdentLetterParagraph(${idx})" ${lvl <= 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''} title="Outdent / Promote" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold">←</button>
                        <button type="button" onclick="indentLetterParagraph(${idx})" ${lvl >= 4 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''} title="Indent / Demote" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-bold">→</button>
                        <button type="button" onclick="addLetterSubParagraph(${idx})" title="Add child sub-paragraph" class="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[10px] font-bold">+ Sub</button>

                        <!-- Move Up / Down -->
                        <button type="button" onclick="moveLetterParagraph(${idx}, -1)" ${idx === 0 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''} title="Move Up" class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">▲</button>
                        <button type="button" onclick="moveLetterParagraph(${idx}, 1)" ${idx === state.ltr.paragraphs.length - 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''} title="Move Down" class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">▼</button>

                        <!-- Formatting -->
                        <button type="button" onclick="formatLtrParaText(${idx}, 'b')" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">B</button>
                        <button type="button" onclick="formatLtrParaText(${idx}, 'u')" class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] underline">U</button>

                        <!-- Remove -->
                        ${state.ltr.paragraphs.length > 1 ? `
                            <button type="button" onclick="removeLetterParagraphRow(${idx})" class="text-rose-600 hover:text-rose-800 text-[11px] font-bold ml-1">✕</button>
                        ` : ''}
                    </div>
                </div>
                <textarea id="ltrParaText_${idx}" oninput="state.ltr.paragraphs[${idx}].text=this.value; updateLetterPreview();" rows="2" placeholder="Paragraph text..." class="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 outline-none">${escapeHtml(p.text || '')}</textarea>
            </div>
        `;
    }).join('');
}

function addLetterParagraphRow(level = 1) {
    state.ltr.paragraphs.push({
        level: level,
        num: '',
        text: ''
    });
    renumberLetterParagraphs();
    renderLetterParagraphs();
    updateLetterPreview();
}

function addLetterSubParagraph(parentIdx) {
    const parent = state.ltr.paragraphs[parentIdx];
    const parentLvl = parent ? (parent.level || 1) : 1;
    const subLvl = Math.min(4, parentLvl + 1);

    state.ltr.paragraphs.splice(parentIdx + 1, 0, {
        level: subLvl,
        num: '',
        text: ''
    });
    renumberLetterParagraphs();
    renderLetterParagraphs();
    updateLetterPreview();
}

function indentLetterParagraph(idx) {
    const p = state.ltr.paragraphs[idx];
    if (!p) return;
    if ((p.level || 1) < 4) {
        p.level = (p.level || 1) + 1;
        renumberLetterParagraphs();
        renderLetterParagraphs();
        updateLetterPreview();
    }
}

function outdentLetterParagraph(idx) {
    const p = state.ltr.paragraphs[idx];
    if (!p) return;
    if ((p.level || 1) > 1) {
        p.level = (p.level || 1) - 1;
        renumberLetterParagraphs();
        renderLetterParagraphs();
        updateLetterPreview();
    }
}

function moveLetterParagraph(idx, direction) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= state.ltr.paragraphs.length) return;
    const temp = state.ltr.paragraphs[idx];
    state.ltr.paragraphs[idx] = state.ltr.paragraphs[targetIdx];
    state.ltr.paragraphs[targetIdx] = temp;
    renumberLetterParagraphs();
    renderLetterParagraphs();
    updateLetterPreview();
}

function removeLetterParagraphRow(idx) {
    if (state.ltr.paragraphs.length > 1) {
        state.ltr.paragraphs.splice(idx, 1);
    } else {
        state.ltr.paragraphs = [{ level: 1, num: '', text: '' }];
    }
    renumberLetterParagraphs();
    renderLetterParagraphs();
    updateLetterPreview();
}

function formatLtrParaText(idx, tag) {
    const el = document.getElementById(`ltrParaText_${idx}`);
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    if (start === end) return;
    const sel = val.substring(start, end);
    const rep = `<${tag}>${sel}</${tag}>`;
    el.value = val.substring(0, start) + rep + val.substring(end);
    state.ltr.paragraphs[idx].text = el.value;
    updateLetterPreview();
}

function renderLetterEnclosures() {
    const container = document.getElementById('ltrEnclosuresContainer');
    if (!container) return;
    container.innerHTML = state.ltr.enclosures.map((enc, idx) => `
        <div class="flex items-center gap-1">
            <input type="text" value="${escapeHtml(enc)}" oninput="state.ltr.enclosures[${idx}]=this.value; updateLetterPreview();" placeholder="e.g. Annex A: Cost Estimate" class="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 outline-none">
            <button type="button" onclick="removeLetterEnclosureRow(${idx})" class="text-rose-500 font-bold px-1">✕</button>
        </div>
    `).join('');
}

function addLetterEnclosureRow() {
    state.ltr.enclosures.push('');
    renderLetterEnclosures();
    updateLetterPreview();
}

function removeLetterEnclosureRow(idx) {
    state.ltr.enclosures.splice(idx, 1);
    renderLetterEnclosures();
    updateLetterPreview();
}

function renderLetterCopyTo() {
    const container = document.getElementById('ltrCopyToContainer');
    if (!container) return;

    const activeCopyTo = state.ltr.copyTo.filter(c => c.trim() !== '');
    const badge = document.getElementById('ltrDistCountBadge');
    if (badge) {
        if (activeCopyTo.length > 4) {
            badge.textContent = `${activeCopyTo.length} (See Distribution)`;
            badge.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        } else {
            badge.textContent = `${activeCopyTo.length}`;
            badge.className = 'text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
    }

    container.innerHTML = state.ltr.copyTo.map((cp, idx) => `
        <div class="flex items-center gap-1">
            <input type="text" value="${escapeHtml(cp)}" oninput="state.ltr.copyTo[${idx}]=this.value; renderLetterCopyTo(); updateLetterPreview();" placeholder="Addressee" class="flex-1 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 outline-none">
            <button type="button" onclick="removeLetterCopyToRow(${idx})" class="text-rose-500 font-bold px-1">✕</button>
        </div>
    `).join('');
}

function addLetterCopyToRow() {
    state.ltr.copyTo.push('');
    renderLetterCopyTo();
    updateLetterPreview();
}

function removeLetterCopyToRow(idx) {
    state.ltr.copyTo.splice(idx, 1);
    renderLetterCopyTo();
    updateLetterPreview();
}

function populateLetterPresets() {
    const cfg = state.settings.letter_config || {};
    const addSelect = document.getElementById('ltrAddresseePresetSelect');
    if (addSelect) {
        addSelect.innerHTML = '<option value="">-- Standard Addressees --</option>' +
            (cfg.addressees || []).map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a.split('\n')[0])}</option>`).join('');
    }

    const signSelect = document.getElementById('ltrSignatoryPresetSelect');
    if (signSelect) {
        signSelect.innerHTML = '<option value="">-- Select Officer Profile --</option>' +
            (cfg.signatories || []).map((s, idx) => `<option value="${idx}">${s.rank} ${s.name} (${s.appointment})</option>`).join('');
    }
}

function applyLetterAddresseePreset(val) {
    if (val) {
        state.ltr.addresseeTo = val;
        document.getElementById('ltrInputAddresseeTo').value = val;
        updateLetterPreview();
    }
}

function applyLetterSignatoryPreset(idx) {
    const profile = (state.settings.letter_config.signatories || [])[idx];
    if (profile) {
        state.ltr.signName = profile.name;
        state.ltr.signRank = profile.rank;
        state.ltr.signAppointment = profile.appointment;

        document.getElementById('ltrInputSignName').value = profile.name;
        document.getElementById('ltrInputSignRank').value = profile.rank;
        document.getElementById('ltrInputSignAppointment').value = profile.appointment;
        updateLetterPreview();
    }
}

async function autoGenerateLetterRef() {
    try {
        const res = await fetch('api.php?action=generate_ref&section=cced_writer&category=NHQ');
        const json = await res.json();
        if (json.success && json.ref_no) {
            state.ltr.ref = json.ref_no;
            document.getElementById('ltrInputRef').value = json.ref_no;
            updateLetterPreview();
        }
    } catch (e) {
        console.error('Error generating letter ref:', e);
    }
}

// Live Paper Rendering (Navy BR 7 Military Correspondence)
function updateLetterPreview() {
    const paper = document.getElementById('letterLivePaper');
    if (!paper) return;

    const secClass = document.getElementById('ltrInputSecurityClass')?.value || state.ltr.securityClass || 'RESTRICTED';
    const precedence = document.getElementById('ltrInputPrecedence')?.value || state.ltr.precedence || 'ROUTINE';
    const ref = document.getElementById('ltrInputRef')?.value || state.ltr.ref;
    const fileNo = document.getElementById('ltrInputFileNo')?.value || state.ltr.fileNo;
    const date = document.getElementById('ltrInputDate')?.value || state.ltr.date;
    const office = document.getElementById('ltrInputOffice')?.value || state.ltr.office;
    const station = document.getElementById('ltrInputStation')?.value || state.ltr.station;
    const tel = document.getElementById('ltrInputTel')?.value || state.ltr.tel;
    const to = document.getElementById('ltrInputAddresseeTo')?.value || state.ltr.addresseeTo;
    const through = document.getElementById('ltrInputChannelThrough')?.value || state.ltr.channelThrough;
    const attention = document.getElementById('ltrInputAttention')?.value || state.ltr.attention;
    const subj = document.getElementById('ltrInputSubject')?.value || state.ltr.subject;
    const salutation = document.getElementById('ltrInputSalutation')?.value || state.ltr.salutation;
    const compClose = document.getElementById('ltrInputCompClose')?.value || state.ltr.complimentaryClose;
    const signName = document.getElementById('ltrInputSignName')?.value || state.ltr.signName;
    const signRank = document.getElementById('ltrInputSignRank')?.value || state.ltr.signRank;
    const signAppt = document.getElementById('ltrInputSignAppointment')?.value || state.ltr.signAppointment;
    const signBranch = document.getElementById('ltrInputSignBranch')?.value || '(CE)';
    const postNominals = document.getElementById('ltrInputPostNominals')?.value || '';
    const sdChecked = document.getElementById('ltrInputSdCheckbox')?.checked ?? true;
    const isExternalSLN = document.getElementById('ltrInputIncludeSLN')?.checked ?? false;
    const copyNo = document.getElementById('ltrInputCopyNo')?.value || 1;
    const totalCopies = document.getElementById('ltrInputTotalCopies')?.value || 5;

    // Toggle Secret Meta inputs visibility in sidebar
    const secretInputsContainer = document.getElementById('ltrSecretMetaInputs');
    if (secretInputsContainer) {
        if (secClass === 'SECRET' || secClass === 'TOP SECRET') {
            secretInputsContainer.classList.remove('hidden');
        } else {
            secretInputsContainer.classList.add('hidden');
        }
    }

    let branchStr = signBranch.trim();
    if (isExternalSLN && branchStr && !branchStr.includes('SLN')) {
        branchStr = `${branchStr}, SLN`;
    }

    const referencesHtml = state.ltr.references.filter(r => r.trim() !== '').map((r, i) => `
        <div class="br7-ref-item" style="margin-left: 24px; text-indent: -24px; font-size: 10.5pt; margin-bottom: 3px;">
            <span style="font-weight: bold;">${REF_LETTERS[i] || String.fromCharCode(65 + i)}.</span> ${escapeHtml(r)}
        </div>
    `).join('');

    renumberLetterParagraphs();

    const paragraphsHtml = state.ltr.paragraphs.map(p => {
        const lvl = p.level || 1;
        const indentPx = (lvl - 1) * 24;
        return `
            <div class="br7-para-item br7-para-l${lvl}" style="margin-left: ${indentPx}px; margin-bottom: 12px; display: flex; align-items: flex-start; text-align: justify; font-size: 11pt; line-height: 1.6;">
                ${p.num ? `<span style="font-weight: bold; width: 32px; shrink: 0; display: inline-block;">${p.num}</span>` : ''}
                <div style="flex: 1;">${p.text || ''}</div>
            </div>
        `;
    }).join('');

    const enclosuresHtml = state.ltr.enclosures.filter(e => e.trim() !== '').map(e => `
        <div>• ${escapeHtml(e)}</div>
    `).join('');

    const activeCopyTo = state.ltr.copyTo.filter(c => c.trim() !== '');
    const isWideDistribution = activeCopyTo.length > 4;

    const copyToHtml = activeCopyTo.map(c => `
        <div>• ${escapeHtml(c)}</div>
    `).join('');

    const subjAlign = state.ltr.subjectAlign || 'left';
    const isSeniorToJunior = state.ltr.br7Tone === 'senior_to_junior';

    paper.innerHTML = `
        <!-- Top Security Classification Stamp (Bold, Underlined, Uppercase) -->
        <div class="br7-security-stamp br7-security-${secClass}">
            <u>${secClass}</u>
        </div>

        <!-- Precedence Indicator -->
        <div style="text-align: center; font-size: 9pt; font-weight: 800; letter-spacing: 1px; color: #475569; margin-bottom: 12px;">
            [${precedence}]
        </div>

        <!-- Top Right Copy and Page Numbering for SECRET / TOP SECRET -->
        ${(secClass === 'SECRET' || secClass === 'TOP SECRET') ? `
            <div class="br7-secret-meta" style="position: absolute; top: 22mm; right: 15mm; text-align: right; font-family: monospace; font-size: 8.5pt; font-weight: bold; line-height: 1.3;">
                <div>Copy No. ${escapeHtml(copyNo)} of ${escapeHtml(totalCopies)}</div>
                <div>Page 1 of 1</div>
            </div>
        ` : ''}

        <!-- Naval Letterhead with Crest & Originator Block -->
        <div class="br7-letterhead" style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
            <img src="logo-crest.png" alt="Crest" class="br7-crest-img" style="height: 65px; object-fit: contain;">
            <div class="br7-originator-info" style="text-align: right; font-size: 9pt; line-height: 1.35;">
                <strong style="font-size: 9.5pt; display: block;">${escapeHtml(office)}</strong>
                <span>${escapeHtml(station)}</span><br>
                <span>Tel: ${escapeHtml(tel)}</span><br>
                <div style="margin-top: 6px; font-weight: bold; font-size: 10pt;">${escapeHtml(date)}</div>
            </div>
        </div>

        <!-- Letter Reference & Physical File Number -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 10.5pt; font-family: monospace;">
            <div><strong>My Ref:</strong> ${escapeHtml(ref)}</div>
            ${fileNo ? `<div><strong>File No:</strong> ${escapeHtml(fileNo)}</div>` : ''}
        </div>

        <!-- Addressee & Through Channel -->
        <div style="margin-bottom: 14px; font-size: 11pt; line-height: 1.4;">
            <div style="white-space: pre-line; font-weight: bold;">${escapeHtml(to)}</div>
            ${through ? `<div style="margin-top: 5px; font-style: italic;">${escapeHtml(through)}</div>` : ''}
            ${attention ? `<div style="margin-top: 4px; font-weight: 600; font-size: 10pt;">(${escapeHtml(attention)})</div>` : ''}
        </div>

        <!-- Salutation (Omitted for Senior to Junior) -->
        ${(!isSeniorToJunior && salutation) ? `
            <div style="margin-top: 14px; font-weight: bold; font-size: 11pt;">${escapeHtml(salutation)}</div>
        ` : ''}

        <!-- Subject Heading (3 Lines below Addressee/Salutation, Block Capitals, Bold, Underlined) -->
        <div style="margin-top: 26px; margin-bottom: 16px; text-align: ${subjAlign}; font-weight: 800; font-size: 11.5pt; text-transform: uppercase; text-decoration: underline; text-underline-offset: 4px;">
            ${escapeHtml(subj)}
        </div>

        <!-- References Block (References: A. ... B. ...) -->
        ${referencesHtml ? `
            <div class="br7-ref-block" style="margin: 12px 0 16px 0;">
                <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 4px;">References:</div>
                ${referencesHtml}
            </div>
        ` : ''}

        <!-- Hierarchical Numbered Paragraphs -->
        <div style="margin-top: 14px; min-height: 160px;">
            ${paragraphsHtml}
        </div>

        <!-- Complimentary Close & Signatory Block (Placed Right 5 Lines Below Text) -->
        <div class="br7-sign-block" style="margin-top: 40px; margin-left: auto; width: 280px; text-align: center; font-size: 10.5pt; line-height: 1.4;">
            ${(!isSeniorToJunior && compClose) ? `
                <div style="margin-bottom: 25px; font-style: italic;">
                    ${escapeHtml(compClose)}
                </div>
            ` : ''}
            ${sdChecked ? '<div style="font-style: italic; font-size: 10pt; margin-bottom: 20px;">sd/-</div>' : '<div style="height: 35px;"></div>'}
            <div style="font-weight: 800; text-transform: uppercase; font-size: 11pt; letter-spacing: 0.5px;">
                ${escapeHtml(signName)}${postNominals ? `, <span style="font-weight: 600; text-transform: none; font-size: 10pt;">${escapeHtml(postNominals)}</span>` : ''}
            </div>
            <div style="font-weight: 600;">${escapeHtml(signRank)}${branchStr ? ` ${escapeHtml(branchStr)}` : ''}</div>
            <div style="font-weight: 600;">${escapeHtml(signAppt)}</div>
        </div>

        <!-- Clearfix -->
        <div style="clear: both;"></div>

        <!-- Enclosures & Distribution Block -->
        <div style="margin-top: 30px; font-size: 9.5pt; border-top: 1px dashed #64748b; padding-top: 10px; display: flex; justify-content: space-between;">
            <div style="width: 48%;">
                ${enclosuresHtml ? `<strong>Enclosure(s):</strong>${enclosuresHtml}` : ''}
            </div>
            <div style="width: 48%;">
                ${copyToHtml ? `
                    ${isWideDistribution ? `
                        <strong>Distribution:</strong>
                        <div style="font-style: italic; font-size: 9pt; margin-bottom: 4px;">(See Distribution List below)</div>
                        ${copyToHtml}
                    ` : `
                        <strong>Copy to:</strong>
                        ${copyToHtml}
                    `}
                ` : ''}
            </div>
        </div>

        <!-- Bottom Security Classification Stamp (Bold, Underlined, Uppercase) -->
        <div class="br7-security-stamp br7-security-${secClass}" style="position: absolute; bottom: 18px; left: 0; right: 0;">
            <u>${secClass}</u>
        </div>
    `;

    if (!document.getElementById('modalLetterPrintStudio').classList.contains('hidden')) {
        syncLetterPrintStudioPreview();
    }
}

// Letter Studio Print Studio Modal
function openLetterPrintStudioModal() {
    updateLetterPreview();
    const modal = document.getElementById('modalLetterPrintStudio');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    syncLetterPrintStudioPreview();
}

function closeLetterPrintStudioModal() {
    const modal = document.getElementById('modalLetterPrintStudio');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function syncLetterPrintStudioPreview() {
    const canvas = document.getElementById('ltrStudioPaperCanvas');
    const live = document.getElementById('letterLivePaper');
    if (!canvas || !live) return;

    canvas.innerHTML = live.innerHTML;
    applyLetterStudioZoom(state.ltrPrintZoom);
}

function adjustLetterStudioZoom(delta) {
    state.ltrPrintZoom = Math.max(40, Math.min(200, state.ltrPrintZoom + delta));
    applyLetterStudioZoom(state.ltrPrintZoom);
}

function setLetterStudioZoomFit() {
    state.ltrPrintZoom = 85;
    applyLetterStudioZoom(state.ltrPrintZoom);
}

function applyLetterStudioZoom(zoom) {
    const canvas = document.getElementById('ltrStudioPaperCanvas');
    const badge = document.getElementById('ltrStudioZoomBadge');
    if (canvas) canvas.style.transform = `scale(${zoom / 100})`;
    if (badge) badge.textContent = `${zoom}%`;
}

function executeLetterDirectPrint() {
    const canvas = document.getElementById('ltrStudioPaperCanvas');
    if (!canvas) return;
    printIsolatedHTML(canvas.innerHTML, "Navy BR 7 Letter - " + state.ltr.ref);
}

async function saveLetterDraft() {
    const payload = buildLetterPayload('Draft', false);
    try {
        const res = await fetch('api.php?action=naval_letters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            alert('Letter draft saved successfully.');
            fetchNavalLetters();
        }
    } catch (e) {
        console.error('Error saving letter:', e);
    }
}

async function registerLetterInOutgoingRegistry() {
    const payload = buildLetterPayload('Registered', true);
    try {
        const res = await fetch('api.php?action=naval_letters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
            alert(`Letter successfully registered in Outgoing Registry under Reference: ${state.ltr.ref}`);
            fetchRegistryData();
            fetchNavalLetters();
        }
    } catch (e) {
        console.error('Error registering outgoing letter:', e);
    }
}

function buildLetterPayload(status, isRegistered) {
    return {
        letter_ref: document.getElementById('ltrInputRef')?.value || state.ltr.ref,
        file_no: document.getElementById('ltrInputFileNo')?.value || state.ltr.fileNo,
        letter_date: document.getElementById('ltrInputDate')?.value || state.ltr.date,
        security_class: document.getElementById('ltrInputSecurityClass')?.value || state.ltr.securityClass,
        precedence: document.getElementById('ltrInputPrecedence')?.value || state.ltr.precedence,
        letterhead_office: document.getElementById('ltrInputOffice')?.value || state.ltr.office,
        letterhead_station: document.getElementById('ltrInputStation')?.value || state.ltr.station,
        letterhead_tel: document.getElementById('ltrInputTel')?.value || state.ltr.tel,
        addressee_to: document.getElementById('ltrInputAddresseeTo')?.value || state.ltr.addresseeTo,
        channel_through: document.getElementById('ltrInputChannelThrough')?.value || state.ltr.channelThrough,
        attention: document.getElementById('ltrInputAttention')?.value || state.ltr.attention,
        subject: document.getElementById('ltrInputSubject')?.value || state.ltr.subject,
        subject_alignment: state.ltr.subjectAlign || 'left',
        references_list: state.ltr.references,
        br7_tone: state.ltr.br7Tone,
        salutation: document.getElementById('ltrInputSalutation')?.value || state.ltr.salutation,
        complimentary_close: document.getElementById('ltrInputCompClose')?.value || state.ltr.complimentaryClose,
        paragraphs: state.ltr.paragraphs,
        signatory_name: document.getElementById('ltrInputSignName')?.value || state.ltr.signName,
        signatory_rank: document.getElementById('ltrInputSignRank')?.value || state.ltr.signRank,
        signatory_branch: document.getElementById('ltrInputSignBranch')?.value || '(CE)',
        signatory_appointment: document.getElementById('ltrInputSignAppointment')?.value || state.ltr.signAppointment,
        post_nominals: document.getElementById('ltrInputPostNominals')?.value || '',
        include_sd: document.getElementById('ltrInputSdCheckbox')?.checked ? 1 : 0,
        is_external_sln: document.getElementById('ltrInputIncludeSLN')?.checked ? 1 : 0,
        copy_no: parseInt(document.getElementById('ltrInputCopyNo')?.value || '1', 10),
        total_copies: parseInt(document.getElementById('ltrInputTotalCopies')?.value || '5', 10),
        enclosures_list: state.ltr.enclosures,
        copy_to_list: state.ltr.copyTo,
        is_registered_outgoing: isRegistered ? 1 : 0,
        status: status,
        office_section: state.currentOffice
    };
}

function renderNavalLettersTable() {
    const tbody = document.getElementById('ltrDraftsTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.navalLetters.map(l => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <td class="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">${l.letter_ref}</td>
            <td class="p-3 text-[11px]">${l.letter_date}</td>
            <td class="p-3 text-[11px] font-semibold">${(l.addressee_to || '').split('\n')[0]}</td>
            <td class="p-3 font-medium line-clamp-1">${l.subject}</td>
            <td class="p-3 text-[10px] font-bold"><span class="px-2 py-0.5 rounded bg-rose-50 text-rose-800">${l.security_class}</span></td>
            <td class="p-3 text-[10px] font-bold"><span class="px-2 py-0.5 rounded ${l.is_registered_outgoing ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">${l.status}</span></td>
            <td class="p-3 text-right">
                <button type="button" onclick="loadLetterIntoStudio('${l.id}')" class="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[11px]">Edit</button>
            </td>
        </tr>
    `).join('');
}

function loadLetterIntoStudio(letterId) {
    const l = state.navalLetters.find(x => x.id === letterId);
    if (!l) return;

    state.ltr.ref = l.letter_ref;
    state.ltr.fileNo = l.file_no || '';
    state.ltr.securityClass = l.security_class || 'RESTRICTED';
    state.ltr.precedence = l.precedence || 'ROUTINE';
    state.ltr.addresseeTo = l.addressee_to || '';
    state.ltr.channelThrough = l.channel_through || '';
    state.ltr.attention = l.attention || '';
    state.ltr.subject = l.subject || '';
    state.ltr.subjectAlign = l.subject_alignment || 'left';
    state.ltr.br7Tone = l.br7_tone || 'junior_to_senior';
    state.ltr.salutation = l.salutation || '';
    state.ltr.complimentaryClose = l.complimentary_close || '';
    state.ltr.signName = l.signatory_name || state.ltr.signName;
    state.ltr.signRank = l.signatory_rank || state.ltr.signRank;
    state.ltr.signBranch = l.signatory_branch || '(CE)';
    state.ltr.signAppointment = l.signatory_appointment || state.ltr.signAppointment;
    state.ltr.postNominals = l.post_nominals || '';
    state.ltr.includeSd = l.include_sd !== 0;
    state.ltr.isExternalSLN = !!l.is_external_sln;
    state.ltr.copyNo = l.copy_no || 1;
    state.ltr.totalCopies = l.total_copies || 5;

    if (Array.isArray(l.references_list)) state.ltr.references = l.references_list;
    if (Array.isArray(l.paragraphs)) state.ltr.paragraphs = l.paragraphs;
    if (Array.isArray(l.enclosures_list)) state.ltr.enclosures = l.enclosures_list;
    if (Array.isArray(l.copy_to_list)) state.ltr.copyTo = l.copy_to_list;

    // Sync input fields
    const attInput = document.getElementById('ltrInputAttention');
    if (attInput) attInput.value = state.ltr.attention;
    const brInput = document.getElementById('ltrInputSignBranch');
    if (brInput) brInput.value = state.ltr.signBranch;
    const pnInput = document.getElementById('ltrInputPostNominals');
    if (pnInput) pnInput.value = state.ltr.postNominals;
    const sdCheck = document.getElementById('ltrInputSdCheckbox');
    if (sdCheck) sdCheck.checked = state.ltr.includeSd;
    const slnCheck = document.getElementById('ltrInputIncludeSLN');
    if (slnCheck) slnCheck.checked = state.ltr.isExternalSLN;
    const cnInput = document.getElementById('ltrInputCopyNo');
    if (cnInput) cnInput.value = state.ltr.copyNo;
    const tcInput = document.getElementById('ltrInputTotalCopies');
    if (tcInput) tcInput.value = state.ltr.totalCopies;

    setSubjectAlignment(state.ltr.subjectAlign);

    switchLetterSubTab('drafting');
    initLetterStudio();
}

function renderNavalLetterTemplatesGrid() {
    const container = document.getElementById('ltrTemplatesGrid');
    if (!container) return;

    container.innerHTML = state.navalLetterTemplates.map(t => `
        <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs hover:border-blue-500 transition-all">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300">${t.category || 'BR 7'}</span>
                <span class="text-[10px] font-mono text-rose-600 font-bold">${t.security_class}</span>
            </div>
            <h4 class="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">${t.title}</h4>
            <p class="text-[11px] text-slate-500 line-clamp-2">${t.subject || 'Standard BR 7 format'}</p>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button type="button" onclick="loadLetterTemplateIntoStudio('${t.id}')" class="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-2xs">
                    Draft Letter
                </button>
            </div>
        </div>
    `).join('');
}

function loadLetterTemplateIntoStudio(tplId) {
    const t = state.navalLetterTemplates.find(x => x.id === tplId);
    if (!t) return;

    state.ltr.securityClass = t.security_class || 'RESTRICTED';
    state.ltr.precedence = t.precedence || 'ROUTINE';
    state.ltr.addresseeTo = t.addressee_to || '';
    state.ltr.channelThrough = t.channel_through || '';
    state.ltr.subject = t.subject || '';
    state.ltr.br7Tone = t.br7_tone || 'senior';

    if (Array.isArray(t.references_list)) state.ltr.references = t.references_list;
    if (Array.isArray(t.paragraphs)) state.ltr.paragraphs = t.paragraphs;
    if (Array.isArray(t.enclosures_list)) state.ltr.enclosures = t.enclosures_list;
    if (Array.isArray(t.copy_to_list)) state.ltr.copyTo = t.copy_to_list;

    switchLetterSubTab('drafting');
    initLetterStudio();
}

function saveLetterAsTemplatePrompt() {
    const title = prompt('Enter Template Name:', state.ltr.subject || 'Standard BR 7 Letter Template');
    if (!title) return;

    const payload = {
        title,
        security_class: state.ltr.securityClass,
        precedence: state.ltr.precedence,
        br7_tone: state.ltr.br7Tone,
        addressee_to: state.ltr.addresseeTo,
        channel_through: state.ltr.channelThrough,
        subject: state.ltr.subject,
        references_list: state.ltr.references,
        paragraphs: state.ltr.paragraphs,
        enclosures_list: state.ltr.enclosures,
        copy_to_list: state.ltr.copyTo
    };

    fetch('api.php?action=naval_letter_templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(() => {
        fetchNavalLetterTemplates();
        alert('Template saved to inventory.');
    });
}

// =============================================================================
// 4. SETTINGS & CONFIGURATION ENGINE
// =============================================================================
function switchSettingsTab(subTab) {
    document.querySelectorAll('[id^="setTab-"]').forEach(btn => {
        btn.classList.remove('active', 'bg-white', 'dark:bg-slate-700', 'text-teal-700', 'dark:text-teal-400', 'shadow-2xs');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
    });
    const activeBtn = document.getElementById(`setTab-${subTab}`);
    if (activeBtn) {
        activeBtn.classList.add('active', 'bg-white', 'dark:bg-slate-700', 'text-teal-700', 'dark:text-teal-400', 'shadow-2xs');
        activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
    }

    document.getElementById('setContent-ms_config').classList.add('hidden');
    document.getElementById('setContent-ltr_config').classList.add('hidden');
    document.getElementById('setContent-prefixes').classList.add('hidden');
    document.getElementById('setContent-files').classList.add('hidden');
    document.getElementById('setContent-sync').classList.add('hidden');

    const content = document.getElementById(`setContent-${subTab}`);
    if (content) content.classList.remove('hidden');
}

function switchSettingsMsLang(lang) {
    state.settingsMinuteLang = lang;
    const isSi = lang === 'si';
    document.getElementById('btnSetMsLangSi').className = isSi
        ? 'px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs'
        : 'px-3 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-400';
    document.getElementById('btnSetMsLangEn').className = !isSi
        ? 'px-3 py-1 rounded-lg font-bold bg-teal-600 text-white shadow-xs'
        : 'px-3 py-1 rounded-lg font-medium text-slate-600 dark:text-slate-400';
    renderSettingsLists();
}

function renderSettingsLists() {
    const lang = state.settingsMinuteLang || 'si';
    const cfg = state.settings.minute_config[lang] || {};

    renderConfigItemList('cfgListAddressees', cfg.addressees || [], 'addressees');
    renderConfigItemList('cfgListOriginators', cfg.originators || [], 'originators');
    renderConfigItemList('cfgListSignatoryTitles', cfg.signatoryTitles || [], 'signatoryTitles');
    renderConfigItemList('cfgListEndorsements', cfg.endorsements || [], 'endorsements');

    const ltrCfg = state.settings.letter_config || {};
    renderConfigItemList('cfgListLtrAddressees', ltrCfg.addressees || [], 'ltr_addressees');
    renderConfigItemList('cfgListLtrDistribution', ltrCfg.distribution_presets || [], 'distribution_presets');
}

function renderConfigItemList(containerId, items, type) {
    const c = document.getElementById(containerId);
    if (!c) return;

    c.innerHTML = items.map((it, idx) => `
        <div class="flex items-center justify-between p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
            <span class="truncate flex-1 pr-2">${escapeHtml(it)}</span>
            <button type="button" onclick="deleteConfigItem('${type}', ${idx})" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5">✕</button>
        </div>
    `).join('');
}

function openAddConfigModal(type) {
    const val = prompt('Enter new configuration item:');
    if (!val || !val.trim()) return;

    const lang = state.settingsMinuteLang || 'si';
    if (type === 'ltr_addressees') {
        state.settings.letter_config.addressees.push(val.trim());
    } else if (type === 'distribution_presets') {
        state.settings.letter_config.distribution_presets.push(val.trim());
    } else {
        if (!state.settings.minute_config[lang][type]) state.settings.minute_config[lang][type] = [];
        state.settings.minute_config[lang][type].push(val.trim());
    }
    renderSettingsLists();
}

function deleteConfigItem(type, idx) {
    const lang = state.settingsMinuteLang || 'si';
    if (type === 'ltr_addressees') {
        state.settings.letter_config.addressees.splice(idx, 1);
    } else if (type === 'distribution_presets') {
        state.settings.letter_config.distribution_presets.splice(idx, 1);
    } else {
        state.settings.minute_config[lang][type].splice(idx, 1);
    }
    renderSettingsLists();
}

async function saveSettingsMinuteConfig() {
    try {
        await fetch('api.php?action=settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'minute_config', value: state.settings.minute_config })
        });
        alert('Minute sheet settings saved successfully.');
        populateMinuteDropdowns();
    } catch (e) {
        console.error('Error saving minute config:', e);
    }
}

async function saveSettingsLetterConfig() {
    try {
        await fetch('api.php?action=settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'letter_config', value: state.settings.letter_config })
        });
        alert('Letter Studio settings saved successfully.');
        populateLetterPresets();
    } catch (e) {
        console.error('Error saving letter config:', e);
    }
}

function renderPrefixesTable() {
    const tbody = document.getElementById('cfgPrefixesTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.prefixes.map(p => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <td class="p-3 font-semibold text-slate-700 dark:text-slate-300">${p.office_section}</td>
            <td class="p-3">${p.category}</td>
            <td class="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">${p.prefix_pattern}</td>
            <td class="p-3 font-mono font-bold">${p.next_sequence}</td>
            <td class="p-3 font-mono text-slate-500">${p.prefix_pattern.replace('{YYYY}', '2026').replace('{SEQ}', String(p.next_sequence).padStart(p.padding_length, '0')).replace('{MM}', '10').replace('{YY}', '26')}</td>
            <td class="p-3 text-right">
                <button type="button" onclick="editPrefixSeqPrompt('${p.id}', ${p.next_sequence})" class="text-blue-600 font-bold hover:underline">Edit Seq</button>
            </td>
        </tr>
    `).join('');
}

function editPrefixSeqPrompt(pfxId, curSeq) {
    const n = prompt('Enter new sequential number for this prefix:', curSeq);
    if (!n) return;
    const seq = parseInt(n, 10);
    if (isNaN(seq) || seq < 1) return;

    const pfx = state.prefixes.find(p => p.id === pfxId);
    if (!pfx) return;
    pfx.next_sequence = seq;

    fetch('api.php?action=prefixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pfx)
    }).then(() => {
        fetchPrefixes();
    });
}

function renderFilesTable() {
    const tbody = document.getElementById('cfgFilesTableBody');
    if (!tbody) return;

    tbody.innerHTML = state.files.map(f => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <td class="p-3 font-mono font-bold text-teal-700 dark:text-teal-400">${f.file_no}</td>
            <td class="p-3 font-semibold text-slate-800 dark:text-white">${f.subject}</td>
            <td class="p-3">${f.office_section}</td>
            <td class="p-3 font-mono">${f.file_box_ref || '-'} / ${f.cabinet_location || '-'}</td>
            <td class="p-3 text-[11px]">${f.current_volume || 'Vol 1'} (${f.total_folios || 0} fls)</td>
            <td class="p-3 text-right">
                <button type="button" onclick="selectFileForActiveStudio('${f.file_no}')" class="text-teal-600 font-bold hover:underline">Select</button>
            </td>
        </tr>
    `).join('');
}

function selectFileForActiveStudio(fileNo) {
    if (state.currentMainTab === 'letterstudio') {
        state.ltr.fileNo = fileNo;
        document.getElementById('ltrInputFileNo').value = fileNo;
        updateLetterPreview();
        alert(`Linked File No: ${fileNo} to Letter Studio.`);
    } else {
        alert(`File No: ${fileNo}`);
    }
}

function openAddFileModal() {
    const fileNo = prompt('Enter File Reference Number (e.g. CE/HQ/01/2026):');
    if (!fileNo) return;
    const subj = prompt('Enter File Subject:');
    if (!subj) return;

    fetch('api.php?action=files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            file_no: fileNo,
            subject: subj,
            office_section: state.currentOffice
        })
    }).then(() => {
        fetchFiles();
    });
}

function openPrefixModalForNew() {
    const pat = prompt('Enter Prefix Pattern (use {YYYY}, {MM}, {SEQ}):', 'CCED/EXT/{YYYY}/{SEQ}');
    if (!pat) return;
    const cat = prompt('Enter Office Category name:');
    if (!cat) return;

    fetch('api.php?action=prefixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            office_section: state.currentOffice,
            category: cat,
            prefix_pattern: pat,
            next_sequence: 1,
            padding_length: 4
        })
    }).then(() => {
        fetchPrefixes();
    });
}

function refreshCacheMetadata() {
    fetchMetaAndSettings();
    alert('Metadata cache refreshed.');
}

// Modals open helpers
function openFileRegisterModal() {
    switchMainTab('settings');
    switchSettingsTab('files');
}

function openPrefixSettingsModal() {
    switchMainTab('settings');
    switchSettingsTab('prefixes');
}

// =============================================================================
// NATIVE ISOLATED PRINT ENGINE
// =============================================================================
function printIsolatedHTML(contentHTML, title = "CMSys Documents - Naval Document Print") {
    const iframe = document.getElementById('printDirectIframe');
    if (!iframe) return;

    const doc = iframe.contentWindow || iframe.contentDocument;
    const ifDoc = doc.document || doc;

    ifDoc.open();
    ifDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${escapeHtml(title)}</title>
            <link rel="stylesheet" href="sinhala-fonts.css">
            <link rel="stylesheet" href="style.css">
            <style>
                @page {
                    size: A4 portrait;
                    margin: 25.4mm 15mm 25.4mm 38.1mm;
                }
                @page :first {
                    @top-center { content: ""; }
                }
                .page-break {
                    page-break-after: always;
                    break-after: page;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: #ffffff !important;
                    color: #000000 !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .print-container {
                    width: 100%;
                    margin: 0;
                    box-sizing: border-box;
                    background: #ffffff !important;
                }
                .minute-sheet-paper, .br7-letter-paper {
                    box-shadow: none !important;
                    border: none !important;
                    padding: 0 !important;
                    width: 100% !important;
                    min-height: auto !important;
                }
            </style>
        </head>
        <body>
            <div class="print-container">
                ${contentHTML}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 350);
                };
            </script>
        </body>
        </html>
    `);
    ifDoc.close();
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


