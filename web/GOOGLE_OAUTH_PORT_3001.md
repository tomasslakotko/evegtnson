# Решение ошибки Google OAuth - Порт 3001

## ⚠️ ВАЖНО: Вы используете порт 3001, а не 3000!

Все настройки должны использовать порт **3001**.

### 1. Обновите .env файл

```env
NEXTAUTH_URL=http://localhost:3001
```

### 2. Обновите Google Cloud Console

В **Authorized JavaScript origins** добавьте:
```
http://localhost:3001
```

В **Authorized redirect URIs** добавьте:
```
http://localhost:3001/api/auth/callback/google
```

### 3. Перезапустите сервер

После изменения `.env`:
```bash
# Остановите сервер (Ctrl+C)
npm run dev
```

### 4. Проверьте Test Users

Если приложение в тестовом режиме:
- APIs & Services → OAuth consent screen → Test users
- Добавьте ваш email

## После этих изменений должно заработать! ✅

