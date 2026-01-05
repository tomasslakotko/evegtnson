# Google Calendar Integration Setup Guide

## Шаг 1: Настройка Google Cloud Console

### 1.1 Создание проекта
1. Перейдите на https://console.cloud.google.com/
2. Войдите в свой Google аккаунт
3. Нажмите на выпадающий список проектов (вверху слева)
4. Нажмите "New Project"
5. Введите название проекта (например: "BookTheCall")
6. Нажмите "Create"

### 1.2 Включение Google Calendar API
1. В меню слева выберите "APIs & Services" > "Library"
2. В поиске введите "Google Calendar API"
3. Нажмите на "Google Calendar API"
4. Нажмите кнопку "Enable"

### 1.3 Создание OAuth 2.0 Credentials
1. Перейдите в "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth client ID"
3. Если появится запрос на настройку OAuth consent screen:
   - Выберите "External" (если планируете публичное использование)
   - Заполните обязательные поля:
     - App name: BookTheCall
     - User support email: ваш email
     - Developer contact: ваш email
   - Нажмите "Save and Continue"
   - На шаге "Scopes" нажмите "Add or Remove Scopes"
   - Найдите и добавьте:
     - `https://www.googleapis.com/auth/calendar` (полный доступ к календарю)
     - `https://www.googleapis.com/auth/calendar.events` (доступ к событиям)
   - Нажмите "Update" и "Save and Continue"
   - На шаге "Test users" добавьте свой email (для тестирования)
   - Нажмите "Save and Continue"
4. Вернитесь в "Credentials" и нажмите "Create Credentials" > "OAuth client ID"
5. Выберите "Web application"
6. Введите название (например: "BookTheCall Web Client")
7. В "Authorized JavaScript origins" добавьте:
   - `http://localhost:3000` (для разработки)
   - `https://yourdomain.com` (для продакшена)
8. В "Authorized redirect URIs" добавьте:
   - `http://localhost:3000/api/auth/callback/google` (для разработки)
   - `https://yourdomain.com/api/auth/callback/google` (для продакшена)
9. Нажмите "Create"
10. **ВАЖНО**: Скопируйте "Client ID" и "Client secret" - они понадобятся для .env файла

## Шаг 2: Установка зависимостей

```bash
cd web
npm install googleapis
```

## Шаг 3: Настройка переменных окружения

Добавьте в файл `.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth URL (для redirect)
NEXTAUTH_URL=http://localhost:3000
# Для продакшена: NEXTAUTH_URL=https://yourdomain.com
```

## Шаг 4: Настройка NextAuth для Google OAuth

NextAuth уже настроен, но нужно добавить Google provider.

## Шаг 5: Функциональность

После настройки будет доступно:
- ✅ Подключение Google Calendar через OAuth
- ✅ Проверка занятости при создании бронирований
- ✅ Автоматическое создание событий в Google Calendar
- ✅ Синхронизация изменений (обновление/отмена)

## Важные замечания

1. **OAuth Consent Screen**: Для публичного использования нужно пройти верификацию Google (может занять несколько дней)
2. **Test Mode**: В режиме тестирования только добавленные пользователи могут подключить календарь
3. **Scopes**: Используем минимально необходимые права доступа
4. **Security**: Никогда не коммитьте Client Secret в git!

## Проверка работы

После настройки:
1. Перейдите в Settings > Calendar Integrations
2. Нажмите "Connect" рядом с Google Calendar
3. Войдите в Google аккаунт и разрешите доступ
4. Календарь должен подключиться

---

**Готовы начать?** Скажите, когда получите Client ID и Client Secret, и я помогу с реализацией кода!

