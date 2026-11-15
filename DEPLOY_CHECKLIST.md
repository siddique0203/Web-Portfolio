# Deploy checklist (upload everything inside `htdocs` to your host's web root)

1. Upload ALL files and folders, including `.env`, `.htaccess`, `phpmailer/` and `assets/`.
   - Hidden files: in your file manager, enable "Show hidden files" so `.env` and `.htaccess` are visible/uploaded.
2. `.env` must contain (no quotes needed):
   SMTP_USERNAME, SMTP_PASSWORD (Gmail App Password), RECIPIENT_EMAIL, GA_MEASUREMENT_ID
3. Open https://YOUR-DOMAIN/.env  -> it MUST show "403 Forbidden" / "Not Found". If it downloads or shows text, tell your host or move `.env` one folder above `htdocs` (the PHP files look there first).
4. Submit the contact form once. If it fails, set `APP_DEBUG=true` in `.env`, retry, read the message, then set it back to `false`.
5. Open the site, then check Google Analytics > Reports > Realtime to confirm your visit appears.
6. After SSL (https) works, uncomment the "Force HTTPS" block in `.htaccess`.
7. When you change CSS/JS later, bump `?v=` in the <link>/<script> tags in `index.html` so visitors get the new files.
