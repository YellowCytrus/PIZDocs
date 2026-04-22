# Управление стилями на Backend

Backend играет центральную роль в управлении стилями документов, обеспечивая их хранение, обновление и применение при генерации Typst-преамбул и PDF. Система управления стилями построена на базе SQLAlchemy ORM для взаимодействия с базой данных и Pydantic для валидации данных.

## Модели стилей

*   **SQLAlchemy ORM-модели** ([`app/models/sqlalchemy/styles/`](../../app/models/sqlalchemy/styles/))
    Определяют структуру хранения стилей в базе данных. Для каждого типа элемента документа (например, `ParStyle`, `DocumentStyle`, `PageStyle`) существует отдельная таблица. Это обеспечивает гибкость и расширяемость.

    *   `TextOverrideStyle` ([`app/models/sqlalchemy/styles/base.py`](../../app/models/sqlalchemy/styles/base.py)): Специальная модель для хранения подробных переопределений текстовых стилей (шрифт, размер, цвет и т.д.), на которую могут ссылаться другие стилевые модели.

*   **Pydantic-модели** ([`app/models/pydantic/`](../../app/models/pydantic/))
    Используются для валидации данных, приходящих во входящих API-запросах, а также для формирования ответов. Для каждого стиля элемента существуют Pydantic-модели для создания/полной замены (`*Styles`) и для частичного обновления (`*StylesUpdate`).

    *   Примеры: [`app/models/pydantic/par.py`](../../app/models/pydantic/par.py) для стилей параграфов, [`app/models/pydantic/page.py`](../../app/models/pydantic/page.py) для стилей страниц.

## Репозитории

*   **`StyleRepository`** ([`app/repositories/style_repository.py`](../../app/repositories/style_repository.py))
    Предоставляет общий интерфейс для операций CRUD (Create, Read, Update, Delete) для любой ORM-модели стиля, связанной с `Profile` через `profile_id`. Это позволяет переиспользовать логику доступа к данным для всех типов стилей.

## Дескрипторы элементов

*   **`ElementDescriptor`** ([`app/api/elements/common.py`](../../app/api/elements/common.py))
    Определяет метаданные для каждого типа элемента документа, включая его ORM-модель, Pydantic-схемы, путь в URL и тег API.

    ```python
    @dataclass(frozen=True)
    class ElementDescriptor(Generic[TModel, TStyles, TStylesUpdate]):
        orm_model: type[TModel]
        path: str
        tag: str
        styles_model: type[TStyles]
        styles_update_model: type[TStylesUpdate]
        not_found_detail: str
    ```

*   **`ELEMENT_DESCRIPTORS`** ([`app/api/elements/descriptors.py`](../../app/api/elements/descriptors.py))
    Централизованный список всех `ElementDescriptor`'ов, который используется для автоматической генерации API-роутеров для управления стилями элементов.

## Фабрика роутеров элементов

*   **`create_element_router`** ([`app/api/elements/factory.py`](../../app/api/elements/factory.py))
    Функция-фабрика, которая на основе `ElementDescriptor` генерирует полный набор CRUD API-эндпоинтов (POST, GET, PATCH, PUT) для каждого типа элемента. Это значительно сокращает количество бойлерплейт-кода.

## Обработка `text_override`

*   **`apply_text_override`** ([`app/api/elements/text_override.py`](../../app/api/elements/text_override.py))
    Вспомогательная функция, которая управляет жизненным циклом `TextOverrideStyle`. Она отвечает за создание, обновление или удаление `TextOverrideStyle` в зависимости от входящих данных и связывает его с родительским стилем элемента.

## Как это работает

Когда Frontend отправляет запрос на изменение стиля элемента (например, `PATCH /profiles/{profile_id}/par`), происходит следующее:

1.  **Маршрутизация:** FastAPI маршрутизирует запрос к соответствующему сгенерированному роутеру (из `factory.py`).
2.  **Валидация:** Pydantic-модель (`ParStylesUpdate` в случае `par`) валидирует входящие данные.
3.  **Получение/создание стиля:** `StyleRepository` извлекает существующий стиль из БД или создает его, если он отсутствует.
4.  **Применение `text_override`:** Если в запросе присутствует `text_override`, `apply_text_override` обновляет или создает `TextOverrideStyle`.
5.  **Обновление полей:** Остальные поля стиля обновляются непосредственно в ORM-модели.
6.  **Сохранение:** Изменения сохраняются в БД через сессию SQLAlchemy.
7.  **Ответ:** Обновленный объект стиля возвращается Frontend.

Далее: [Интеграция с Typst](TypstIntegration.md)