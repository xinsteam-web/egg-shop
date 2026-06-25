const express = require('express');
const router = express.Router();
const db = require('../database/init');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  res.render('cart', { title: '购物车', user: req.session.user || null, cart, total, count });
});

router.post('/cart/add', (req, res) => {
  const { product_id, name, price, unit, quantity } = req.body;
  const qty = parseFloat(quantity) || 1;
  if (!req.session.cart) req.session.cart = [];
  const existing = req.session.cart.find(i => i.product_id === product_id);
  if (existing) {
    existing.quantity += qty;
  } else {
    req.session.cart.push({ product_id, name, price: parseFloat(price), unit, quantity: qty });
  }
  res.redirect(req.headers.referer || '/products');
});

router.post('/cart/update', (req, res) => {
  const { product_id, quantity } = req.body;
  const qty = parseFloat(quantity);
  if (req.session.cart) {
    if (qty <= 0) {
      req.session.cart = req.session.cart.filter(i => i.product_id !== product_id);
    } else {
      const item = req.session.cart.find(i => i.product_id === product_id);
      if (item) item.quantity = qty;
    }
  }
  res.redirect('/cart');
});

router.post('/cart/remove', (req, res) => {
  const { product_id } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(i => i.product_id !== product_id);
  }
  res.redirect('/cart');
});

router.get('/checkout', requireAuth, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  res.render('checkout', { title: '结算', user: req.session.user, cart, total, error: null });
});

router.post('/checkout', requireAuth, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');
  const { recipient, phone, address, note } = req.body;
  if (!recipient || !phone || !address) {
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    return res.render('checkout', { title: '结算', user: req.session.user, cart, total, error: '请填写收货信息' });
  }
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const orderNo = 'EG' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  db.run(
    'INSERT INTO orders (order_no, user_id, status, total, recipient, phone, address, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [orderNo, req.session.user.id, 'pending', total, recipient, phone, address, note || '']);
  const order = db.query('SELECT id FROM orders WHERE order_no = ?', [orderNo]);
  const orderId = order[0].id;
  for (const item of cart) {
    db.run(
      'INSERT INTO order_items (order_id, product_id, product_name, price, quantity, unit, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, item.product_id, item.name, item.price, item.quantity, item.unit, item.price * item.quantity]);
  }
  req.session.cart = [];
  res.redirect('/orders/' + orderId);
});

router.get('/', requireAuth, (req, res) => {
  const orders = db.query(
    'SELECT o.*, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count FROM orders o WHERE o.user_id = ? ORDER BY o.created_at DESC',
    [req.session.user.id]);
  res.render('orders', { title: '我的订单', user: req.session.user, orders });
});


router.post('/:id/pay', requireAuth, (req, res) => {
  var order = db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
  if (order.length === 0) return res.redirect('/orders');
  db.run("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [req.params.id]);
  res.redirect('/orders/' + req.params.id);
});

router.get('/:id', requireAuth, (req, res) => {
  const orders = db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
  if (orders.length === 0) return res.redirect('/orders');
  const items = db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.render('order_detail', { title: '订单详情', user: req.session.user, order: orders[0], items });
});

module.exports = router;
