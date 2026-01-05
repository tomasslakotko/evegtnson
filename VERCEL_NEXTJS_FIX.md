# Решение: No Next.js version detected

## Проблема
Vercel не может найти Next.js, хотя он установлен.

## Решение

### 1. Убедитесь, что Root Directory настроен в Vercel UI:

**ОБЯЗАТЕЛЬНО** сделайте это:
1. Vercel Dashboard → ваш проект → **Settings** → **General**
2. Найдите **"Root Directory"**
3. Нажмите **"Edit"**
4. Введите: `web`
5. **Сохраните**

### 2. Упростите vercel.json:

Я уже упростил `vercel.json` - теперь Vercel будет автоматически определять настройки Next.js.

### 3. Пересоберите проект:

После настройки Root Directory:
- Vercel автоматически пересоберет
- Или вручную: **Deployments** → **Redeploy**

## Важно:

**Root Directory ДОЛЖЕН быть настроен в UI Vercel!** 

Без этого Vercel не знает, где искать `package.json` и `next.config.ts`.

После настройки Root Directory на `web`, Vercel:
- ✅ Найдет `web/package.json`
- ✅ Найдет Next.js в зависимостях
- ✅ Соберет проект правильно

## Если проблема осталась:

1. Проверьте, что в `web/package.json` есть `"next"` в `dependencies`
2. Убедитесь, что Root Directory точно установлен на `web` (без слеша в конце)
3. Проверьте логи сборки в Vercel

