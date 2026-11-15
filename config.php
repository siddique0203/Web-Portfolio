<?php
/**
 * Shared configuration loader.
 * - Reads secrets from a .env file (never hard-code them in PHP files).
 * - Looks one level ABOVE the web root first (safest), then next to this file.
 * - The first value found for a key wins.
 * Opening this file in a browser prints nothing (and .htaccess blocks it anyway).
 */
if (!function_exists('loadEnv')) {
    function loadEnv(array $paths): void
    {
        foreach ($paths as $path) {
            if (!@is_readable($path)) {
                continue;
            }
            $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            if ($lines === false) {
                continue;
            }
            foreach ($lines as $i => $line) {
                if ($i === 0) {
                    $line = preg_replace('/^\xEF\xBB\xBF/', '', $line); // strip UTF-8 BOM
                }
                $line = trim($line);
                if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
                    continue;
                }
                list($key, $value) = array_map('trim', explode('=', $line, 2));
                $value = trim($value, " \t\"'");
                if ($key !== '' && !isset($_ENV[$key])) {
                    $_ENV[$key] = $value;
                }
            }
        }
    }

    function env(string $key, string $default = ''): string
    {
        $v = isset($_ENV[$key]) ? $_ENV[$key] : getenv($key);
        return (is_string($v) && $v !== '') ? $v : $default;
    }

    loadEnv([dirname(__DIR__) . '/.env', __DIR__ . '/.env']);
}
