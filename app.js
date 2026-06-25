const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'egg-shop-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.cartCount = req.session.cart ? req.session.cart.reduce((s, i) => s + i.quantity, 0) : 0;
  res.locals.user = req.session.user || null;
  next();
});

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  const db = require('./database/init');
  const categories = db.query('SELECT * FROM categories ORDER BY id');
  const featured = db.query('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id ORDER BY p.sort_order LIMIT 8');
  res.render('index', { title: '首页', categories, featured });
});

app.get('/about', (req, res) => {
  res.render('about', { title: '关于我们' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: '联系我们' });
});

async function start() {
  const db = require('./database/init');
  await db.initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running at http://localhost:3000');
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;