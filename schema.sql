CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
 image_url TEXT NOT NULL DEFAULT '',
 stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
 active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
 session_id TEXT PRIMARY KEY,
 email TEXT,
 amount_total INTEGER,
 currency TEXT,
 status TEXT NOT NULL,
 items_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO products (id,name,description,price_cents,image_url,stock) VALUES
 ('silver-stack','Silver Ring Stack','Everyday silver rings',2995,'',12),
 ('gold-stack','Gold Ring Stack','Everyday gold-tone rings',3495,'',8);
