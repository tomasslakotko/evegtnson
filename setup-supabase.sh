#!/bin/bash

# Скрипт для настройки Supabase подключения
# Использование: ./setup-supabase.sh YOUR_PASSWORD

if [ -z "$1" ]; then
  echo "Использование: ./setup-supabase.sh YOUR_DATABASE_PASSWORD"
  echo "Пример: ./setup-supabase.sh mySecurePassword123"
  exit 1
fi

PASSWORD=$1

# URL encode password to handle special characters
if command -v python3 &> /dev/null; then
  ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PASSWORD'))")
elif command -v node &> /dev/null; then
  ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent('$PASSWORD'))")
else
  # Fallback: try to escape manually
  ENCODED_PASSWORD=$(echo "$PASSWORD" | sed 's/@/%40/g; s/#/%23/g; s/\$/%24/g; s/&/%26/g; s/+/%2B/g; s/=/%3D/g; s/?/%3F/g')
fi

# Use Session Pooler (IPv4 compatible) - recommended
# Format: postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
CONNECTION_STRING="postgresql://postgres.lhhbifimethvjtgkepyb:${ENCODED_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require"

cd "$(dirname "$0")/web"

# Backup existing .env
if [ -f .env ]; then
  cp .env .env.backup
  echo "✅ Создан backup: .env.backup"
fi

# Update DATABASE_URL in .env
if [ -f .env ]; then
  # Remove old DATABASE_URL line
  grep -v "^DATABASE_URL" .env > .env.tmp
  # Add new DATABASE_URL
  echo "DATABASE_URL=\"${CONNECTION_STRING}\"" >> .env.tmp
  mv .env.tmp .env
else
  # Create new .env file
  cat > .env << EOF
DATABASE_URL="${CONNECTION_STRING}"
NEXTAUTH_SECRET="supersecret"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
EOF
fi

echo "✅ Обновлен .env файл с connection string (Session Pooler)"
echo ""
echo "📦 Применяю миграции к базе данных..."

# Apply migrations
cd "$(dirname "$0")/web"
npx prisma migrate deploy
npx prisma generate

echo ""
echo "✅ Готово! Теперь запустите: cd web && npm run dev"
