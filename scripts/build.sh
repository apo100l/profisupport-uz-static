#!/bin/sh
# Сборка для хостинга profisupport.uz (Plesk, Apache).
# Результат: dist/ и profisupport-uz.zip — содержимое кладётся в httpdocs.
set -e
cd "$(dirname "$0")/.."

rm -rf dist profisupport-uz.zip
mkdir dist
cp -R index.html 404.html robots.txt sitemap.xml assets uz ru en dist/
find dist -name '.DS_Store' -delete

cat > dist/.htaccess <<'HT'
DirectoryIndex index.html
ErrorDocument 404 /404.html
Options -Indexes

# Один адрес на страницу: корень и короткие пути ведут на узбекскую версию,
# …/index.html — на адрес папки
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{THE_REQUEST} \s/+((?:[^?\s]*/)?)index\.html[?\s]
  RewriteRule ^ /%1 [R=301,L]
  RewriteRule ^$ /uz/ [R=301,L]
  RewriteRule ^(about|contacts|support|privacy|terms|delete-account)/?$ /uz/$1/ [R=301,L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml application/xml text/xml text/plain application/ld+json
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  <FilesMatch "\.(woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\.(jpg|webp|svg)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
  <FilesMatch "\.(css|js)$">
    Header set Cache-Control "public, max-age=86400"
  </FilesMatch>
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
HT

(cd dist && zip -qr ../profisupport-uz.zip . -x '.DS_Store')
echo "dist/ и profisupport-uz.zip готовы"
