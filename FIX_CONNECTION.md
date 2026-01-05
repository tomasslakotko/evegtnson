# Исправление проблем с подключением

## Проблема 1: Ошибка подключения к базе данных

Ошибка `P1001: Can't reach database server` может быть из-за:
- Неправильного пароля
- Использования Direct connection вместо Session Pooler (IPv4 проблема)

## ✅ Решение: Используйте Session Pooler

Я обновил скрипт `setup-supabase.sh` чтобы использовать **Session Pooler** вместо Direct connection.

### Как получить правильный connection string:

1. В Supabase перейдите: **Settings** → **Database**
2. Найдите секцию **Connection string**
3. Выберите вкладку **Connection string** (не URI)
4. Выберите **Session mode** (не Direct connection)
5. Скопируйте строку - она будет выглядеть так:
   ```
   postgresql://postgres.lhhbifimethvjtgkepyb:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

### Или используйте обновленный скрипт:

```bash
./setup-supabase.sh ВАШ_ПАРОЛЬ
```

Скрипт автоматически использует Session Pooler.

---

## Проблема 2: npm run dev не работает

Команда должна запускаться из папки `web`:

```bash
cd web
npm run dev
```

Или из корневой папки:

```bash
cd "/Users/tomasslakotko/Library/Mobile Documents/com~apple~CloudDocs/bookthecall /web"
npm run dev
```

---

## 🔧 Ручная настройка (если скрипт не работает)

1. Откройте `web/.env`
2. Замените `DATABASE_URL` на Session Pooler connection string:
   ```
   DATABASE_URL="postgresql://postgres.lhhbifimethvjtgkepyb:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"
   ```
   ⚠️ Замените `ВАШ_ПАРОЛЬ` на реальный пароль

3. Выполните:
   ```bash
   cd web
   npx prisma migrate deploy
   npx prisma generate
   npm run dev
   ```

