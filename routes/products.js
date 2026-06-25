const express = require('express');
const router = express.Router();
const db = require('../database/init');

router.get('/', (req, res) => {
  const categorySlug = req.query.category || '';
  let products;
  if (categorySlug) {
    products = db.query(
      'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE c.slug = ? ORDER BY p.sort_order',
      [categorySlug]);
  } else {
    products = db.query(
      'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id ORDER BY p.category_id, p.sort_order');
  }
  const categories = db.query('SELECT * FROM categories ORDER BY id');
  const selectedCategory = categorySlug;
  res.render('products', { title: selectedCategory ? selectedCategory + ' - 产品中心' : '产品中心',
    user: req.session.user || null,
    products,
    categories,
    selectedCategory,
    cartCount: req.session.cart ? req.session.cart.reduce((s, i) => s + i.quantity, 0) : 0
  });
});

router.get('/:slug', (req, res) => {
  const products = db.query(
    'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p JOIN categories c ON p.category_id = c.id WHERE p.slug = ?',
    [req.params.slug]);
  if (products.length === 0) {
    return res.status(404).render('products', { title: '产品未找到',
      user: req.session.user || null,
      products: [],
      categories: [],
      selectedCategory: '',
      error: '产品未找到',
      cartCount: req.session.cart ? req.session.cart.reduce((s, i) => s + i.quantity, 0) : 0
    });
  }
  res.render('product', { title: products[0].name + ' - 产品详情',
    user: req.session.user || null,
    product: products[0],
    cartCount: req.session.cart ? req.session.cart.reduce((s, i) => s + i.quantity, 0) : 0
  });
});

module.exports = router;
