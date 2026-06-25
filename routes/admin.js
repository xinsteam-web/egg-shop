const express = require('express');
const router = express.Router();
const db = require('../database/init');

function requireAdmin(req, res, next) {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/login');
  }
  next();
}

router.get('/', requireAdmin, (req, res) => {
  const orders = db.query(
    'SELECT o.*, u.company as user_company, u.contact as user_contact, (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
  );
  const stats = {
    total: db.query('SELECT COUNT(*) as c FROM orders')[0].c,
    pending: db.query("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'")[0].c,
    confirmed: db.query("SELECT COUNT(*) as c FROM orders WHERE status = 'confirmed'")[0].c,
    shipped: db.query("SELECT COUNT(*) as c FROM orders WHERE status = 'shipped'")[0].c,
    completed: db.query("SELECT COUNT(*) as c FROM orders WHERE status = 'completed'")[0].c
  };
  res.render('admin', { title: '管理后台', orders, stats, layout: 'layout' });
});

router.post('/order/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'completed'];
  if (validStatuses.includes(status)) {
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  }
  res.redirect('/admin');
});

module.exports = router;
