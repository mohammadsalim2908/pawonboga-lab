-- =============================================================================
-- TekniKita — migrasi 001
-- Untuk database yang SUDAH berisi data (mis. hasil impor phpMyAdmin).
-- Jalankan SEKALI lewat phpMyAdmin → database teknikita → tab SQL,
-- atau: mysql -u teknikita -p teknikita < db/migrations/001_pricing_maps_private_categories.sql
--
-- Perubahan:
--   1. technicians.maps_url            → tautan lokasi Google Maps (opsional)
--   2. services.price_type             → fixed / starting / quote
--      services.includes_parts         → harga sudah termasuk komponen atau jasa saja
--   3. orders.price_type               → snapshot tipe harga saat pesanan dibuat
--   4. categories.owner_user_id        → kategori pribadi milik satu teknisi
-- =============================================================================

ALTER TABLE `technicians`
  ADD COLUMN `maps_url` VARCHAR(500) NOT NULL DEFAULT '' AFTER `address`;

ALTER TABLE `services`
  ADD COLUMN `price_type` ENUM('fixed','starting','quote') NOT NULL DEFAULT 'fixed' AFTER `description`,
  ADD COLUMN `includes_parts` TINYINT(1) NOT NULL DEFAULT 0 AFTER `price_type`;

ALTER TABLE `orders`
  ADD COLUMN `price_type` ENUM('fixed','starting','quote') NOT NULL DEFAULT 'fixed' AFTER `service_name`;

ALTER TABLE `categories`
  DROP INDEX `uq_categories_name`,
  ADD COLUMN `owner_user_id` INT UNSIGNED NULL AFTER `icon`,
  ADD KEY `idx_categories_name` (`name`),
  ADD KEY `idx_categories_owner` (`owner_user_id`),
  ADD CONSTRAINT `fk_categories_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- Penyesuaian data lama: layanan perbaikan/servis dianggap "mulai dari",
-- layanan yang menyebut penggantian komponen dianggap sudah termasuk komponen.
UPDATE `services`
   SET `price_type` = 'starting'
 WHERE `name` LIKE 'Perbaikan%'
    OR `name` LIKE 'Servis%'
    OR `name` LIKE 'Recovery%'
    OR `name` LIKE 'Upgrade%';

UPDATE `services`
   SET `includes_parts` = 1
 WHERE `name` LIKE 'Ganti %'
    OR `name` LIKE 'Isi Freon%';

-- Sinkronkan tipe harga pada pesanan lama dengan layanannya (jika masih tertaut).
UPDATE `orders` o
  JOIN `services` s ON s.id = o.service_id
   SET o.price_type = s.price_type;

-- Selesai.
