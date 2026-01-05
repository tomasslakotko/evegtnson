# Исправление ошибки vercel.json

## Проблема
Ошибка: `should NOT have additional property 'rootDirectory'`

## Решение

`rootDirectory` нельзя указывать в `vercel.json`. Его нужно настроить через UI Vercel.

### Шаги:

1. **Удалите vercel.json** (уже исправлено) или используйте упрощенную версию без `rootDirectory`

2. **Настройте Root Directory в Vercel UI**:
   - Перейдите в ваш проект на Vercel
   - Settings → General
   - Найдите "Root Directory"
   - Нажмите "Edit"
   - Введите: `web`
   - Сохраните

3. **Пересоберите проект**:
   - Deployments → последний деплой → Redeploy

После этого проект должен собраться успешно!

