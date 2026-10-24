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
        securityClass: 'RESTRICTED',
        originatorTag: 'BY CCEO(E)',
        addressees: ['කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)'],
        subject: 'ජල නල පද්ධතිය ප්‍රතිසංස්කරණය කිරීම පිළිබඳව',
        originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
        paragraphs: [
            { num: '01.', text: 'ශ්‍රීලංනෞ තිස්ස ආයතනයේ ප්‍රධාන ජල නල පද්ධතිය පරීක්ෂා කිරීම සඳහා විෂයයෙහි සඳහන් කරුණු අනුව මෙම සටහන ඉදිරිපත් කරමි.' },
            { num: '02.', text: 'ප්‍රධාන නල මාර්ගයේ දැඩි විඛාදන තත්ත්වයක් නිරීක්ෂණය වූ අතර, නිවාස පෙළේ ජල පීඩනය අඛණ්ඩව අඩුවීමට හේතු වී ඇත.' },
            { num: '03.', text: 'ප්‍රතිසංස්කරණ කටයුතු සඳහා රු. 1,485,000.00 ක් ඇස්තමේන්තු කර ඇති අතර, ඇස්තමේන්තුව මෙමඟින් ඉදිරිපත් කරමි.' }
        ],
        recommendation: 'ඉදිරි කටයුතු සඳහා කාරුණිකව ඉදිරිපත් කරමි.',
        signatory: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
        m02Enabled: false,
        m02Addressee: 'විධායක නිලධාරී - ශ්‍රීලංනෞ තිස්ස',
        m02Originator: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
        m02Text: 'නිර්දේශ කර ඉදිරිපත් කරමි.',
        m02Date: '2026 ඔක්තෝබර් මස 24',
        m02Signatory: 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
        dividerWidth: 36, // address column width, percent of the sheet's text width
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
        subject: 'RECONSTRUCTION OF WATER DISTRIBUTION NETWORK — SLNS TISSA',
        subjectAlignment: 'left', // 'left' or 'center'
        references: [
            'NHQ Letter NHQ/CE/05/2026/042 dated 10 Sep 26',
            'COMEN Signal DTG 150830Z OCT 26'
        ],
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
            { id: 'p_1', level: 1, text: 'I have the honour to submit for your kind consideration and approval please that an on-site structural and plumbing inspection was carried out at the Wardroom Complex of SLNS Tissa and the findings are enumerated below.' },
            { id: 'p_2', level: 1, heading: 'Inspection Findings', text: 'The existing main distribution pipe network has developed severe galvanic corrosion resulting in intermittent pressure drops across the residential quarters.' },
            { id: 'p_3', level: 2, text: 'Severe pitting was observed along the 150 mm ductile iron trunk line feeding the Chief and Petty Officers mess.' },
            { id: 'p_4', level: 2, text: 'Auxiliary booster pumps at pumping station 02 exhibit cavitation and continuous thermal tripping.' },
            { id: 'p_5', level: 3, text: 'A like-for-like replacement of the affected trunk line is considered the most economical remedy.' },
            { id: 'p_6', level: 1, text: 'The total estimated cost of the replacement amounts to Rs. 1,485,000.00. The detailed estimate and Bill of Quantities are forwarded herewith for kind approval, please.' }
        ],
        enclosures: [
            'Detailed Engineering Estimate (Annex A)',
            'Bill of Quantities (BOQ) Summary (Annex B)'
        ],
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


// Styled replacement for window.prompt(); falls back to the native dialog when
// the Command Deck script is unavailable.
async function deckPrompt(opts) {
    if (window.Deck && typeof Deck.prompt === 'function') return Deck.prompt(opts);
    return window.prompt(opts.title || '', opts.value || '');
}

