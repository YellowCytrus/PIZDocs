# API Backend

Данный раздел подробно описывает REST API Backend-части приложения, включая эндпоинты, их параметры, форматы запросов и ответов, а также возможные коды ошибок.

**Источник истины для схем** — OpenAPI: после запуска сервиса смотрите [Swagger UI](http://localhost:8000/docs) и [ReDoc](http://localhost:8000/redoc) (для полей Pydantic-моделей, включая единицы в мм). Локальная копия: [`docs/API.md`](../API.md) **перенесена**; там осталась только ссылка сюда.

**Единицы длины в JSON:** для большинства стилей длины хранятся и отдаются в **мм** (см. [StyleManagement.md](StyleManagement.md), [Constants.md](../Constants.md)). Фронтенд может отображать другие единицы через [UnitConversion.md](../Frontend/UnitConversion.md).

## Общая информация

*   **Базовый URL:** `/` (относительно корня сервиса)
*   **Формат запросов/ответов:** JSON, за исключением операций с файлами (Multipart/form-data для загрузки, бинарные данные для PDF).
*   **Авторизация:** В текущей версии не используется.

## Эндпоинты

### Управление профилями стилей

**Путь:** `/profiles`

*   `POST /profiles`
    *   Создает новый профиль стилей.
    *   **Запрос:** `{"name": "string"}`
    *   **Ответ:** `{"id": int, "name": "string"}`
*   `GET /profiles`
    *   Возвращает список всех профилей.
    *   **Query-параметры:** `limit` (int, default 50), `offset` (int, default 0)
    *   **Ответ:** `[{"id": int, "name": "string"}, ...]`
*   `GET /profiles/{profile_id}`
    *   Возвращает профиль по ID.
    *   **Ответ:** `{"id": int, "name": "string"}` или 404.
*   `PATCH /profiles/{profile_id}`
    *   Частично обновляет профиль.
    *   **Запрос:** `{"name": "string"}` (поле опционально)
    *   **Ответ:** Обновленный профиль или 404.
*   `DELETE /profiles/{profile_id}`
    *   Удаляет профиль и все связанные с ним стили.
    *   **Ответ:** 204 No Content или 404.

### Управление титульными страницами

**Путь:** `/title-pages`

*   `POST /title-pages`
    *   Создает новую титульную страницу.
    *   **Запрос:** `{"name": "string", "content": { ... }}` (содержимое - JSON-объект)
    *   **Ответ:** `{"id": int, "name": "string", "content": { ... }, "created_at": "datetime"}`
*   `GET /title-pages`
    *   Возвращает список всех титульных страниц.
    *   **Query-параметры:** `limit` (int, default 50), `offset` (int, default 0)
    *   **Ответ:** `[{"id": int, "name": "string", "content": { ... }, "created_at": "datetime"}, ...]`
*   `GET /title-pages/{title_page_id}`
    *   Возвращает титульную страницу по ID.
    *   **Ответ:** Титульная страница или 404.
*   `PATCH /title-pages/{title_page_id}`
    *   Частично обновляет титульную страницу.
    *   **Запрос:** `{"name": "string", "content": { ... }}` (поля опциональны)
    *   **Ответ:** Обновленная титульная страница или 404.
*   `DELETE /title-pages/{title_page_id}`
    *   Удаляет титульную страницу.
    *   **Ответ:** 204 No Content или 404.

### Загрузка изображений

**Путь:** `/upload-image`

*   `POST /upload-image`
    *   Загружает изображение в локальное хранилище проекта. Автоматически регистрирует его в БД.
    *   **Content-Type:** `multipart/form-data`
    *   **Поле формы:** `file` (файл изображения)
    *   **Ответ:** `{"id": int, "path": "images/uuid.ext"}`
    *   **Особенности:** Поддерживает `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`. Максимальный размер файла 5 MB.

### Получение и список изображений

**Путь:** `/image-assets`

*   `GET /image-assets/{asset_id}/file`
    *   Отдает файл изображения по его ID. Используется для вставки изображений в Typst-документы (URL вида `/image-assets/{id}/file`).
    *   **Ответ:** Бинарные данные изображения или 404.
*   `GET /image-assets`
    *   Возвращает список всех зарегистрированных изображений.
    *   **Ответ:** `[{"id": int, "path": "string", "original_filename": "string", "created_at": "datetime"}, ...]`

### Генерация документов

**Путь:** `/profiles/{profile_id}`

*   `GET /profiles/{profile_id}/preamble`
    *   Возвращает сгенерированный текст Typst-преамбулы для заданного профиля стилей.
    *   **Ответ:** `text/plain` (строка с Typst-кодом).
    *   **Подробнее:** [Поток преамбулы Typst](../DocumentProcessing/TypstPreambleFlow.md)
*   `POST /profiles/{profile_id}/generate-pdf`
    *   Конвертирует загруженный Markdown-файл в PDF, применяя стили профиля и опциональную титульную страницу.
    *   **Content-Type:** `multipart/form-data`
    *   **Поля формы:** `file` (Markdown-файл), `title_page_id` (int, опционально)
    *   **Ответ:** Бинарные данные PDF-файла.
    *   **Подробнее:** [Typst в PDF](../DocumentProcessing/TypstToPDF.md)
*   `POST /profiles/{profile_id}/export-typ`
    *   Конвертирует загруженный Markdown-файл в чистый исходный код Typst (без компиляции в PDF).
    *   **Content-Type:** `multipart/form-data`
    *   **Поля формы:** `file` (Markdown-файл), `title_page_id` (int, опционально)
    *   **Ответ:** `text/plain` (строка с Typst-кодом).

### Управление стилями элементов

**Путь:** `/profiles/{profile_id}/{element_type}`

Для каждого типа элемента (`bullet_list`, `document`, `figure`, `footnote`, `heading`, `heading_level`, `numbered_list`, `outline`, `page`, `par`, `quote`, `raw`, `table`, `terms`, `equation`) доступны следующие операции:

*   `POST /profiles/{profile_id}/{element_type}`
    *   Создаёт или полностью заменяет стили для данного элемента в профиле.
    *   **Запрос/Ответ:** Соответствует Pydantic-модели стиля элемента.
*   `GET /profiles/{profile_id}/{element_type}`
    *   Возвращает текущие стили элемента.
    *   **Ответ:** Pydantic-модель стиля элемента или 404.
*   `PATCH /profiles/{profile_id}/{element_type}`
    *   Частично обновляет стили элемента.
    *   **Запрос/Ответ:** Соответствует Pydantic-модели обновления стиля элемента (только изменяемые поля).
*   `PUT /profiles/{profile_id}/{element_type}`
    *   Полностью заменяет стили элемента (аналогично POST).
    *   **Запрос/Ответ:** Соответствует Pydantic-модели стиля элемента.

**Особенности:**

*   Для `heading_level` роутер имеет дополнительный параметр `/{level}` (от 1 до 6), например, `/profiles/{profile_id}/heading/1`.
*   Для всех стилей, поддерживающих `text_override`, можно передать JSON-объект с переопределениями текстовых стилей (размер, шрифт, цвет и т.д.).

Далее: [Потоки данных](DataFlows.md)