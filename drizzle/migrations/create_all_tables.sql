-- =====================================================
-- AutoMarket AI - CREATE ALL TABLES (PostgreSQL)
-- =====================================================
-- Script completo para criar toda a estrutura do banco
-- Seguindo especificações do PRD
-- Sintaxe PostgreSQL
-- =====================================================

-- Criar ENUMS primeiro
CREATE TYPE role_enum AS ENUM ('user', 'admin', 'store_owner');
CREATE TYPE transmission_enum AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT');
CREATE TYPE fuel_enum AS ENUM ('FLEX', 'GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID');
CREATE TYPE car_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'BANNED');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE import_job_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Tabela: users (usuários do sistema)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role role_enum NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "openId_idx" ON users("openId");

-- Tabela: profiles (perfis estendidos dos usuários)
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  "fullName" TEXT NOT NULL,
  "avatarUrl" TEXT,
  phone VARCHAR(20),
  location JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: stores (lojas)
CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  "ownerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  "logoUrl" TEXT,
  document VARCHAR(20) NOT NULL,
  "apiKey" VARCHAR(64) NOT NULL UNIQUE,
  "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS owner_idx ON stores("ownerId");
CREATE INDEX IF NOT EXISTS slug_idx ON stores(slug);

-- Tabela: cars (anúncios de veículos)
CREATE TABLE IF NOT EXISTS cars (
  id SERIAL PRIMARY KEY,
  "sellerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "storeId" INTEGER REFERENCES stores(id) ON DELETE SET NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  version VARCHAR(100) NOT NULL,
  "yearFab" INTEGER NOT NULL,
  "yearModel" INTEGER NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  mileage INTEGER NOT NULL,
  transmission transmission_enum NOT NULL,
  fuel fuel_enum NOT NULL,
  color VARCHAR(50) NOT NULL,
  description TEXT,
  features JSONB,
  status car_status_enum NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS seller_idx ON cars("sellerId");
CREATE INDEX IF NOT EXISTS store_idx ON cars("storeId");
CREATE INDEX IF NOT EXISTS status_idx ON cars(status);
CREATE INDEX IF NOT EXISTS brand_model_idx ON cars(brand, model);
CREATE INDEX IF NOT EXISTS price_idx ON cars(price);
CREATE INDEX IF NOT EXISTS year_idx ON cars("yearModel");

-- Tabela: car_photos (fotos dos veículos)
CREATE TABLE IF NOT EXISTS car_photos (
  id SERIAL PRIMARY KEY,
  "carId" INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  urls JSONB NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS car_idx ON car_photos("carId");
CREATE INDEX IF NOT EXISTS order_idx ON car_photos("carId", "orderIndex");

-- Tabela: messages (mensagens entre usuários)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  "carId" INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "receiverId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS msg_car_idx ON messages("carId");
CREATE INDEX IF NOT EXISTS sender_idx ON messages("senderId");
CREATE INDEX IF NOT EXISTS receiver_idx ON messages("receiverId");
CREATE INDEX IF NOT EXISTS conversation_idx ON messages("carId", "senderId", "receiverId");

-- Tabela: reviews (avaliações de vendedores)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  "sellerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "reviewerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "carId" INTEGER REFERENCES cars(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("sellerId", "reviewerId", "carId")
);

CREATE INDEX IF NOT EXISTS review_seller_idx ON reviews("sellerId");
CREATE INDEX IF NOT EXISTS reviewer_idx ON reviews("reviewerId");

-- Tabela: transactions (transações e propostas)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  "carId" INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  "buyerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "sellerId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "proposedPrice" NUMERIC(12, 2),
  status transaction_status_enum NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS trans_car_idx ON transactions("carId");
CREATE INDEX IF NOT EXISTS buyer_idx ON transactions("buyerId");
CREATE INDEX IF NOT EXISTS trans_seller_idx ON transactions("sellerId");
CREATE INDEX IF NOT EXISTS trans_status_idx ON transactions(status);

-- Tabela: bulk_import_jobs (jobs de importação em massa)
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
  id SERIAL PRIMARY KEY,
  "storeId" INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  status import_job_status_enum NOT NULL DEFAULT 'PENDING',
  "totalRecords" INTEGER NOT NULL,
  "processedRecords" INTEGER NOT NULL DEFAULT 0,
  "failedRecords" INTEGER NOT NULL DEFAULT 0,
  "errorLog" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS job_store_idx ON bulk_import_jobs("storeId");
CREATE INDEX IF NOT EXISTS job_status_idx ON bulk_import_jobs(status);

-- Confirmar conclusão
SELECT 'Todas as tabelas foram criadas com sucesso!' AS status;
