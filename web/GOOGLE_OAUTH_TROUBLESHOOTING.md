# Решение ошибки Google OAuth "This browser or app may not be secure"

## Основные причины и решения:

### 1. ✅ Проверьте Redirect URI в Google Cloud Console

**Важно**: Redirect URI должен точно совпадать с тем, что использует NextAuth.

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Откройте ваш OAuth 2.0 Client ID
4. В разделе **"Authorized redirect URIs"** убедитесь, что указан:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
   (или `https://yourdomain.com/api/auth/callback/google` для продакшена)

5. **ВАЖНО**: Убедитесь, что нет лишних пробелов или символов!

### 2. ✅ Добавьте пользователя в Test Users

Если OAuth Consent Screen в **тестовом режиме**:

1. Перейдите в APIs & Services → OAuth consent screen
2. Прокрутите вниз до раздела **"Test users"**
3. Нажмите **"+ ADD USERS"**
4. Добавьте ваш email адрес (тот, с которым вы пытаетесь войти)
5. Сохраните

**Важно**: В тестовом режиме только добавленные пользователи могут авторизоваться!

### 3. ✅ Проверьте переменные окружения

Убедитесь, что в `.env` файле правильно указаны:

```env
GOOGLE_CLIENT_ID=ваш_client_id_без_пробелов
GOOGLE_CLIENT_SECRET=ваш_client_secret_без_пробелов
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=ваш_секретный_ключ
```

**Проверьте**:
- Нет лишних пробелов в начале/конце значений
- Нет кавычек вокруг значений (если они не нужны)
- `NEXTAUTH_URL` точно совпадает с тем, что в Google Cloud Console

### 4. ✅ Проверьте OAuth Consent Screen

1. APIs & Services → OAuth consent screen
2. Убедитесь, что заполнены все обязательные поля:
   - App name
   - User support email
   - Developer contact information
3. В разделе **Scopes** должны быть добавлены:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
4. Сохраните все изменения

### 5. ✅ Перезапустите сервер

После изменения `.env` файла:

```bash
# Остановите сервер (Ctrl+C)
# Запустите снова
npm run dev
```

### 6. ✅ Очистите кеш браузера

Иногда помогает:
- Очистить cookies для `accounts.google.com`
- Использовать режим инкогнито
- Попробовать другой браузер

### 7. ✅ Проверьте, что используете правильный URL

Убедитесь, что вы подключаетесь через тот же URL, который указан в:
- `NEXTAUTH_URL` в `.env`
- Authorized JavaScript origins в Google Cloud Console
- Authorized redirect URIs в Google Cloud Console

## Быстрая проверка:

1. ✅ Redirect URI: `http://localhost:3000/api/auth/callback/google`
2. ✅ JavaScript origin: `http://localhost:3000`
3. ✅ Email добавлен в Test users (если в тестовом режиме)
4. ✅ `.env` файл содержит правильные значения
5. ✅ Сервер перезапущен после изменений

## Если ничего не помогает:

1. Создайте новый OAuth 2.0 Client ID в Google Cloud Console
2. Убедитесь, что все настройки правильные с самого начала
3. Используйте новый Client ID и Client Secret в `.env`

