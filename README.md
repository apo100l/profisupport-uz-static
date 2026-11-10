# profisupport.uz — статическая сборка (демо)

Статический сайт: только HTML, CSS, шрифты и картинки. Серверного кода и внешних запросов нет, шрифт Lato 2.015 (латиница и кириллица, лицензия OFL — `assets/fonts/OFL.txt`) лежит в `assets/fonts`.

Демо: https://apo100l.github.io/profisupport-uz-static/

## Структура

- `/` — главная на узбекском
- `/{uz|ru|en}/` и `about/`, `contacts/`, `support/`, `privacy/`, `terms/`, `delete-account/` — 22 страницы
- `assets/site.css`, `assets/site.js` — стили и небольшой JS (переключатели на главной, меню на телефоне)
- `robots.txt` и `<meta name="robots" content="noindex">` — демо закрыто от индексации. Перед боевой публикацией убрать.

Ссылки относительные, поэтому сайт работает и в корне домена, и в подпапке (как на GitHub Pages). Исключение — `404.html`: в нём абсолютные пути с префиксом `/profisupport-uz-static/`.

## Локально

    npm start          # http://127.0.0.1:8080/, порт меняется через PORT=3000 npm start

## Реквизиты

Реквизиты компании хранятся в одном файле — `requisites.json`: полное и латинское наименование, краткое наименование, СТИР, дата и место регистрации, адрес, телефоны, виды сделок, дата редакции документов. Текстовые поля задаются на трёх языках (`uz`, `ru`, `en`), телефоны — списком.

    npm run requisites

Скрипт расставляет значения по всем страницам в элементы `<span data-req="…">`. Телефоны становятся ссылками `tel:`, номер не разрывается при переносе строки. Пустое значение оставляет на странице жёлтую плашку-заглушку (`ps-ph`). Значения брать из утверждённого эталона, символ в символ как в D&B и в заявке Apple.

Тот же скрипт пишет структурированные данные (schema.org JSON-LD: Organization, WebSite, страница) в `<script type="application/ld+json" id="ps-ld">` на главных и на страницах контактов. Адреса в нём продакшн: `https://profisupport.uz/…`.

## Что ещё заглушки

- В `requisites.json` не заполнены виды сделок (`dealTypes`) и дата редакции документов (`revisionDate`).
- Тексты политики конфиденциальности и условий использования — черновой план, не готовый текст.
- Тексты на узбекском и английском — черновик, нужна вычитка.

## Перед публикацией на profisupport.uz

canonical, hreflang (с `x-default` на узбекскую версию), Open Graph, JSON-LD и `sitemap.xml` уже указывают на `https://profisupport.uz/`. При переезде:

1. Убрать `<meta name="robots" content="noindex, nofollow">` со всех страниц, кроме `404.html`.
2. Заменить `robots.txt` на открытый, он должен лежать в корне домена:

        User-agent: *
        Allow: /

        Sitemap: https://profisupport.uz/sitemap.xml

   Пускать ли обучающих ботов (GPTBot, ClaudeBot, Google-Extended, CCBot) — отдельное решение; поисковых и пользовательских ботов ИИ (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot) лучше пускать.
3. В `404.html` заменить префикс `/profisupport-uz-static/` на `/`.
4. Не выкладывать `dev/`, `scripts/`, `package.json`, `requisites.json` и `README.md`.
5. Решить, что отдаёт корень `/`: сейчас это копия `/uz/` с canonical на `/uz/`; проще сделать 301 на `/uz/`.
6. На хостинге: долгий кэш для `assets/` (лучше с версией в имени файла), Brotli или gzip, HSTS и базовые заголовки безопасности.
7. Отправить `sitemap.xml` в Google Search Console и Яндекс Вебмастер.
