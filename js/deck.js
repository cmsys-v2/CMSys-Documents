/**
 * =============================================================================
 * CMSys DOCUMENTS — COMMAND DECK CONTROLS  (js/deck.js)
 * =============================================================================
 * Interface-only enhancements layered over the engine:
 *   · Sri Lanka Standard Time clock
 *   · Command palette (Ctrl / ⌘ K)
 *   · Focus mode, canvas zoom & fit
 *   · Animated instrument counters, ripples, toasts
 *   · Ledger print isolation
 *
 * No business logic, no API writes. Everything degrades gracefully when a
 * control is absent.
 * =============================================================================
 */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const VIEW_META = {
        registry: { title: 'Document Registry', suffix: 'Master Ledger' },
        letterstudio: { title: 'BR 7 Letter Studio', suffix: 'Naval Correspondence' },
        minutesheet: { title: 'Minute Sheet Studio', suffix: 'Bilingual M01 / M02' },
        settings: { title: 'Settings & Prefixes', suffix: 'Configuration' }
    };

    let currentView = 'registry';
    let toastSeq = 0;

    /* ---------------------------------------------------------------------
       CLOCK — Sri Lanka Standard Time, always (UTC + 05:30)
       --------------------------------------------------------------------- */
    function paintClock() {
        const clock = $('deckClock');
        const dateEl = $('deckClockDate');
        if (!clock && !dateEl) return;

        const now = new Date();
        // Convert using the browser's absolute time + fixed offset (no Intl tz data needed).
        const slst = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000));
        const hh = String(slst.getHours()).padStart(2, '0');
        const mm = String(slst.getMinutes()).padStart(2, '0');
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        if (clock) clock.textContent = `${hh}:${mm}`;
        if (dateEl) dateEl.textContent = `${days[slst.getDay()]} ${String(slst.getDate()).padStart(2, '0')} ${months[slst.getMonth()]} · SLST`;
    }

    /* ---------------------------------------------------------------------
       TOASTS
       --------------------------------------------------------------------- */
    function toast(title, message, kind) {
        const stack = $('toastStack');
        if (!stack) return;
        const id = `toast-${++toastSeq}`;
        const icon = kind === 'error' ? '#i-alert' : kind === 'warn' ? '#i-info' : '#i-check';
        const node = document.createElement('div');
        node.className = `toast${kind === 'warn' ? ' toast--warn' : kind === 'error' ? ' toast--error' : ''}`;
        node.id = id;
        node.innerHTML = `<svg class="icon icon--sm"><use href="${icon}"/></svg>
            <div><b>${escapeHtml(title || 'Notice')}</b>${message ? `<div>${escapeHtml(message)}</div>` : ''}</div>`;
        stack.appendChild(node);
        setTimeout(() => {
            node.classList.add('is-leaving');
            setTimeout(() => node.remove(), 260);
        }, 3600);
    }

    /* ---------------------------------------------------------------------
       ANIMATED INSTRUMENT COUNTERS
       --------------------------------------------------------------------- */
    function animateCount(el, target) {
        if (!el) return;
        const end = Number(target) || 0;
        const start = Number(String(el.textContent).replace(/[^\d.-]/g, '')) || 0;
        if (start === end) { el.textContent = end; return; }
        if (el._cdRaf) cancelAnimationFrame(el._cdRaf);
        const t0 = performance.now();
        const dur = 420;
        const step = (t) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(start + (end - start) * eased);
            if (p < 1) el._cdRaf = requestAnimationFrame(step);
            else { el.textContent = end; el._cdRaf = null; }
        };
        el._cdRaf = requestAnimationFrame(step);
    }

    /* ---------------------------------------------------------------------
       VIEW CHANGES
       --------------------------------------------------------------------- */
    function onViewChange(tab) {
        currentView = tab;
        const meta = VIEW_META[tab];
        const title = $('cmdTitle');
        if (title && meta) title.innerHTML = `${meta.title} <em>/ ${meta.suffix}</em>`;

        const stage = $('deckStage');
        if (stage) stage.scrollTo({ top: 0, behavior: 'smooth' });

        const search = $('globalSearchInput');
        if (search) search.placeholder = tab === 'registry'
            ? 'Search reference, subject, addressee…'
            : 'Search the registry (applies to the ledger)…';

        closePalette();
        if (tab === 'letterstudio' || tab === 'minutesheet') {
            requestAnimationFrame(() => { fitActive(); });
        }
    }

    /* ---------------------------------------------------------------------
       COMMAND PALETTE
       --------------------------------------------------------------------- */
    const ACTIONS = [
        { group: 'Navigate', label: 'Document registry', hint: 'Ledger', icon: '#i-ledger', run: () => switchMainTab('registry') },
        { group: 'Navigate', label: 'BR 7 letter studio', hint: 'Correspondence', icon: '#i-letter', run: () => switchMainTab('letterstudio') },
        { group: 'Navigate', label: 'Minute sheet studio', hint: 'M01 / M02', icon: '#i-minute', run: () => switchMainTab('minutesheet') },
        { group: 'Navigate', label: 'Settings & prefixes', hint: 'Configuration', icon: '#i-gear', run: () => switchMainTab('settings') },
        { group: 'Registry', label: 'New document entry', hint: 'Record', icon: '#i-plus', run: () => openNewDocumentModal() },
        { group: 'Registry', label: 'Outing / dispatch folio', hint: 'Dispatch', icon: '#i-package', run: () => openOutingModal() },
        { group: 'Registry', label: 'Physical file register', hint: 'Files', icon: '#i-folder', run: () => openFileRegisterModal() },
        { group: 'Registry', label: 'Refresh registry', hint: 'Reload', icon: '#i-refresh', run: () => refreshRegistryData() },
        { group: 'Registry', label: 'Isolate overdue documents', hint: 'Watch', icon: '#i-alert', run: () => toggleFilterOverdueOnly() },
        { group: 'Letter studio', label: 'Open BR 7 print studio', hint: 'Print', icon: '#i-print', run: () => { switchMainTab('letterstudio'); openLetterPrintStudioModal(); } },
        { group: 'Letter studio', label: 'Register outgoing letter', hint: 'Dispatch', icon: '#i-flag', run: () => { switchMainTab('letterstudio'); registerLetterInOutgoingRegistry(); } },
        { group: 'Minute studio', label: 'Open minute print studio', hint: 'Print', icon: '#i-print', run: () => { switchMainTab('minutesheet'); openMinutePrintStudioModal(); } },
        { group: 'Minute studio', label: 'Register minute sheet', hint: 'Save', icon: '#i-shield', run: () => { switchMainTab('minutesheet'); saveMinuteRecord(); } },
        { group: 'Workspace', label: 'Toggle day / night watch', hint: 'Theme', icon: '#i-moon', run: () => toggleTheme() },
        { group: 'Workspace', label: 'Focus mode', hint: 'Hide chrome', icon: '#i-maximize', run: () => toggleFocus() },
        { group: 'Workspace', label: 'Ecosystem & sync status', hint: 'Cloud', icon: '#i-cloud', run: () => openEcosystemModal() },
        { group: 'Workspace', label: 'Print the current registry ledger', hint: 'Print', icon: '#i-print', run: () => printRegistry() },
        { group: 'Workspace', label: 'Keyboard shortcuts', hint: '⌘K · ⌘⇧L · ?', icon: '#i-keyboard', run: () => openShortcuts() }
    ];

    let paletteIndex = 0;
    let paletteFiltered = ACTIONS.slice();

    function openPalette() {
        const palette = $('deckPalette');
        if (!palette) return;
        palette.classList.add('is-open');
        const input = $('paletteInput');
        if (input) { input.value = ''; input.focus(); }
        paintPalette('');
    }

    function closePalette() {
        $('deckPalette')?.classList.remove('is-open');
    }

    function paintPalette(query) {
        const results = $('paletteResults');
        if (!results) return;
        const q = (query || '').toLowerCase().trim();
        paletteFiltered = ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q));
        paletteIndex = 0;

        if (!paletteFiltered.length) {
            results.innerHTML = '<div class="palette__group">No matching command</div>';
            return;
        }
        let html = '';
        let group = '';
        paletteFiltered.forEach((action, i) => {
            if (action.group !== group) {
                group = action.group;
                html += `<div class="palette__group">${escapeHtml(group)}</div>`;
            }
            html += `<button type="button" class="palette__item${i === 0 ? ' is-selected' : ''}" data-index="${i}">
                        <svg class="icon"><use href="${action.icon}"/></svg>
                        <span>${escapeHtml(action.label)}</span>
                        <small>${escapeHtml(action.hint || '')}</small>
                    </button>`;
        });
        results.innerHTML = html;
        results.querySelectorAll('.palette__item').forEach((btn) => {
            btn.addEventListener('mouseenter', () => selectPalette(Number(btn.dataset.index)));
            btn.addEventListener('click', () => runPalette(Number(btn.dataset.index)));
        });
    }

    function selectPalette(index) {
        const items = $('paletteResults')?.querySelectorAll('.palette__item') || [];
        if (!items.length) return;
        paletteIndex = (index + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle('is-selected', i === paletteIndex));
        items[paletteIndex]?.scrollIntoView({ block: 'nearest' });
    }

    function runPalette(index) {
        const action = paletteFiltered[index];
        if (!action) return;
        closePalette();
        try { action.run(); } catch (e) { console.error(e); }
    }

    /* ---------------------------------------------------------------------
       FOCUS MODE
       --------------------------------------------------------------------- */
    function toggleFocus() {
        const on = document.body.classList.toggle('is-focus-mode');
        toast(on ? 'Focus mode on' : 'Focus mode off', on ? 'Chrome hidden — press Ctrl/⌘B to restore.' : 'Workstation chrome restored.', 'ok');
    }

    /* ---------------------------------------------------------------------
       CANVAS ZOOM & FIT
       --------------------------------------------------------------------- */
    const zoom = { letter: 100, minute: 100 };

    function applyZoom(kind) {
        const wrap = kind === 'letter' ? $('ltrPaperWrap') : $('msPaperWrap');
        const badge = kind === 'letter' ? $('ltrLiveZoomBadge') : $('msLiveZoomBadge');
        const z = zoom[kind];
        if (wrap) {
            // `zoom` (unlike transform) re-flows the sheet so the drafting desk
            // never grows a horizontal scrollbar when the A4 sheet is wider
            // than the available column.
            wrap.style.transform = '';
            wrap.style.zoom = String(z / 100);
            wrap.style.transformOrigin = 'top center';
        }
        if (badge) badge.textContent = `${Math.round(z)}%`;
    }

    function zoomBy(kind, delta) {
        zoom[kind] = Math.max(40, Math.min(150, zoom[kind] + delta));
        applyZoom(kind);
    }

    function fitActive() {
        const kind = currentView === 'minutesheet' ? 'minute' : 'letter';
        const desk = kind === 'letter' ? $('ltrBoardDesk') : $('msBoardDesk');
        const wrap = kind === 'letter' ? $('ltrPaperWrap') : $('msPaperWrap');
        if (!desk || !wrap) return;
        const available = desk.clientWidth - 84;
        const sheet = 794;
        const z = Math.max(40, Math.min(120, Math.round((available / sheet) * 100)));
        zoom[kind] = z;
        applyZoom(kind);
    }

    /* ---------------------------------------------------------------------
       PRINT ISOLATION — registry ledger
       --------------------------------------------------------------------- */
    function printRegistry() {
        const panel = $('registryTableContainer');
        if (!panel) return;
        const rows = panel.querySelectorAll('tbody tr');
        if (!rows.length) { toast('Ledger empty', 'There are no files to print on this desk.', 'warn'); return; }

        const desk = $('cmdTitle')?.textContent || 'Document Registry';
        const content = `
            <div style="font-family:Arial,Helvetica,sans-serif;color:#000">
                <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px">
                    <div>
                        <div style="font-size:9pt;letter-spacing:.16em;font-weight:700">SRI LANKA NAVY</div>
                        <div style="font-size:13pt;font-weight:800;margin-top:2px">COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)</div>
                        <div style="font-size:8.5pt;margin-top:2px">SLN Dockyard, Trincomalee · Document Registry</div>
                    </div>
                    <div style="text-align:right;font-size:8.5pt;font-family:monospace">
                        <div><b>${escapeHtml(desk.split('/')[0].trim())}</b></div>
                        <div>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:8pt">
                    <thead><tr>${Array.from(panel.querySelectorAll('thead th')).map((th) => `<th style="border-bottom:1px solid #000;text-align:left;padding:4px 3px;font-size:7pt;text-transform:uppercase;letter-spacing:.06em">${escapeHtml(th.textContent.trim())}</th>`).join('')}</tr></thead>
                    <tbody>${Array.from(rows).map((tr) => `<tr>${Array.from(tr.cells)
                        .filter((td) => !td.querySelector('button, .row-actions'))
                        .map((td) => `<td style="border-bottom:.5px solid #999;padding:4px 3px;vertical-align:top">${escapeHtml(td.textContent.replace(/\s+/g, ' ').trim())}</td>`)
                        .join('')}</tr>`).join('')}</tbody>
                </table>
                <div style="margin-top:10px;font-size:7.5pt;font-style:italic">Ledger extract · ${rows.length} records · generated from the CMSys Documents registry.</div>
            </div>`;
        if (typeof printIsolatedHTML === 'function') printIsolatedHTML(content, 'CMSys — Registry Ledger');
        else window.print();
        toast('Ledger prepared', `${rows.length} records sent to the print engine.`, 'ok');
    }

    /* ---------------------------------------------------------------------
       INIT
       --------------------------------------------------------------------- */
    function init() {
        /* Native `alert` is a modal brick in an air-gapped desktop app; route it
           through the toast stack so confirmations never block the workbench. */
        const nativeAlert = typeof window.alert === 'function' ? window.alert.bind(window) : null;
        window.alert = function (message) {
            const text = String(message == null ? '' : message);
            if (!document.getElementById('toastStack')) {
                if (nativeAlert) return nativeAlert(text);
                return;
            }
            const warn = /error|fail|invalid|cannot|denied|not available|please|required|unable|missing/i.test(text);
            const short = text.length > 64 ? text.slice(0, 62).trim() + '…' : text;
            toast(short, text.length > 64 ? text : '', warn ? 'warn' : '');
        };

        paintClock();
        setInterval(paintClock, 15000);

        /* Ripple on buttons */
        document.addEventListener('pointerdown', (event) => {
            const btn = event.target.closest?.('.btn');
            if (!btn || btn.disabled) return;
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const span = document.createElement('span');
            span.className = 'ripple';
            span.style.width = span.style.height = `${size}px`;
            span.style.left = `${event.clientX - rect.left - size / 2}px`;
            span.style.top = `${event.clientY - rect.top - size / 2}px`;
            btn.appendChild(span);
            setTimeout(() => span.remove(), 640);
        });

        /* Palette */
        $('paletteInput')?.addEventListener('input', (e) => paintPalette(e.target.value));
        $('deckPalette')?.addEventListener('click', (e) => { if (e.target.id === 'deckPalette') closePalette(); });

        /* Global shortcuts */
        document.addEventListener('keydown', (e) => {
            const meta = e.ctrlKey || e.metaKey;
            const paletteOpen = $('deckPalette')?.classList.contains('is-open');

            const typing = /input|textarea|select/i.test(document.activeElement?.tagName || '')
                || document.activeElement?.isContentEditable;

            if (meta && e.key.toLowerCase() === 'k') { e.preventDefault(); paletteOpen ? closePalette() : openPalette(); return; }
            if (meta && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); toggleFocus(); return; }
            if (meta && e.shiftKey && e.key.toLowerCase() === 'd') { e.preventDefault(); window.toggleTheme?.(); return; }

            if (paletteOpen) {
                if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); selectPalette(paletteIndex + 1); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); selectPalette(paletteIndex - 1); }
                else if (e.key === 'Enter') { e.preventDefault(); runPalette(paletteIndex); }
                return;
            }

            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.flex, .modal.is-open').forEach((m) => {
                    m.classList.add('hidden');
                    m.classList.remove('flex', 'is-open');
                });
            }
            if (typing || paletteOpen) return;

            if (e.key === '/') { e.preventDefault(); $('globalSearchInput')?.focus(); return; }
            if (e.key === '?') { e.preventDefault(); openShortcuts(); return; }

            const viewByKey = { '1': 'registry', '2': 'letterstudio', '3': 'minutesheet', '4': 'settings' };
            if (viewByKey[e.key] && typeof window.switchMainTab === 'function') {
                e.preventDefault();
                window.switchMainTab(viewByKey[e.key]);
                return;
            }
            if (e.key === '0') { e.preventDefault(); fitActive(); return; }
            if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(currentView === 'minutesheet' ? 'minute' : 'letter', 10); return; }
            if (e.key === '-') { e.preventDefault(); zoomBy(currentView === 'minutesheet' ? 'minute' : 'letter', -10); return; }
        });

        /* Click-outside for modals */
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.addEventListener('mousedown', (e) => {
                if (e.target !== modal) return;
                modal.classList.add('hidden');
                modal.classList.remove('flex', 'is-open');
            });
        });

        /* Reconnect slider fill visuals */
        document.querySelectorAll('input[type="range"]').forEach((slider) => {
            const paint = () => {
                const min = Number(slider.min) || 0;
                const max = Number(slider.max) || 100;
                const v = Number(slider.value) || 0;
                slider.style.setProperty('--fill', `${((v - min) / (max - min)) * 100}%`);
            };
            slider.addEventListener('input', paint);
            paint();
        });

        /* If the registry read never resolves (air-gapped API fallback), clear the
           skeleton so the empty state can speak instead of a permanent shimmer. */
        setTimeout(() => {
            const tbody = $('registryTableBody');
            if (!tbody || !tbody.querySelector('.skeleton-row')) return;
            if (window.Skin) Skin.refreshRegistry();
            else tbody.innerHTML = '';
        }, 6000);

        /* Auto-fit the active sheet when the viewport changes */
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (currentView === 'letterstudio' || currentView === 'minutesheet') fitActive();
            }, 180);
        });

        onViewChange('registry');
        if (window.Skin) Skin.refreshCompliance();
    }


    /* ---------------------------------------------------------------------
       KEYBOARD MAP DIALOG
       --------------------------------------------------------------------- */
    function openShortcuts() {
        $('deckShortcuts')?.classList.add('is-open');
    }
    function closeShortcuts() {
        $('deckShortcuts')?.classList.remove('is-open');
    }

    /* ---------------------------------------------------------------------
       INLINE PROMPT — replaces native window.prompt with a deck dialog
       --------------------------------------------------------------------- */
    let promptResolve = null;
    let promptMultiline = false;

    function prompt(opts = {}) {
        const modal = $('deckPrompt');
        if (!modal) return Promise.resolve(window.prompt(opts.title || '') || null);

        $('deckPromptTitle').textContent = opts.title || 'Enter value';
        $('deckPromptHint').textContent = opts.hint || '↵ to confirm · Esc to cancel';
        $('deckPromptLabel').textContent = opts.label || 'Value';
        const ok = $('deckPromptOk');
        if (ok) ok.textContent = opts.confirm || 'Confirm';

        promptMultiline = !!opts.multiline;
        const input = $('deckPromptInput');
        const area = $('deckPromptTextarea');
        const value = opts.value == null ? '' : String(opts.value);
        input.classList.toggle('hidden', promptMultiline);
        area.classList.toggle('hidden', !promptMultiline);
        if (promptMultiline) area.value = value;
        else input.value = value;
        input.placeholder = opts.placeholder || '';
        if (opts.type) input.type = opts.type; else input.type = 'text';

        modal.classList.add('is-open');
        setTimeout(() => { (promptMultiline ? area : input).focus(); (promptMultiline ? area : input).select?.(); }, 40);

        return new Promise((resolve) => { promptResolve = resolve; });
    }

    function submitPrompt(event) {
        if (event) event.preventDefault();
        const value = promptMultiline ? $('deckPromptTextarea').value : $('deckPromptInput').value;
        closePrompt(value == null ? '' : value.trim());
    }

    function closePrompt(value = null) {
        const modal = $('deckPrompt');
        if (modal) modal.classList.remove('is-open');
        if (promptResolve) {
            const resolve = promptResolve;
            promptResolve = null;
            resolve(value);
        }
    }

    /* Escape closes the prompt before any other handler sees it */
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const modal = $('deckPrompt');
        if (modal && modal.classList.contains('is-open')) {
            e.stopPropagation();
            closePrompt(null);
        }
    }, true);

    /* Public control surface used by inline handlers and the engine */
    window.Deck = {
        openPalette,
        closePalette,
        toast,
        prompt,
        openShortcuts,
        closeShortcuts,
        submitPrompt,
        closePrompt,
        animateCount,
        onViewChange,
        onThemeChange: () => { /* charts & previews are CSS-driven */ },
        toggleFocus,
        zoomLetter: (d) => zoomBy('letter', d),
        zoomMinute: (d) => zoomBy('minute', d),
        fitLetter: () => { zoom.letter = 100; fitActive(); },
        fitMinute: () => { zoom.minute = 100; fitActive(); },
        syncLetterZoom: () => applyZoom('letter'),
        printRegistry
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
