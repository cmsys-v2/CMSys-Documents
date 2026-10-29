<?php
/**
 * CMSys Documents — Central Configuration & Database Engine
 * Consolidated Unified Firebase Architecture:
 *  1. Local MySQL: ncw_ps_db
 *  2. Consolidated Cloud Target: cmsys-v2 (Firebase RTDB asia-southeast1)
 */

// Error handling & headers
error_reporting(E_ALL);
ini_set('display_errors', 0);

if (!headers_sent()) {
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// =============================================
// LOCAL MYSQL DATABASE CONFIGURATION (XAMPP)
// =============================================
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'ncw_ps_db');
define('DB_CHARSET', 'utf8mb4');

// =============================================
// CONSOLIDATED CMSys UNIFIED FIREBASE (cmsys-v2)
// =============================================
define('FB_TARGET_PROJECT_ID', 'cmsys-v2');
define('FB_TARGET_API_KEY',    'AIzaSyDpxQzPBylQeLTXmgiF6GSVtGG_FrIo900');
define('FB_TARGET_DB_URL',     'https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app');
define('FB_TARGET_AUTH_DOMAIN','cmsys-v2.firebaseapp.com');

// 1. Primary Dedicated Document System Firebase (Consolidated to cmsys-v2)
define('FB_DOCS_PROJECT_ID',   FB_TARGET_PROJECT_ID);
define('FB_DOCS_DB_URL_ASIA',  FB_TARGET_DB_URL);
define('FB_DOCS_DB_URL_US',    FB_TARGET_DB_URL);
define('FB_DOCS_DB_URL_DIRECT',FB_TARGET_DB_URL);
define('FB_DOCS_AUTH_DOMAIN',  FB_TARGET_AUTH_DOMAIN);

// 2. Core CMSys V2 Logistics Platform (cmsys-v2) for Zone & Workshop Job Minutes
define('FB_CORE_PROJECT_ID',   FB_TARGET_PROJECT_ID);
define('FB_CORE_API_KEY',      FB_TARGET_API_KEY);
define('FB_CORE_DB_URL',       FB_TARGET_DB_URL);
define('FB_CORE_AUTH_DOMAIN',  FB_TARGET_AUTH_DOMAIN);

// 3. Personnel Master for Active Sailors (Consolidated to cmsys-v2)
define('FB_SAILORS_PROJECT_ID',FB_TARGET_PROJECT_ID);
define('FB_SAILORS_DB_URL',    FB_TARGET_DB_URL);

// 4. Dedicated Projects Master for Capital Projects (Consolidated to cmsys-v2)
define('FB_PROJECTS_PROJECT_ID',FB_TARGET_PROJECT_ID);
define('FB_PROJECTS_DB_URL',     FB_TARGET_DB_URL);

// Backward Compatibility Aliases
define('FB_PROJECT_ID', FB_TARGET_PROJECT_ID);
define('FB_DB_URL',     FB_TARGET_DB_URL);
define('FB_AUTH_SECRET', '');

// Application Metadata
define('APP_NAME',    'CMSys Documents Master Suite');
define('APP_VERSION', '1.0.0');
define('TIMEZONE',    'Asia/Colombo');
date_default_timezone_set(TIMEZONE);

// Database Singleton
class Database {
    private static $instance = null;
    private $pdo = null;

    private function __construct() {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 3,
        ];
        try {
            $this->pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $this->pdo = null;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }
}

