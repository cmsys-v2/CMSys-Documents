<?php
/**
 * Sri Lanka Navy - CMSys Documents Database Migration Script
 * Schema Version: 2.4-NCW-DB (InnoDB / utf8mb4)
 * Provisioning: 8 Core Relational Tables with Composite Indices & Seeding
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');

$host = 'localhost';
$db   = 'ncw_ps_db';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host={$host};charset={$charset}";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `{$db}`");

    $tablesStatus = [];

    // 1. Master Document Registry
    $pdo->exec("CREATE TABLE IF NOT EXISTS `document_registry` (
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
        INDEX (`date_recorded`),
        INDEX (`present_position`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['document_registry'] = 'PROVISIONED';

    // 2. Departmental Prefix Rules
    $pdo->exec("CREATE TABLE IF NOT EXISTS `registry_prefixes` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['registry_prefixes'] = 'PROVISIONED';

    // 3. Physical File Registry (16 Official Naval Folders)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `file_registry` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['file_registry'] = 'PROVISIONED';

    // 4. BR 7 Naval Letters Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `naval_letters` (
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
        `subject_alignment` VARCHAR(16) DEFAULT 'left',
        `references_list` LONGTEXT NULL,
        `br7_tone` VARCHAR(64) DEFAULT 'junior_to_senior',
        `salutation` VARCHAR(128) NULL,
        `paragraphs` LONGTEXT NOT NULL,
        `complimentary_close` VARCHAR(128) NULL,
        `signatory_name` VARCHAR(128) NOT NULL,
        `signatory_rank` VARCHAR(64) NOT NULL,
        `signatory_branch` VARCHAR(64) DEFAULT '(CE)',
        `signatory_appointment` VARCHAR(128) NOT NULL,
        `post_nominals` VARCHAR(64) NULL,
        `include_sd` TINYINT(1) DEFAULT 1,
        `is_external_sln` TINYINT(1) DEFAULT 0,
        `copy_no` INT DEFAULT 1,
        `total_copies` INT DEFAULT 5,
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['naval_letters'] = 'PROVISIONED';

    // 5. Minute Templates
    $pdo->exec("CREATE TABLE IF NOT EXISTS `minute_templates` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['minute_templates'] = 'PROVISIONED';

    // 6. Naval Letter Templates
    $pdo->exec("CREATE TABLE IF NOT EXISTS `naval_letter_templates` (
        `id` VARCHAR(64) NOT NULL PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `category` VARCHAR(64) DEFAULT 'Standard BR 7',
        `security_class` VARCHAR(32) DEFAULT 'RESTRICTED',
        `precedence` VARCHAR(32) DEFAULT 'ROUTINE',
        `br7_tone` VARCHAR(64) DEFAULT 'junior_to_senior',
        `addressee_to` TEXT NULL,
        `channel_through` TEXT NULL,
        `subject` TEXT NULL,
        `references_list` LONGTEXT NULL,
        `paragraphs` LONGTEXT NULL,
        `enclosures_list` LONGTEXT NULL,
        `copy_to_list` LONGTEXT NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['naval_letter_templates'] = 'PROVISIONED';

    // 7. Job Minutes (Work Orders & Requests)
    $pdo->exec("CREATE TABLE IF NOT EXISTS `job_minutes` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['job_minutes'] = 'PROVISIONED';

    // 8. System Document Settings
    $pdo->exec("CREATE TABLE IF NOT EXISTS `system_document_settings` (
        `setting_key` VARCHAR(64) NOT NULL PRIMARY KEY,
        `setting_value` LONGTEXT NOT NULL,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $tablesStatus['system_document_settings'] = 'PROVISIONED';

    // Seed Default Prefixes if Empty
    $pfxCount = (int)$pdo->query("SELECT COUNT(*) FROM `registry_prefixes`")->fetchColumn();
    if ($pfxCount === 0) {
        $prefixes = [
            ['pfx_cced_nhq', 'cced_writer', 'NHQ', 'CCED/NHQ/{YYYY}/{SEQ}', 1, 4, 1, 'NHQ Outgoing Letters'],
            ['pfx_cced_ena', 'cced_writer', 'Bases & Ships in ENA', 'CCED/ENA/{YYYY}/{SEQ}', 1, 4, 0, 'ENA Bases & Ships Outgoing'],
            ['pfx_cced_ext', 'cced_writer', 'Outside', 'CCED/EXT/{YYYY}/{SEQ}', 1, 4, 0, 'External Civilians & Contractors'],
            ['pfx_cced_gen', 'cced_writer', 'Miscellaneous', 'CCED/GEN/{YYYY}/{SEQ}', 1, 4, 0, 'General Miscellaneous Outgoing'],
            ['pfx_adm_nhq',  'admin_office', 'NHQ, VNF Commandant etc', 'CCED/ADM/NHQ/{YYYY}/{SEQ}', 1, 4, 1, 'Admin NHQ Outgoing'],
            ['pfx_adm_ena',  'admin_office', 'Bases & Ships in ENA', 'CCED/ADM/ENA/{YYYY}/{SEQ}', 1, 4, 0, 'Admin Bases & Ships'],
            ['pfx_adm_sig',  'admin_office', 'Related Signals', 'ADM/SIG/{MM}{YY}/{SEQ}', 1, 3, 0, 'Admin Signal Outgoing Ref'],
            ['pfx_drg_nhq',  'drawing_office', 'NHQ, VNF Commandant etc', 'CCED/DRG/{YYYY}/{SEQ}', 1, 4, 1, 'Drawing Office NHQ'],
            ['pfx_drg_min',  'drawing_office', 'Minute sheet from SLN Dockyard and other departments in ENA', 'CCED/PLN/DY/{YYYY}/{SEQ}', 1, 4, 0, 'Drawing Office Minutes'],
            ['pfx_drg_sig',  'drawing_office', 'Related Signals', 'DRG/SIG/{MM}{YY}/{SEQ}', 1, 3, 0, 'Drawing Office Signals'],
            ['pfx_min_std',  'minute_sheet', 'Minute sheet from SLN Dockyard and other departments in ENA', 'CCED/A/{MM}/{SEQ}/{YY}', 2216, 0, 1, 'Standard Naval Minute Sheet'],
            ['pfx_min_sig',  'minute_sheet', 'Related Signals', 'CCED/MS/SIG/{MM}{YY}/{SEQ}', 1, 3, 0, 'Minute Sheet Signal Ref']
        ];

        $pfxStmt = $pdo->prepare("INSERT INTO `registry_prefixes` 
            (`id`, `office_section`, `category`, `prefix_pattern`, `next_sequence`, `padding_length`, `is_default`, `description`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($prefixes as $pfx) {
            $pfxStmt->execute($pfx);
        }
        $tablesStatus['prefixes_seed'] = 'SEEDED ' . count($prefixes) . ' PREFIXES';
    }

    echo json_encode([
        "status" => "SUCCESS",
        "message" => "SLN CMSys Database & 8 Relational Tables Provisioned Successfully.",
        "tables" => $tablesStatus
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "ERROR",
        "message" => $e->getMessage()
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
