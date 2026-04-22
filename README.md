# Docs Render Site

Vue 3 приложение, которое собирает Markdown-документацию в многостраничный сайт с:

- выпадающей навигацией по структуре файлов;
- рендерингом `[[wiki-links]]` и обычных markdown-ссылок;
- встроенным рендером Mermaid;
- диагностикой битых ссылок и сиротских файлов (`/_diagnostics`);
- fallback-страницей для несуществующих ссылок.

## Запуск

```bash
npm install
npm run dev
```

## Источник документации

По умолчанию читается папка `../docs` относительно корня приложения.

Можно переопределить:

```bash
DOCS_ROOT=/absolute/or/relative/path npm run dev
```

## Команды

- `npm run dev` — локальный запуск;
- `npm run build` — production сборка;
- `npm run preview` — предпросмотр сборки;
- `npm run lint` — проверка TypeScript.
# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).
