-- =====================================================
-- AutoMarket AI - DROP ALL TABLES (PostgreSQL)
-- =====================================================
-- ATENÇÃO: Este script apaga TODAS as tabelas e seus dados!
-- Execute apenas se tiver certeza do que está fazendo.
-- Sintaxe PostgreSQL (sem backticks)
-- =====================================================

-- =====================================================
-- TABELAS DO SCHEMA ANTIGO
-- =====================================================
DROP TABLE IF EXISTS whatsappleads CASCADE;
DROP TABLE IF EXISTS "whatsappLeads" CASCADE;
DROP TABLE IF EXISTS webhookevents CASCADE;
DROP TABLE IF EXISTS "webhookEvents" CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS local_auth CASCADE;
DROP TABLE IF EXISTS auth_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABELAS DO SCHEMA NOVO (AutoMarket AI)
-- =====================================================
DROP TABLE IF EXISTS bulk_import_jobs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS car_photos CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- =====================================================
-- SEQUENCES (PostgreSQL)
-- =====================================================
DROP SEQUENCE IF EXISTS auth_tokens_id_seq CASCADE;
DROP SEQUENCE IF EXISTS images_id_seq CASCADE;
DROP SEQUENCE IF EXISTS local_auth_id_seq CASCADE;
DROP SEQUENCE IF EXISTS profiles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS tenants_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_id_seq CASCADE;
DROP SEQUENCE IF EXISTS vehicles_id_seq CASCADE;
DROP SEQUENCE IF EXISTS "webhookEvents_id_seq" CASCADE;
DROP SEQUENCE IF EXISTS webhooks_id_seq CASCADE;
DROP SEQUENCE IF EXISTS "whatsappLeads_id_seq" CASCADE;

-- =====================================================
-- ENUMS (PostgreSQL)
-- =====================================================
DROP TYPE IF EXISTS profile_role_enum CASCADE;
DROP TYPE IF EXISTS role_enum CASCADE;
DROP TYPE IF EXISTS transmission_enum CASCADE;
DROP TYPE IF EXISTS fuel_enum CASCADE;
DROP TYPE IF EXISTS car_status_enum CASCADE;
DROP TYPE IF EXISTS transaction_status_enum CASCADE;
DROP TYPE IF EXISTS import_job_status_enum CASCADE;

-- Confirmar conclusão
SELECT 'Todas as tabelas (antigas e novas) foram removidas com sucesso!' AS status;
