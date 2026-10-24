<?php
require_once __DIR__ . '/config.php';
$pdo = Database::getInstance()->getConnection();

if (!$pdo) die("No PDO connection\n");

// Check minute templates
$mCount = $pdo->query("SELECT COUNT(*) FROM minute_templates")->fetchColumn();
if ($mCount == 0) {
    $minTemplates = [
        [
            'id' => 'tpl_min_estimate',
            'lang' => 'si',
            'title' => 'ඇස්තමේන්තු සකස් කිරීම සඳහා යොමු කිරීම',
            'category' => 'Estimates',
            'ref_no' => 'CCED/A/{MM}/2216/{YY}',
            'subject' => 'ගොඩනැගිලි හා යටිතල පහසුකම් ප්‍රතිසංස්කරණ ඇස්තමේන්තුව සකස් කිරීම පිළිබඳව',
            'addressees' => json_encode(['කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)', 'විධායක නිලධාරී - ශ්‍රීලංනෞ තිස්ස'], JSON_UNESCAPED_UNICODE),
            'originator' => 'වැඩ භාර නිලධාරී (සිවිල්) මඟින්',
            'paragraphs' => json_encode([
                ['num' => '01.', 'text' => 'ඉහත විෂය කරුණ සම්බන්ධව ශ්‍රීලංනෞ තිස්ස කඳවුරු පරිශ්‍රයේ ස්ථානීය නිරීක්ෂණය සිදු කරන ලද අතර, අදාළ අලුත්වැඩියා කටයුතු කඩිනමින් සිදු කිරීම අත්‍යවශ්‍ය බව නිරීක්ෂණය විය.'],
                ['num' => '02.', 'text' => 'එම කටයුතු සඳහා අවශ්‍ය වන ද්‍රව්‍ය හා ශ්‍රම අවශ්‍යතාවය ඇතුළත් සවිස්තරාත්මක ඇස්තමේන්තුවක් සකස් කර ඉදිරිපත් කිරීමට කටයුතු සම්පාදනය කර ඇත.']
            ], JSON_UNESCAPED_UNICODE),
            'recommendation' => 'ඉදිරි කටයුතු සඳහා කාරුණිකව ඉදිරිපත් කරමි.',
            'sign_title' => 'වැඩ භාර නිලධාරී (සිවිල්)',
            'm02_enabled' => 1,
            'm02_addressee' => 'විධායක නිලධාරී - ශ්‍රීලංනෞ තිස්ස',
            'm02_originator' => 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
            'm02_text' => 'නිර්දේශ කර ඉදිරිපත් කරමි.',
            'm02_sign_title' => 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)'
        ],
        [
            'id' => 'tpl_min_approval',
            'lang' => 'si',
            'title' => 'කාර්යයන් අනුමැතිය සඳහා ඉදිරිපත් කිරීම',
            'category' => 'Approvals',
            'ref_no' => 'CCED/A/{MM}/2217/{YY}',
            'subject' => 'ජල සැපයුම් පද්ධතිය ප්‍රතිසංස්කරණය කිරීම සඳහා අනුමැතිය ලබා ගැනීම',
            'addressees' => json_encode(['අණදෙන නිලධාරී - ශ්‍රීලංනෞ තිස්ස'], JSON_UNESCAPED_UNICODE),
            'originator' => 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර) මඟින්',
            'paragraphs' => json_encode([
                ['num' => '01.', 'text' => 'ඉහත විෂය සම්බන්ධව පවතින ජල කාන්දුවීම් හේතුවෙන් දෛනික ජල සැපයුමට බාධා එල්ල වී ඇති බැවින් අත්‍යවශ්‍ය ප්‍රතිසංස්කරණ කටයුතු ආරම්භ කිරීමට සැලසුම් කර ඇත.'],
                ['num' => '02.', 'text' => 'මේ සඳහා වන ද්‍රව්‍ය දෙපාර්තමේන්තු ගබඩාවෙන් ලබා ගැනීමටත්, කාර්යය කඩිනමින් නිම කිරීමටත් අවශ්‍ය අනුමැතිය කාරුණිකව අපේක්ෂා කරමි.']
            ], JSON_UNESCAPED_UNICODE),
            'recommendation' => 'අනුමැතිය සඳහා කාරුණිකව ඉදිරිපත් කරමි.',
            'sign_title' => 'කොට්ඨාස සිවිල් ඉංජිනේරු නිලධාරී (නැගෙනහිර)',
            'm02_enabled' => 0,
            'm02_addressee' => '',
            'm02_originator' => '',
            'm02_text' => '',
            'm02_sign_title' => ''
        ]
    ];
    $stmt = $pdo->prepare("INSERT INTO minute_templates (id, lang, title, category, ref_no, subject, addressees, originator, paragraphs, recommendation, sign_title, m02_enabled, m02_addressee, m02_originator, m02_text, m02_sign_title) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($minTemplates as $t) {
        $stmt->execute([$t['id'], $t['lang'], $t['title'], $t['category'], $t['ref_no'], $t['subject'], $t['addressees'], $t['originator'], $t['paragraphs'], $t['recommendation'], $t['sign_title'], $t['m02_enabled'], $t['m02_addressee'], $t['m02_originator'], $t['m02_text'], $t['m02_sign_title']]);
    }
    echo "Seeded minute templates.\n";
}

