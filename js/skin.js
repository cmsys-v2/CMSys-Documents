/**
 * =============================================================================
 * CMSys DOCUMENTS — COMMAND DECK PRESENTATION LAYER  (js/skin.js)
 * =============================================================================
 * `app.js` remains the authoritative engine: state, API calls, numbering,
 * business rules and mutation functions.  This file ONLY replaces the
 * presentation-bound renderers so the workstation can adopt the Command Deck
 * component language without duplicating any logic.
 *
 * Loaded AFTER app.js and BEFORE DOMContentLoaded, therefore every function
 * declaration below safely supersedes its legacy counterpart.
 *
 * Sections
 *   1.  Registry ledger & instruments
 *   2.  Builder controls (paragraphs, references, addressees, distribution)
 *   3.  Template / draft libraries
 *   4.  Settings workspace
 *   5.  BR 7 letter preview renderer
 *   6.  Bilingual minute sheet preview renderer
 *   7.  Compliance instrumentation
 * =============================================================================
 */
(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const val = (id, fallback = '') => {
        const el = $(id);
        return el ? el.value : fallback;
    };
    const checked = (id, fallback = false) => {
        const el = $(id);
        return el ? el.checked : fallback;
    };
    const txt = (s) => (s === null || s === undefined ? '' : String(s));

    /* =========================================================================
       1. REGISTRY
       ========================================================================= */

    function renderOfficeCategoryPills() {
        const container = $('officeCategoryPills');
        if (!container) return;
        const cats = (typeof OFFICE_CATEGORIES !== 'undefined' && OFFICE_CATEGORIES[state.currentOffice])
            || [{ id: 'ALL', label: 'All categories' }];

        container.innerHTML = cats.map((cat) => {
            const active = state.currentCategoryFilter === cat.id;
            return `<button type="button" class="filter-pill${active ? ' is-active' : ''}"
                        aria-pressed="${active}"
                        onclick="setOfficeCategoryFilter('${escapeHtml(cat.id)}')">
                        ${escapeHtml(cat.label)}
                    </button>`;
        }).join('');
    }

    function flowBadge(doc) {
        return doc.flow_type === 'OUTGOING'
            ? '<span class="badge badge--out">↑ Outward</span>'
            : '<span class="badge badge--in">↓ Inward</span>';
    }

    function positionBadge(position) {
        const pos = txt(position || 'Received');
        let cls = 'badge--muted';
        if (/dispatch|outed/i.test(pos)) cls = 'badge--out';
        else if (/action|progress|implement/i.test(pos)) cls = 'badge--ok';
        else if (/received|inbox/i.test(pos)) cls = 'badge--overdue';
        else if (/complete|done|closed|handed/i.test(pos)) cls = 'badge--ok';
        else if (/forward|refer/i.test(pos)) cls = 'badge--out';
        return `<span class="badge ${cls}" title="${escapeHtml(pos)}">${escapeHtml(pos)}</span>`;
    }

    function renderRegistryTable() {
        const tbody = $('registryTableBody');
        const empty = $('registryTableEmptyState');
        if (!tbody) return;

        let docs = Array.isArray(state.documents) ? state.documents.slice() : [];
        if (state.filterOverdueOnly) {
            docs = docs.filter((d) => {
                const days = calculateDaysInPosition(d.date_recorded);
                return days >= state.overdueThreshold
                    && d.present_position !== 'Dispatched / Outed'
                    && d.present_position !== 'Completed';
            });
        }

        const countLabel = $('registryCountLabel');
        if (countLabel) {
            countLabel.textContent = docs.length
                ? `${docs.length} file${docs.length === 1 ? '' : 's'} on this desk`
                : 'No files';
        }

        if (docs.length === 0) {
            tbody.innerHTML = '';
            if (empty) empty.classList.remove('hidden');
            return;
        }
        if (empty) empty.classList.add('hidden');

        tbody.innerHTML = docs.map((d, index) => {
            const days = calculateDaysInPosition(d.date_recorded);
            const settled = d.present_position === 'Dispatched / Outed' || d.present_position === 'Completed';
            const overdue = !settled && days >= state.overdueThreshold;
            const nearDue = !settled && !overdue && days >= Math.max(1, state.overdueThreshold - 2);

            const daysChip = overdue
                ? `<span class="badge badge--overdue">${days}d overdue</span>`
                : nearDue
                    ? `<span class="badge badge--overdue" style="opacity:.7">${days}d</span>`
                    : `<span class="cell-meta mono">${days}d in position</span>`;

            return `
            <tr data-doc-id="${escapeHtml(d.id)}" class="${overdue ? 'row-overdue' : ''}">
                <td class="cell-idx">${String(index + 1).padStart(2, '0')}</td>
                <td class="cell-ref">
                    <span class="ref-code">${escapeHtml(d.ref_no || '—')}</span>
                    ${d.sender_ref_no ? `<span class="ref-sub">↳ ${escapeHtml(d.sender_ref_no)}</span>` : ''}
                </td>
                <td>
                    ${flowBadge(d)}
                    <span class="cell-meta">${escapeHtml(d.sender_source_category || d.category || 'General')}</span>
                </td>
                <td class="nowrap">
                    <span style="color:var(--ink);font-weight:600">${escapeHtml(d.date_recorded || '—')}</span>
                    ${d.date_letter ? `<span class="cell-meta">Ltr ${escapeHtml(d.date_letter)}</span>` : ''}
                </td>
                <td>
                    <span style="color:var(--ink);font-weight:620">${escapeHtml(d.sender_or_recipient || '—')}</span>
                    ${d.contact_no ? `<span class="cell-meta mono">${escapeHtml(d.contact_no)}</span>` : ''}
                </td>
                <td class="cell-subject">
                    <span class="subject-line" title="${escapeHtml(d.subject || '')}">${escapeHtml(d.subject || '—')}</span>
                    ${d.scope_description ? `<span class="cell-meta">${escapeHtml(d.scope_description)}</span>` : ''}
                </td>
                <td>
                    ${positionBadge(d.present_position)}
                    <div style="margin-top:4px">${daysChip}</div>
                </td>
                <td>
                    ${d.directed_to
                        ? `<span class="badge badge--ok">${escapeHtml(d.directed_to)}</span>`
                        : '<span class="cell-meta">—</span>'}
                    ${d.project_name ? `<span class="cell-meta" title="${escapeHtml(d.project_name)}">${escapeHtml(d.project_name)}</span>` : ''}
                </td>
                <td class="mono" style="font-size:10px;color:var(--ink-3)">${escapeHtml(d.file_no || '—')}</td>
                <td class="cell-actions">
                    <div class="row-actions">
                        <button type="button" class="btn btn--icon btn--sm btn--ghost tip" data-tip="Move file / trail"
                                onclick="openUpdatePositionModalForDoc('${escapeHtml(d.id)}')" aria-label="Update position">
                            <svg class="icon"><use href="#i-sync"/></svg>
                        </button>
                        <button type="button" class="btn btn--icon btn--sm btn--ghost tip" data-tip="Outing / dispatch"
                                onclick="openOutingModalForDoc('${escapeHtml(d.id)}')" aria-label="Outing">
                            <svg class="icon"><use href="#i-package"/></svg>
                        </button>
                        <button type="button" class="btn btn--icon btn--sm btn--ghost tip" data-tip="Draft minute"
                                onclick="createMinuteFromDoc('${escapeHtml(d.id)}')" aria-label="Create minute">
                            <svg class="icon"><use href="#i-minute"/></svg>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Keep the right-hand instruments in step with the visible ledger.
        updateRegistrySidePanels(Array.isArray(state.documents) ? state.documents : [], 0);
    }

    function updateRegistryStats() {
        const docs = Array.isArray(state.documents) ? state.documents : [];
        const total = docs.length;
        let incoming = 0;
        let outgoing = 0;
        let active = 0;
        let overdue = 0;

        docs.forEach((d) => {
            if (d.flow_type === 'OUTGOING') outgoing++;
            else incoming++;
            const settled = d.present_position === 'Dispatched / Outed' || d.present_position === 'Completed';
            if (!settled) active++;
            const days = calculateDaysInPosition(d.date_recorded);
            if (!settled && days >= state.overdueThreshold) overdue++;
        });

        const paint = (id, value) => {
            const el = $(id);
            if (!el) return;
            if (window.Deck && typeof Deck.animateCount === 'function') Deck.animateCount(el, value);
            else el.textContent = value;
        };
        paint('statTotalDocs', total);
        paint('statIncomingDocs', incoming);
        paint('statOutgoingDocs', outgoing);
        paint('statActiveDocs', active);
        paint('statOverdueDocs', overdue);

        const deltaTotal = $('deltaTotal');
        if (deltaTotal) deltaTotal.textContent = total ? 'live' : 'empty';
        const deltaIn = $('deltaIncoming');
        if (deltaIn) deltaIn.textContent = total ? `${Math.round((incoming / total) * 100)}%` : '—';
        const deltaOut = $('deltaOutgoing');
        if (deltaOut) deltaOut.textContent = total ? `${Math.round((outgoing / total) * 100)}%` : '—';
        const deltaActive = $('deltaActive');
        if (deltaActive) deltaActive.textContent = active ? 'in hand' : 'clear';

        const overdueCard = $('statOverdueCard');
        if (overdueCard) overdueCard.classList.toggle('is-engaged', !!state.filterOverdueOnly);

        const stripChip = $('overdueStripChip');
        if (stripChip) stripChip.style.display = overdue ? '' : 'none';

        updateRegistrySidePanels(docs, overdue);
    }

    function updateRegistrySidePanels(docs, overdueCount) {
        /* Overdue watch */
        const watch = $('watchList');
        const watchCount = $('watchCount');
        const hot = docs
            .filter((d) => d.present_position !== 'Dispatched / Outed' && d.present_position !== 'Completed')
            .map((d) => ({ doc: d, days: calculateDaysInPosition(d.date_recorded) }))
            .filter((x) => x.days >= state.overdueThreshold)
            .sort((a, b) => b.days - a.days);

        if (watchCount) watchCount.textContent = hot.length;
        if (watch) {
            watch.innerHTML = hot.length
                ? hot.slice(0, 6).map(({ doc, days }) => `
                    <div class="watch-item" onclick="openUpdatePositionModalForDoc('${escapeHtml(doc.id)}')">
                        <div style="min-width:0">
                            <div class="watch-item__ref">${escapeHtml(doc.ref_no || '—')}</div>
                            <div class="watch-item__subject">${escapeHtml(doc.subject || 'No subject recorded')}</div>
                        </div>
                        <span class="watch-item__days">${days}d</span>
                    </div>`).join('')
                : '<div class="panel__sub" style="padding:8px 2px">No documents past the threshold. The desk is clear.</div>';
        }

        /* Desk distribution by category */
        const mix = $('deskMix');
        if (mix) {
            const buckets = {};
            docs.forEach((d) => {
                const key = d.sender_source_category || d.category || 'General';
                buckets[key] = (buckets[key] || 0) + 1;
            });
            const rows = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 6);
            const max = rows.reduce((m, r) => Math.max(m, r[1]), 1);
            mix.innerHTML = rows.length
                ? rows.map(([name, count]) => `
                    <div class="mini-desk">
                        <span class="mini-desk__name truncate" style="max-width:130px" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
                        <span class="mini-desk__bar"><i style="width:${Math.round((count / max) * 100)}%"></i></span>
                        <span class="mini-desk__val">${count}</span>
                    </div>`).join('')
                : '<div class="panel__sub" style="padding:8px 2px">No category data on this desk.</div>';
        }

        /* Physical file index */
        const files = $('fileMiniIndex');
        if (files) {
            const list = Array.isArray(state.files) ? state.files.slice(0, 4) : [];
            files.innerHTML = list.length
                ? list.map((f) => `
                    <div class="mini-desk" title="${escapeHtml(f.subject || '')}">
                        <span class="mini-desk__name mono" style="color:var(--teal);font-size:10px">${escapeHtml(f.file_no || '—')}</span>
                        <span class="mini-desk__name truncate" style="max-width:120px">${escapeHtml(f.file_box_ref || f.cabinet_location || '—')}</span>
                        <span class="mini-desk__val">${escapeHtml(f.current_volume || 'V1')}</span>
                    </div>`).join('')
                : '<div class="panel__sub" style="padding:8px 2px">File register not loaded.</div>';
        }
    }

    /* =========================================================================
       2. BUILDER CONTROLS
       ========================================================================= */

    function renderMinuteAddresseesInputs() {
        const container = $('msAddresseesContainer');
        if (!container) return;
        container.innerHTML = state.ms.addressees.map((addr, idx) => `
            <div class="builder-row">
                <input type="text" class="input input--sm" value="${escapeHtml(addr)}"
                       oninput="state.ms.addressees[${idx}]=this.value; updateMinutePreview();"
                       placeholder="Addressee designation (appointment)">
                ${state.ms.addressees.length > 1 ? `
                    <button type="button" class="icon-btn icon-btn--danger" title="Remove addressee"
                            onclick="removeMinuteAddresseeRow(${idx})">
                        <svg class="icon"><use href="#i-x"/></svg>
                    </button>` : ''}
            </div>`).join('');
    }

    function renderMinuteParagraphsInputs() {
        const container = $('msParagraphsContainer');
        if (!container) return;
        container.innerHTML = state.ms.paragraphs.map((p, idx) => `
            <div class="para-card lvl-1">
                <div class="para-card__top">
                    <span class="para-card__num mono">${escapeHtml(p.num || String(idx + 1).padStart(2, '0') + '.')}</span>
                    <div class="para-card__tools">
                        <button type="button" class="icon-btn" title="Bold selection" onclick="formatParaText(${idx}, 'b')"><b style="font-size:10px">B</b></button>
                        <button type="button" class="icon-btn" title="Underline selection" onclick="formatParaText(${idx}, 'u')"><span style="font-size:10px;text-decoration:underline">U</span></button>
                        ${state.ms.paragraphs.length > 1 ? `
                        <button type="button" class="icon-btn" title="Remove paragraph" onclick="removeMinuteParagraphRow(${idx})">
                            <svg class="icon"><use href="#i-trash"/></svg>
                        </button>` : ''}
                    </div>
                </div>
                <textarea id="msParaText_${idx}" class="textarea" rows="2" placeholder="Paragraph content…"
                          oninput="state.ms.paragraphs[${idx}].text=this.value; updateMinutePreview();">${escapeHtml(p.text || '')}</textarea>
            </div>`).join('');
    }

    function renderLetterReferences() {
        const container = $('ltrReferencesContainer');
        if (!container) return;
        if (!state.ltr.references.length) {
            container.innerHTML = '<p class="hint">No references yet. Cite prior letters or signals in chronological order (oldest first).</p>';
            return;
        }
        const letters = (typeof REF_LETTERS !== 'undefined') ? REF_LETTERS : 'ABCDEFGHJKLMNPQRST';
        container.innerHTML = state.ltr.references.map((ref, idx) => `
            <div class="builder-row">
                <span class="mono" style="width:18px;font-size:10px;font-weight:800;color:var(--teal)">${letters[idx] || String.fromCharCode(65 + idx)}.</span>
                <input type="text" class="input input--sm" value="${escapeHtml(ref)}"
                       oninput="state.ltr.references[${idx}]=this.value; updateLetterPreview();"
                       placeholder="NHQ Letter NHQ/CE/2026/042 dated 10 Sep 26">
                <button type="button" class="icon-btn icon-btn--danger" onclick="removeLetterReferenceRow(${idx})" title="Remove reference">
                    <svg class="icon"><use href="#i-x"/></svg>
                </button>
            </div>`).join('');
    }

    function renderLetterParagraphs() {
        const container = $('ltrParagraphsContainer');
        if (!container) return;

        renumberLetterParagraphs();

        container.innerHTML = state.ltr.paragraphs.map((p, idx) => {
            const lvl = p.level || 1;
            const names = { 1: 'Main', 2: 'Sub (a)', 3: 'Sub (1)', 4: 'Sub (i)' };
            return `
            <div class="para-card lvl-${lvl}" style="margin-left:${(lvl - 1) * 10}px">
                <div class="para-card__top">
                    <span class="para-card__lvl">${names[lvl] || 'Main'}</span>
                    <span class="para-card__num mono">${escapeHtml(p.num || '—')}</span>
                    <div class="para-card__tools">
                        <button type="button" class="icon-btn" title="Promote / outdent" ${lvl <= 1 ? 'disabled' : ''} onclick="outdentLetterParagraph(${idx})"><svg class="icon"><use href="#i-outdent"/></svg></button>
                        <button type="button" class="icon-btn" title="Demote / indent" ${lvl >= 4 ? 'disabled' : ''} onclick="indentLetterParagraph(${idx})"><svg class="icon"><use href="#i-indent"/></svg></button>
                        <button type="button" class="icon-btn" title="Add child sub-paragraph" onclick="addLetterSubParagraph(${idx})"><svg class="icon"><use href="#i-plus-sub"/></svg></button>
                        <button type="button" class="icon-btn" title="Move up" ${idx === 0 ? 'disabled' : ''} onclick="moveLetterParagraph(${idx}, -1)"><svg class="icon"><use href="#i-arrow-up"/></svg></button>
                        <button type="button" class="icon-btn" title="Move down" ${idx === state.ltr.paragraphs.length - 1 ? 'disabled' : ''} onclick="moveLetterParagraph(${idx}, 1)"><svg class="icon"><use href="#i-arrow-down"/></svg></button>
                        <button type="button" class="icon-btn" title="Bold selection" onclick="formatLtrParaText(${idx}, 'b')"><b style="font-size:10px">B</b></button>
                        <button type="button" class="icon-btn" title="Underline selection" onclick="formatLtrParaText(${idx}, 'u')"><span style="font-size:10px;text-decoration:underline">U</span></button>
                        ${state.ltr.paragraphs.length > 1 ? `<button type="button" class="icon-btn" title="Remove paragraph" onclick="removeLetterParagraphRow(${idx})"><svg class="icon"><use href="#i-trash"/></svg></button>` : ''}
                    </div>
                </div>
                <textarea id="ltrParaText_${idx}" class="textarea" rows="2" placeholder="Paragraph text…"
                          oninput="state.ltr.paragraphs[${idx}].text=this.value; updateLetterPreview();">${escapeHtml(p.text || '')}</textarea>
            </div>`;
        }).join('');
    }

    function renderLetterEnclosures() {
        const container = $('ltrEnclosuresContainer');
        if (!container) return;
        if (!state.ltr.enclosures.length) {
            container.innerHTML = '<p class="hint">No enclosures or annexes listed.</p>';
            return;
        }
        container.innerHTML = state.ltr.enclosures.map((enc, idx) => `
            <div class="builder-row">
                <span class="mono" style="width:18px;font-size:10px;color:var(--brass)">${idx + 1}.</span>
                <input type="text" class="input input--sm" value="${escapeHtml(enc)}"
                       oninput="state.ltr.enclosures[${idx}]=this.value; updateLetterPreview();"
                       placeholder="Annex A — cost estimate">
                <button type="button" class="icon-btn icon-btn--danger" onclick="removeLetterEnclosureRow(${idx})" title="Remove">
                    <svg class="icon"><use href="#i-x"/></svg>
                </button>
            </div>`).join('');
    }

    function renderLetterCopyTo() {
        const container = $('ltrCopyToContainer');
        if (!container) return;

        const activeCopyTo = state.ltr.copyTo.filter((c) => c.trim() !== '');
        const badge = $('ltrDistCountBadge');
        if (badge) {
            badge.textContent = activeCopyTo.length > 4
                ? `${activeCopyTo.length} · see distribution`
                : `${activeCopyTo.length}`;
            badge.classList.toggle('chip--amber', activeCopyTo.length > 4);
            badge.classList.toggle('chip--teal', activeCopyTo.length <= 4);
        }

        container.innerHTML = state.ltr.copyTo.map((cp, idx) => `
            <div class="builder-row">
                <span style="width:18px;font-size:10px;color:var(--violet)">•</span>
                <input type="text" class="input input--sm" value="${escapeHtml(cp)}"
                       oninput="state.ltr.copyTo[${idx}]=this.value; renderLetterCopyTo(); updateLetterPreview();"
                       placeholder="Action / information addressee">
                <button type="button" class="icon-btn icon-btn--danger" onclick="removeLetterCopyToRow(${idx})" title="Remove">
                    <svg class="icon"><use href="#i-x"/></svg>
                </button>
            </div>`).join('');
    }

    /* =========================================================================
       3. LIBRARIES
       ========================================================================= */

    function renderMinuteTemplatesGrid() {
        const container = $('msTemplatesGrid');
        if (!container) return;
        if (!state.minuteTemplates.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-state__mark"><svg class="icon icon--lg"><use href="#i-copy"/></svg></span>
                <b>No minute templates</b><p>Save a composed minute as a template to reuse its structure.</p></div>`;
            return;
        }
        container.innerHTML = state.minuteTemplates.map((t) => `
            <article class="tpl-card">
                <div class="tpl-card__top">
                    <span class="badge badge--ok">${escapeHtml(t.category || 'General')}</span>
                    <span class="tpl-card__lang" style="margin-left:auto">${t.lang === 'si' ? 'සිංහල' : 'English'}</span>
                </div>
                <h4>${escapeHtml(t.title || 'Untitled minute template')}</h4>
                <p>${escapeHtml(t.subject || 'No subject recorded')}</p>
                <div class="tpl-card__foot">
                    <button type="button" class="btn btn--sm btn--primary" onclick="loadMinuteTemplateIntoBuilder('${escapeHtml(t.id)}')">
                        Use in composer
                    </button>
                </div>
            </article>`).join('');
    }

    function renderNavalLetterTemplatesGrid() {
        const container = $('ltrTemplatesGrid');
        if (!container) return;
        if (!state.navalLetterTemplates.length) {
            container.innerHTML = `<div class="empty-state"><span class="empty-state__mark"><svg class="icon icon--lg"><use href="#i-copy"/></svg></span>
                <b>No BR 7 templates</b><p>Save the current letter as a template to establish a reusable format.</p></div>`;
            return;
        }
        container.innerHTML = state.navalLetterTemplates.map((t) => `
            <article class="tpl-card">
                <div class="tpl-card__top">
                    <span class="badge badge--out">${escapeHtml(t.category || 'BR 7')}</span>
                    <span class="badge badge--overdue" style="margin-left:auto">${escapeHtml(t.security_class || 'RESTRICTED')}</span>
                </div>
                <h4>${escapeHtml(t.title || 'Untitled BR 7 template')}</h4>
                <p>${escapeHtml(t.subject || 'Standard BR 7 format')}</p>
                <div class="tpl-card__foot">
                    <button type="button" class="btn btn--sm btn--primary" onclick="loadLetterTemplateIntoStudio('${escapeHtml(t.id)}')">
                        Draft letter
                    </button>
                </div>
            </article>`).join('');
    }

    function renderNavalLettersTable() {
        const tbody = $('ltrDraftsTableBody');
        if (!tbody) return;
        if (!state.navalLetters.length) {
            tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:34px 12px">
                <b>No registered letters</b><p>Letters saved or registered as outgoing will be listed here.</p></div></td></tr>`;
            return;
        }
        tbody.innerHTML = state.navalLetters.map((l) => `
            <tr>
                <td><span class="ref-code">${escapeHtml(l.letter_ref || '—')}</span></td>
                <td class="mono" style="font-size:10.5px">${escapeHtml(l.letter_date || '—')}</td>
                <td>${escapeHtml((l.addressee_to || '').split('\n')[0])}</td>
                <td class="cell-subject"><span class="subject-line">${escapeHtml(l.subject || '—')}</span></td>
                <td><span class="badge badge--overdue">${escapeHtml(l.security_class || 'RESTRICTED')}</span></td>
                <td><span class="badge ${l.is_registered_outgoing ? 'badge--ok' : 'badge--muted'}">${escapeHtml(l.status || 'Draft')}</span></td>
                <td class="cell-actions">
                    <button type="button" class="btn btn--sm btn--ghost" onclick="loadLetterIntoStudio('${escapeHtml(l.id)}')">
                        <svg class="icon"><use href="#i-drafting"/></svg> Open
                    </button>
                </td>
            </tr>`).join('');
    }

    /* =========================================================================
       4. SETTINGS
       ========================================================================= */

    function renderConfigItemList(containerId, items, type) {
        const c = $(containerId);
        if (!c) return;
        c.innerHTML = items.length
            ? items.map((it, idx) => `
                <div class="config-item">
                    <span class="idx mono">${String(idx + 1).padStart(2, '0')}</span>
                    <span class="grow truncate" title="${escapeHtml(it)}">${escapeHtml(it)}</span>
                    <button type="button" class="icon-btn icon-btn--danger" style="width:22px;height:22px"
                            onclick="deleteConfigItem('${escapeHtml(type)}', ${idx})" title="Delete">
                        <svg class="icon"><use href="#i-x"/></svg>
                    </button>
                </div>`).join('')
            : '<p class="hint">Nothing configured for this language yet.</p>';
    }

    function renderPrefixesTable() {
        const tbody = $('cfgPrefixesTableBody');
        if (!tbody) return;
        if (!state.prefixes.length) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:30px 10px"><b>No prefixes defined</b>
                <p>Create a prefix to allocate atomic sequential references.</p></div></td></tr>`;
            return;
        }
        tbody.innerHTML = state.prefixes.map((p) => {
            const preview = String(p.prefix_pattern || '')
                .replace('{YYYY}', '2026')
                .replace('{YY}', '26')
                .replace('{MM}', '10')
                .replace('{M}', '10')
                .replace('{SEQ}', String(p.next_sequence).padStart(p.padding_length || 4, '0'));
            return `
            <tr>
                <td><span class="badge badge--ok">${escapeHtml(p.office_section || '—')}</span></td>
                <td>${escapeHtml(p.category || '—')}</td>
                <td class="mono" style="color:var(--teal);font-weight:700">${escapeHtml(p.prefix_pattern || '—')}</td>
                <td class="mono" style="color:var(--ink)">${escapeHtml(p.next_sequence)}</td>
                <td class="mono" style="color:var(--ink-3)">${escapeHtml(preview)}</td>
                <td class="cell-actions">
                    <button type="button" class="btn btn--xs btn--ghost" onclick="editPrefixSeqPrompt('${escapeHtml(p.id)}', ${Number(p.next_sequence) || 1})">
                        Edit sequence
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    function renderFilesTable() {
        const tbody = $('cfgFilesTableBody');
        if (!tbody) return;
        if (!state.files.length) {
            tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state" style="padding:30px 10px"><b>File register empty</b>
                <p>Add physical files to reconcile cabinet, box and folio locations.</p></div></td></tr>`;
            return;
        }
        tbody.innerHTML = state.files.map((f) => `
            <tr>
                <td><span class="ref-code" style="font-size:10.5px">${escapeHtml(f.file_no || '—')}</span></td>
                <td class="cell-subject"><span class="subject-line">${escapeHtml(f.subject || '—')}</span></td>
                <td>${escapeHtml(f.office_section || '—')}</td>
                <td class="mono" style="font-size:10px">${escapeHtml(f.cabinet_location || '—')} / ${escapeHtml(f.file_box_ref || '—')}</td>
                <td class="mono" style="font-size:10px">${escapeHtml(f.folder_no || '—')}</td>
                <td>${escapeHtml(f.current_volume || 'Vol 1')}</td>
                <td class="mono">${escapeHtml(f.total_folios || 0)}</td>
                <td class="cell-actions">
                    <button type="button" class="btn btn--xs btn--ghost" onclick="selectFileForActiveStudio('${escapeHtml(f.file_no)}')">Select</button>
                </td>
            </tr>`).join('');
    }

    function renderTimelineTrail(trail) {
        const container = $('uppTrailTimeline');
        if (!container) return;
        if (!trail || trail.length === 0) {
            container.innerHTML = '<p class="hint" style="padding:6px 2px">No movements recorded yet. The first entry will open the trail.</p>';
            return;
        }
        container.innerHTML = trail.slice().reverse().map((item) => `
            <div class="timeline__item">
                <div class="timeline__when">${escapeHtml(item.timestamp || item.date || '—')}</div>
                <div class="timeline__what">${escapeHtml(item.action_status || item.stage || 'Movement')}</div>
                <div class="timeline__note">
                    ${escapeHtml(item.officer_from || '—')} <span style="color:var(--teal)">→</span> ${escapeHtml(item.to_officer || item.officer || '—')}
                </div>
                ${item.remarks ? `<div class="timeline__note" style="font-style:italic">“${escapeHtml(item.remarks)}”</div>` : ''}
            </div>`).join('');
    }

    /* =========================================================================
       5. BR 7 LETTER PREVIEW
       ========================================================================= */

    function setStamping(mode) {
        const input = $('ltrInputStampingMode');
        if (input) input.value = mode;
        $('btnStampRed')?.classList.toggle('is-active', mode === 'red');
        $('btnStampMono')?.classList.toggle('is-active', mode === 'monochrome');
        updateLetterPreview();
    }

    function setPrivacy(value) {
        const sel = $('ltrInputPrivacyMarking');
        if (sel) sel.value = value;
        updateLetterPreview();
    }

    function letterChecks(ctx) {
        const items = [];
        items.push({ ok: !!ctx.secClass, label: ctx.secClass ? `Class ${ctx.secClass}` : 'Classification' });
        items.push({ ok: !!ctx.precedence, label: ctx.precedence ? `Prec ${ctx.precedence}` : 'Precedence' });
        items.push({ ok: !!ctx.addressee.trim(), label: 'Addressee' });
        items.push({ ok: ctx.subject.length > 3, label: 'Subject' });
        items.push({ ok: ctx.sigComplete, label: 'Signature block' });
        items.push({ ok: ctx.refsOk, label: ctx.refCount ? `${ctx.refCount} reference${ctx.refCount > 1 ? 's' : ''}` : 'References' });
        items.push({ ok: true, label: `${ctx.copyCount} copy to` });
        return items;
    }

    function renderChecks(targetId, items) {
        const el = $(targetId);
        if (!el) return;
        el.innerHTML = items.map((it) => `
            <span class="compliance__item ${it.ok ? 'is-ok' : 'is-warn'}">
                <svg class="icon"><use href="${it.ok ? '#i-check' : '#i-alert'}"/></svg>${escapeHtml(it.label)}
            </span>`).join('');
    }

    /* The composer markup ships empty; the engine's `state` owns the values.
       Hydrate exactly once, before the first read, so an early render can never
       blank the sheet (or the engine state) with empty controls. */
    let formsHydrated = false;
    function ensureHydration() {
        if (formsHydrated) return;
        formsHydrated = true;
        if (typeof window.hydrateStudioForms === 'function') {
            try { window.hydrateStudioForms(); } catch (e) { console.error('Hydration failed', e); }
        }
    }

    function updateLetterPreview() {
        ensureHydration();
        const paper = $('letterLivePaper');
        if (!paper) return;

        /* --- pull values from the composer --- */
        const secClass = (val('ltrInputSecurityClass') || state.ltr.securityClass || 'RESTRICTED').toUpperCase();
        const precedence = (val('ltrInputPrecedence') || 'ROUTINE').toUpperCase();
        const privacy = val('ltrInputPrivacyMarking', 'NONE');
        const stampMode = val('ltrInputStampingMode', 'red');
        const ref = val('ltrInputRef', state.ltr.ref);
        const fileNo = val('ltrInputFileNo', state.ltr.fileNo);
        const date = val('ltrInputDate', state.ltr.date);
        const office = val('ltrInputOffice', state.ltr.office);
        const station = val('ltrInputStation', state.ltr.station);
        const tel = val('ltrInputTel', state.ltr.tel);
        const to = val('ltrInputAddresseeTo', state.ltr.addresseeTo);
        const through = val('ltrInputChannelThrough', state.ltr.channelThrough);
        const attention = val('ltrInputAttention', state.ltr.attention);
        const subject = val('ltrInputSubject', state.ltr.subject);
        const salutation = val('ltrInputSalutation', state.ltr.salutation);
        const close = val('ltrInputCompClose', state.ltr.complimentaryClose);
        const signName = val('ltrInputSignName', state.ltr.signName);
        const signRank = val('ltrInputSignRank', state.ltr.signRank);
        const signBranch = val('ltrInputSignBranch', state.ltr.signBranch);
        const signAppt = val('ltrInputSignAppointment', state.ltr.signAppointment);
        const postNominals = val('ltrInputPostNominals', state.ltr.postNominals);
        const sd = checked('ltrInputSdCheckbox', true);
        const external = checked('ltrInputIncludeSLN', false);
        const copyNo = Number(val('ltrInputCopyNo', 1)) || 1;
        const totalCopies = Number(val('ltrInputTotalCopies', 5)) || 5;
        const totalSheets = Math.max(1, Number(val('ltrInputTotalSheets', 1)) || 1);
        const subjectAlign = state.ltr.subjectAlign || 'left';

        /* --- keep engine state in step --- */
        state.ltr.securityClass = secClass;
        state.ltr.precedence = precedence;
        state.ltr.privacyMarking = privacy;
        state.ltr.stampingMode = stampMode;
        state.ltr.addresseeTo = to;
        state.ltr.subject = subject;

        const secret = secClass === 'SECRET' || secClass === 'TOP SECRET';
        const isSenior = state.ltr.br7Tone === 'senior_to_junior';
        const stampClass = stampMode === 'monochrome' ? 'pp__stamp--mono' : '';

        $('ltrSecretMetaInputs')?.classList.toggle('hidden', !secret);

        const branch = external && signBranch && !/SLN/i.test(signBranch)
            ? `${signBranch}, SLN`
            : signBranch;

        renumberLetterParagraphs();

        const references = (state.ltr.references || []).filter((r) => txt(r).trim());
        const enclosures = (state.ltr.enclosures || []).filter((e) => txt(e).trim());
        const copyTo = (state.ltr.copyTo || []).filter((c) => txt(c).trim());
        const wideDistribution = copyTo.length > 4;

        const refsHtml = references.map((r, i) => {
            const letters = (typeof REF_LETTERS !== 'undefined') ? REF_LETTERS : 'ABCDEFGHJKLMNPQRST';
            return `<div class="pp__ref-item"><b>${letters[i] || String.fromCharCode(65 + i)}.</b> ${escapeHtml(r)}</div>`;
        }).join('');

        const paragraphsHtml = state.ltr.paragraphs.map((p, i) => {
            const lvl = p.level || 1;
            const num = p.num || (state.ltr.paragraphs.length === 1 && lvl === 1 ? '' : `${i + 1}.`);
            const heading = p.heading ? `<b><u>${escapeHtml(p.heading)}.</u></b> ` : '';
            return `<div class="pp__para pp__para--l${lvl}">
                        ${num ? `<span class="pp__para-num">${escapeHtml(num)}</span>` : ''}
                        <span class="pp__para-text">${heading}${p.text || ''}</span>
                    </div>`;
        }).join('');

        const enclosuresHtml = enclosures.map((e, i) => `<div>${i + 1}. ${escapeHtml(e)}</div>`).join('');
        const copyHtml = wideDistribution
            ? `<div><i>See Distribution List</i></div>` + copyTo.map((c) => `<div>• ${escapeHtml(c)}</div>`).join('')
            : copyTo.map((c) => `<div>• ${escapeHtml(c)}</div>`).join('');

        const pageText = secret
            ? `1 of ${totalSheets}`
            : (totalSheets > 1 ? '1' : '');

        const sigHtml = `
            <div class="pp__sig">
                ${close && !isSenior ? `<div class="pp__close">${escapeHtml(close)}</div>` : ''}
                ${sd ? '<span class="sd">sd/-</span>' : '<div class="space"></div>'}
                <b>${escapeHtml(signName)}${postNominals ? `<span class="postnom">, ${escapeHtml(postNominals)}</span>` : ''}</b>
                <span class="rank">${escapeHtml(signRank)} ${escapeHtml(branch)}</span>
                <span class="appt">${escapeHtml(signAppt)}</span>
            </div>`;

        paper.className = `a4-canvas br7-letter-paper${state.ltr.lang === 'si' ? ' lang-si' : ''}`;
        paper.innerHTML = `
            <div class="pp pp--letter">
                <div class="pp__stamp pp__stamp--top ${stampClass}">${escapeHtml(secClass)}</div>
                ${privacy !== 'NONE' ? `<div class="pp__privacy">${escapeHtml(privacy)}</div>` : ''}

                <div class="pp__head">
                    <div class="pp__ref">
                        <div><b>My Ref:</b> ${escapeHtml(ref)}</div>
                        <div><b>File No:</b> ${escapeHtml(fileNo || '—')}</div>
                    </div>
                    <div class="pp__origin">
                        <div class="pp__corner">
                            <span>${escapeHtml(precedence)}</span>
                            ${secret ? `<span class="pp__copy">Copy No. ${copyNo} of ${totalCopies}</span>` : ''}
                            ${secret ? `<span class="pp__copy">Page 1 of ${totalSheets}</span>` : ''}
                        </div>
                        <div class="pp__crest"><img src="logo-crest.png" alt=""></div>
                        <div class="pp__origin-lines">
                            <b>${escapeHtml(office)}</b>
                            <span>${escapeHtml(station)}</span>
                            <span>Tel: ${escapeHtml(tel)}</span>
                            <span class="pp__date">${escapeHtml(date)}</span>
                        </div>
                    </div>
                </div>

                <div class="pp__addr">
                    <div class="pp__to">${escapeHtml(to)}</div>
                    ${through ? `<div class="pp__channel">${escapeHtml(through)}</div>` : ''}
                    ${attention ? `<div class="pp__attention">${escapeHtml(attention)}</div>` : ''}
                </div>

                ${salutation && !isSenior ? `<div class="pp__salutation">${escapeHtml(salutation)}</div>` : ''}

                <div class="pp__subject ${subjectAlign === 'center' ? 'pp__subject--center' : ''}">${escapeHtml(subject)}</div>

                ${references.length ? `<div class="pp__refs"><span class="lbl">References:</span>${refsHtml}</div>` : ''}

                <div class="pp__body">${paragraphsHtml}</div>

                ${sigHtml}

                <div class="pp__foot">
                    <div>
                        ${enclosuresHtml ? `<span class="lbl">Enclosures / Annexes</span>${enclosuresHtml}` : ''}
                    </div>
                    <div>
                        ${copyHtml ? `<span class="lbl">${wideDistribution ? 'Distribution' : 'Copy to'}</span>${copyHtml}` : ''}
                    </div>
                </div>

                ${pageText ? `<div class="pp__pageno">— ${pageText} —</div>` : ''}
                ${privacy !== 'NONE' ? `<div class="pp__privacy pp__privacy--bottom">${escapeHtml(privacy)}</div>` : ''}
                <div class="pp__stamp pp__stamp--bottom ${stampClass}">${escapeHtml(secClass)}</div>
            </div>`;

        /* --- chrome --- */
        const classChip = $('ltrFormClassChip');
        if (classChip) {
            classChip.textContent = secClass;
            classChip.className = `chip chip--sm ${secret ? 'chip--coral' : 'chip--teal'}`;
        }
        const precChip = $('ltrFormPrecChip');
        if (precChip) {
            precChip.textContent = precedence;
            precChip.className = `chip chip--sm ${/FLASH|IMMEDIATE|PRIORITY/.test(precedence) ? 'chip--amber' : ''}`;
        }
        const paperMeta = $('ltrPaperMeta');
        if (paperMeta) {
            paperMeta.textContent = `${secret ? 'secure' : 'standard'} · ${totalSheets} sheet${totalSheets > 1 ? 's' : ''} · A4 210×297 mm`;
        }

        renderChecks('ltrCompliance', letterChecks({
            secClass, precedence, addressee: to, subject,
            sigComplete: !!(signName && signRank && signAppt),
            refCount: references.length,
            refsOk: references.length === 0 || references.every((r) => /\d{2,}/.test(r)),
            copyCount: copyTo.length
        }));

        if (window.Deck && typeof Deck.syncLetterZoom === 'function') Deck.syncLetterZoom();
        if ($('modalLetterPrintStudio')?.classList.contains('flex')) {
            syncLetterPrintStudioPreview();
        }
    }

    /* =========================================================================
       6. BILINGUAL MINUTE PREVIEW
       ========================================================================= */

    function updateMinutePreview() {
        ensureHydration();
        const paper = $('minuteLivePaper');
        if (!paper) return;

        const ref = val('msInputRefNo', state.ms.refNo);
        const date = val('msInputDate', state.ms.date);
        const subject = val('msInputSubject', state.ms.subject);
        const originator = val('msInputOriginator', state.ms.originator);
        const recommendation = val('msInputRecommendation', state.ms.recommendation);
        const signatory = val('msInputSignatory', state.ms.signatory);
        const minuteSeq = val('msInputMinuteSeq', state.ms.minuteSeq || 'M 01');
        const originatorTag = val('msInputOriginatorTag', state.ms.originatorTag || 'BY CCEO(E)');
        const secClass = (val('msInputSecurityClass', 'RESTRICTED') || 'RESTRICTED').toUpperCase();

        const divPct = Math.min(48, Math.max(28, Number(state.ms.dividerWidth) || 36));
        const rightMargin = Number(state.ms.rightMargin) || 20;
        const fontFamily = state.ms.fontFamily || "'Abhaya Libre', 'Noto Serif Sinhala', serif";
        const fontSize = Number(state.ms.fontSize) || 11;
        let leading = Number(state.ms.lineHeight) || 1.65;
        if (state.ms.lang === 'si' && leading < 1.6) leading = 1.6;

        const isSi = state.ms.lang === 'si';
        const addressees = state.ms.addressees.filter((a) => txt(a).trim());
        const paragraphs = state.ms.paragraphs.filter((p) => txt(p.text).trim());

        const m02 = !!state.ms.m02Enabled;
        const m02Addressee = val('msM02InputAddressee', state.ms.m02Addressee);
        const m02Originator = val('msM02InputOriginator', state.ms.m02Originator);
        const m02Text = val('msM02InputText', state.ms.m02Text);
        const m02Date = val('msM02InputDate', state.ms.m02Date);
        const m02Signatory = val('msM02InputSignatory', state.ms.m02Signatory);

        const parasHtml = paragraphs.map((p, idx) => `
            <div class="pp__ms-para">
                <span class="n">${escapeHtml(p.num || String(idx + 1).padStart(2, '0') + '.')}</span>
                <span>${(p.text || '').replace(/\n/g, '<br>')}</span>
            </div>`).join('');

        paper.style.fontFamily = fontFamily;
        paper.style.fontSize = `${fontSize}pt`;
        paper.style.lineHeight = String(leading);
        paper.style.paddingRight = `${rightMargin}mm`;

        paper.innerHTML = `
            <div class="pp pp--minute ${isSi ? 'pp--si' : ''}" lang="${isSi ? 'si' : 'en'}">
                <div class="pp__stamp pp__stamp--top">${escapeHtml(secClass)}</div>

                <div class="pp__ms-head">
                    <span class="seq">${escapeHtml(minuteSeq)}</span>
                    <div class="title">${isSi ? 'සටහන් පත · MINUTE SHEET' : 'MINUTE SHEET'}</div>
                    <div class="orig">${escapeHtml(originatorTag)}</div>
                </div>

                <div class="pp__ms-cols">
                    <div class="pp__ms-left" style="width:${divPct}%">
                        <div class="pp__ms-label">${isSi ? 'ලිපිනය' : 'To'}</div>
                        ${addressees.map((a) => `<div class="pp__ms-addressee">${escapeHtml(a)}</div>`).join('')}
                    </div>
                    <div class="pp__ms-right">
                        <div class="pp__ms-ref">${escapeHtml(ref)}</div>
                        <div class="pp__ms-date">${escapeHtml(date)}</div>
                        ${originator ? `<div class="pp__ms-through"><span>${isSi ? 'මඟින්' : 'Through'}:</span> ${escapeHtml(originator)}</div>` : ''}
                        <div class="pp__ms-subject">${isSi ? 'විෂයය: ' : 'Subject: '}${escapeHtml(subject || '—')}</div>
                        <div class="pp__ms-body">${parasHtml || '<p style="opacity:.45">—</p>'}</div>
                        ${recommendation ? `<div class="pp__ms-rec">${isSi ? 'නිර්දේශය: ' : 'Recommendation: '}${escapeHtml(recommendation)}</div>` : ''}
                        <div class="pp__ms-sig">
                            <div class="line"></div>
                            <b>${escapeHtml(signatory)}</b>
                            <span>${isSi ? 'දිනය: ' : 'Date: '}${escapeHtml(date)}</span>
                        </div>
                    </div>
                </div>

                ${m02 ? `
                <div class="pp__ms-m02">
                    <div class="m02-head">
                        <div><span class="lbl">${isSi ? 'ලිපිනය' : 'To'}</span><br>${escapeHtml(m02Addressee)}</div>
                        <div style="text-align:right"><span class="lbl">${isSi ? 'මඟින්' : 'Through'}</span><br>${escapeHtml(m02Originator)}</div>
                    </div>
                    <div class="m02-text">${escapeHtml(m02Text)}</div>
                    <div class="m02-sig">
                        <div class="line"></div>
                        <b>${escapeHtml(m02Signatory)}</b>
                        <span>${escapeHtml(m02Date)}</span>
                    </div>
                </div>` : ''}

                <div class="pp__stamp pp__stamp--bottom">${escapeHtml(secClass)}</div>
            </div>`;

        /* chrome */
        const langChip = $('msLangChip');
        if (langChip) langChip.textContent = isSi ? 'සිංහල' : 'English';
        const meta = $('msPaperMeta');
        if (meta) meta.textContent = `${minuteSeq} · ${m02 ? 'M 01 + M 02' : 'M 01'} · ${fontSize.toFixed(1)}pt / ${leading.toFixed(2)}`;

        renderChecks('msCompliance', [
            { ok: !!minuteSeq, label: minuteSeq || 'Serial' },
            { ok: !!originatorTag, label: originatorTag || 'Originator' },
            { ok: addressees.length > 0, label: addressees.length ? `${addressees.length} addressee${addressees.length > 1 ? 's' : ''}` : 'Addressee' },
            { ok: txt(subject).length > 2, label: 'Subject' },
            { ok: paragraphs.length > 0, label: `${paragraphs.length} para` },
            { ok: state.ms.lang !== 'si' || leading >= 1.6, label: `Leading ${leading.toFixed(2)}` },
            { ok: true, label: secClass }
        ]);

        if ($('modalMinutePrintStudio')?.classList.contains('flex')) {
            syncMinutePrintStudioPreview();
        }
    }

    /* =========================================================================
       7. EXPORT — public skin namespace
       ========================================================================= */
    window.Skin = {
        setStamping,
        setPrivacy,
        refreshRegistry: () => { renderRegistryTable(); updateRegistryStats(); },
        refreshCompliance: () => { updateLetterPreview(); updateMinutePreview(); }
    };

    /* Re-declare the presentation-bound renderers on the window object so the
       engine's internal calls resolve to the Command Deck implementations. */
    window.renderOfficeCategoryPills = renderOfficeCategoryPills;
    window.renderRegistryTable = renderRegistryTable;
    window.updateRegistryStats = updateRegistryStats;
    window.renderMinuteAddresseesInputs = renderMinuteAddresseesInputs;
    window.renderMinuteParagraphsInputs = renderMinuteParagraphsInputs;
    window.renderLetterReferences = renderLetterReferences;
    window.renderLetterParagraphs = renderLetterParagraphs;
    window.renderLetterEnclosures = renderLetterEnclosures;
    window.renderLetterCopyTo = renderLetterCopyTo;
    window.renderMinuteTemplatesGrid = renderMinuteTemplatesGrid;
    window.renderNavalLetterTemplatesGrid = renderNavalLetterTemplatesGrid;
    window.renderNavalLettersTable = renderNavalLettersTable;
    window.renderConfigItemList = renderConfigItemList;
    window.renderPrefixesTable = renderPrefixesTable;
    window.renderFilesTable = renderFilesTable;
    window.renderTimelineTrail = renderTimelineTrail;
    window.updateLetterPreview = updateLetterPreview;
    window.updateMinutePreview = updateMinutePreview;

    // Re-bind any engine reference captured before this script (defensive; the
    // engine calls the globals lazily, so this is mostly documentation).
    if (window.App && typeof window.App === 'object') {
        window.App.updateLetterPreview = updateLetterPreview;
    }
})();
