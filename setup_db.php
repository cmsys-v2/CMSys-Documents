<?php
/**
 * CMSys Documents Database Migration & Setup Script
 * Ensures all required tables for Registry, Minute Sheets, Letter Studio, and Settings exist.
 */

$host = 'localhost';
$user = 'root';
$pass = '';
$db   = 'ncw_ps_db';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'error' => "Connection failed: " . $conn->connect_error]));
}
$conn->set_charset("utf8mb4");

$queries = [];

// 1. document_registry
$queries['document_registry'] = "CREATE TABLE IF NOT EXISTS `document_registry` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `office_section` VARCHAR(32) NOT NULL DEFAULT 'cced_writer',
  `flow_type` VARCHAR(16) NOT NULL DEFAULT 'INCOMING',
  `doc_type` VARCHAR(32) NOT NULL DEFAULT 'LETTER',
  `ref_no` VARCHAR(128) NOT NULL,
  `sender_ref_no` VARCHAR(150) NULL,
  `sender_source_category` VARCHAR(64) NULL,
  `sender_or_recipient` VARCHAR(255) NULL,
  `date_letter` DATE NULL,
  `date_recorded` DATE NOT NULL,
  `subject` TEXT NOT NULL,
  `scope_description` TEXT NULL,
  `directed_type` VARCHAR(64) NULL,
  `directed_to` VARCHAR(128) NULL,
  `project_id` VARCHAR(64) NULL,
  `project_name` VARCHAR(255) NULL,
  `priority` VARCHAR(32) DEFAULT 'Normal',
  `security_class` VARCHAR(32) DEFAULT 'RESTRICTED',
  `present_position` VARCHAR(64) DEFAULT 'Received / In Registry',
  `action_officer` VARCHAR(128) NULL,
  `file_box_ref` VARCHAR(128) NULL,
  `file_no` VARCHAR(100) NULL,
  `folio_no` VARCHAR(64) NULL,
  `dispatch_mode` VARCHAR(64) NULL,
  `dispatch_book_ref` VARCHAR(128) NULL,
  `contact_person` VARCHAR(128) NULL,
  `contact_no` VARCHAR(64) NULL,
  `whatsapp_no` VARCHAR(64) NULL,
  `linked_estimate_id` VARCHAR(64) NULL,
  `linked_job_number` VARCHAR(64) NULL,
  `linked_signal_ref` VARCHAR(128) NULL,
  `position_trail` LONGTEXT NULL,
  `attachments_meta` LONGTEXT NULL,
  `status` VARCHAR(32) DEFAULT 'Active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`office_section`),
  INDEX (`flow_type`),
  INDEX (`ref_no`),
  INDEX (`file_no`),
  INDEX (`date_recorded`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 2. registry_prefixes
$queries['registry_prefixes'] = "CREATE TABLE IF NOT EXISTS `registry_prefixes` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `office_section` VARCHAR(32) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `flow_type` VARCHAR(16) NOT NULL DEFAULT 'OUTGOING',
  `prefix_pattern` VARCHAR(128) NOT NULL,
  `next_sequence` INT NOT NULL DEFAULT 1,
  `padding_length` INT NOT NULL DEFAULT 4,
  `separator_char` VARCHAR(8) DEFAULT '/',
  `description` VARCHAR(255) NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`office_section`),
  INDEX (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 3. file_registry
$queries['file_registry'] = "CREATE TABLE IF NOT EXISTS `file_registry` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `file_no` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `office_section` VARCHAR(50) DEFAULT 'cced_writer',
  `category` VARCHAR(100) DEFAULT 'General',
  `file_box_ref` VARCHAR(100) DEFAULT '',
  `cabinet_location` VARCHAR(100) DEFAULT '',
  `current_volume` VARCHAR(20) DEFAULT 'Vol 1',
  `total_folios` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'Active',
  `remarks` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_file_no_sec` (`file_no`, `office_section`),
  INDEX (`office_section`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 4. job_minutes
$queries['job_minutes'] = "CREATE TABLE IF NOT EXISTS `job_minutes` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `ref_no` VARCHAR(64) NOT NULL,
  `date_received` DATE NOT NULL,
  `end_user` VARCHAR(255) NOT NULL,
  `contact_1` VARCHAR(32) NULL,
  `contact_2` VARCHAR(32) NULL,
  `whatsapp` VARCHAR(32) NULL,
  `subject` TEXT NOT NULL,
  `description` TEXT NULL,
  `directed_type` VARCHAR(64) NULL,
  `directed_to` VARCHAR(128) NULL,
  `project_id` VARCHAR(64) NULL,
  `project_name` VARCHAR(255) NULL,
  `priority` VARCHAR(32) DEFAULT 'Normal',
  `position` VARCHAR(32) DEFAULT 'New Request',
  `linked_estimate_id` VARCHAR(64) NULL,
  `linked_job_number` VARCHAR(64) NULL,
  `position_trail` LONGTEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`ref_no`),
  INDEX (`date_received`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 5. minute_templates
$queries['minute_templates'] = "CREATE TABLE IF NOT EXISTS `minute_templates` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `lang` VARCHAR(8) DEFAULT 'si',
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) DEFAULT 'General',
  `ref_no` VARCHAR(64) NULL,
  `subject` TEXT NULL,
  `addressees` TEXT NULL,
  `originator` VARCHAR(255) NULL,
  `paragraphs` LONGTEXT NULL,
  `recommendation` TEXT NULL,
  `sign_title` VARCHAR(255) NULL,
  `m02_enabled` TINYINT(1) DEFAULT 0,
  `m02_addressee` VARCHAR(255) NULL,
  `m02_originator` VARCHAR(255) NULL,
  `m02_text` TEXT NULL,
  `m02_sign_title` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 6. naval_letters (NEW: Letter Studio letters)
$queries['naval_letters'] = "CREATE TABLE IF NOT EXISTS `naval_letters` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `letter_ref` VARCHAR(128) NOT NULL,
  `file_no` VARCHAR(100) NULL,
  `letter_date` DATE NOT NULL,
  `security_class` VARCHAR(32) DEFAULT 'RESTRICTED',
  `precedence` VARCHAR(32) DEFAULT 'ROUTINE',
  `letterhead_office` VARCHAR(255) DEFAULT 'COMMAND CIVIL ENGINEERING DEPARTMENT (EAST)',
  `letterhead_station` VARCHAR(255) DEFAULT 'SLN DOCKYARD, TRINCOMALEE',
  `letterhead_tel` VARCHAR(128) DEFAULT '026-2222384 / Ext 3144',
  `letterhead_email` VARCHAR(128) DEFAULT 'cceoeast@navy.lk',
  `addressee_to` TEXT NOT NULL,
  `channel_through` TEXT NULL,
  `attention_to` VARCHAR(255) NULL,
  `subject` TEXT NOT NULL,
  `references_list` LONGTEXT NULL,
  `br7_tone` VARCHAR(64) DEFAULT 'senior',
  `salutation` VARCHAR(128) NULL,
  `paragraphs` LONGTEXT NOT NULL,
  `complimentary_close` VARCHAR(128) NULL,
  `signatory_name` VARCHAR(128) NOT NULL,
  `signatory_rank` VARCHAR(64) NOT NULL,
  `signatory_appointment` VARCHAR(128) NOT NULL,
  `enclosures_list` LONGTEXT NULL,
  `copy_to_list` LONGTEXT NULL,
  `is_registered_outgoing` TINYINT(1) DEFAULT 0,
  `registered_doc_id` VARCHAR(64) NULL,
  `status` VARCHAR(32) DEFAULT 'Draft',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`letter_ref`),
  INDEX (`file_no`),
  INDEX (`letter_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 7. naval_letter_templates (NEW: Letter Studio reusable BR 7 templates)
$queries['naval_letter_templates'] = "CREATE TABLE IF NOT EXISTS `naval_letter_templates` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) DEFAULT 'Standard BR 7',
  `security_class` VARCHAR(32) DEFAULT 'RESTRICTED',
  `precedence` VARCHAR(32) DEFAULT 'ROUTINE',
  `br7_tone` VARCHAR(64) DEFAULT 'senior',
  `addressee_to` TEXT NULL,
  `channel_through` TEXT NULL,
  `subject` TEXT NULL,
  `references_list` LONGTEXT NULL,
  `paragraphs` LONGTEXT NULL,
  `enclosures_list` LONGTEXT NULL,
  `copy_to_list` LONGTEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// 8. system_document_settings (NEW: unified persistent settings)
$queries['system_document_settings'] = "CREATE TABLE IF NOT EXISTS `system_document_settings` (
  `setting_key` VARCHAR(64) NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$results = [];
foreach ($queries as $name => $sql) {
    if ($conn->query($sql) === TRUE) {
        $results[$name] = 'OK';
    } else {
        $results[$name] = 'Error: ' . $conn->error;
    }
}

// Populate default prefixes if table empty
$checkPfx = $conn->query("SELECT COUNT(*) AS cnt FROM registry_prefixes");
$row = $checkPfx->fetch_assoc();
if ($row['cnt'] == 0) {
    $defaults = [
        ['pfx_cced_nhq', 'cced_writer', 'NHQ', 'OUTGOING', 'CCED/NHQ/{YYYY}/{SEQ}', 1, 4, '/', 'NHQ Outgoing Letters', 1],
        ['pfx_cced_ena', 'cced_writer', 'Bases & Ships in ENA', 'OUTGOING', 'CCED/ENA/{YYYY}/{SEQ}', 1, 4, '/', 'ENA Bases & Ships Outgoing', 0],
        ['pfx_cced_ext', 'cced_writer', 'Outside', 'OUTGOING', 'CCED/EXT/{YYYY}/{SEQ}', 1, 4, '/', 'External Civilians & Contractors', 0],
        ['pfx_cced_gen', 'cced_writer', 'Miscellaneous', 'OUTGOING', 'CCED/GEN/{YYYY}/{SEQ}', 1, 4, '/', 'General Miscellaneous Outgoing', 0],
        ['pfx_adm_nhq', 'admin_office', 'NHQ, VNF Commandant etc', 'OUTGOING', 'CCED/ADM/NHQ/{YYYY}/{SEQ}', 1, 4, '/', 'Admin NHQ Outgoing', 1],
        ['pfx_adm_ena', 'admin_office', 'Bases & Ships in ENA', 'OUTGOING', 'CCED/ADM/ENA/{YYYY}/{SEQ}', 1, 4, '/', 'Admin Bases & Ships', 0],
        ['pfx_adm_sig', 'admin_office', 'Related Signals', 'OUTGOING', 'ADM/SIG/{MM}{YY}/{SEQ}', 1, 3, '/', 'Admin Signal Outgoing Ref', 0],
        ['pfx_adm_gen', 'admin_office', 'Miscellaneous', 'OUTGOING', 'CCED/ADM/{YYYY}/{SEQ}', 1, 4, '/', 'Admin General Outgoing', 0],
        ['pfx_drg_nhq', 'drawing_office', 'NHQ, VNF Commandant etc', 'OUTGOING', 'CCED/DRG/{YYYY}/{SEQ}', 1, 4, '/', 'Drawing Office NHQ', 1],
        ['pfx_drg_min', 'drawing_office', 'Minute Sheet (Dockyard/ENA)', 'OUTGOING', 'CCED/PLN/DY/{YYYY}/{SEQ}', 1, 4, '/', 'Drawing Office Minute Sheets', 0],
        ['pfx_drg_sig', 'drawing_office', 'Related Signals', 'OUTGOING', 'DRG/SIG/{MM}{YY}/{SEQ}', 1, 3, '/', 'Drawing Office Signals', 0],
        ['pfx_min_std', 'minute_sheet', 'Dockyard & ENA Departments', 'OUTGOING', 'CCED/A/{MM}/{SEQ}/{YY}', 2216, 4, '/', 'Standard CE Job Minute Number', 1],
        ['pfx_min_sig', 'minute_sheet', 'Related Signals', 'OUTGOING', 'CCED/MS/SIG/{MM}{YY}/{SEQ}', 1, 3, '/', 'Minute Sheet Signal Ref', 0],
    ];
    $stmt = $conn->prepare("INSERT INTO registry_prefixes (id, office_section, category, flow_type, prefix_pattern, next_sequence, padding_length, separator_char, description, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($defaults as $d) {
        $stmt->bind_param("sssssiissi", $d[0], $d[1], $d[2], $d[3], $d[4], $d[5], $d[6], $d[7], $d[8], $d[9]);
        $stmt->execute();
    }
    $results['prefixes_seed'] = 'Seeded 13 default prefixes';
}

echo json_encode(['success' => true, 'tables' => $results], JSON_PRETTY_PRINT);
