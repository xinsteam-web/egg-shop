const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
     company TEXT NOT NULL,
     contact TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT ''
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      spec TEXT DEFAULT '',
      origin TEXT DEFAULT '',
      packaging TEXT DEFAULT '',
      min_order INTEGER DEFAULT 1,
      price REAL NOT NULL,
      unit TEXT DEFAULT '斤',
      image TEXT DEFAULT '',
      stock INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      total REAL NOT NULL,
      recipient TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT '斤',
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  const catCount = db.exec("SELECT COUNT(*) as c FROM categories");
  if (catCount.length === 0 || catCount[0].values[0][0] === 0) {
    seedData();
  }

  // Migration: add payment_status to orders
  try { db.run("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'unpaid'"); } catch(e) {}

  saveDb();
  return db;
}

function seedData() {
  db.run("INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES (1, '鹌鹑蛋', 'quail-egg', '新鲜鹌鹑蛋，营养丰富，有''''''''动物人参''''''''之美誉')");
  db.run("INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES (2, '鸽蛋', 'pigeon-egg', '滋补鸽蛋，细腻嫩滑，老少皆宜')");
  db.run("INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES (3, '鸭蛋', 'duck-egg', '优质鸭蛋，个大味鲜，适合加工')");
  db.run("INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES (4, '鹅蛋', 'goose-egg', '大个鹅蛋，营养充沛，适合家庭分享')");

  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (1, '鲜鹌鹑蛋（小号）', 'quail-small', '每日新鲜采收，颗粒饱满，蛋黄丰腴', '每斤约40-45枚', '自有养殖基地', '10斤/泡沫箱', 10, 16, '斤', 1)");
  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (1, '鲜鹌鹑蛋（大号）', 'quail-large', '精选大号鹌鹑蛋，皮薄肉厚', '每斤约35-38枚', '自有养殖基地', '10斤/泡沫箱', 10, 20, '斤', 2)");
  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (1, '有机鹌鹑蛋', 'quail-organic', '通过有机认证，天然谷物喂养', '每斤约38-42枚', '有机认证基地', '5斤/礼盒装', 5, 28, '斤', 3)");

  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (2, '鲜鸽蛋（普通）', 'pigeon-regular', '新鲜白鸽蛋，口感细腻', '每枚约15-18g', '自有鸽场', '50枚/箱', 50, 5, '枚', 1)");
  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (2, '鲜鸽蛋（精选）', 'pigeon-premium', '精选肥鸽蛋，个头均匀', '每枚约18-22g', '自有鸽场', '30枚/礼盒', 30, 6.5, '枚', 2)");

  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (3, '鲜鸭蛋', 'duck-fresh', '新鲜麻鸭蛋，个大黄多', '每斤约6-8枚', '散养基地', '20斤/筐', 20, 10, '斤', 1)");
  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (3, '农家散养鸭蛋', 'duck-free-range', '散养麻鸭自然产蛋，风味浓郁', '每斤约5-7枚', '山区散养基地', '10斤/筐', 10, 14, '斤', 2)");

  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (4, '鲜鹅蛋', 'goose-fresh', '新鲜大白鹅蛋，营养丰富', '每枚约120-150g', '自有鹅场', '20枚/箱', 20, 8, '枚', 1)");
  db.run("INSERT OR IGNORE INTO products (category_id, name, slug, description, spec, origin, packaging, min_order, price, unit, sort_order) VALUES (4, '散养鹅蛋', 'goose-free-range', '散养大白鹅自然产蛋，品质上乘', '每枚约130-160g', '散养基地', '12枚/礼盒', 12, 10, '枚', 2)");

    var adminHashed = "$2a$10$bphUQMJizxt8V.5w8DtzMOX/N4fwi/UEZd0Rv.Mwop6zQijUOoXTe";
  db.run("INSERT OR IGNORE INTO users (username, password, is_admin, company, contact, phone, address) VALUES ('admin', '" + adminHashed + "', 1, '系统管理员', '管理员', '13800000000', '')");
}

function query(sql, params) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const columns = stmt.getColumnNames();
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params) {
  if (!db) throw new Error('Database not initialized');
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  saveDb();
}

module.exports = { initDatabase, getDb, query, run, saveDb };
