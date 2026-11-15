<?php
/**
 * Serves the Google Analytics (GA4) snippet using the Measurement ID from .env:
 *   GA_MEASUREMENT_ID=G-XXXXXXXXXX
 * If the key is missing or malformed, nothing is loaded.
 */
require_once __DIR__ . '/config.php';

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: public, max-age=3600');
header('X-Content-Type-Options: nosniff');

$id = env('GA_MEASUREMENT_ID');
if (!preg_match('/^G-[A-Z0-9]{6,20}$/', $id)) {
    echo '/* analytics disabled: GA_MEASUREMENT_ID missing or invalid */';
    exit;
}

echo "window.dataLayer = window.dataLayer || [];\n";
echo "function gtag(){dataLayer.push(arguments);}\n";
echo "gtag('js', new Date());\n";
echo "gtag('config', '" . $id . "');\n";
echo "(function(){var s=document.createElement('script');s.async=true;";
echo "s.src='https://www.googletagmanager.com/gtag/js?id=" . $id . "';document.head.appendChild(s);})();\n";