// Check naval letter templates
$lCount = $pdo->query("SELECT COUNT(*) FROM naval_letter_templates")->fetchColumn();
if ($lCount == 0) {
    $ltrTemplates = [
        [
            'id' => 'tpl_br7_nhq_approval',
            'title' => 'Submission to NHQ for Project Work Approval (BR 7)',
            'category' => 'NHQ Submissions',
            'security_class' => 'RESTRICTED',
            'precedence' => 'ROUTINE',
            'br7_tone' => 'senior',
            'addressee_to' => "The Commander of the Navy\nNaval Headquarters\nPO Box 593\nColombo 01",
            'channel_through' => "Through: The Commander Eastern Naval Area",
            'subject' => 'RECONSTRUCTION AND WATER SUPPLY UPGRADE AT WARDROOM COMPLEX - SLNS TISSA',
            'references_list' => json_encode([
                '(a) NHQ Letter NHQ/CE/05/2026/042 dated 10 September 2026',
                '(b) COMEN Signal DTG 150830Z OCT 26'
            ], JSON_UNESCAPED_UNICODE),
            'paragraphs' => json_encode([
                ['num' => '1.', 'text' => 'I have the honour to submit for your kind consideration and approval please that an on-site structural and plumbing inspection was carried out at the Wardroom Complex of SLNS Tissa.'],
                ['num' => '2.', 'text' => 'The existing main distribution pipe network has developed severe corrosion resulting in recurring pressure drops and significant wastage of potable water. A comprehensive Bill of Quantities (BOQ) and structural drawings have been formulated by this department.'],
                ['num' => '3.', 'text' => 'The total estimated cost for the proposed replacement works amounts to Rs. 1,485,000.00 (Rupees One Million Four Hundred and Eighty-Five Thousand only). Detailed cost breakdown is forwarded herewith at Annex A.'],
                ['num' => '4.', 'text' => 'In view of the urgency, it is respectfully recommended that administrative and financial approval be granted to initiate departmental procurement and execution.']
            ], JSON_UNESCAPED_UNICODE),
            'enclosures_list' => json_encode([
                'Annex A: Detailed Cost Estimate & BOQ (CE/TS/EST/2026/08)',
                'Annex B: Site Layout Drawing No. CCED/DRG/2026/045'
            ], JSON_UNESCAPED_UNICODE),
            'copy_to_list' => json_encode([
                'The Director General Civil Engineering, NHQ',
                'The Command Logistics Officer (East)',
                'The Commanding Officer, SLNS Tissa',
                'Office Copy'
            ], JSON_UNESCAPED_UNICODE)
        ],
        [
            'id' => 'tpl_br7_directive',
            'title' => 'Directive to Subordinate Unit / Base (BR 7 Directive)',
            'category' => 'Directives',
            'security_class' => 'RESTRICTED',
            'precedence' => 'PRIORITY',
            'br7_tone' => 'junior',
            'addressee_to' => "The Commanding Officer\nSLNS Tissa\nTrincomalee",
            'channel_through' => "",
            'subject' => 'EXPEDITION OF DEFECT RECTIFICATION WORKS - WATERFRONT JETTY',
            'references_list' => json_encode([
                '(a) Inspection Report CCED/INS/2026/14 dated 02 October 2026'
            ], JSON_UNESCAPED_UNICODE),
            'paragraphs' => json_encode([
                ['num' => '1.', 'text' => 'Reference (a), you are hereby directed to coordinate with the Command Civil Engineering Department to facilitate immediate defect rectification at the Waterfront Jetty.'],
                ['num' => '2.', 'text' => 'The nominated CE working party will commence bollard reinforcement and deck concrete repair operations with effect from 26 October 2026.'],
                ['num' => '3.', 'text' => 'You are requested to ensure berthing clearances and unhindered vehicle access for equipment transport during work hours.'],
                ['num' => '4.', 'text' => 'Progress report is to be rendered to this office upon completion of Phase 01.']
            ], JSON_UNESCAPED_UNICODE),
            'enclosures_list' => json_encode([
                'Defect rectification schedule'
            ], JSON_UNESCAPED_UNICODE),
            'copy_to_list' => json_encode([
                'Commander Eastern Naval Area',
                'Command Operations Officer (East)',
                'File Copy'
            ], JSON_UNESCAPED_UNICODE)
        ]
    ];
    $stmt2 = $pdo->prepare("INSERT INTO naval_letter_templates (id, title, category, security_class, precedence, br7_tone, addressee_to, channel_through, subject, references_list, paragraphs, enclosures_list, copy_to_list) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($ltrTemplates as $t) {
        $stmt2->execute([$t['id'], $t['title'], $t['category'], $t['security_class'], $t['precedence'], $t['br7_tone'], $t['addressee_to'], $t['channel_through'], $t['subject'], $t['references_list'], $t['paragraphs'], $t['enclosures_list'], $t['copy_to_list']]);
    }
    echo "Seeded naval letter templates.\n";
}

echo "Database seeding complete.\n";
