# Обработка ошибок на Backend

Backend приложения обрабатывает различные типы ошибок, возникающие в процессе работы API и взаимодействия с внешними утилитами. Основной механизм обработки ошибок базируется на исключениях FastAPI `HTTPException` и кастомных исключениях для внешних процессов.

## `HTTPException`

Для обработки стандартных ошибок HTTP (таких как 400 Bad Request, 404 Not Found, 500 Internal Server Error) используется встроенный класс FastAPI [`HTTPException`](https://fastapi.tiangolo.com/tutorial/handling-errors/#http-exceptions). Он позволяет возвращать клиенту стандартизированные JSON-ответы с кодом состояния и детальным сообщением.

**Примеры использования:**

*   **404 Not Found:**
    ```python
    if profile is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    ```
    Это исключение выбрасывается, если запрашиваемый ресурс (профиль, титульная страница, изображение) не найден в базе данных.

*   **400 Bad Request:**
    ```python
    if not content.strip():
        raise HTTPException(status_code=400, detail="Empty Markdown file")
    ```
    Возникает при неверных входных данных, например, при пустом файле Markdown или неподдерживаемом расширении файла при загрузке.

*   **413 Payload Too Large:**
    ```python
    if len(content) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")
    ```
    Возникает при попытке загрузить файл, превышающий максимально допустимый размер.

*   **500 Internal Server Error:**
    ```python
    except PandocError as e:
        logger.exception("Pandoc failed: %s", e.stderr)
        raise HTTPException(status_code=500, detail="Markdown conversion failed") from e
    ```
    Выбрасывается при внутренних ошибках сервера, например, если Pandoc или Typst не смогли выполнить свою задачу. Детали внутренней ошибки часто логируются для отладки (`logger.exception`).

## Кастомные исключения для внешних утилит

Для ошибок, возникающих при работе с внешними CLI-утилитами (Pandoc, Typst), определены кастомные исключения, которые инкапсулируют специфичную для утилиты информацию (например, вывод `stderr`). Эти исключения затем перехватываются и преобразуются в `HTTPException` для возврата клиенту.

*   **`PandocError`** ([`app/utils/pandoc_converter.py`](../../app/utils/pandoc_converter.py))
    Возникает, когда утилита Pandoc завершается с ошибкой или превышает время ожидания. Содержит поле `stderr` с подробностями ошибки из вывода Pandoc.

    ```python
    class PandocError(Exception):
        def __init__(self, message: str, stderr: str = "") -> None:
            self.stderr = stderr
            super().__init__(message)
    ```

*   **`TypstCompileError`** ([`app/utils/typst_compiler.py`](../../app/utils/typst_compiler.py))
    Аналогично `PandocError`, это исключение возникает, если компилятор Typst возвращает ошибку или превышает лимит времени. Также содержит поле `stderr`.

    ```python
    class TypstCompileError(Exception):
        def __init__(self, message: str, stderr: str = "") -> None:
            self.stderr = stderr
            super().__init__(message)
    ```

## Логирование

Backend использует стандартный модуль `logging` для записи информации об ошибках. Важные ошибки (например, ошибки компиляции Typst или Pandoc) логируются с уровнем `exception`, что позволяет отслеживать их в системных логах.

```python
import logging
logger = logging.getLogger(__name__)
# ...
logger.exception("Pandoc failed: %s", e.stderr)
```

Далее: [Обзор Frontend](../Frontend/Overview.md)