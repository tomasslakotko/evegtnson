# Настройка Redirect URI для Google OAuth

## Проблема
Ошибка `redirect_uri_mismatch` возникает, потому что новый endpoint `/api/auth/google-account` не добавлен в Google Cloud Console.

## Решение

### Шаг 1: Откройте Google Cloud Console
1. Перейдите на https://console.cloud.google.com/
2. Выберите ваш проект
3. Перейдите в **APIs & Services** → **Credentials**

### Шаг 2: Найдите ваш OAuth 2.0 Client ID
1. Найдите ваш OAuth 2.0 Client ID (который используется для приложения)
2. Нажмите на него, чтобы открыть настройки

### Шаг 3: Добавьте Redirect URI
В разделе **Authorized redirect URIs** добавьте следующие URI:

**Для Production (Vercel):**
```
https://evegtnson.vercel.app/api/auth/google-account
```

**Для локальной разработки (если нужно):**
```
http://localhost:3000/api/auth/google-account
http://localhost:3001/api/auth/google-account
```

**Также убедитесь, что у вас есть стандартный NextAuth redirect URI:**
```
https://evegtnson.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

### Шаг 4: Сохраните изменения
1. Нажмите **Save** внизу страницы
2. Подождите несколько секунд, пока изменения применятся

### Шаг 5: Проверьте
Попробуйте снова подключить Google аккаунт в настройках профиля.

## Важно
- URI должны точно совпадать (включая протокол http/https, домен, путь)
- Не добавляйте слэш в конце: `/api/auth/google-account` (правильно), `/api/auth/google-account/` (неправильно)
- Изменения могут занять до 5 минут для применения

