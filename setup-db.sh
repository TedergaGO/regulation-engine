#!/bin/bash
# ── Regulation Engine — DB Kurulum Script'i ────────────────────────────────────
# Kullanım: bash setup-db.sh
# PostgreSQL şifrenizi girin, rest otomatik yapılır.

PSQL="/Library/PostgreSQL/17/bin/psql"
CREATEDB="/Library/PostgreSQL/17/bin/createdb"
PGHOST="127.0.0.1"
PGPORT="5432"
PGUSER="postgres"
DBNAME="regulation_engine"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Regülasyon Motoru — PostgreSQL Kurulum                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# PostgreSQL şifresini al
read -s -p "PostgreSQL 'postgres' kullanıcısı şifresi: " PGPASSWORD
echo ""
export PGPASSWORD

# Bağlantıyı test et
echo "[1/4] PostgreSQL bağlantısı test ediliyor..."
if ! $PSQL -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "❌ Bağlantı başarısız. Şifre veya bağlantı ayarlarını kontrol edin."
  exit 1
fi
echo "✅ Bağlantı başarılı"

# Veritabanını oluştur
echo "[2/4] Veritabanı oluşturuluyor: $DBNAME"
if $PSQL -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" -lqt | cut -d \| -f 1 | grep -qw "$DBNAME"; then
  echo "ℹ️  Veritabanı zaten mevcut, atlanıyor"
else
  $CREATEDB -U "$PGUSER" -h "$PGHOST" -p "$PGPORT" "$DBNAME"
  echo "✅ Veritabanı oluşturuldu"
fi

# .env'e şifreyi yaz
echo "[3/4] .env dosyası güncelleniyor..."
ENV_FILE="$(dirname "$0")/.env"
if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
  # macOS sed (BSD) uyumlu
  sed -i '' "s|^DB_PASSWORD=.*|DB_PASSWORD=$PGPASSWORD|" "$ENV_FILE"
else
  echo "DB_PASSWORD=$PGPASSWORD" >> "$ENV_FILE"
fi
echo "✅ DB_PASSWORD .env'e yazıldı"

# Seed çalıştır
echo "[4/4] Seed verisi yükleniyor (standartlar + kontroller + admin kullanıcı)..."
cd "$(dirname "$0")"
DB_PASSWORD="$PGPASSWORD" npx ts-node db/seeds/seed.ts
if [ $? -eq 0 ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  ✅ Kurulum tamamlandı!                                  ║"
  echo "╠══════════════════════════════════════════════════════════╣"
  echo "║  Giriş bilgileri:                                        ║"
  echo "║    Kullanıcı adı : admin                                 ║"
  echo "║    Şifre         : Admin@2024!                           ║"
  echo "╠══════════════════════════════════════════════════════════╣"
  echo "║  Uygulamayı başlatmak için:                              ║"
  echo "║    npm run dev                                           ║"
  echo "║  Adres:                                                  ║"
  echo "║    http://localhost:3000/regulation-engine               ║"
  echo "╚══════════════════════════════════════════════════════════╝"
else
  echo "❌ Seed hatası. Log'ları kontrol edin."
  exit 1
fi
