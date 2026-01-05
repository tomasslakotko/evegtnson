# КРИТИЧЕСКИ ВАЖНО: Настройка Root Directory в Vercel

## Проблема
Vercel не может найти `package.json`, потому что он в папке `web`, а не в корне.

## Решение (ОБЯЗАТЕЛЬНО!)

### Настройте Root Directory в Vercel UI:

1. **Откройте Vercel Dashboard**: https://vercel.com
2. **Выберите ваш проект**: `evegtnson`
3. **Перейдите в Settings** → **General**
4. **Найдите раздел "Root Directory"**
5. **Нажмите "Edit"**
6. **Введите**: `web`
7. **Нажмите "Save"**

### После этого:

- Vercel автоматически пересоберет проект
- Или вручную: **Deployments** → **Redeploy**

## Почему это важно?

Без настройки Root Directory Vercel ищет файлы в корне репозитория, но ваш Next.js проект находится в папке `web/`. 

После настройки Root Directory на `web`, Vercel будет:
- Искать `package.json` в `web/package.json` ✅
- Выполнять команды из папки `web/` ✅
- Собирать проект правильно ✅

## Альтернатива (если Root Directory не работает):

Можно переместить все файлы из `web/` в корень, но это потребует больших изменений в структуре проекта.

**Рекомендуется**: Настроить Root Directory в UI Vercel.

