-- TekniKita — skema basis data MySQL 8+
-- Dijalankan oleh `npm run db:init` (lihat db/init.js)
-- Untuk database yang sudah berjalan, gunakan file di db/migrations/.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL,
  phone         VARCHAR(32)  NOT NULL DEFAULT '',
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('admin', 'technician', 'customer') NOT NULL DEFAULT 'customer',
  status        ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_status (role, status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Kategori umum (owner_user_id NULL) dikelola admin.
-- Kategori pribadi (owner_user_id terisi) hanya terlihat & dipakai teknisi pemiliknya.
CREATE TABLE IF NOT EXISTS categories (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80) NOT NULL,
  description   VARCHAR(255) NOT NULL DEFAULT '',
  icon          VARCHAR(40) NOT NULL DEFAULT 'wrench',
  owner_user_id INT UNSIGNED NULL,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_categories_name (name),
  KEY idx_categories_owner (owner_user_id),
  CONSTRAINT fk_categories_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS technicians (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED NOT NULL,
  category_id     INT UNSIGNED NOT NULL,
  business_name   VARCHAR(140) NOT NULL,
  description     TEXT NOT NULL,
  address         VARCHAR(255) NOT NULL,
  maps_url        VARCHAR(500) NOT NULL DEFAULT '',
  area            VARCHAR(120) NOT NULL,
  whatsapp_number VARCHAR(32) NOT NULL,
  tariff_start    INT UNSIGNED NOT NULL DEFAULT 0,
  call_fee        INT UNSIGNED NOT NULL DEFAULT 0,
  slots_available TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_featured     TINYINT(1) NOT NULL DEFAULT 0,
  is_verified     TINYINT(1) NOT NULL DEFAULT 0,
  rating          DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_technicians_user (user_id),
  KEY idx_technicians_category (category_id),
  KEY idx_technicians_catalog (is_verified, is_featured),
  CONSTRAINT fk_technicians_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_technicians_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- price_type:
--   fixed    = harga tetap untuk layanan tersebut
--   starting = harga awal, final setelah pengecekan
--   quote    = harga belum bisa ditentukan, menunggu diagnosa teknisi
CREATE TABLE IF NOT EXISTS services (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  technician_id     INT UNSIGNED NOT NULL,
  name              VARCHAR(140) NOT NULL,
  description       VARCHAR(255) NOT NULL DEFAULT '',
  price_type        ENUM('fixed', 'starting', 'quote') NOT NULL DEFAULT 'fixed',
  includes_parts    TINYINT(1) NOT NULL DEFAULT 0,
  price             INT UNSIGNED NOT NULL DEFAULT 0,
  estimated_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_services_technician (technician_id, is_active),
  CONSTRAINT fk_services_technician FOREIGN KEY (technician_id) REFERENCES technicians (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code              VARCHAR(24) NOT NULL,
  customer_id       INT UNSIGNED NULL,
  technician_id     INT UNSIGNED NULL,
  service_id        INT UNSIGNED NULL,
  customer_name     VARCHAR(120) NOT NULL,
  customer_phone    VARCHAR(32) NOT NULL DEFAULT '',
  technician_name   VARCHAR(140) NOT NULL,
  technician_phone  VARCHAR(32) NOT NULL,
  service_name      VARCHAR(140) NOT NULL DEFAULT '',
  price_type        ENUM('fixed', 'starting', 'quote') NOT NULL DEFAULT 'fixed',
  service_mode      ENUM('home', 'workshop') NOT NULL DEFAULT 'home',
  complaint         TEXT NOT NULL,
  customer_address  VARCHAR(255) NOT NULL DEFAULT '',
  estimated_total   INT UNSIGNED NOT NULL DEFAULT 0,
  status            ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')
                      NOT NULL DEFAULT 'pending',
  scheduled_date    DATE NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (code),
  KEY idx_orders_customer (customer_id, created_at),
  KEY idx_orders_technician (technician_id, created_at),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_technician FOREIGN KEY (technician_id) REFERENCES technicians (id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_service FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL,
  expires    INT UNSIGNED NOT NULL,
  data       MEDIUMTEXT,
  PRIMARY KEY (session_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
