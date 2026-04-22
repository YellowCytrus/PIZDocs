# CI и защита main

## CI (GitHub Actions)

При каждом push и pull request в `main`/`master` запускаются:

1. **Tests** — pytest (без интеграционных pandoc/typst)
2. **Lint** — ruff check + ruff format

Postgres поднимается как service container в CI.

## Защита main — настройка в GitHub

Рекомендуемые правила **Settings → Branches → Add branch protection rule** для `main`:

| Правило | Значение | Зачем |
|---------|----------|-------|
| Require a pull request before merging | ✓ | Код только через PR |
| Require approvals | 1 | Один ревьюер |
| Require status checks to pass | ✓ | CI должен пройти |
| Require branches to be up to date | ✓ | Перед merge — rebase/merge с main |
| Require conversation resolution | ✓ | Все комментарии закрыты |
| Do not allow bypassing | ✓ | Даже админы под правилами |

## Pre-commit (локальные проверки до коммита)

Перед каждым коммитом можно запускать ruff и хукки:

```bash
pip install pre-commit
pre-commit install
```

Далее при `git commit` автоматически:
- ruff check --fix
- ruff format
- trailing whitespace, large files, merge conflicts

## Что не даёт лететь шлаку в main

1. **CI** — тесты + линтер, merge запрещён при падении
2. **Branch protection** — только через PR с ревью
3. **Pre-commit** — отсекает очевидное до push
4. **Concurrency** — новый push отменяет старый CI run
