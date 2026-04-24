# Управление состоянием на Frontend

Frontend приложение использует [Pinia](https://pinia.vuejs.org/) — рекомендованное решение для управления состоянием в Vue 3. Pinia stores предоставляют централизованное хранилище для данных, которые должны быть доступны между различными компонентами, обеспечивая предсказуемость и легкую отладку состояния приложения.

## Основные Pinia Stores

Все stores определены в директории [`frontend/src/stores/`](../../frontend/src/stores/).

### [useEditorStore](<../../frontend/src/stores/editor.ts>)

Отвечает за состояние Markdown-редактора и связанные с ним параметры.

*   `content`: Текущее содержимое Markdown-редактора.
*   `currentFileName`: Имя текущего редактируемого файла.
*   `debounceMs`: Задержка перед автоматической компиляцией предпросмотра (для оптимизации).
*   `titlePageId`: ID выбранной титульной страницы.
*   **Actions:** `setContent`, `setCurrentFileName`, `setDebounceMs`, `setTitlePageId`, `clear`.

### [usePageEditorStore](<../../frontend/src/stores/pageEditor.ts>)

Управляет состоянием редактора титульных страниц (`PageEditor`).

*   `elements`: Массив элементов, составляющих титульную страницу (текст, переменные, линии).
*   `variables`: Словарь пользовательских переменных для титульной страницы.
*   `ignoreDocumentStyles`: Флаг, указывающий, нужно ли игнорировать глобальные стили документа для титульной страницы.
*   `paper`: Параметры бумаги для титульной страницы (размер, поля).
*   `selectedId`: ID текущего выбранного элемента на холсте редактора.
*   `showGrid`, `snapEnabled`, `snapThresholdMm`: Настройки сетки и привязки для удобства редактирования.
*   **Actions:** `setSelected`, `setPaper`, `addText`, `addVariable`, `addLine`, `updatePosition`, `updateSize`, `updateLineEndpoints`, `updateTextContent`, `updateTextStyle`, `updateVariableName`, `setVariableValue`, `loadContent`, `reset`, `toggleGrid`, `setSnapEnabled`, `toggleSnap`, `setSnapThresholdMm`.

### [usePreviewStore](<../../frontend/src/stores/preview.ts>)

Содержит состояние, связанное с живым предпросмотром Typst-документа.

*   `typstSource`: Текущий полный Typst-исходник, который отображается в предпросмотре.
*   `error`: Сообщение об ошибке, если компиляция предпросмотра не удалась.
*   `compiling`: Флаг, указывающий, находится ли предпросмотр в процессе компиляции.
*   **Actions:** `setTypstSource`, `setError`, `setCompiling`, `clear`.

### [useProfilesStore](<../../frontend/src/stores/profiles.ts>)

Отвечает за управление профилями стилей и их кэширование.

*   `list`: Массив всех доступных профилей стилей.
*   `currentId`: ID текущего активного профиля.
*   `styleCache`: Кэш для хранения сгенерированных Typst-преамбул для каждого профиля.
*   `loading`: Флаг, указывающий, идет ли загрузка профилей.
*   `lastProfileId`: Последний выбранный профиль, сохраняется в `localStorage` с помощью `@vueuse/core`.
*   **Actions:** `fetchProfiles`, `setCurrent`, `loadProfileStyles`, `getCachedPreamble`, `invalidateCache`, `createProfile`.

## Взаимодействие Stores

Stores взаимодействуют друг с другом, чтобы поддерживать согласованное состояние приложения. Например:

*   `useEditorStore` обновляет `content`, что вызывает перекомпиляцию предпросмотра через `usePreviewStore`.
*   `useProfilesStore` загружает и кэширует Typst-преамбулу, которую затем использует `usePreviewStore` для формирования полного Typst-исходника.
*   Изменения в `usePageEditorStore` приводят к обновлению `titlePageId` в `useEditorStore`.

Далее: [Пайплайн рендеринга](RenderingPipeline.md)