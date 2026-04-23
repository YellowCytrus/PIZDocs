# Константы в кодовой базе

В проекте вынесены **канонические значения по умолчанию** и **вспомогательные шаблоны** для генерации Typst, чтобы:

- единообразно инициализировать Pydantic-схемы и SQLAlchemy-модели;
- не дублировать магические числа в `typst_preamble.py` и тестах;
- явно документировать соответствие «legacy» единиц (pt/em) и **миллиметров (mm)** как хранимой единицы в API/БД.

## Значения по умолчанию стилей (`app/models/constants/`)

Модуль [`app/models/constants/style_defaults.py`](../../app/models/constants/style_defaults.py) задаёт **численные дефолты** для полей стилей. Все длины здесь заданы в **мм** — это каноническая единица хранения на backend (см. [Управление стилями](Backend/StyleManagement.md), [Конвертация единиц](Frontend/UnitConversion.md)).

Имена констант отражают смысл (например, `PAGE_MARGIN_MM_DEFAULT`, `PAR_SPACING_MM_DEFAULT`). В комментариях к константам указано, от какого «legacy» выражения в pt/em получено значение, чтобы проще отслеживать миграции схемы.

## Typst-преамбула (`app/utils/constants/`)

Модуль [`app/utils/constants/typst_preamble_constants.py`](../../app/utils/constants/typst_preamble_constants.py) содержит вещи, не относящиеся к числовым дефолтам стилей, а к **генерации Typst-строк**:

- `HEADING_UNNUMBERED_LEFT_OUTDENT` — компенсация визуального сдвига при отключённой нумерации заголовков;
- `CAPTION_PLACEHOLDER_RE` — шаблон плейсхолдеров в подписях к рисункам;
- `FONT_ALIASES` — подстановка имён шрифтов, которых может не быть в окружении Typst, на встроенные семейства.

Связь с потоком данных: [Интеграция с Typst](Backend/TypstIntegration.md), [Поток преамбулы](DocumentProcessing/TypstPreambleFlow.md).

## Где смотреть дальше

- [Архитектура](Architecture.md) — как backend и frontend согласованы по стилям.
- [База данных](Backend/Database.md) — как дефолты соотносятся с ORM-таблицами.
- [Конфиг полей UI](Frontend/StyleEditor.md) — `styleFields.ts` (отдельный слой: описание формы, не дефолты API).

Далее: [Оглавление](SUMMARY.md)