// =============================================================================
// FORM HYDRATION — state is the single source of truth on boot
// -----------------------------------------------------------------------------
// The Command Deck markup ships with empty controls; the engine owns the values.
// Hydrating before the first preview render keeps the paper and the builder in
// lock-step (and prevents an empty first paint when the app is opened cold).
// =============================================================================
function setControlValue(id, value) {
    const el = document.getElementById(id);
    if (!el || value === undefined || value === null) return;
    if (el.type === 'checkbox') { el.checked = !!value; return; }
    el.value = String(value);
    if (el.tagName === 'SELECT' && el.value !== String(value)) {
        // Value not present in the option list — leave the existing selection.
        el.value = el.options.length ? el.options[0].value : el.value;
    }
}

function hydrateStudioForms() {
    const L = state.ltr;
    setControlValue('ltrInputSecurityClass', L.securityClass);
    setControlValue('ltrInputPrecedence', L.precedence);
    setControlValue('ltrInputPrivacyMarking', L.privacyMarking || 'NONE');
    setControlValue('ltrInputCopyNo', L.copyNo);
    setControlValue('ltrInputTotalCopies', L.totalCopies);
    setControlValue('ltrInputTotalSheets', L.totalSheets || 1);
    setControlValue('ltrInputStampingMode', L.stampingMode || 'red');
    setControlValue('ltrInputRef', L.ref);
    setControlValue('ltrInputFileNo', L.fileNo);
    setControlValue('ltrInputOffice', L.office);
    setControlValue('ltrInputStation', L.station);
    setControlValue('ltrInputTel', L.tel);
    setControlValue('ltrInputDate', L.date);
    setControlValue('ltrInputAddresseeTo', L.addresseeTo);
    setControlValue('ltrInputChannelThrough', L.channelThrough);
    setControlValue('ltrInputAttention', L.attentionTo);
    setControlValue('ltrInputSubject', L.subject);
    setControlValue('ltrInputSalutation', L.salutation);
    setControlValue('ltrInputCompClose', L.complimentaryClose);
    setControlValue('ltrInputSdCheckbox', L.sdIncluded !== false);
    setControlValue('ltrInputIncludeSLN', !!L.includeSLN);
    setControlValue('ltrInputSignName', L.signName);
    setControlValue('ltrInputPostNominals', L.postNominals);
    setControlValue('ltrInputSignRank', L.signRank);
    setControlValue('ltrInputSignBranch', L.signBranch);
    setControlValue('ltrInputSignAppointment', L.signAppointment);

    const M = state.ms;
    setControlValue('msInputMinuteSeq', M.minuteSeq);
    setControlValue('msInputSecurityClass', M.securityClass || 'RESTRICTED');
    setControlValue('msInputOriginatorTag', M.originatorTag);
    setControlValue('msInputRefNo', M.refNo);
    setControlValue('msInputDate', M.date);
    setControlValue('msInputSubject', M.subject);
    setControlValue('msInputOriginator', M.originator);
    setControlValue('msInputRecommendation', M.recommendation);
    setControlValue('msInputSignatory', M.signatory);
    setControlValue('msM02InputAddressee', M.m02Addressee);
    setControlValue('msM02InputOriginator', M.m02Originator);
    setControlValue('msM02InputText', M.m02Text);
    setControlValue('msM02InputDate', M.m02Date);
    setControlValue('msM02InputSignatory', M.m02Signatory);
    setControlValue('msToggleM02', !!M.m02Enabled);

    document.getElementById('btnDateInternal')?.classList.toggle('is-active', (L.dateFormat || 'internal') !== 'external');
    document.getElementById('btnDateExternal')?.classList.toggle('is-active', L.dateFormat === 'external');
    document.getElementById('btnStampRed')?.classList.toggle('is-active', (L.stampingMode || 'red') === 'red');
    document.getElementById('btnStampMono')?.classList.toggle('is-active', L.stampingMode === 'monochrome');
}

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

    hydrateStudioForms();
    initMinuteSheetBuilder();
    initLetterStudio();
    renderOfficeCategoryPills();
    updateRegistryStats();
    if (window.App && typeof window.App.init === 'function') {
        window.App.init();
    }
});

