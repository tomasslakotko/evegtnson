# Куда вставить пароль от Supabase?

## ✅ Способ 1: Автоматический (проще всего)

Запустите скрипт из **корневой папки проекта** (не из папки web):

```bash
cd "/Users/tomasslakotko/Library/Mobile Documents/com~apple~CloudDocs/bookthecall "
./setup-supabase.sh ВАШ_ПАРОЛЬ_ЗДЕСЬ
```

**Пример:**
```bash
./setup-supabase.sh MyPassword123!
```

Скрипт автоматически:
- Обновит файл `web/.env`
- Применит миграции
- Настроит всё за вас

---

## ✅ Способ 2: Вручную

1. Откройте файл: `web/.env`

2. Найдите строку:
   ```
   DATABASE_URL="file:./dev.db"
   ```

3. Замените её на:
   ```
   DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@db.lhhbifimethvjtgkepyb.supabase.co:5432/postgres?sslmode=require"
   ```
   
   ⚠️ **Замените `ВАШ_ПАРОЛЬ` на реальный пароль!**

4. Сохраните файл

5. Выполните в терминале:
   ```bash
   cd web
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## 🔑 Где найти пароль?

В Supabase:
1. Откройте ваш проект
2. Перейдите: **Settings** → **Database**
3. Найдите секцию **Database password**
4. Если забыли пароль, нажмите **"Reset database password"**

---

## 📝 Пример готового .env файла:

```env
DATABASE_URL="postgresql://postgres:MyPassword123@db.lhhbifimethvjtgkepyb.supabase.co:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="supersecret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

