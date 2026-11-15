<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function respond(bool $ok, string $message, int $code = 200, array $extra = []): void
{
    http_response_code($code);
    echo json_encode(array_merge(['success' => $ok, 'message' => $message], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function text_len(string $s): int
{
    return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s);
}

/** Returns the cleaned text, or null when it exceeds $max characters.
 *  Single-line fields lose line breaks (blocks header injection); multi-line keeps them. */
function clean_field($value, int $max, bool $multiline = false): ?string
{
    $v = is_string($value) ? $value : '';
    $v = str_replace("\0", '', strip_tags($v));
    $v = str_replace("\r\n", "\n", $v);
    $v = $multiline ? str_replace("\r", "\n", $v) : preg_replace('/[\r\n]+/', ' ', $v);
    $v = trim((string)$v);
    return text_len($v) > $max ? null : $v;
}

// ---- Request checks -------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'Invalid request method', 405);
}

// Same-origin only (blocks form posts coming from other websites)
$host = strtolower((string)preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
    if (!empty($_SERVER[$h])) {
        $from = strtolower((string)parse_url((string)$_SERVER[$h], PHP_URL_HOST));
        if ($from !== '' && $from !== $host) {
            respond(false, 'Request not allowed', 403);
        }
        break;
    }
}

// Honeypot: real visitors never see or fill this field. Pretend success to bots.
if (!empty($_POST['website'])) {
    respond(true, 'Message sent successfully');
}

// ---- Configuration --------------------------------------------------------
$smtpUser  = env('SMTP_USERNAME');
$smtpPass  = str_replace(' ', '', env('SMTP_PASSWORD')); // Gmail app passwords are shown with spaces
$recipient = env('RECIPIENT_EMAIL');
$smtpHost  = env('SMTP_HOST', 'smtp.gmail.com');
$smtpPort  = (int)env('SMTP_PORT', '587');
$smtpSec   = strtolower(env('SMTP_SECURE', $smtpPort === 465 ? 'ssl' : 'tls'));
$debug     = strtolower(env('APP_DEBUG', 'false')) === 'true';

if ($smtpUser === '' || $smtpPass === '' || $recipient === '') {
    error_log('[portfolio-mail] Missing SMTP_USERNAME / SMTP_PASSWORD / RECIPIENT_EMAIL in .env');
    respond(false, 'Server configuration error', 500);
}
foreach (['PHPMailer', 'SMTP', 'Exception'] as $f) {
    if (!is_file(__DIR__ . "/phpmailer/src/$f.php")) {
        error_log("[portfolio-mail] phpmailer/src/$f.php not found");
        respond(false, 'Mail library not found on server', 500);
    }
}
require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
require_once __DIR__ . '/phpmailer/src/SMTP.php';
require_once __DIR__ . '/phpmailer/src/Exception.php';

// ---- Rate limit: 5 messages / 10 minutes / IP ------------------------------
$ip     = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rlFile = rtrim(sys_get_temp_dir(), '/\\') . '/portfolio_rl_' . md5($ip) . '.json';
$now    = time();
$hits   = [];
if (is_file($rlFile)) {
    $decoded = json_decode((string)@file_get_contents($rlFile), true);
    if (is_array($decoded)) {
        $hits = array_values(array_filter($decoded, function ($t) use ($now) {
            return is_int($t) && $t > $now - 600;
        }));
    }
}
if (count($hits) >= 5) {
    respond(false, 'Too many messages. Please try again in a few minutes.', 429);
}

// ---- Validate input ---------------------------------------------------------
$name    = clean_field($_POST['name'] ?? '', 100);
$subject = clean_field($_POST['subject'] ?? '', 150);
$message = clean_field($_POST['message'] ?? '', 5000, true);
$email   = trim((string)($_POST['email'] ?? ''));

if ($name === null || $subject === null || $message === null) {
    respond(false, 'One of the fields is too long', 422);
}
if ($name === '' || $subject === '' || $message === '' || $email === '') {
    respond(false, 'All fields are required', 422);
}
if (strlen($email) > 254 || preg_match('/[\r\n]/', $email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Invalid email address', 422);
}

// Count every valid attempt (successful or not) so the SMTP server cannot be hammered
$hits[] = $now;
@file_put_contents($rlFile, json_encode($hits), LOCK_EX);

// ---- Send ---------------------------------------------------------------------
use PHPMailer\PHPMailer\PHPMailer;

function send_contact_mail(string $host, int $port, string $secure, array $d): void
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $host;
    $mail->Port       = $port;
    $mail->SMTPAuth   = true;
    $mail->Username   = $d['user'];
    $mail->Password   = $d['pass'];
    $mail->SMTPSecure = $secure === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Timeout    = 15;
    $mail->CharSet    = 'UTF-8';
    $mail->SMTPDebug  = 0;

    $mail->setFrom($d['user'], 'Portfolio Contact');
    $mail->addAddress($d['to']);
    $mail->addReplyTo($d['email'], $d['name']);
    $mail->isHTML(false);
    $mail->Subject = 'Portfolio Contact: ' . $d['subject'];
    $mail->Body    = "Name: {$d['name']}\nEmail: {$d['email']}\n\nMessage:\n{$d['message']}\n\n"
                   . "--\nSent from the portfolio contact form | IP: {$d['ip']} | " . date('Y-m-d H:i:s T');
    $mail->send();
}

$payload = [
    'user' => $smtpUser, 'pass' => $smtpPass, 'to' => $recipient,
    'name' => $name, 'email' => $email, 'subject' => $subject, 'message' => $message, 'ip' => $ip,
];

// Some hosts block port 587; for Gmail fall back to SMTPS on 465 automatically.
$attempts = [[$smtpHost, $smtpPort, $smtpSec]];
if ($smtpHost === 'smtp.gmail.com' && $smtpPort === 587) {
    $attempts[] = [$smtpHost, 465, 'ssl'];
}

$sent = false;
$lastError = '';
foreach ($attempts as $a) {
    try {
        send_contact_mail($a[0], $a[1], $a[2], $payload);
        $sent = true;
        break;
    } catch (Throwable $e) {
        $lastError = $e->getMessage();
        error_log('[portfolio-mail] ' . $a[1] . ': ' . $lastError);
    }
}

if (!$sent) {
    respond(false, 'Email could not be sent. Please try again later.', 502, $debug ? ['debug' => $lastError] : []);
}

respond(true, 'Message sent successfully');
