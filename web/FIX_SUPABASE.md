# Решение проблемы подключения к Supabase

## Проблема
Ошибка `P1001: Can't reach database server` или `Tenant or user not found`

## ✅ Решение: Используйте правильный формат из Supabase UI

### Шаг 1: Получите правильный connection string

1. В Supabase откройте: **Settings** → **Database**
2. Найдите секцию **Connection string**
3. Выберите вкладку **Connection string** (не URI)
4. Выберите **Session mode** (для IPv4 совместимости)
5. Скопируйте **полную строку** - она должна выглядеть примерно так:
   ```
   postgresql://postgres.lhhbifimethvjtgkepyb:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

### Шаг 2: Обновите .env файл

Откройте `web/.env` и замените `DATABASE_URL` на скопированную строку:

```env
DATABASE_URL="postgresql://postgres.lhhbifimethvjtgkepyb:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

⚠️ **Важно**: Замените `[YOUR-PASSWORD]` на ваш реальный пароль (dusnoc-paVpe1-kuxjus)

### Шаг 3: Примените миграции

```bash
cd web
npx prisma migrate deploy
npx prisma generate
```

### Шаг 4: Запустите сервер

```bash
cd web
npm run dev
```

---

## Альтернатива: Transaction Pooler

Если Session Pooler не работает, попробуйте **Transaction mode**:

1. В Supabase выберите **Transaction mode** вместо Session
2. Скопируйте connection string
3. Обновите `.env`
4. Повторите шаги 3-4

---

## Если ничего не помогает

Проверьте:
1. Правильность пароля в Supabase (Settings → Database → Reset password)
2. Что проект активен (не приостановлен)
3. Что используете правильный регион (eu-central-1)

