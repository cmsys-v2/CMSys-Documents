<?php
/**
 * CMSys Documents — Master Central API
 * Full Multi-Cluster Firebase Synchronization (cmsys-v2, cmsys-v2, cmsys-v2, cmsys-v2)
 * Handles:
 *  1. Document Registry (4 Sections: CCED Writer, Admin, Drawing, Minute Sheet)
 *  2. Pre-determined Outgoing Sequential Prefix Engine
 *  3. File Registry (16 Official Naval Folders)
 *  4. Minute Sheet Creation, Templates & Sync
 *  5. Letter Studio (Navy BR 7 Correspondence, Tones, Templates & Outgoing Registration)
 *  6. System & Document Typography / Designations Settings
 *  7. Cross-Cluster Ecosystem Health, Seeding & Real-Time Sync
 */

require_once __DIR__ . '/config.php';

$pdo = Database::getInstance()->getConnection();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Parse incoming JSON body
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?? [];

switch ($action) {

    // =========================================================================
    // 1. MASTER DOCUMENT & CORRESPONDENCE REGISTRY
    // =========================================================================
    case 'get_documents':
    case 'documents':
        if ($method === 'GET' || $action === 'get_documents') {
            $id = $_GET['id'] ?? null;
            $section = $_GET['section'] ?? 'ALL'; // cced_writer, admin_office, drawing_office, minute_sheet, or ALL
            $flowType = $_GET['flow_type'] ?? 'ALL'; // INCOMING, OUTGOING, or ALL
            $category = $_GET['category'] ?? 'ALL';
            $zoneId = $_GET['zone_id'] ?? null;
            $projectId = $_GET['project_id'] ?? null;
            $position = $_GET['position'] ?? null;
            $search = trim($_GET['search'] ?? '');
            $sortBy = $_GET['sort_by'] ?? 'date_recorded_desc';

            if ($id) {
                $doc = null;
                if ($pdo) {
                    $stmt = $pdo->prepare("SELECT *, DATEDIFF(CURRENT_DATE, date_recorded) AS days_in_position FROM document_registry WHERE id = ?");
                    $stmt->execute([$id]);
                    $doc = $stmt->fetch();
                }
                if (!$doc) {
                    $docsUrl = getDocsFirebaseUrl();
                    $doc = firebaseGet($docsUrl, "document_registry/{$id}");
                }
                if ($doc && isset($doc['position_trail']) && is_string($doc['position_trail'])) {
                    $doc['position_trail'] = json_decode($doc['position_trail'], true) ?? [];
                }
                jsonResponse(['success' => true, 'data' => $doc]);
            }

            // Build dynamic query from local MySQL
            $list = [];
            if ($pdo) {
                try {
                    $where = ["1=1"];
                    $params = [];

                    if ($section !== 'ALL' && !empty($section)) {
                        $where[] = "office_section = ?";
                        $params[] = $section;
                    }

                    if ($flowType !== 'ALL' && !empty($flowType)) {
                        $where[] = "flow_type = ?";
                        $params[] = $flowType;
                    }

                    if ($category !== 'ALL' && !empty($category)) {
                        $where[] = "sender_source_category = ?";
                        $params[] = $category;
                    }

                    if (!empty($zoneId) && $zoneId !== 'ALL') {
                        $where[] = "(directed_to = ? OR directed_type = ?)";
                        $params[] = $zoneId;
                        $params[] = $zoneId;
                    }

                    if (!empty($projectId) && $projectId !== 'ALL') {
                        $where[] = "project_id = ?";
                        $params[] = $projectId;
                    }

                    if (!empty($position) && $position !== 'ALL') {
                        $where[] = "present_position = ?";
                        $params[] = $position;
                    }

                    if (!empty($search)) {
                        $where[] = "(ref_no LIKE ? OR sender_ref_no LIKE ? OR subject LIKE ? OR sender_or_recipient LIKE ? OR file_no LIKE ? OR linked_signal_ref LIKE ?)";
                        $sTerm = "%{$search}%";
                        $params[] = $sTerm;
                        $params[] = $sTerm;
                        $params[] = $sTerm;
                        $params[] = $sTerm;
                        $params[] = $sTerm;
                        $params[] = $sTerm;
                    }

                    $order = "date_recorded DESC, created_at DESC";
                    switch ($sortBy) {
                        case 'date_recorded_asc':
                            $order = "date_recorded ASC";
                            break;
                        case 'date_letter_desc':
                            $order = "date_letter DESC";
                            break;
                        case 'ref_no_asc':
                            $order = "ref_no ASC";
                            break;
                        case 'sender_asc':
                            $order = "sender_or_recipient ASC";
                            break;
                        case 'priority_desc':
                            $order = "FIELD(priority, 'High', 'Urgent', 'Normal', 'Low')";
                            break;
                    }

                    $sql = "SELECT *, DATEDIFF(CURRENT_DATE, date_recorded) AS days_in_position FROM document_registry WHERE " . implode(" AND ", $where) . " ORDER BY " . $order . " LIMIT 500";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $list = $stmt->fetchAll();

                    foreach ($list as &$item) {
                        $item['days_in_position'] = isset($item['days_in_position']) ? (int)$item['days_in_position'] : 0;
                        if (isset($item['position_trail']) && is_string($item['position_trail'])) {
                            $item['position_trail'] = json_decode($item['position_trail'], true) ?? [];
                        }
                    }
                } catch (Exception $e) {
                    error_log("documents GET error: " . $e->getMessage());
                }
            }

            // Fallback to Firebase (cmsys-v2) if list is empty
            if (empty($list)) {
                $docsUrl = getDocsFirebaseUrl();
                $fbData = firebaseGet($docsUrl, 'document_registry');
                if (is_array($fbData)) {
                    foreach ($fbData as $k => $v) {
                        if (!is_array($v)) continue;
                        $v['id'] = $v['id'] ?? $k;
                        if ($section !== 'ALL' && ($v['office_section'] ?? '') !== $section) continue;
                        if ($flowType !== 'ALL' && ($v['flow_type'] ?? '') !== $flowType) continue;
                        if ($category !== 'ALL' && ($v['sender_source_category'] ?? '') !== $category) continue;
                        if (!empty($zoneId) && $zoneId !== 'ALL' && ($v['directed_to'] ?? '') !== $zoneId) continue;
                        $list[] = $v;
                    }
                }
            }

            jsonResponse(['success' => true, 'count' => count($list), 'data' => $list]);
        }

        // CREATE OR UPDATE DOCUMENT
        if ($method === 'POST' || $method === 'PUT') {
            $data = !empty($input) ? $input : $_POST;

            $id = $data['id'] ?? ('doc_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)));
            $officeSection = $data['office_section'] ?? 'cced_writer';
            $flowType = strtoupper($data['flow_type'] ?? 'INCOMING');
            $docType = $data['doc_type'] ?? 'LETTER';
            $refNo = trim($data['ref_no'] ?? '');
            $senderRefNo = trim($data['sender_ref_no'] ?? '');
            $category = $data['sender_source_category'] ?? ($data['category'] ?? 'General');
            $senderOrRecipient = trim($data['sender_or_recipient'] ?? '');
            $dateLetter = !empty($data['date_letter']) ? $data['date_letter'] : null;
            $dateRecorded = !empty($data['date_recorded']) ? $data['date_recorded'] : date('Y-m-d');
            $subject = trim($data['subject'] ?? '');
            $scopeDesc = trim($data['scope_description'] ?? ($data['description'] ?? ''));
            $directedType = $data['directed_type'] ?? '';
            $directedTo = $data['directed_to'] ?? '';
            $projectId = $data['project_id'] ?? null;
            $projectName = $data['project_name'] ?? null;
            $priority = $data['priority'] ?? 'Normal';
            $securityClass = $data['security_class'] ?? 'RESTRICTED';
            $presentPosition = $data['present_position'] ?? ($data['position'] ?? 'Received / In Registry');
            $actionOfficer = $data['action_officer'] ?? '';
            $fileBoxRef = $data['file_box_ref'] ?? '';
            $fileNo = $data['file_no'] ?? '';
            $folioNo = $data['folio_no'] ?? '';
            $dispatchMode = $data['dispatch_mode'] ?? '';
            $dispatchBookRef = $data['dispatch_book_ref'] ?? '';
            $contactPerson = $data['contact_person'] ?? '';
            $contactNo = $data['contact_no'] ?? '';
            $whatsappNo = $data['whatsapp_no'] ?? '';
            $linkedEstimateId = $data['linked_estimate_id'] ?? null;
            $linkedJobNumber = $data['linked_job_number'] ?? null;
            $linkedSignalRef = $data['linked_signal_ref'] ?? null;
            $status = $data['status'] ?? 'Active';

            // Position trail
            $trail = $data['position_trail'] ?? [];
            if (is_string($trail)) {
                $trail = json_decode($trail, true) ?? [];
            }
            if (empty($trail)) {
                $trail[] = [
                    'date' => date('Y-m-d H:i'),
                    'officer' => $actionOfficer ?: 'Registry Clerk',
                    'stage' => $presentPosition,
                    'remarks' => $flowType === 'OUTGOING' ? 'Outgoing Document Registered' : 'Received into Registry'
                ];
            }
            $trailJson = json_encode($trail, JSON_UNESCAPED_UNICODE);

            if ($pdo) {
                try {
                    $sql = "INSERT INTO document_registry (
                        id, office_section, flow_type, doc_type, ref_no, sender_ref_no,
                        sender_source_category, sender_or_recipient, date_letter, date_recorded,
                        subject, scope_description, directed_type, directed_to, project_id, project_name,
                        priority, security_class, present_position, action_officer, file_box_ref,
                        file_no, folio_no, dispatch_mode, dispatch_book_ref, contact_person,
                        contact_no, whatsapp_no, linked_estimate_id, linked_job_number,
                        linked_signal_ref, position_trail, status
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    ) ON DUPLICATE KEY UPDATE
                        office_section = VALUES(office_section),
                        flow_type = VALUES(flow_type),
                        doc_type = VALUES(doc_type),
                        ref_no = VALUES(ref_no),
                        sender_ref_no = VALUES(sender_ref_no),
                        sender_source_category = VALUES(sender_source_category),
                        sender_or_recipient = VALUES(sender_or_recipient),
                        date_letter = VALUES(date_letter),
                        date_recorded = VALUES(date_recorded),
                        subject = VALUES(subject),
                        scope_description = VALUES(scope_description),
                        directed_type = VALUES(directed_type),
                        directed_to = VALUES(directed_to),
                        project_id = VALUES(project_id),
                        project_name = VALUES(project_name),
                        priority = VALUES(priority),
                        security_class = VALUES(security_class),
                        present_position = VALUES(present_position),
                        action_officer = VALUES(action_officer),
                        file_box_ref = VALUES(file_box_ref),
                        file_no = VALUES(file_no),
                        folio_no = VALUES(folio_no),
                        dispatch_mode = VALUES(dispatch_mode),
                        dispatch_book_ref = VALUES(dispatch_book_ref),
                        contact_person = VALUES(contact_person),
                        contact_no = VALUES(contact_no),
                        whatsapp_no = VALUES(whatsapp_no),
                        linked_estimate_id = VALUES(linked_estimate_id),
                        linked_job_number = VALUES(linked_job_number),
                        linked_signal_ref = VALUES(linked_signal_ref),
                        position_trail = VALUES(position_trail),
                        status = VALUES(status),
                        updated_at = NOW()";

                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        $id, $officeSection, $flowType, $docType, $refNo, $senderRefNo,
                        $category, $senderOrRecipient, $dateLetter, $dateRecorded,
                        $subject, $scopeDesc, $directedType, $directedTo, $projectId, $projectName,
                        $priority, $securityClass, $presentPosition, $actionOfficer, $fileBoxRef,
                        $fileNo, $folioNo, $dispatchMode, $dispatchBookRef, $contactPerson,
                        $contactNo, $whatsappNo, $linkedEstimateId, $linkedJobNumber,
                        $linkedSignalRef, $trailJson, $status
                    ]);
                } catch (Exception $e) {
                    error_log("documents SAVE DB error: " . $e->getMessage());
                }
            }

            // Multi-Cluster Ecosystem Sync
            $fbPayload = [
                'id' => $id,
                'office_section' => $officeSection,
                'flow_type' => $flowType,
                'doc_type' => $docType,
                'ref_no' => $refNo,
                'sender_ref_no' => $senderRefNo,
                'sender_source_category' => $category,
                'sender_or_recipient' => $senderOrRecipient,
                'date_letter' => $dateLetter,
                'date_recorded' => $dateRecorded,
                'subject' => $subject,
                'scope_description' => $scopeDesc,
                'directed_type' => $directedType,
                'directed_to' => $directedTo,
                'project_id' => $projectId,
                'project_name' => $projectName,
                'priority' => $priority,
                'security_class' => $securityClass,
                'present_position' => $presentPosition,
                'action_officer' => $actionOfficer,
                'file_box_ref' => $fileBoxRef,
                'file_no' => $fileNo,
                'folio_no' => $folioNo,
                'dispatch_mode' => $dispatchMode,
                'dispatch_book_ref' => $dispatchBookRef,
                'contact_person' => $contactPerson,
                'contact_no' => $contactNo,
                'whatsapp_no' => $whatsappNo,
                'linked_estimate_id' => $linkedEstimateId,
                'linked_job_number' => $linkedJobNumber,
                'linked_signal_ref' => $linkedSignalRef,
                'position_trail' => $trail,
                'status' => $status,
                'updated_at' => date('Y-m-d H:i:s')
            ];

            $syncStatus = syncToEcosystemFirebase('document_registry', $id, $fbPayload);

            jsonResponse(['success' => true, 'id' => $id, 'data' => $fbPayload, 'sync' => $syncStatus]);
        }

        if ($method === 'DELETE') {
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if ($id) {
                if ($pdo) {
                    $stmt = $pdo->prepare("DELETE FROM document_registry WHERE id = ?");
                    $stmt->execute([$id]);
                }
                $docsUrl = getDocsFirebaseUrl();
                firebaseDelete($docsUrl, "document_registry/{$id}");
                jsonResponse(['success' => true, 'deleted' => $id]);
            }
            jsonResponse(['success' => false, 'error' => 'Missing ID'], 400);
        }
        break;

    // =========================================================================
    // 1B. PRESENT POSITION UPDATE & AUDIT TRAIL
    // =========================================================================
    case 'save_position':
    case 'update_position':
        $data = !empty($input) ? $input : $_POST;
        $id = $data['id'] ?? null;
        $newPosition = trim($data['present_position'] ?? ($data['position'] ?? ''));
        $officer = trim($data['action_officer'] ?? ($data['officer'] ?? 'Officer'));
        $remarks = trim($data['remarks'] ?? '');
        $stageDate = !empty($data['date']) ? $data['date'] : (!empty($data['timestamp']) ? $data['timestamp'] : date('Y-m-d H:i'));

        if (!$id || !$newPosition) {
            jsonResponse(['success' => false, 'error' => 'Missing ID or Position'], 400);
        }

        $existing = null;
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT * FROM document_registry WHERE id = ?");
            $stmt->execute([$id]);
            $existing = $stmt->fetch();
        }
        if (!$existing) {
            $docsUrl = getDocsFirebaseUrl();
            $existing = firebaseGet($docsUrl, "document_registry/{$id}");
        }

        $officerFrom = trim($data['officer_from'] ?? ($existing['action_officer'] ?? 'Registry / Current Desk'));
        $toOfficer = trim($data['to_officer'] ?? $officer);
        $actionStatus = $newPosition;
        $timestamp = $stageDate;

        $trail = [];
        if ($existing && isset($existing['position_trail'])) {
            $trail = is_string($existing['position_trail']) ? json_decode($existing['position_trail'], true) : $existing['position_trail'];
        }
        if (!is_array($trail)) $trail = [];

        $trail[] = [
            'officer_from' => $officerFrom,
            'to_officer' => $toOfficer,
            'timestamp' => $timestamp,
            'action_status' => $actionStatus,
            'remarks' => $remarks,
            'date' => $timestamp,
            'officer' => $toOfficer,
            'stage' => $actionStatus
        ];
        $trailJson = json_encode($trail, JSON_UNESCAPED_UNICODE);

        if ($pdo) {
            $stmt = $pdo->prepare("UPDATE document_registry SET present_position = ?, action_officer = ?, position_trail = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$newPosition, $toOfficer, $trailJson, $id]);

            // Sync to job_minutes if exists
            $stmt2 = $pdo->prepare("UPDATE job_minutes SET position = ?, position_trail = ?, updated_at = NOW() WHERE id = ?");
            $stmt2->execute([$newPosition, $trailJson, $id]);
        }

        $docsUrl = getDocsFirebaseUrl();
        firebasePatch($docsUrl, "document_registry/{$id}", [
            'present_position' => $newPosition,
            'action_officer' => $toOfficer,
            'position_trail' => $trail,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        // Mirror position update to CMSys V2
        firebasePatch(FB_CORE_DB_URL, "job_minutes/{$id}", [
            'position' => $newPosition,
            'position_trail' => $trail,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        jsonResponse(['success' => true, 'id' => $id, 'present_position' => $newPosition, 'position_trail' => $trail]);
        break;

    // =========================================================================
    // 1C. OUTING / DISPATCH MOVEMENT
    // =========================================================================
    case 'save_outing':
        $data = !empty($input) ? $input : $_POST;
        $id = $data['id'] ?? null;
        $dispatchMode = $data['dispatch_mode'] ?? 'By Hand';
        $dispatchBookRef = trim($data['dispatch_book_ref'] ?? '');
        $folioNo = trim($data['folio_no'] ?? '');
        $messenger = trim($data['messenger'] ?? '');
        $outingDate = !empty($data['outing_date']) ? $data['outing_date'] : date('Y-m-d H:i');
        $remarks = trim($data['remarks'] ?? '');

        if (!$id) {
            jsonResponse(['success' => false, 'error' => 'Missing Document ID'], 400);
        }

        $existing = null;
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT * FROM document_registry WHERE id = ?");
            $stmt->execute([$id]);
            $existing = $stmt->fetch();
        }
        $trail = [];
        if ($existing && !empty($existing['position_trail'])) {
            $trail = is_string($existing['position_trail']) ? json_decode($existing['position_trail'], true) : $existing['position_trail'];
        }
        if (!is_array($trail)) $trail = [];

        $trailRemarks = "Dispatched via {$dispatchMode}";
        if ($dispatchBookRef) $trailRemarks .= " (Book Ref: {$dispatchBookRef})";
        if ($messenger) $trailRemarks .= " by {$messenger}";
        if ($remarks) $trailRemarks .= " - {$remarks}";

        $trail[] = [
            'date' => $outingDate,
            'officer' => $messenger ?: 'Dispatch Clerk',
            'stage' => 'Dispatched / Outed',
            'remarks' => $trailRemarks
        ];
        $trailJson = json_encode($trail, JSON_UNESCAPED_UNICODE);

        if ($pdo) {
            $stmt = $pdo->prepare("UPDATE document_registry SET
                dispatch_mode = ?,
                dispatch_book_ref = ?,
                folio_no = ?,
                present_position = 'Dispatched / Outed',
                position_trail = ?,
                updated_at = NOW()
                WHERE id = ?");
            $stmt->execute([$dispatchMode, $dispatchBookRef, $folioNo, $trailJson, $id]);
        }

        $docsUrl = getDocsFirebaseUrl();
        firebasePatch($docsUrl, "document_registry/{$id}", [
            'dispatch_mode' => $dispatchMode,
            'dispatch_book_ref' => $dispatchBookRef,
            'folio_no' => $folioNo,
            'present_position' => 'Dispatched / Outed',
            'position_trail' => $trail,
            'updated_at' => date('Y-m-d H:i:s')
        ]);

        jsonResponse([
            'success' => true,
            'id' => $id,
            'dispatch_mode' => $dispatchMode,
            'dispatch_book_ref' => $dispatchBookRef,
            'folio_no' => $folioNo,
            'position_trail' => $trail
        ]);
        break;

    // =========================================================================
    // 2. PRE-DETERMINED OUTGOING SEQUENTIAL PREFIX ENGINE
    // =========================================================================
    case 'prefixes':
        if ($method === 'GET') {
            $section = $_GET['section'] ?? null;
            $list = [];
            if ($pdo) {
                if ($section && $section !== 'ALL') {
                    $stmt = $pdo->prepare("SELECT * FROM registry_prefixes WHERE office_section = ? ORDER BY is_default DESC, category ASC");
                    $stmt->execute([$section]);
                    $list = $stmt->fetchAll();
                } else {
                    $stmt = $pdo->query("SELECT * FROM registry_prefixes ORDER BY office_section ASC, is_default DESC, category ASC");
                    $list = $stmt->fetchAll();
                }
            }
            jsonResponse(['success' => true, 'data' => $list]);
        }

        if ($method === 'POST' || $method === 'PUT') {
            $data = !empty($input) ? $input : $_POST;
            $id = $data['id'] ?? ('pfx_' . bin2hex(random_bytes(4)));
            $section = $data['office_section'] ?? 'cced_writer';
            $category = $data['category'] ?? 'General';
            $flowType = strtoupper($data['flow_type'] ?? 'OUTGOING');
            $pattern = trim($data['prefix_pattern'] ?? 'CCED/{YYYY}/{SEQ}');
            $seq = intval($data['next_sequence'] ?? 1);
            $padding = intval($data['padding_length'] ?? 4);
            $sep = $data['separator_char'] ?? '/';
            $desc = $data['description'] ?? '';
            $isDef = !empty($data['is_default']) ? 1 : 0;

            if ($pdo) {
                $sql = "INSERT INTO registry_prefixes (id, office_section, category, flow_type, prefix_pattern, next_sequence, padding_length, separator_char, description, is_default)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            office_section = VALUES(office_section),
                            category = VALUES(category),
                            flow_type = VALUES(flow_type),
                            prefix_pattern = VALUES(prefix_pattern),
                            next_sequence = VALUES(next_sequence),
                            padding_length = VALUES(padding_length),
                            separator_char = VALUES(separator_char),
                            description = VALUES(description),
                            is_default = VALUES(is_default)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $section, $category, $flowType, $pattern, $seq, $padding, $sep, $desc, $isDef]);
            }

            // Sync to cmsys-v2
            $docsUrl = getDocsFirebaseUrl();
            firebasePatch($docsUrl, "registry_prefixes/{$id}", [
                'id' => $id, 'office_section' => $section, 'category' => $category,
                'prefix_pattern' => $pattern, 'next_sequence' => $seq, 'padding_length' => $padding
            ]);

            jsonResponse(['success' => true, 'id' => $id, 'message' => 'Prefix saved']);
        }
        break;

    // Generate Next Sequential Reference Number (Thread-Safe Atomic Engine with SELECT ... FOR UPDATE)
    case 'generate_ref':
        $section = $_GET['section'] ?? ($input['office_section'] ?? 'cced_writer');
        $category = $_GET['category'] ?? ($input['category'] ?? '');
        $prefixId = $_GET['prefix_id'] ?? ($input['prefix_id'] ?? null);
        $previewOnly = !empty($_GET['preview_only']) || !empty($input['preview_only']);

        $prefixRecord = null;
        if ($pdo) {
            if ($prefixId) {
                $stmt = $pdo->prepare("SELECT * FROM registry_prefixes WHERE id = ?");
                $stmt->execute([$prefixId]);
                $prefixRecord = $stmt->fetch();
            }
            if (!$prefixRecord && $category) {
                $stmt = $pdo->prepare("SELECT * FROM registry_prefixes WHERE office_section = ? AND category = ? LIMIT 1");
                $stmt->execute([$section, $category]);
                $prefixRecord = $stmt->fetch();
            }
            if (!$prefixRecord) {
                $stmt = $pdo->prepare("SELECT * FROM registry_prefixes WHERE office_section = ? AND is_default = 1 LIMIT 1");
                $stmt->execute([$section]);
                $prefixRecord = $stmt->fetch();
            }
            if (!$prefixRecord) {
                $stmt = $pdo->prepare("SELECT * FROM registry_prefixes WHERE office_section = ? LIMIT 1");
                $stmt->execute([$section]);
                $prefixRecord = $stmt->fetch();
            }
        }

        if (!$prefixRecord) {
            $year = date('Y');
            $seqStr = str_pad("1", 4, "0", STR_PAD_LEFT);
            $ref = strtoupper("{$section}/{$year}/{$seqStr}");
            jsonResponse(['success' => true, 'ref_no' => $ref, 'sequence' => 1, 'prefix_id' => null]);
        }

        $now = new DateTime();
        $yyyy = $now->format('Y');
        $yy   = $now->format('y');
        $mm   = $now->format('m');
        $m    = $now->format('n');
        $dd   = $now->format('d');
        $d    = $now->format('j');

        $pattern = $prefixRecord['prefix_pattern'];
        $seq = intval($prefixRecord['next_sequence']);
        $padding = intval($prefixRecord['padding_length']);
        $nextSeq = $seq + 1;

        if (!$previewOnly && $pdo) {
            try {
                $pdo->beginTransaction();
                // SQL Row-level locking (SELECT ... FOR UPDATE)
                $lockStmt = $pdo->prepare("SELECT * FROM registry_prefixes WHERE id = ? FOR UPDATE");
                $lockStmt->execute([$prefixRecord['id']]);
                $lockedRow = $lockStmt->fetch();

                if ($lockedRow) {
                    $pattern = $lockedRow['prefix_pattern'];
                    $seq = intval($lockedRow['next_sequence']);
                    $padding = intval($lockedRow['padding_length']);
                    $nextSeq = $seq + 1;

                    $updateStmt = $pdo->prepare("UPDATE registry_prefixes SET next_sequence = ?, updated_at = NOW() WHERE id = ?");
                    $updateStmt->execute([$nextSeq, $lockedRow['id']]);
                    $pdo->commit();

                    $docsUrl = getDocsFirebaseUrl();
                    firebasePatch($docsUrl, "registry_prefixes/{$lockedRow['id']}/next_sequence", $nextSeq);
                } else {
                    $pdo->rollBack();
                }
            } catch (Exception $e) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                error_log("[CMSys Documents] Atomic serial generator lock failed: " . $e->getMessage());
            }
        }

        // Token pattern replacer supporting {YYYY}, {YY}, {MM}, {M}, {DD}, {D}, {SEQ}
        $padSeq = ($padding > 0) ? str_pad((string)$seq, $padding, "0", STR_PAD_LEFT) : (string)$seq;
        $refNo = str_replace(
            ['{YYYY}', '{YY}', '{MM}', '{M}', '{DD}', '{D}', '{SEQ}'],
            [$yyyy, $yy, $mm, $m, $dd, $d, $padSeq],
            $pattern
        );

        jsonResponse([
            'success' => true,
            'ref_no' => $refNo,
            'sequence' => $seq,
            'next_sequence' => $nextSeq,
            'prefix_id' => $prefixRecord['id'],
            'pattern' => $pattern
        ]);
        break;

    // =========================================================================
    // 3. FILE REGISTRY (16 Official Naval Folders)
    // =========================================================================
    case 'files':
        if ($method === 'GET') {
            $section = $_GET['section'] ?? 'ALL';
            $search = trim($_GET['search'] ?? '');
            $list = [];

            if ($pdo) {
                $where = ["1=1"];
                $params = [];
                if ($section !== 'ALL' && !empty($section)) {
                    $where[] = "office_section = ?";
                    $params[] = $section;
                }
                if (!empty($search)) {
                    $where[] = "(file_no LIKE ? OR subject LIKE ? OR file_box_ref LIKE ? OR cabinet_location LIKE ?)";
                    $sTerm = "%{$search}%";
                    $params[] = $sTerm;
                    $params[] = $sTerm;
                    $params[] = $sTerm;
                    $params[] = $sTerm;
                }
                $sql = "SELECT * FROM file_registry WHERE " . implode(" AND ", $where) . " ORDER BY file_no ASC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $list = $stmt->fetchAll();
            }

            jsonResponse(['success' => true, 'count' => count($list), 'data' => $list]);
        }

        if ($method === 'POST') {
            $data = !empty($input) ? $input : $_POST;
            $id = $data['id'] ?? ('file_' . bin2hex(random_bytes(4)));
            $fileNo = trim($data['file_no'] ?? '');
            $subject = trim($data['subject'] ?? '');
            $office = $data['office_section'] ?? 'cced_writer';
            $category = $data['category'] ?? 'General';
            $fileBox = trim($data['file_box_ref'] ?? '');
            $cabinet = trim($data['cabinet_location'] ?? '');
            $volume = trim($data['current_volume'] ?? 'Vol 1');
            $folios = intval($data['total_folios'] ?? 0);
            $status = $data['status'] ?? 'Active';
            $remarks = trim($data['remarks'] ?? '');

            if (!$fileNo || !$subject) {
                jsonResponse(['success' => false, 'error' => 'File No and Subject are required'], 400);
            }

            if ($pdo) {
                $sql = "INSERT INTO file_registry (id, file_no, subject, office_section, category, file_box_ref, cabinet_location, current_volume, total_folios, status, remarks)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            file_no = VALUES(file_no),
                            subject = VALUES(subject),
                            office_section = VALUES(office_section),
                            category = VALUES(category),
                            file_box_ref = VALUES(file_box_ref),
                            cabinet_location = VALUES(cabinet_location),
                            current_volume = VALUES(current_volume),
                            total_folios = VALUES(total_folios),
                            status = VALUES(status),
                            remarks = VALUES(remarks)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $fileNo, $subject, $office, $category, $fileBox, $cabinet, $volume, $folios, $status, $remarks]);
            }

            $docsUrl = getDocsFirebaseUrl();
            firebasePatch($docsUrl, "file_registry/{$id}", [
                'id' => $id, 'file_no' => $fileNo, 'subject' => $subject,
                'office_section' => $office, 'file_box_ref' => $fileBox, 'total_folios' => $folios
            ]);

            jsonResponse(['success' => true, 'id' => $id, 'file_no' => $fileNo]);
        }
        break;

    // =========================================================================
    // 4. MINUTE SHEET RECORDS & TEMPLATES
    // =========================================================================
    case 'job_minutes':
        if ($method === 'GET') {
            $list = [];
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM job_minutes ORDER BY date_received DESC, created_at DESC LIMIT 300");
                $list = $stmt->fetchAll();
                foreach ($list as &$m) {
                    if (isset($m['position_trail']) && is_string($m['position_trail'])) {
                        $m['position_trail'] = json_decode($m['position_trail'], true) ?? [];
                    }
                }
            }
            jsonResponse(['success' => true, 'count' => count($list), 'data' => $list]);
        }

        if ($method === 'POST') {
            $data = !empty($input) ? $input : $_POST;
            $id = $data['id'] ?? ('min_' . bin2hex(random_bytes(6)));
            $refNo = trim($data['ref_no'] ?? '');
            $dateReceived = !empty($data['date_received']) ? $data['date_received'] : (!empty($data['date']) ? $data['date'] : date('Y-m-d'));
            $endUser = trim($data['end_user'] ?? ($data['originator'] ?? 'Originator Desk'));
            $subject = trim($data['subject'] ?? 'Naval Minute');
            $description = trim($data['description'] ?? '');
            $position = trim($data['position'] ?? 'Under Scrutiny by CCEO');
            $trail = is_array($data['position_trail'] ?? null) ? json_encode($data['position_trail'], JSON_UNESCAPED_UNICODE) : ($data['position_trail'] ?? '[]');

            if ($pdo) {
                $stmt = $pdo->prepare("INSERT INTO job_minutes (id, ref_no, date_received, end_user, subject, description, position, position_trail, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE ref_no = VALUES(ref_no), date_received = VALUES(date_received), end_user = VALUES(end_user),
                    subject = VALUES(subject), description = VALUES(description), position = VALUES(position), position_trail = VALUES(position_trail), updated_at = NOW()");
                $stmt->execute([$id, $refNo, $dateReceived, $endUser, $subject, $description, $position, $trail]);
            }

            // Sync to Firebase Core RTDB if online
            firebasePatch(FB_CORE_DB_URL, "job_minutes/{$id}", [
                'id' => $id,
                'ref_no' => $refNo,
                'date_received' => $dateReceived,
                'end_user' => $endUser,
                'subject' => $subject,
                'description' => $description,
                'position' => $position,
                'updated_at' => date('Y-m-d H:i:s')
            ]);

            jsonResponse(['success' => true, 'id' => $id, 'ref_no' => $refNo]);
        }
        break;

    case 'minute_templates':
        if ($method === 'GET') {
            $list = [];
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM minute_templates ORDER BY category ASC, title ASC");
                $list = $stmt->fetchAll();
                foreach ($list as &$tpl) {
                    if (isset($tpl['paragraphs']) && is_string($tpl['paragraphs'])) {
                        $tpl['paragraphs'] = json_decode($tpl['paragraphs'], true) ?? [];
                    }
                }
            }
            jsonResponse(['success' => true, 'data' => $list]);
        }

        if ($method === 'POST') {
            $data = !empty($input) ? $input : $_POST;
            $id = $data['id'] ?? ('ms_tpl_' . bin2hex(random_bytes(4)));
            $lang = $data['lang'] ?? 'si';
            $title = trim($data['title'] ?? 'Custom Minute Template');
            $category = $data['category'] ?? 'General';
            $refNo = $data['ref_no'] ?? '';
            $subject = $data['subject'] ?? '';
            $addressees = is_array($data['addressees'] ?? null) ? json_encode($data['addressees'], JSON_UNESCAPED_UNICODE) : ($data['addressees'] ?? '');
            $originator = $data['originator'] ?? '';
            $paragraphs = is_array($data['paragraphs'] ?? null) ? json_encode($data['paragraphs'], JSON_UNESCAPED_UNICODE) : ($data['paragraphs'] ?? '[]');
            $recommendation = $data['recommendation'] ?? '';
            $signTitle = $data['sign_title'] ?? '';
            $m02Enabled = !empty($data['m02_enabled']) ? 1 : 0;
            $m02Addressee = $data['m02_addressee'] ?? '';
            $m02Originator = $data['m02_originator'] ?? '';
            $m02Text = $data['m02_text'] ?? '';
            $m02SignTitle = $data['m02_sign_title'] ?? '';

            if ($pdo) {
                $sql = "INSERT INTO minute_templates (
                    id, lang, title, category, ref_no, subject, addressees, originator,
                    paragraphs, recommendation, sign_title, m02_enabled, m02_addressee,
                    m02_originator, m02_text, m02_sign_title
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    lang = VALUES(lang),
                    title = VALUES(title),
                    category = VALUES(category),
                    ref_no = VALUES(ref_no),
                    subject = VALUES(subject),
                    addressees = VALUES(addressees),
                    originator = VALUES(originator),
                    paragraphs = VALUES(paragraphs),
                    recommendation = VALUES(recommendation),
                    sign_title = VALUES(sign_title),
                    m02_enabled = VALUES(m02_enabled),
                    m02_addressee = VALUES(m02_addressee),
                    m02_originator = VALUES(m02_originator),
                    m02_text = VALUES(m02_text),
                    m02_sign_title = VALUES(m02_sign_title)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $id, $lang, $title, $category, $refNo, $subject, $addressees, $originator,
                    $paragraphs, $recommendation, $signTitle, $m02Enabled, $m02Addressee,
                    $m02Originator, $m02Text, $m02SignTitle
                ]);
            }

            $docsUrl = getDocsFirebaseUrl();
            firebasePatch($docsUrl, "minute_templates/{$id}", [
                'id' => $id, 'title' => $title, 'category' => $category, 'lang' => $lang, 'subject' => $subject
            ]);

            jsonResponse(['success' => true, 'id' => $id]);
        }

        if ($method === 'DELETE') {
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if ($id && $pdo) {
                $stmt = $pdo->prepare("DELETE FROM minute_templates WHERE id = ?");
                $stmt->execute([$id]);
                $docsUrl = getDocsFirebaseUrl();
                firebaseDelete($docsUrl, "minute_templates/{$id}");
                jsonResponse(['success' => true, 'deleted' => $id]);
            }
            jsonResponse(['success' => false, 'error' => 'Missing ID'], 400);
        }
        break;

    // =========================================================================
    // 5. LETTER STUDIO — NAVAL BR 7 CORRESPONDENCE
    // =========================================================================
    case 'save_letter':
    case 'naval_letters':
        if ($method === 'GET' && $action !== 'save_letter') {
            $id = $_GET['id'] ?? null;
            $search = trim($_GET['search'] ?? '');
            $status = $_GET['status'] ?? 'ALL';

            if ($id && $pdo) {
                $stmt = $pdo->prepare("SELECT * FROM naval_letters WHERE id = ?");
                $stmt->execute([$id]);
                $letter = $stmt->fetch();
                if ($letter) {
                    $letter['references_list'] = json_decode($letter['references_list'] ?? '[]', true);
                    $letter['paragraphs'] = json_decode($letter['paragraphs'] ?? '[]', true);
                    $letter['enclosures_list'] = json_decode($letter['enclosures_list'] ?? '[]', true);
                    $letter['copy_to_list'] = json_decode($letter['copy_to_list'] ?? '[]', true);
                }
                jsonResponse(['success' => true, 'data' => $letter]);
            }

            $list = [];
            if ($pdo) {
                $where = ["1=1"];
                $params = [];
                if ($status !== 'ALL' && !empty($status)) {
                    $where[] = "status = ?";
                    $params[] = $status;
                }
                if (!empty($search)) {
                    $where[] = "(letter_ref LIKE ? OR subject LIKE ? OR addressee_to LIKE ? OR file_no LIKE ?)";
                    $sTerm = "%{$search}%";
                    $params[] = $sTerm;
                    $params[] = $sTerm;
                    $params[] = $sTerm;
                    $params[] = $sTerm;
                }
                $sql = "SELECT * FROM naval_letters WHERE " . implode(" AND ", $where) . " ORDER BY letter_date DESC, created_at DESC LIMIT 200";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $list = $stmt->fetchAll();

                foreach ($list as &$item) {
                    $item['references_list'] = json_decode($item['references_list'] ?? '[]', true);
                    $item['paragraphs'] = json_decode($item['paragraphs'] ?? '[]', true);
                    $item['enclosures_list'] = json_decode($item['enclosures_list'] ?? '[]', true);
                    $item['copy_to_list'] = json_decode($item['copy_to_list'] ?? '[]', true);
                }
            }

            jsonResponse(['success' => true, 'count' => count($list), 'data' => $list]);
        }

        if ($method === 'POST' || $action === 'save_letter') {
            $data = !empty($input) ? $input : $_POST;

            $id = $data['id'] ?? ('ltr_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)));
            $letterRef = trim($data['letter_ref'] ?? 'CCED/NHQ/' . date('Y') . '/0001');
            $fileNo = trim($data['file_no'] ?? '');
            $letterDate = !empty($data['letter_date']) ? $data['letter_date'] : date('Y-m-d');
            $securityClass = $data['security_class'] ?? 'RESTRICTED';
            $precedence = $data['precedence'] ?? 'ROUTINE';
            $letterheadOffice = $data['letterhead_office'] ?? 'COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)';
            $letterheadStation = $data['letterhead_station'] ?? 'SLN DOCKYARD, TRINCOMALEE';
            $letterheadTel = $data['letterhead_tel'] ?? '026-2222384 / Ext 3144';
            $letterheadEmail = $data['letterhead_email'] ?? 'cceoeast@navy.lk';
            $addresseeTo = trim($data['addressee_to'] ?? '');
            $channelThrough = trim($data['channel_through'] ?? '');
            $attentionTo = trim($data['attention_to'] ?? ($data['attention'] ?? ''));
            $subject = trim($data['subject'] ?? '');
            $br7Tone = $data['br7_tone'] ?? 'senior';
            $salutation = trim($data['salutation'] ?? '');
            $compClose = trim($data['complimentary_close'] ?? '');
            $signName = trim($data['signatory_name'] ?? '');
            $signRank = trim($data['signatory_rank'] ?? '');
            $signAppointment = trim($data['signatory_appointment'] ?? '');
            $status = $data['status'] ?? 'Draft';
            $isRegistered = !empty($data['is_registered_outgoing']) ? 1 : 0;
            $registeredDocId = $data['registered_doc_id'] ?? null;

            // Arrays
            $refs = is_array($data['references_list'] ?? null) ? json_encode($data['references_list'], JSON_UNESCAPED_UNICODE) : ($data['references_list'] ?? '[]');
            $paras = is_array($data['paragraphs'] ?? null) ? json_encode($data['paragraphs'], JSON_UNESCAPED_UNICODE) : ($data['paragraphs'] ?? '[]');
            $encls = is_array($data['enclosures_list'] ?? null) ? json_encode($data['enclosures_list'], JSON_UNESCAPED_UNICODE) : ($data['enclosures_list'] ?? '[]');
            $copyTo = is_array($data['copy_to_list'] ?? null) ? json_encode($data['copy_to_list'], JSON_UNESCAPED_UNICODE) : ($data['copy_to_list'] ?? '[]');

            if ($pdo) {
                $sql = "INSERT INTO naval_letters (
                    id, letter_ref, file_no, letter_date, security_class, precedence,
                    letterhead_office, letterhead_station, letterhead_tel, letterhead_email,
                    addressee_to, channel_through, attention_to, subject, references_list,
                    br7_tone, salutation, paragraphs, complimentary_close,
                    signatory_name, signatory_rank, signatory_appointment,
                    enclosures_list, copy_to_list, is_registered_outgoing, registered_doc_id, status
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                ) ON DUPLICATE KEY UPDATE
                    letter_ref = VALUES(letter_ref),
                    file_no = VALUES(file_no),
                    letter_date = VALUES(letter_date),
                    security_class = VALUES(security_class),
                    precedence = VALUES(precedence),
                    letterhead_office = VALUES(letterhead_office),
                    letterhead_station = VALUES(letterhead_station),
                    letterhead_tel = VALUES(letterhead_tel),
                    letterhead_email = VALUES(letterhead_email),
                    addressee_to = VALUES(addressee_to),
                    channel_through = VALUES(channel_through),
                    attention_to = VALUES(attention_to),
                    subject = VALUES(subject),
                    references_list = VALUES(references_list),
                    br7_tone = VALUES(br7_tone),
                    salutation = VALUES(salutation),
                    paragraphs = VALUES(paragraphs),
                    complimentary_close = VALUES(complimentary_close),
                    signatory_name = VALUES(signatory_name),
                    signatory_rank = VALUES(signatory_rank),
                    signatory_appointment = VALUES(signatory_appointment),
                    enclosures_list = VALUES(enclosures_list),
                    copy_to_list = VALUES(copy_to_list),
                    is_registered_outgoing = VALUES(is_registered_outgoing),
                    registered_doc_id = VALUES(registered_doc_id),
                    status = VALUES(status),
                    updated_at = NOW()";

                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $id, $letterRef, $fileNo, $letterDate, $securityClass, $precedence,
                    $letterheadOffice, $letterheadStation, $letterheadTel, $letterheadEmail,
                    $addresseeTo, $channelThrough, $attentionTo, $subject, $refs,
                    $br7Tone, $salutation, $paras, $compClose,
                    $signName, $signRank, $signAppointment,
                    $encls, $copyTo, $isRegistered, $registeredDocId, $status
                ]);
            }

            // Sync to cmsys-v2 RTDB
            $docsUrl = getDocsFirebaseUrl();
            firebasePatch($docsUrl, "naval_letters/{$id}", [
                'id' => $id, 'letter_ref' => $letterRef, 'file_no' => $fileNo,
                'letter_date' => $letterDate, 'subject' => $subject, 'status' => $status,
                'is_registered_outgoing' => $isRegistered, 'registered_doc_id' => $registeredDocId
            ]);

            // If user clicked "Register into Outgoing Registry"
            if ($isRegistered && empty($registeredDocId)) {
                $regDocId = 'doc_' . date('Ymd_His') . '_' . bin2hex(random_bytes(2));
                $officeSection = $data['office_section'] ?? 'cced_writer';

                $trail = [
                    [
                        'date' => date('Y-m-d H:i'),
                        'officer' => $signName ?: 'Authorizing Officer',
                        'stage' => 'Drafted in Letter Studio',
                        'remarks' => "Registered from Letter Studio under ref {$letterRef}"
                    ]
                ];

                if ($pdo) {
                    $regStmt = $pdo->prepare("INSERT INTO document_registry (
                        id, office_section, flow_type, doc_type, ref_no, sender_or_recipient,
                        date_letter, date_recorded, subject, priority, security_class,
                        present_position, file_no, position_trail, status
                    ) VALUES (?, ?, 'OUTGOING', 'LETTER', ?, ?, ?, ?, ?, ?, ?, 'Drafted in Letter Studio', ?, ?, 'Active')");
                    $regStmt->execute([
                        $regDocId, $officeSection, $letterRef, $addresseeTo,
                        $letterDate, date('Y-m-d'), $subject,
                        $precedence === 'ROUTINE' ? 'Normal' : 'High',
                        $securityClass, $fileNo, json_encode($trail, JSON_UNESCAPED_UNICODE)
                    ]);

                    $updateLtr = $pdo->prepare("UPDATE naval_letters SET registered_doc_id = ? WHERE id = ?");
                    $updateLtr->execute([$regDocId, $id]);
                    $registeredDocId = $regDocId;
                }

                syncToEcosystemFirebase('document_registry', $regDocId, [
                    'id' => $regDocId, 'office_section' => $officeSection, 'flow_type' => 'OUTGOING',
                    'ref_no' => $letterRef, 'sender_or_recipient' => $addresseeTo, 'subject' => $subject,
                    'file_no' => $fileNo, 'present_position' => 'Drafted in Letter Studio',
                    'position_trail' => $trail, 'status' => 'Active'
                ]);
            }

            jsonResponse(['success' => true, 'id' => $id, 'registered_doc_id' => $registeredDocId]);
        }

        if ($method === 'DELETE') {
            $id = $_GET['id'] ?? ($input['id'] ?? null);
            if ($id && $pdo) {
                $stmt = $pdo->prepare("DELETE FROM naval_letters WHERE id = ?");
                $stmt->execute([$id]);
                $docsUrl = getDocsFirebaseUrl();
                firebaseDelete($docsUrl, "naval_letters/{$id}");
                jsonResponse(['success' => true, 'deleted' => $id]);
            }
            jsonResponse(['success' => false, 'error' => 'Missing ID'], 400);
        }
        break;

    // =========================================================================
    // 5B. NAVAL LETTER TEMPLATES
    // =========================================================================
    case 'naval_letter_templates':
        if ($method === 'GET') {
            $list = [];
            if ($pdo) {
                $stmt = $pdo->query("SELECT * FROM naval_letter_templates ORDER BY category ASC, title ASC");
                $list = $stmt->fetchAll();
                foreach ($list as &$tpl) {
                    $tpl['references_list'] = json_decode($tpl['references_list'] ?? '[]', true);
                    $tpl['paragraphs'] = json_decode($tpl['paragraphs'] ?? '[]', true);
                    $tpl['enclosures_list'] = json_decode($tpl['enclosures_list'] ?? '[]', true);
                    $tpl['copy_to_list'] = json_decode($tpl['copy_to_list'] ?? '[]', true);
                }
            }
            jsonResponse(['success' => true, 'data' => $list]);
        }

        if ($method === 'POST') {
            $data = !empty($input) ? $input : $_POST;
            $id = $data['id'] ?? ('ltr_tpl_' . bin2hex(random_bytes(4)));
            $title = trim($data['title'] ?? 'Standard Naval Letter Template');
            $category = $data['category'] ?? 'Standard BR 7';
            $secClass = $data['security_class'] ?? 'RESTRICTED';
            $precedence = $data['precedence'] ?? 'ROUTINE';
            $tone = $data['br7_tone'] ?? 'senior';
            $addressee = $data['addressee_to'] ?? '';
            $channel = $data['channel_through'] ?? '';
            $subject = $data['subject'] ?? '';

            $refs = is_array($data['references_list'] ?? null) ? json_encode($data['references_list'], JSON_UNESCAPED_UNICODE) : ($data['references_list'] ?? '[]');
            $paras = is_array($data['paragraphs'] ?? null) ? json_encode($data['paragraphs'], JSON_UNESCAPED_UNICODE) : ($data['paragraphs'] ?? '[]');
            $encls = is_array($data['enclosures_list'] ?? null) ? json_encode($data['enclosures_list'], JSON_UNESCAPED_UNICODE) : ($data['enclosures_list'] ?? '[]');
            $copyTo = is_array($data['copy_to_list'] ?? null) ? json_encode($data['copy_to_list'], JSON_UNESCAPED_UNICODE) : ($data['copy_to_list'] ?? '[]');

            if ($pdo) {
                $sql = "INSERT INTO naval_letter_templates (
                    id, title, category, security_class, precedence, br7_tone,
                    addressee_to, channel_through, subject, references_list,
                    paragraphs, enclosures_list, copy_to_list
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    category = VALUES(category),
                    security_class = VALUES(security_class),
                    precedence = VALUES(precedence),
                    br7_tone = VALUES(br7_tone),
                    addressee_to = VALUES(addressee_to),
                    channel_through = VALUES(channel_through),
                    subject = VALUES(subject),
                    references_list = VALUES(references_list),
                    paragraphs = VALUES(paragraphs),
                    enclosures_list = VALUES(enclosures_list),
                    copy_to_list = VALUES(copy_to_list)";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $title, $category, $secClass, $precedence, $tone, $addressee, $channel, $subject, $refs, $paras, $encls, $copyTo]);
            }
            jsonResponse(['success' => true, 'id' => $id]);
        }
        break;

    // =========================================================================
    // 6. SYSTEM & DOCUMENT SETTINGS
    // =========================================================================
    case 'settings':
        if ($method === 'GET') {
            $key = $_GET['key'] ?? null;
            $settings = [];

            if ($pdo) {
                if ($key) {
                    $stmt = $pdo->prepare("SELECT setting_value FROM system_document_settings WHERE setting_key = ?");
                    $stmt->execute([$key]);
                    $val = $stmt->fetchColumn();
                    jsonResponse(['success' => true, 'key' => $key, 'data' => $val ? json_decode($val, true) : null]);
                } else {
                    $stmt = $pdo->query("SELECT * FROM system_document_settings");
                    while ($row = $stmt->fetch()) {
                        $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
                    }
                }
            }

            // Defaults if not set in DB
            if (empty($settings['minute_config'])) {
                $settings['minute_config'] = [
                    'si' => [
                        'addressees' => [
                            'ධජ නිලධාරී නාවික හමුදා මූලස්ථානය',
                            'අණදෙන නිලධාරී - ශ්‍රීලංනෞ තිස්ස',
                            'විධායක නිලධාරී - ශ්‍රීලංනෞ තිස්ස',
                            'සිවිල් ඉංජිනේරු අධ්‍යක්‍ෂ ජනරාල්',
                            'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
                            'විධායක නිලධාරී - ශ්‍රීලංනෞ ඩොක්යාර්ඩ්',
                            'වැඩබලන කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැ)'
                        ],
                        'originators' => [
                            'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
                            'විධායක නිලධාරී මඟින්',
                            'වැඩ භාර නිලධාරී (සිවිල්) මඟින්'
                        ],
                        'signatoryTitles' => [
                            'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
                            'විධායක නිලධාරී',
                            'වැඩ භාර නිලධාරී',
                            'සහකාර විනයාරක්ෂකාධිපති (නැ)'
                        ],
                        'endorsements' => [
                            'නිර්දේශ කර ඉදිරිපත් කරමි.',
                            'අනුමැතිය සඳහා ඉදිරිපත් කරමි.',
                            'අනුමත කරමි.',
                            'ක්‍රියාමාර්ග ගැනීම සඳහා යොමු කරමි.',
                            'සලකා බලා වාර්තා කරන්න.'
                        ]
                    ],
                    'en' => [
                        'addressees' => [
                            'Flag Officer Commanding Naval Fleet',
                            'Commanding Officer - SLNS Tissa',
                            'Executive Officer - SLNS Tissa',
                            'Director General Civil Engineering',
                            'Command Civil Engineering Officer (East)',
                            'Executive Officer - SLN Dockyard'
                        ],
                        'originators' => [
                            'Through Command Civil Engineering Officer (East)',
                            'Through Executive Officer',
                            'Through Officer in Charge (Civil)'
                        ],
                        'signatoryTitles' => [
                            'Command Civil Engineering Officer (East)',
                            'Executive Officer',
                            'Officer in Charge',
                            'Staff Officer (CE)'
                        ],
                        'endorsements' => [
                            'Recommended and forwarded for approval please.',
                            'Submitted for your kind approval please.',
                            'Approved.',
                            'Referred for necessary action please.'
                        ]
                    ]
                ];
            }

            if (empty($settings['letter_config'])) {
                $settings['letter_config'] = [
                    'letterheads' => [
                        [
                            'id' => 'lh_east',
                            'office' => 'COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)',
                            'station' => 'SLN DOCKYARD, TRINCOMALEE',
                            'tel' => '026-2222384 / Ext 3144',
                            'email' => 'cceoeast@navy.lk',
                            'crest' => 'logo-crest.png',
                            'is_default' => true
                        ]
                    ],
                    'addressees' => [
                        'The Commander of the Navy, Naval Headquarters, Colombo 01',
                        'The Commander Eastern Naval Area, SLN Dockyard, Trincomalee',
                        'The Director General Civil Engineering, Naval Headquarters, Colombo',
                        'The Command Logistics Officer (East), SLN Dockyard, Trincomalee',
                        'The Commanding Officer, SLNS Tissa, Trincomalee',
                        'The Executive Officer, SLN Dockyard, Trincomalee'
                    ],
                    'tones' => [
                        'senior' => [
                            'label' => 'Superior / Senior Officer (BR 7 Official)',
                            'opening' => '1. I have the honour to submit for your kind consideration and approval please that',
                            'salutation' => 'Sir / Commander,',
                            'closing' => 'I have the honour to be, Sir, Your obedient Servant,'
                        ],
                        'equal' => [
                            'label' => 'Equal / Contemporary Command / Colleague',
                            'opening' => '1. Forwarded herewith for your kind information and necessary concurrence please.',
                            'salutation' => 'Dear Sir / Commander,',
                            'closing' => 'Yours sincerely,'
                        ],
                        'junior' => [
                            'label' => 'Junior / Subordinate Base or Unit',
                            'opening' => '1. You are hereby directed to initiate immediate action regarding',
                            'salutation' => 'Officer-in-Charge / Commander,',
                            'closing' => 'For strict compliance please,'
                        ],
                        'external' => [
                            'label' => 'Civil Authorities / Contractors / External Agencies',
                            'opening' => '1. I am directed by the Commander Eastern Naval Area to inform you that',
                            'salutation' => 'Dear Sir / Madam,',
                            'closing' => 'Yours faithfully,'
                        ]
                    ],
                    'signatories' => [
                        [
                            'name' => 'K A KAHANDAWA',
                            'rank' => 'Commander (CE)',
                            'appointment' => 'Command Civil Engineering Officer (East)'
                        ],
                        [
                            'name' => 'S P SILVA',
                            'rank' => 'Lieutenant Commander (CE)',
                            'appointment' => 'Staff Officer (Civil Engineering - Projects)'
                        ]
                    ],
                    'distribution_presets' => [
                        'Director General Civil Engineering, NHQ',
                        'Commander Eastern Naval Area',
                        'Command Logistics Officer (East)',
                        'Base Commander, SLNS Tissa',
                        'Office / File Copy'
                    ]
                ];
            }

            jsonResponse(['success' => true, 'data' => $settings]);
        }

        if ($method === 'POST') {
            $data = !empty($input) ? $input : $_POST;
            $key = $data['key'] ?? null;
            $val = $data['value'] ?? null;

            if (!$key || $val === null) {
                jsonResponse(['success' => false, 'error' => 'Missing key or value'], 400);
            }

            $jsonVal = is_string($val) ? $val : json_encode($val, JSON_UNESCAPED_UNICODE);

            if ($pdo) {
                $stmt = $pdo->prepare("INSERT INTO system_document_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()");
                $stmt->execute([$key, $jsonVal]);
            }

            $docsUrl = getDocsFirebaseUrl();
            firebasePatch($docsUrl, "system_settings/{$key}", is_array($val) ? $val : json_decode($jsonVal, true));

            jsonResponse(['success' => true, 'key' => $key, 'message' => 'Settings updated']);
        }
        break;

    // =========================================================================
    // 7. METADATA & SYSTEM STATS (FEDERATED CROSS-SYSTEM LINKAGE)
    // =========================================================================
    case 'meta':
        $forceRefresh = !empty($_GET['refresh']);
        $cacheFile = __DIR__ . '/meta_cache.json';
        $cached = file_exists($cacheFile) ? json_decode(file_get_contents($cacheFile), true) : [];

        $meta = [
            'zones' => [
                ['id' => 'A-Zone', 'name' => 'A-Zone (Administrative & Waterfront)'],
                ['id' => 'BC-Zone', 'name' => 'BC-Zone (Residential & Facilities)'],
                ['id' => 'D-Zone', 'name' => 'D-Zone (Technical & Industrial)'],
                ['id' => 'Carpentry Shop', 'name' => 'Carpentry Workshop'],
                ['id' => 'Welding Shop', 'name' => 'Welding & Steel Workshop'],
                ['id' => 'Masonry Shop', 'name' => 'Masonry & Concrete Works'],
                ['id' => 'Plumbing Shop', 'name' => 'Plumbing & Water Supply']
            ],
            'projects' => $cached['projects'] ?? [],
            'sailors' => $cached['sailors'] ?? [],
            'stats' => []
        ];

        // If sailors list is empty or refresh requested, pull from cmsys-v2
        if (empty($meta['sailors']) || $forceRefresh) {
            $sailorsFeed = firebaseGet(FB_SAILORS_DB_URL, 'sailors', 3);
            if (is_array($sailorsFeed)) {
                $parsedSailors = [];
                foreach ($sailorsFeed as $k => $s) {
                    if (!is_array($s)) continue;
                    $offNo = $s['off_no'] ?? ($s['official_number'] ?? '');
                    if (!$offNo) continue;
                    $parsedSailors[] = [
                        'official_number' => $offNo,
                        'full_name' => $s['name'] ?? '',
                        'call_name' => $s['name'] ?? '',
                        'rank_rate' => $s['rank'] ?? '',
                        'current_trade' => $s['trade'] ?? '',
                        'contact_no' => $s['contact_no'] ?? ''
                    ];
                }
                if (!empty($parsedSailors)) {
                    $meta['sailors'] = $parsedSailors;
                    $cached['sailors'] = $parsedSailors;
                }
            }
        }

        // If projects list is empty or refresh requested, pull from cmsys-v2
        if (empty($meta['projects']) || $forceRefresh) {
            $prjFeed = firebaseGet(FB_PROJECTS_DB_URL, 'naval_projects', 3);
            if (is_array($prjFeed)) {
                $parsedProjects = [];
                foreach ($prjFeed as $p) {
                    if (!is_array($p)) continue;
                    $parsedProjects[] = [
                        'id' => $p['id'] ?? '',
                        'code' => $p['code'] ?? '',
                        'name' => $p['name'] ?? '',
                        'voteNumber' => $p['voteNumber'] ?? '',
                        'status' => $p['status'] ?? 'Active'
                    ];
                }
                if (!empty($parsedProjects)) {
                    $meta['projects'] = $parsedProjects;
                    $cached['projects'] = $parsedProjects;
                }
            }
        }

        // Persist cache
        file_put_contents($cacheFile, json_encode($cached, JSON_UNESCAPED_UNICODE));

        // Stats from MySQL
        if ($pdo) {
            try {
                $statsStmt = $pdo->query("SELECT
                    COUNT(*) as total_docs,
                    SUM(CASE WHEN flow_type = 'INCOMING' THEN 1 ELSE 0 END) as total_incoming,
                    SUM(CASE WHEN flow_type = 'OUTGOING' THEN 1 ELSE 0 END) as total_outgoing,
                    SUM(CASE WHEN present_position != 'Dispatched / Outed' AND present_position != 'Completed' THEN 1 ELSE 0 END) as total_active,
                    SUM(CASE WHEN office_section = 'cced_writer' THEN 1 ELSE 0 END) as count_cced,
                    SUM(CASE WHEN office_section = 'admin_office' THEN 1 ELSE 0 END) as count_admin,
                    SUM(CASE WHEN office_section = 'drawing_office' THEN 1 ELSE 0 END) as count_drawing,
                    SUM(CASE WHEN office_section = 'minute_sheet' THEN 1 ELSE 0 END) as count_minute
                    FROM document_registry");
                $meta['stats'] = $statsStmt->fetch() ?: [];

                $lStmt = $pdo->query("SELECT COUNT(*) FROM naval_letters");
                $meta['stats']['total_naval_letters'] = $lStmt->fetchColumn() ?: 0;
            } catch (Exception $e) {}
        }

        jsonResponse(['success' => true, 'data' => $meta]);
        break;

    // =========================================================================
    // 8. ECOSYSTEM FIREBASE HEALTH CHECK & LIVE STATUS
    // =========================================================================
    case 'sync_status':
        $status = [
            'timestamp' => date('c'),
            'clusters' => []
        ];

        // 1. Primary: cmsys-v2
        $docsUrl = getDocsFirebaseUrl();
        $t0 = microtime(true);
        $resDocs = firebaseRequest($docsUrl . '/system_status', 'GET', null, 2);
        $latencyDocs = round((microtime(true) - $t0) * 1000);
        $status['clusters']['cmsys-v2-docs'] = [
            'project_id' => FB_DOCS_PROJECT_ID,
            'endpoint' => $docsUrl,
            'http_code' => $resDocs['code'],
            'latency_ms' => $latencyDocs,
            'online' => $resDocs['code'] < 400 || $resDocs['code'] === 401
        ];

        // 2. Core: cmsys-v2
        $t0 = microtime(true);
        $resCore = firebaseRequest(FB_CORE_DB_URL . '/system_status', 'GET', null, 2);
        $latencyCore = round((microtime(true) - $t0) * 1000);
        $status['clusters']['cmsys-v2'] = [
            'project_id' => FB_CORE_PROJECT_ID,
            'endpoint' => FB_CORE_DB_URL,
            'http_code' => $resCore['code'],
            'latency_ms' => $latencyCore,
            'online' => $resCore['code'] < 400 || $resCore['code'] === 401
        ];

        // 3. Personnel: cmsys-v2
        $t0 = microtime(true);
        $resSailors = firebaseRequest(FB_SAILORS_DB_URL . '/sailors', 'GET', null, 2);
        $latencySailors = round((microtime(true) - $t0) * 1000);
        $status['clusters']['cmsys-v2-sailors'] = [
            'project_id' => FB_SAILORS_PROJECT_ID,
            'endpoint' => FB_SAILORS_DB_URL,
            'http_code' => $resSailors['code'],
            'latency_ms' => $latencySailors,
            'online' => $resSailors['code'] === 200
        ];

        // 4. Projects: cmsys-v2
        $t0 = microtime(true);
        $resProjects = firebaseRequest(FB_PROJECTS_DB_URL . '/naval_projects', 'GET', null, 2);
        $latencyProjects = round((microtime(true) - $t0) * 1000);
        $status['clusters']['cmsys-v2-projects'] = [
            'project_id' => FB_PROJECTS_PROJECT_ID,
            'endpoint' => FB_PROJECTS_DB_URL,
            'http_code' => $resProjects['code'],
            'latency_ms' => $latencyProjects,
            'online' => $resProjects['code'] === 200
        ];

        jsonResponse(['success' => true, 'data' => $status]);
        break;

    // =========================================================================
    // 9. ONE-CLICK BULK SEED TO CLOUD (cmsys-v2)
    // =========================================================================
    case 'seed_cloud':
        $docsUrl = getDocsFirebaseUrl();
        $exported = [];

        if ($pdo) {
            // Document Registry
            $dStmt = $pdo->query("SELECT * FROM document_registry");
            $docsList = [];
            while ($r = $dStmt->fetch()) {
                if (isset($r['position_trail']) && is_string($r['position_trail'])) {
                    $r['position_trail'] = json_decode($r['position_trail'], true);
                }
                $docsList[$r['id']] = $r;
            }
            if (!empty($docsList)) {
                firebasePut($docsUrl, 'document_registry', $docsList, 6);
                $exported['document_registry'] = count($docsList);
            }

            // File Registry
            $fStmt = $pdo->query("SELECT * FROM file_registry");
            $filesList = [];
            while ($r = $fStmt->fetch()) {
                $filesList[$r['id']] = $r;
            }
            if (!empty($filesList)) {
                firebasePut($docsUrl, 'file_registry', $filesList, 6);
                $exported['file_registry'] = count($filesList);
            }

            // Prefixes
            $pStmt = $pdo->query("SELECT * FROM registry_prefixes");
            $pfxList = [];
            while ($r = $pStmt->fetch()) {
                $pfxList[$r['id']] = $r;
            }
            if (!empty($pfxList)) {
                firebasePut($docsUrl, 'registry_prefixes', $pfxList, 6);
                $exported['registry_prefixes'] = count($pfxList);
            }

            // Naval Letters
            $lStmt = $pdo->query("SELECT * FROM naval_letters");
            $ltrList = [];
            while ($r = $lStmt->fetch()) {
                $ltrList[$r['id']] = $r;
            }
            if (!empty($ltrList)) {
                firebasePut($docsUrl, 'naval_letters', $ltrList, 6);
                $exported['naval_letters'] = count($ltrList);
            }

            // Minute Templates
            $mStmt = $pdo->query("SELECT * FROM minute_templates");
            $mtList = [];
            while ($r = $mStmt->fetch()) {
                $mtList[$r['id']] = $r;
            }
            if (!empty($mtList)) {
                firebasePut($docsUrl, 'minute_templates', $mtList, 6);
                $exported['minute_templates'] = count($mtList);
            }
        }

        // Write system status heartbeat
        firebasePatch($docsUrl, 'system_status', [
            'system' => 'Sri Lanka Navy Civil Engineering — CMSys Documents',
            'version' => '1.0.0',
            'status' => 'online',
            'last_sync' => date('c')
        ]);

        jsonResponse(['success' => true, 'target_url' => $docsUrl, 'exported' => $exported]);
        break;

    default:
        jsonResponse(['success' => false, 'error' => 'Invalid action: ' . $action], 400);
}