// Universal Firebase HTTP Request Helper
function firebaseRequest($url, $method = 'GET', $data = null, $timeout = 4) {
    if (!str_ends_with(parse_url($url, PHP_URL_PATH) ?? '', '.json')) {
        $parts = explode('?', $url, 2);
        $url = $parts[0] . '.json' . (isset($parts[1]) ? '?' . $parts[1] : '');
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    $headers = ['Content-Type: application/json; charset=utf-8'];
    if ($data !== null && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'])) {
        $json = is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        $headers[] = 'Content-Length: ' . strlen($json);
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    return [
        'code' => $code,
        'body' => $body,
        'json' => $body ? json_decode($body, true) : null,
        'err'  => $err
    ];
}

function firebaseGet($baseUrl, $path, $timeout = 3) {
    $res = firebaseRequest(rtrim($baseUrl, '/') . '/' . ltrim($path, '/'), 'GET', null, $timeout);
    return $res['code'] === 200 ? $res['json'] : null;
}

function firebasePut($baseUrl, $path, $data, $timeout = 3) {
    $res = firebaseRequest(rtrim($baseUrl, '/') . '/' . ltrim($path, '/'), 'PUT', $data, $timeout);
    return $res['code'] < 400;
}

function firebasePatch($baseUrl, $path, $data, $timeout = 3) {
    $res = firebaseRequest(rtrim($baseUrl, '/') . '/' . ltrim($path, '/'), 'PATCH', $data, $timeout);
    return $res['code'] < 400;
}

function firebaseDelete($baseUrl, $path, $timeout = 3) {
    $res = firebaseRequest(rtrim($baseUrl, '/') . '/' . ltrim($path, '/'), 'DELETE', null, $timeout);
    return $res['code'] < 400;
}

// Determine active target URL for cmsys-v2 RTDB
function getDocsFirebaseUrl() {
    return FB_DOCS_DB_URL_ASIA;
}

// Unified multi-cluster sync across CMSys Ecosystem
function syncToEcosystemFirebase($collection, $id, $data) {
    $results = [];
    $docsUrl = getDocsFirebaseUrl();

    // 1. Sync to Primary Target (cmsys-v2)
    $docsRes = firebasePatch($docsUrl, "{$collection}/{$id}", $data);
    $results['cmsys-v2'] = $docsRes ? 'OK' : 'Pending Activation';

    // 2. Synchronize Minute Sheets & Work Orders with CMSys V2 Core (cmsys-v2)
    $isMinuteSheet = ($collection === 'job_minutes') ||
                     (isset($data['office_section']) && $data['office_section'] === 'minute_sheet') ||
                     (!empty($data['directed_to']) && strtolower($data['directed_to']) !== 'central registry') ||
                     (!empty($data['project_id']));

    if ($isMinuteSheet) {
        $coreData = [
            'id' => $id,
            'ref_no' => $data['ref_no'] ?? '',
            'date_received' => $data['date_recorded'] ?? ($data['date_received'] ?? date('Y-m-d')),
            'end_user' => $data['sender_or_recipient'] ?? ($data['end_user'] ?? ''),
            'contact_1' => $data['contact_no'] ?? ($data['contact_1'] ?? ''),
            'whatsapp' => $data['whatsapp_no'] ?? ($data['whatsapp'] ?? ''),
            'subject' => $data['subject'] ?? '',
            'description' => $data['scope_description'] ?? ($data['description'] ?? ''),
            'directed_type' => $data['directed_type'] ?? 'Maintenance Zone',
            'directed_to' => $data['directed_to'] ?? 'Civil Engineering Department',
            'project_id' => $data['project_id'] ?? '',
            'project_name' => $data['project_name'] ?? '',
            'priority' => $data['priority'] ?? 'Normal',
            'position' => $data['present_position'] ?? ($data['position'] ?? 'Received / In Registry'),
            'linked_estimate_id' => $data['linked_estimate_id'] ?? '',
            'linked_job_number' => $data['linked_job_number'] ?? '',
            'position_trail' => $data['position_trail'] ?? [],
            'updated_at' => date('Y-m-d H:i:s')
        ];
        $coreRes = firebasePatch(FB_CORE_DB_URL, "job_minutes/{$id}", $coreData);
        $results['cmsys-v2'] = $coreRes ? 'OK' : 'Failed';
    }

    return $results;
}
