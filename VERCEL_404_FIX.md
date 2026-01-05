# Решение ошибки 404 NOT_FOUND на Vercel

## Проблема
Ошибка `404: NOT_FOUND` на Vercel обычно возникает из-за неправильной настройки Root Directory.

## Решение

### Вариант 1: Через Vercel Dashboard (Рекомендуется)

1. Перейдите в ваш проект на Vercel
2. Settings → General
3. Найдите раздел **"Root Directory"**
4. Нажмите **"Edit"**
5. Введите: `web`
6. Сохраните изменения
7. Перейдите в **Deployments**
8. Нажмите на последний деплой → **"Redeploy"**

### Вариант 2: Через vercel.json (Уже добавлен)

Файл `vercel.json` уже создан в корне проекта. После пуша на GitHub:

1. Vercel автоматически обнаружит конфигурацию
2. Или перейдите в Settings → General → Root Directory и убедитесь, что указано `web`

## Проверка настроек

Убедитесь, что в Vercel:
- ✅ **Root Directory**: `web`
- ✅ **Framework Preset**: Next.js
- ✅ **Build Command**: `npm run build` (или оставьте по умолчанию)
- ✅ **Output Directory**: `.next` (или оставьте по умолчанию)
- ✅ **Install Command**: `npm install` (или оставьте по умолчанию)

## После исправления

1. Vercel автоматически пересоберет проект
2. Дождитесь завершения деплоя
3. Проверьте, что сайт работает

## Если проблема осталась

1. Проверьте логи сборки в Vercel Dashboard → Deployments → последний деплой → Build Logs
2. Убедитесь, что все environment variables установлены
3. Проверьте, что `package.json` находится в папке `web`

