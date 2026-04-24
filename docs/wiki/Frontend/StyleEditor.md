# Редактор стилей на Frontend

Редактор стилей — это ключевая часть Frontend, позволяющая пользователям настраивать внешний вид документов, управляя стилевыми профилями и их параметрами. Он обеспечивает интерактивный интерфейс для изменения различных свойств элементов документа.

## Обзор компонентов

### [Styles.vue](<../../frontend/src/views/Styles.vue>)

Корневой компонент страницы стилей. Он агрегирует данные от `useProfilesStore` и `useStyleEditor`, отображает текущий профиль, статус сохранения и является контейнером для `NestedTabs`, который рендерит поля для редактирования стилей.

*   **`profilesStore`**: Используется для получения списка профилей, текущего активного профиля и для инвалидации кэша преамбулы после сохранения стилей.
*   **`useStyleEditor`**: Компосабл, который управляет загрузкой, обновлением и сохранением стилей для текущего профиля.
*   **`NestedTabs`**: Отображает структуру полей стилей, организованных во вложенные вкладки.

### [RightPanel.vue](<../../frontend/src/components/RightPanel.vue>)

Компонент правой панели, который содержит секции для выбора профилей и базовые настройки документа, заголовков и таблиц. Здесь также есть возможность создать новый профиль. 

*   **`profilesStore`**: Используется для управления профилями.
*   **`editorStore`**: Используется для настройки debounce задержки.

### [ProfileSidebar.vue](<../../frontend/src/components/styles/ProfileSidebar.vue>)

Боковая панель для управления профилями. Отображает список профилей, позволяет выбрать активный профиль, создать новый и управлять их базовыми настройками. Это основной интерфейс для навигации по профилям стилей.

### [NestedTabs.vue](<../../frontend/src/components/styles/NestedTabs.vue>)

Рекурсивный компонент, который отображает структуру вкладок стилей на основе `STYLE_TAB_TREE` из [`frontend/src/config/styleFields.ts`](../../frontend/src/config/styleFields.ts). Он позволяет организовывать поля стилей во вложенные группы для удобства навигации.

*   Принимает `nodes` (узлы дерева вкладок), `styles` (текущие значения стилей), `units` (выбранные единицы измерения) и `context` (контекст для конвертации единиц).
*   Передает события `field-change` и `unit-change` наверх.

### [StyleForm.vue](<../../frontend/src/components/styles/StyleForm.vue>)

Компонент, который рендерит набор полей для одного элемента стиля (например, параграфа или страницы). Он использует `StyleFieldInput` для отображения каждого отдельного поля.

*   Принимает `elementKey` (ключ элемента), `fields` (определения полей из `styleFields.ts`), `values` (текущие значения) и `hasTextOverride` (флаг наличия переопределения текстового стиля).
*   Обрабатывает включение/выключение `text_override` и передает изменения полей через события.

### [StyleFieldInput.vue](<../../frontend/src/components/styles/StyleFieldInput.vue>)

Базовый компонент для отображения и редактирования одного поля стиля. Он динамически выбирает тип элемента управления (числовой ввод, переключатель, текстовое поле, выпадающий список, ввод маркеров) в зависимости от `field.type`.

*   Поддерживает конвертацию единиц измерения через `UnitInput` для числовых полей.
*   Использует `context` для правильной конвертации значений, зависящих от других стилей (например, `em` зависит от `font_size` документа).

### [UnitInput.vue](<../../frontend/src/components/styles/UnitInput.vue>)

Компонент для ввода числовых значений с поддержкой выбора единиц измерения. Он автоматически конвертирует значения между миллиметрами, сантиметрами, дюймами, пунктами и `em`.

*   Использует `unitConversion.ts` для логики конвертации.
*   Позволяет пользователю выбирать единицу отображения.

## Компосаблы

### [useStyleEditor](<../../frontend/src/composables/useStyleEditor.ts>)

Основной композиционный хук для управления состоянием и логикой редактора стилей.

*   **`styles`**: Ref-объект, содержащий текущие значения всех стилей для активного профиля.
*   **`loading`**: Флаг загрузки стилей.
*   **`saving`**, **`saveStatus`**: Флаги, отражающие статус сохранения изменений на Backend.
*   **`loadAll(id: number)`**: Асинхронная функция для загрузки всех стилей профиля с Backend.
*   **`updateField(elementKey: ElementType, field: string, value: unknown, persist = true)`**: Обновляет локальное состояние стиля и, если `persist` равно `true`, планирует асинхронное сохранение изменения на Backend с дебаунсом.
*   **`schedulePersist`**, **`persistField`**: Внутренние функции для управления отложенным сохранением изменений (дебаунс для предотвращения слишком частых запросов к API).

### [`useStyles.ts`](../../frontend/src/composables/useStyles.ts)

Содержит **клиентскую** сборку строки преамбулы из DTO стилей (`buildTypstPreamble`, `loadProfileStyles` через пачку `GET` по каждому элементу). **В прод-потоке превью и PDF** итоговая преамбула приходит с сервера: [`profilesStore.loadProfileStyles`](../../frontend/src/stores/profiles.ts) → `GET /profiles/{id}/preamble` → [`app/utils/typst_preamble.py`](../../app/utils/typst_preamble.py). Клиентский `useStyles` оставлен как слой, повторяющий Typst-логику на TypeScript (эксперименты, тесты, обход API); при смене правил генерации **источник истины** — Python-преамбула, см. [Поток преамбулы](../DocumentProcessing/TypstPreambleFlow.md).

## Конфигурация полей стилей (`styleFields.ts`)

Исходник: [`frontend/src/config/styleFields.ts`](../../frontend/src/config/styleFields.ts). Это **слой UI**, а не дубль backend-дефолтов ([Constants.md](../Constants.md) — канон в мм на сервере).

| Экспорт / конструкция | Роль |
|----------------------|------|
| `STYLE_TAB_TREE` | Дерево вкладок и секций (страница, документ, `heading_1`…`heading_6`, списки, таблица, рисунок, terms, outline, …) и набор `fields` на листе. |
| `FieldDef` | Тип поля: `number` / `boolean` / `string` / `select` / `markers`, min/max/step, `unit`, `allowedUnits` для [UnitInput](UnitConversion.md). |
| `TEXT_OVERRIDE_FIELDS` | Поля, показываемые при «Задать свой стиль для текста». |
| `collectElementKeys(STYLE_TAB_TREE)` | Собирает все `elementKey` — нужен `useStyleEditor` для пакетной загрузки стилей по API. |
| `isMmConvertibleField`, `getAllowedUnits` | Какие числовые поля подлежат конвертации между мм/em/pt и т.д. (исключения: `font_size`, `tracking`, `word_spacing`, проценты). |
| `TITLE_TEXT_DEFAULTS`, `VARIABLE_ALIGN_OPTIONS` | Дефолты и опции, специфичные для титульной разметки в UI. |

Где подключается: [`Styles.vue`](../../frontend/src/views/Styles.vue) передаёт дерево в `NestedTabs`; [`useStyleEditor.ts`](../../frontend/src/composables/useStyleEditor.ts) вызывает `collectElementKeys` при загрузке; [`StyleForm.vue`](../../frontend/src/components/styles/StyleForm.vue) использует `TEXT_OVERRIDE_FIELDS` для оверрайдов.

Далее: [Конвертация единиц измерения](UnitConversion.md)