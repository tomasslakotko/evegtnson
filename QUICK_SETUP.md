# Быстрая настройка Supabase

## Ваш connection string уже настроен!
**Host**: db.lhhbifimethvjtgkepyb.supabase.co

## Что нужно сделать:

### Вариант 1: Автоматический (рекомендуется)
```bash
cd "/Users/tomasslakotko/Library/Mobile Documents/com~apple~CloudDocs/bookthecall "
./setup-supabase.sh ВАШ_ПАРОЛЬ_ОТ_SUPABASE
```

### Вариант 2: Вручную
1. Откройте файл `web/.env`
2. Найдите строку с `DATABASE_URL`
3. Замените `[YOUR-PASSWORD]` на ваш реальный пароль
4. Выполните:
   ```bash
   cd web
   npx prisma migrate deploy
   npx prisma generate
   npm run dev
   ```

## Где найти пароль?
В Supabase: **Settings** → **Database** → **Database password**
(Если забыли, можно сбросить через "Reset database password")

