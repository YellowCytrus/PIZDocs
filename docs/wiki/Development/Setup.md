# Настройка проекта

## Требования

- **Backend:** Python 3.x, рекомендуется [uv](https://github.com/astral-sh/uv) или venv + pip
- **БД:** PostgreSQL (для dev — через Docker, см. ниже)
- **Внешние CLI:** `pandoc`, `typst` — нужны для полной [генерации PDF](../DocumentProcessing/TypstToPDF.md) и [интеграционных тестов](Testing.md)
- **Frontend:** Node.js, npm (см. `frontend/package.json`)

## Backend и база (Docker)

Из корня репозитория:

```bash
docker-compose up --build
```

- API: <http://localhost:8000>
- Swagger: <http://localhost:8000/docs>
- Сервис `app` при старте выполняет `alembic upgrade head`, затем `uvicorn` с hot-reload
- Монтированы: `app/`, `alembic/`, `images/`, `fonts/`

Postgres: пользователь/пароль/БД по умолчанию задаются в [`docker-compose.yml`](../../../docker-compose.yml).

## Локальная разработка без полного стека

1. Поднять только БД: `docker-compose up -d db`
2. Установить зависимости: `uv pip install -r requirements.txt` (или эквивалент)
3. Настроить переменные окружения (хост/порт Postgres) и выполнить миграции: `alembic upgrade head`
4. Запустить приложение: `uvicorn app.main:app --reload`

## Frontend

```bash
cd frontend && npm install && npm run dev
```

Vite dev-server (по умолчанию порт 5173) ожидает API на `localhost:8000` — см. [обзор фронтенда](../Frontend/Overview.md).

## Шрифты Typst

Каталог [`fonts/`](../../../fonts) в корне репозитория монтируется в контейнер как `/app/fonts`. Семейства из профиля должны разрешаться Typst; иначе генерация PDF завершится ошибкой (см. [Typst-интеграция](../Backend/TypstIntegration.md)).

## Структура репозитория (кратко)

| Путь | Назначение |
|------|------------|
| `app/` | FastAPI, модели, репозитории, утилиты (Pandoc, Typst) |
| `app/api/elements/` | Декларативные маршруты стилей по типам элементов |
| `frontend/` | Vue 3, Pinia, редактор, preview |
| `alembic/` | Миграции схемы БД |
| `tests/` | Pytest по публичному API |
| `images/` | Загруженные изображения для `image(...)` в Typst |
| `docs/wiki/` | Документация (этот раздел) |

Старый справочник `docs/DIRECTORY_HIERARCHY.md` **перенесён**; актуальное описание структуры — в этой статье и в [Архитектуре](../Architecture.md).

Далее: [Тестирование](Testing.md)
