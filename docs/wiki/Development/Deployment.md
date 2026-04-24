# Деплой

Проект ориентирован на **контейнерный** сценарий: один `Dockerfile` для приложения и [`docker-compose.yml`](../../../docker-compose.yml) с PostgreSQL. Отдельного production-Helm-чарта в репозитории нет: типовой путь — собрать образ, поднять `db` + `app`, пробросить порт `8000`, смонтировать `fonts/`, `images/`, настроить переменные `POSTGRES_*` и миграции `alembic upgrade head` при старте (как в compose).

## Минимальный сценарий (как в README)

```bash
docker-compose up --build
```

- Backend слушает `0.0.0.0:8000` в контейнере, на хосте — `localhost:8000`
- Сеть `pizdo`, volume `postgres_data` для данных БД
- [Frontend](../Frontend/Overview.md) при локальной разработке обычно поднимается **отдельно** (Vite), а не в этом compose — в проде часто отдаётся отдельным статик-хостом или встроен разработчиком в тот же оркестратор по необходимости

## Секреты и конфиг

В репозитории пароли **по умолчанию** даны для dev (см. `docker-compose.yml`). Для реального развёртывания: вынести `POSTGRES_*` в secrets, не коммитить креды, при необходимости включить TLS на reverse proxy перед приложением.

## Health и миграции

- **Миграции:** команда `alembic upgrade head` в entrypoint `app` в compose гарантирует схему до приёма трафика
- **Healthcheck** задан у сервиса `db` (`pg_isready`); `app` ждёт `depends_on: condition: service_healthy`

## См. также

- [Настройка проекта](Setup.md) — шрифты, тома, локальный запуск
- [CI_AND_PROTECTION.md](../../CI_AND_PROTECTION.md) — публикация артефактов/проверок в PR

Далее: [Обзор раздела](Overview.md)
