<?php
// Scratch test verification script for CMSys Ecosystem Migration
header('Content-Type: application/json');

echo "=== 1. Testing check_ecosystem action ===\n";
$_GET['action'] = 'check_ecosystem';
ob_start();
require __DIR__ . '/../api.php';
$ecoResult = ob_get_clean();
echo $ecoResult . "\n\n";

echo "=== 2. Testing sync_meta action (Sailors & Projects) ===\n";
$_GET['action'] = 'sync_meta';
ob_start();
// Since api.php may exit or return
// Let's call curl or direct helper
$ch = curl_init('https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app/naval_projects.json?shallow=true');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$projectsJson = curl_exec($ch);
curl_close($ch);
$projects = json_decode($projectsJson, true);
echo "Naval projects count in cmsys-v2: " . (is_array($projects) ? count($projects) : 'Failed: ' . $projectsJson) . "\n";

$ch = curl_init('https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app/sailors.json?shallow=true');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$sailorsJson = curl_exec($ch);
curl_close($ch);
$sailors = json_decode($sailorsJson, true);
echo "Sailors count in cmsys-v2: " . (is_array($sailors) ? count($sailors) : 'Failed: ' . $sailorsJson) . "\n";

$ch = curl_init('https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app/document_registry.json?shallow=true');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$docsJson = curl_exec($ch);
curl_close($ch);
$docs = json_decode($docsJson, true);
echo "Documents count in cmsys-v2: " . (is_array($docs) ? count($docs) : 'Failed: ' . $docsJson) . "\n";

$ch = curl_init('https://cmsys-v2-default-rtdb.asia-southeast1.firebasedatabase.app/logistics.json?shallow=true');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$logisticsJson = curl_exec($ch);
curl_close($ch);
$logistics = json_decode($logisticsJson, true);
echo "Logistics items count in cmsys-v2: " . (is_array($logistics) ? count($logistics) : 'Failed: ' . $logisticsJson) . "\n";
