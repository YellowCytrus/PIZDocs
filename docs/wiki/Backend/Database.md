# База данных

Backend-часть приложения использует реляционную базу данных (PostgreSQL в production, SQLite для разработки) для хранения всех данных. Взаимодействие с БД осуществляется через SQLAlchemy ORM, а управление схемой — с помощью Alembic.

## Обзор SQLAlchemy моделей

Основные модели данных определены в директории [`app/models/sqlalchemy/`](../../app/models/sqlalchemy/).

### [Profile](<../../app/models/sqlalchemy/profile.py>)

Главная сущность, представляющая профиль стилей. Связана с различными стилями элементов отношением один-к-одному или один-ко-многим.

```python
class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    # ... отношения к стилям элементов
```

### [TitlePage](<../../app/models/sqlalchemy/title_page.py>)

Модель для хранения пользовательских титульных страниц.

```python
class TitlePage(Base):
    __tablename__ = "title_pages"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    content: Mapped[dict] = mapped_column(JSONB, nullable=False) # JSONB для PostgreSQL, JSON для SQLite
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

### [ImageAsset](<../../app/models/sqlalchemy/image_asset.py>)

Модель для отслеживания загруженных изображений.

```python
class ImageAsset(Base):
    __tablename__ = "image_assets"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    path: Mapped[str] = mapped_column(String(512), unique=True, nullable=False, index=True)
    original_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
```

### Стили элементов ([`app/models/sqlalchemy/styles/`](../../app/models/sqlalchemy/styles/))

Каждый тип стиля документа (например, `ParStyle`, `HeadingStyle`, `PageStyle`) имеет свою отдельную таблицу, которая связана с `Profile` через `profile_id` (отношение один-к-одному с `unique=True`). Это позволяет гибко настраивать стили для каждого профиля. Многие стили также используют `TextOverrideMixin` и связаны с `TextOverrideStyle`.

*   **`TextOverrideStyle`** ([`app/models/sqlalchemy/styles/base.py`](../../app/models/sqlalchemy/styles/base.py)):
    Модель для переопределения текстовых стилей (шрифт, размер, цвет и т.д.), которая может быть привязана к различным элементам. Это позволяет более детально настраивать внешний вид текста для конкретных частей документа, например, для параграфов или заголовков.

Примеры моделей стилей:

*   **`DocumentStyle`** ([`app/models/sqlalchemy/styles/block_styles.py`](../../app/models/sqlalchemy/styles/block_styles.py)):
    Определяет базовые стили документа, такие как размер шрифта, межстрочный интервал.

    ```python
    class DocumentStyle(Base):
        __tablename__ = "document_styles"
        id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
        profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
        font_size: Mapped[float] = mapped_column(Float, nullable=False, default=12.0)
        line_spacing: Mapped[float] = mapped_column(Float, nullable=False, default=DOCUMENT_LINE_SPACING_MM_DEFAULT)
        # ... другие поля
    ```

*   **`ParStyle`** ([`app/models/sqlalchemy/styles/block_styles.py`](../../app/models/sqlalchemy/styles/block_styles.py)):
    Стили для параграфов, включая отступы, межстрочный интервал и возможность переопределения текстовых стилей.

    ```python
    class ParStyle(TextOverrideMixin, Base):
        __tablename__ = "par_styles"
        id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
        profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), unique=True, nullable=False)
        spacing: Mapped[float] = mapped_column(Float, nullable=False, default=PAR_SPACING_MM_DEFAULT)
        first_line_indent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
        # ... другие поля
        text_override_style_id: Mapped[Optional[int]] = mapped_column(ForeignKey("text_override_styles.id", ondelete="SET NULL"), nullable=True)
        text_override_style: Mapped[Optional[TextOverrideStyle]] = relationship(foreign_keys=[text_override_style_id], lazy="joined")
    ```

*   **`HeadingStyle`** ([`app/models/sqlalchemy/styles/structure_styles.py`](../../app/models/sqlalchemy/styles/structure_styles.py)):
    Основные стили для заголовков (например, схема нумерации).

*   **`HeadingLevelStyle`** ([`app/models/sqlalchemy/styles/structure_styles.py`](../../app/models/sqlalchemy/styles/structure_styles.py)):
    Стили для конкретных уровней заголовков (H1-H6), с возможностью переопределения текстовых стилей и настроек поведения.

*   **`PageStyle`** ([`app/models/sqlalchemy/styles/page_style.py`](../../app/models/sqlalchemy/styles/page_style.py)):
    Стили для страниц, включая размер бумаги, поля, количество колонок и нумерацию.

## Alembic миграции

Миграции базы данных управляются с помощью [Alembic](<https://alembic.sqlalchemy.org/en/latest/>). Файлы миграций расположены в директории [`alembic/versions/`](../../alembic/versions/). Они отслеживают изменения в SQLAlchemy моделях и позволяют обновлять схему базы данных при развертывании новых версий приложения.

Примеры миграций, которые были применены:

*   `d0f63a1fa726_initial.py`: Инициализация базы данных, создание первых таблиц.
*   `add_image_assets_table.py`: Добавление таблицы `image_assets` для хранения метаданных изображений.
*   `add_figure_caption_template.py`: Добавление поля `caption_template` в `figure_styles`.
*   `add_heading_level_break_before.py`, `add_heading_level_numbering_enabled.py`: Добавление полей для управления поведением заголовков.
*   `convert_style_units_to_mm.py`, `convert_table_style_lengths_to_mm_float.py`: Миграции, связанные с конвертацией единиц измерения стилей.

**Процесс применения миграций:**

1.  Создание новой миграции: `alembic revision --autogenerate -m "Описание изменений"`.
2.  Применение миграций: `alembic upgrade head`.

Далее: [Управление стилями](StyleManagement.md)