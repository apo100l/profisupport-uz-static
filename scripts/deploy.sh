#!/bin/sh
# Сборка и выкладка на хостинг по FTPS (Plesk, u17.billur.com).
# Логин и пароль — в ~/.netrc: machine 83.69.136.99 login … password …
# TLS 1.3 на этом ProFTPD обрывает передачу (ответ 426), поэтому TLS 1.2.
set -e
cd "$(dirname "$0")/.."
sh scripts/build.sh
HOST="${FTP_HOST:-83.69.136.99}"
cd dist
fail=0
for f in $(find . -type f ! -name '.DS_Store' | sed 's#^\./##'); do
  curl -s -m 120 --netrc --ssl-reqd -k --tlsv1.2 --tls-max 1.2 --ftp-create-dirs \
    -T "$f" "ftp://$HOST/httpdocs/$f" || { echo "FAIL $f"; fail=1; }
done
[ "$fail" = 0 ] && echo "Выложено. Если менялись CSS, JS, шрифты или картинки — сбросьте кэш Cloudflare." || exit 1