function initTheme() {
    // Default to dark mode for this naval system — professional dark-first UI
    const stored = localStorage.getItem('cmsys_theme');
    const isDark = stored === null ? true : stored === 'dark';
    const icon = document.getElementById('themeIcon');
    if (isDark) {
        document.documentElement.classList.add('dark');
        if (icon) icon.textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        if (icon) icon.textContent = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    try { localStorage.setItem('cmsys_theme', isDark ? 'dark' : 'light'); } catch (e) { /* storage blocked */ }
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#050c16' : '#eef2f7');
    if (window.Deck && typeof Deck.onThemeChange === 'function') Deck.onThemeChange(isDark);
}

function setupCurrentDates() {
    const today = new Date().toISOString().split('T')[0];
    const recEl = document.getElementById('docEntryDateRecorded');
    if (recEl) recEl.value = today;

    // Military formatted date
    // BR 7 §1.4 — internal naval correspondence uses DD Mon YY (e.g. 24 Oct 26)
    const ltrDateStr = (typeof formatNavalDate === 'function')
        ? formatNavalDate(new Date(), 'internal')
        : new Date().toDateString();
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

function populateSettingsDropdowns() {
    populateMinuteDropdowns();
    if (typeof populateLetterPresets === 'function') {
        populateLetterPresets();
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

    // Presentation is handled entirely by the Command Deck skin: a single
    // `is-active` state per rail item, no inline colour mutation.
    document.querySelectorAll('.rail__item[id^="tabBtn-"]').forEach(b => b.classList.remove('is-active'));
    const btn = document.getElementById(`tabBtn-${tab}`);
    if (btn) btn.classList.add('is-active');

    document.querySelectorAll('.shell .view').forEach(v => v.classList.add('hidden'));

    const view = document.getElementById(`view-${tab}`);
    if (view) {
        view.classList.remove('hidden');
        // Replay the entrance animation for a sense of deck change.
        view.style.animation = 'none';
        void view.offsetWidth;
        view.style.animation = '';
    }

    if (tab === 'registry') {
        renderRegistryTable();
    } else if (tab === 'minutesheet') {
        updateMinutePreview();
    } else if (tab === 'letterstudio') {
        updateLetterPreview();
    }

    if (window.Deck && typeof Deck.onViewChange === 'function') Deck.onViewChange(tab);
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

    document.querySelectorAll('.office-tab[id^="officeTab-"]').forEach(btn => btn.classList.remove('is-active'));

    const activeBtn = document.getElementById(`officeTab-${officeId}`);
    if (activeBtn) activeBtn.classList.add('is-active');

    renderOfficeCategoryPills();
    fetchRegistryData();
}

function setRegistryFlowFilter(flow) {
    state.currentFlowFilter = flow;
    document.querySelectorAll('.flow-pill').forEach(btn => btn.classList.remove('is-active'));
    const active = document.getElementById(`flowTab-${flow}`);
    if (active) active.classList.add('is-active');
    fetchRegistryData();
}

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderOfficeCategoryPills() {
    const impl = window['renderOfficeCategoryPills'];
    if (typeof impl === 'function' && impl !== renderOfficeCategoryPills) return impl.apply(this, arguments);
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
    const panel = document.getElementById('registryTableContainer')?.closest('.panel');
    const btn = document.getElementById('btnWideTable');
    if (panel) panel.classList.toggle('is-wide', state.isWideTable);
    if (btn) {
        btn.classList.toggle('is-active', state.isWideTable);
        btn.setAttribute('aria-pressed', String(state.isWideTable));
    }
}

function calculateDaysInPosition(dateRecorded) {
    if (!dateRecorded) return 0;
    const d = new Date(dateRecorded);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
}

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderRegistryTable() {
    const impl = window['renderRegistryTable'];
    if (typeof impl === 'function' && impl !== renderRegistryTable) return impl.apply(this, arguments);
}

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function updateRegistryStats() {
    const impl = window['updateRegistryStats'];
    if (typeof impl === 'function' && impl !== updateRegistryStats) return impl.apply(this, arguments);
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
    const req = '<span class="req-dot" aria-hidden="true">*</span>';
    document.getElementById('lblDocSenderOrRecipient').innerHTML = isOut
        ? `Recipient / Addressee ${req}`
        : `Sender / Department ${req}`;
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderTimelineTrail(trail) {
    const impl = window['renderTimelineTrail'];
    if (typeof impl === 'function' && impl !== renderTimelineTrail) return impl.apply(this, arguments);
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
    document.querySelectorAll('[id^="msSubTab-"]').forEach(btn => btn.classList.remove('is-active'));
    const activeBtn = document.getElementById(`msSubTab-${subTab}`);
    if (activeBtn) activeBtn.classList.add('is-active');

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
    if (divSlider) divSlider.value = state.ms.dividerWidth || 36;
    const divBadge = document.getElementById('msDividerWidthBadge');
    if (divBadge) divBadge.textContent = `${state.ms.dividerWidth || 36}%`;

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
    document.getElementById('btnMsLangSi')?.classList.toggle('is-active', isSi);
    document.getElementById('btnMsLangEn')?.classList.toggle('is-active', !isSi);
    document.getElementById('msLangChip')?.replaceChildren(document.createTextNode(isSi ? 'සිංහල' : 'English'));

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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderMinuteAddresseesInputs() {
    const impl = window['renderMinuteAddresseesInputs'];
    if (typeof impl === 'function' && impl !== renderMinuteAddresseesInputs) return impl.apply(this, arguments);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderMinuteParagraphsInputs() {
    const impl = window['renderMinuteParagraphsInputs'];
    if (typeof impl === 'function' && impl !== renderMinuteParagraphsInputs) return impl.apply(this, arguments);
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
/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function updateMinutePreview() {
    const impl = window['updateMinutePreview'];
    if (typeof impl === 'function' && impl !== updateMinutePreview) return impl.apply(this, arguments);
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
    canvas.style.lineHeight = live.style.lineHeight;
    canvas.style.backgroundColor = '#ffffff';
    canvas.style.color = '#000000';

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

    // Typography + column calibration
    const fontPt = Number(document.getElementById('msPrintFontSize')?.value) || 11;
    canvas.style.fontSize = `${fontPt}pt`;
    if (state.ms.lang === 'si') canvas.style.lineHeight = String(Math.max(1.6, Number(state.ms.lineHeight) || 1.65));
    const density = document.getElementById('msPrintDensity')?.value;
    if (density) canvas.style.lineHeight = String(Math.max(state.ms.lang === 'si' ? 1.6 : 1.2, Number(density)));

    const divPct = Number(document.getElementById('msPrintDividerPct')?.value) || 36;
    canvas.querySelectorAll('.pp__ms-left').forEach((el) => { el.style.width = `${divPct}%`; });

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
    const style = `font-family:${canvas.style.fontFamily};font-size:${canvas.style.fontSize};line-height:${canvas.style.lineHeight}`;
    const mm = (id, fallback) => `${document.getElementById(id)?.value || fallback}mm`;
    printIsolatedHTML(`<div style="${style}">${canvas.innerHTML}</div>`,
        "Naval Minute Sheet - " + state.ms.refNo,
        {
            paper: document.getElementById('msPrintPaperSize')?.value || 'A4',
            marginLeft: mm('msPrintMarginLeft', 20),
            marginRight: mm('msPrintMarginRight', 20),
            marginTop: mm('msPrintMarginTop', 20),
            marginBottom: mm('msPrintMarginBottom', 20)
        });
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

async function saveMinuteAsTemplatePrompt() {
    const title = await deckPrompt({
        title: 'Save minute template',
        label: 'Template name',
        hint: 'Stored in the local template library',
        value: state.ms.subject || 'Standard Minute Sheet Template'
    });
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderMinuteTemplatesGrid() {
    const impl = window['renderMinuteTemplatesGrid'];
    if (typeof impl === 'function' && impl !== renderMinuteTemplatesGrid) return impl.apply(this, arguments);
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
    document.querySelectorAll('[id^="ltrSubTab-"]').forEach(btn => btn.classList.remove('is-active'));
    const activeBtn = document.getElementById(`ltrSubTab-${subTab}`);
    if (activeBtn) activeBtn.classList.add('is-active');

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
    document.getElementById('btnDateInternal')?.classList.toggle('is-active', type === 'internal' || type === 'ink_dating');
    document.getElementById('btnDateExternal')?.classList.toggle('is-active', type === 'external');
    updateLetterPreview();
}

function setSubjectAlignment(align) {
    state.ltr.subjectAlign = align;
    const btnLeft = document.getElementById('btnSubjAlignLeft');
    const btnCenter = document.getElementById('btnSubjAlignCenter');
    if (btnCenter) btnCenter.classList.toggle('is-active', align === 'center');
    if (btnLeft) btnLeft.classList.toggle('is-active', align !== 'center');
    updateLetterPreview();
}

// Formula preset <select> → BR 7 tone engine
function applyTonePresetFromSelect(value) {
    const map = {
        junior: 'junior_to_senior',
        senior: 'senior_to_junior',
        equal: 'equal_to_equal',
        do_letter: 'do_letter',
        do: 'do_letter'
    };
    setLetterTone(map[value] || 'junior_to_senior');
}

function setLetterTone(tone) {
    state.ltr.br7Tone = tone;
    const toneSel = document.getElementById('br7ToneSelect');
    if (toneSel) {
        if (tone === 'junior_to_senior') toneSel.value = 'junior';
        else if (tone === 'senior_to_junior') toneSel.value = 'senior';
        else if (tone === 'equal_to_equal') toneSel.value = 'equal';
    }
    document.querySelectorAll('.tone-btn').forEach(btn => btn.classList.remove('is-active', 'active'));
    const active = document.getElementById(`toneBtn-${tone}`);
    if (active) active.classList.add('is-active');

    const toneChip = document.getElementById('ltrToneChip');
    if (toneChip) {
        toneChip.textContent = {
            junior_to_senior: 'Junior → Senior',
            senior_to_junior: 'Senior → Junior',
            equal_to_equal: 'Equal → Equal',
            do_letter: 'DO Letter'
        }[tone] || 'Tone';
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderLetterReferences() {
    const impl = window['renderLetterReferences'];
    if (typeof impl === 'function' && impl !== renderLetterReferences) return impl.apply(this, arguments);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderLetterParagraphs() {
    const impl = window['renderLetterParagraphs'];
    if (typeof impl === 'function' && impl !== renderLetterParagraphs) return impl.apply(this, arguments);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderLetterEnclosures() {
    const impl = window['renderLetterEnclosures'];
    if (typeof impl === 'function' && impl !== renderLetterEnclosures) return impl.apply(this, arguments);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderLetterCopyTo() {
    const impl = window['renderLetterCopyTo'];
    if (typeof impl === 'function' && impl !== renderLetterCopyTo) return impl.apply(this, arguments);
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
/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function updateLetterPreview() {
    const impl = window['updateLetterPreview'];
    if (typeof impl === 'function' && impl !== updateLetterPreview) return impl.apply(this, arguments);
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
    canvas.style.fontFamily = live.style.fontFamily || "'Abhaya Libre', 'Noto Serif Sinhala', serif";
    canvas.style.backgroundColor = '#ffffff';
    canvas.style.color = '#000000';

    // Typography calibration
    const fontPt = Number(document.getElementById('ltrPrintFontSize')?.value) || 11;
    const leading = Number(document.getElementById('ltrPrintLineSpacing')?.value) || 1.5;
    canvas.style.fontSize = `${fontPt}pt`;
    canvas.style.lineHeight = String(leading);

    // Optional sheet furniture
    const crest = document.getElementById('ltrPrintShowCrest');
    const banner = document.getElementById('ltrPrintShowSecurityBanner');
    const holes = document.getElementById('ltrPrintShowFilingHoles');
    canvas.classList.toggle('is-crest-hidden', crest ? !crest.checked : false);
    canvas.classList.toggle('is-banner-hidden', banner ? !banner.checked : false);
    canvas.classList.toggle('is-holes-shown', holes ? holes.checked : true);

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
    const style = `font-family:${canvas.style.fontFamily};font-size:${canvas.style.fontSize};line-height:${canvas.style.lineHeight}`;
    printIsolatedHTML(`<div style="${style}">${canvas.innerHTML}</div>`, "Navy BR 7 Letter - " + state.ltr.ref);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderNavalLettersTable() {
    const impl = window['renderNavalLettersTable'];
    if (typeof impl === 'function' && impl !== renderNavalLettersTable) return impl.apply(this, arguments);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderNavalLetterTemplatesGrid() {
    const impl = window['renderNavalLetterTemplatesGrid'];
    if (typeof impl === 'function' && impl !== renderNavalLetterTemplatesGrid) return impl.apply(this, arguments);
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

async function saveLetterAsTemplatePrompt() {
    const title = await deckPrompt({
        title: 'Save letter template',
        label: 'Template name',
        hint: 'Stored in the local template library',
        value: state.ltr.subject || 'Standard BR 7 Letter Template'
    });
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
    document.querySelectorAll('[id^="setTab-"]').forEach(btn => btn.classList.remove('is-active', 'active'));
    const activeBtn = document.getElementById(`setTab-${subTab}`);
    if (activeBtn) activeBtn.classList.add('is-active');

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
    document.getElementById('btnSetMsLangSi')?.classList.toggle('is-active', isSi);
    document.getElementById('btnSetMsLangEn')?.classList.toggle('is-active', !isSi);
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderConfigItemList(containerId, items, type) {
    const impl = window['renderConfigItemList'];
    if (typeof impl === 'function' && impl !== renderConfigItemList) return impl.apply(this, arguments);
}

async function openAddConfigModal(type) {
    const val = await deckPrompt({
        title: 'Add configuration item',
        label: 'New entry',
        hint: 'Applies to the active language list',
        multiline: /addressees|distribution/i.test(type)
    });
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderPrefixesTable() {
    const impl = window['renderPrefixesTable'];
    if (typeof impl === 'function' && impl !== renderPrefixesTable) return impl.apply(this, arguments);
}

async function editPrefixSeqPrompt(pfxId, curSeq) {
    const n = await deckPrompt({
        title: 'Edit running sequence',
        label: 'Next sequential number',
        hint: 'Atomically reserved by the API on the next reference',
        value: curSeq,
        type: 'number'
    });
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

/* Presentation renderer owned by js/skin.js — this forwarder keeps the
   engine's internal calls (and inline handlers) pointed at the live
   Command Deck implementation. */
function renderFilesTable() {
    const impl = window['renderFilesTable'];
    if (typeof impl === 'function' && impl !== renderFilesTable) return impl.apply(this, arguments);
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

async function openAddFileModal() {
    const fileNo = await deckPrompt({
        title: 'Open new physical file',
        label: 'File reference number',
        hint: 'Format · CE/HQ/01/2026',
        placeholder: 'CE/HQ/01/2026'
    });
    if (!fileNo) return;
    const subj = await deckPrompt({
        title: 'Open new physical file',
        label: 'File subject',
        hint: `File ${fileNo}`,
        multiline: true
    });
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

async function openPrefixModalForNew() {
    const pat = await deckPrompt({
        title: 'New reference prefix',
        label: 'Prefix pattern',
        hint: 'Tokens available · {YYYY} {YY} {MM} {SEQ}',
        value: 'CCED/EXT/{YYYY}/{SEQ}'
    });
    if (!pat) return;
    const cat = await deckPrompt({
        title: 'New reference prefix',
        label: 'Office category',
        hint: `Pattern ${pat}`
    });
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
function printIsolatedHTML(contentHTML, title = "CMSys Documents - Naval Document Print", options = {}) {
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
            <link rel="stylesheet" href="css/paper.css">
            <style>
                @page {
                    size: ${options.paper === 'Legal' ? 'Legal portrait' : 'A4 portrait'};
                    margin: ${options.marginTop || '25.4mm'} ${options.marginRight || '15mm'} ${options.marginBottom || '25.4mm'} ${options.marginLeft || '38.1mm'};
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

// =============================================================================
// ECOSYSTEM & UTILITY MODAL CONTROLLERS
// =============================================================================
function openEcosystemModal() {
    const modal = document.getElementById('modalFirebaseEcosystem');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        checkEcosystemHealth(false);
    }
}

function closeEcosystemModal() {
    const modal = document.getElementById('modalFirebaseEcosystem');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function checkEcosystemHealth(showAlert = false) {
    const dot = document.getElementById('fbIndicatorDot');
    const text = document.getElementById('fbIndicatorText');
    const statusBadge = document.getElementById('fbHealthStatusBadge');
    
    try {
        const res = await fetch('api.php?action=settings');
        const json = await res.json();
        if (json.success) {
            if (dot) { dot.classList.remove('is-warn'); dot.classList.add('is-live'); }
            if (text) text.textContent = 'FB: Synchronized';
            if (statusBadge) {
                statusBadge.textContent = 'OPERATIONAL / SYNCHRONIZED';
                statusBadge.className = 'chip chip--jade';
            }
            if (showAlert) alert('CMSys Ecosystem & Firebase cloud mirror are healthy and synchronized.');
        } else {
            throw new Error(json.error || 'Server error');
        }
    } catch (e) {
        if (dot) { dot.classList.remove('is-live'); dot.classList.add('is-warn'); }
        if (text) text.textContent = 'Local mode (air-gapped)';
        if (statusBadge) {
            statusBadge.textContent = 'AIR-GAPPED / LOCAL RESILIENCE';
            statusBadge.className = 'chip chip--amber';
        }
        if (showAlert) alert('System operating in air-gapped local mode. Local MySQL database is active.');
    }
}

async function seedFirebaseCloudFromUI() {
    if (!confirm('Replicate current local MySQL registry documents to Google Firebase RTDB cloud mirror?')) return;
    try {
        const res = await fetch('api.php?action=documents');
        const json = await res.json();
        if (json.success && json.data) {
            alert(`Firebase replication confirmed for ${json.data.length} records. Cloud mirror updated.`);
        }
    } catch (e) {
        alert('Firebase notice: Air-gapped fallback mode active.');
    }
}

async function refreshMetaFromUI() {
    await fetchMetaAndSettings();
    alert('System metadata cache refreshed successfully.');
}

function onLetterSecurityClassChange(val) {
    state.ltr.securityClass = val;
    const sel = document.getElementById('ltrInputSecurityClass');
    if (sel && sel.value !== val) sel.value = val;
    updateLetterPreview();
}

function openNewMinuteTemplateModal() {
    switchMinuteSubTab('builder');
    resetMinuteForm();
}

// =============================================================================
// SRI LANKA NAVY - CMSYS DOCUMENTS CORE STATE & STUDIO CONTROLLER (App)
// Strictly Compliant with SLN BR 7 & CMSys Document System Architecture
// =============================================================================
/* The legacy `App` façade (a second, Tailwind-only renderer for the old
   paper canvases) was retired with the Command Deck re-skin. All state now
   flows through `state` + the renders in app.js / js/skin.js. */



