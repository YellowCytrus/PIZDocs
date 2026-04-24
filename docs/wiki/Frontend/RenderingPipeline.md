# Пайплайн рендеринга на Frontend

Frontend приложение реализует сложный пайплайн рендеринга для отображения живого предпросмотра документов Typst непосредственно в браузере. Этот процесс включает в себя конвертацию Markdown в Typst, сборку полного Typst-исходника с учетом стилей и его рендеринг на HTML Canvas с помощью WebAssembly-модуля `typst.ts`.

## Диаграмма потока данных для Live Preview

```mermaid
graph TD
  MarkdownEditor[Markdown Editor (Vue.js)] --> TypstBodyConverter[usePandoc.ts: convertMdToTypst()]
  TypstBodyConverter -- Typst Body --> PreviewStore[Pinia: previewStore]
  ProfileStore[Pinia: profilesStore] -- Cached Preamble --> PreviewStore
  PreviewStore -- Full Typst Source --> TypstPreviewComponent[TypstPreview.vue]
  TypstPreviewComponent --> TypstTS_WASM[typst.ts (WASM Module)]
  TypstTS_WASM -- Rendered Pages --> HTMLCanvas[Browser Canvas]
```

## Этапы пайплайна

1.  **Ввод Markdown и отслеживание изменений** ([`frontend/src/views/Editor.vue`](../../frontend/src/views/Editor.vue))
    *   Пользователь вводит текст в Markdown-редакторе. Изменения отслеживаются `editorStore` ([`frontend/src/stores/editor.ts`](../../frontend/src/stores/editor.ts)).
    *   Каждое изменение запускает функцию `debouncedCompile` с небольшой задержкой (`editorStore.debounceMs`) для предотвращения слишком частых перекомпиляций.

2.  **Конвертация Markdown в Typst Body** ([`frontend/src/composables/usePandoc.ts`](../../frontend/src/composables/usePandoc.ts))
    *   Функция `convertMdToTypst` из `usePandoc` используется для преобразования текущего Markdown-содержимого в базовый Typst-код (`typstBody`).
    *   Эта конвертация выполняется непосредственно в браузере с помощью библиотеки `pandoc-wasm` ([`pandoc-wasm`](https://github.com/pandoc-wasm/pandoc-wasm)), которая компилирует Pandoc в WebAssembly. Это позволяет избежать обращения к Backend для каждой конвертации Markdown.

3.  **Получение и кэширование Typst-преамбулы** ([`frontend/src/stores/profiles.ts`](../../frontend/src/stores/profiles.ts))
    *   `profilesStore` отвечает за загрузку и кэширование Typst-преамбулы для текущего выбранного профиля стилей. Эта преамбула получается с Backend через API-эндпоинт `GET /profiles/{profile_id}/preamble`.
    *   Преамбула представляет собой строку Typst-кода, содержащую `#set` и `#show` правила, определяющие глобальные стили документа.

4.  **Сборка полного Typst-исходника** ([`frontend/src/views/Editor.vue`](../../frontend/src/views/Editor.vue))
    *   В `compileMdToPreview` (вызывается `debouncedCompile`), кэшированная `preamble` объединяется с `typstBody`:
        ```typescript
        const fullTypst = (preamble ?? '') + '\n' + typstBody;
        ```
    *   Полученный `fullTypst` затем устанавливается в `previewStore.typstSource` ([`frontend/src/stores/preview.ts`](../../frontend/src/stores/preview.ts)).

5.  **Рендеринг Typst на Canvas** ([`frontend/src/components/TypstPreview.vue`](../../frontend/src/components/TypstPreview.vue))
    *   Компонент `TypstPreview.vue` отслеживает изменения в `previewStore.typstSource`.
    *   При изменении `typstSource`, вызывается асинхронная функция `compileToCanvas(mainContent: string)`.
    *   **Обработка изображений:** `registerImagesForPreview` извлекает пути к изображениям из Typst-исходника и загружает их в Shadow FS (виртуальную файловую систему) `typst.ts`.
    *   **Компиляция `typst.ts`:** Затем `mainContent` передается в `typst.ts` (`@myriaddreamin/typst.ts/contrib/snippet`), который компилирует Typst-код и рендерит каждую страницу как отдельный HTML-элемент (`.typst-page`) на Canvas внутри `canvasContainerRef`.
    *   Обработка ошибок: Любые ошибки компиляции `typst.ts` перехватываются и устанавливаются в `previewStore.error`.
    *   Управление масштабом: Компонент также обрабатывает масштабирование предпросмотра с помощью Ctrl + колесо мыши.

## Взаимодействие с Backend для изображений

Хотя основной рендеринг происходит на Frontend, изображения, на которые ссылается Typst-код, могут быть загружены с Backend. `TypstPreview.vue` использует `fetch` для получения изображений по URL, таким как `/image-assets/{id}/file`, и затем регистрирует их в Shadow FS `typst.ts`.

Далее: [Редактор стилей](StyleEditor.md)