const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database/init');

router.get('/register', (req, res) => {
  res.render('register', { title: '注册', error: null });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, company, contact, phone, address } = req.body;
    if (!username || !password || !company || !contact || !phone) {
      return res.render('register', { title: '注册', error: '请填写所有必填字段' });
    }
    const existing = db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.render('register', { title: '注册', error: '该用户名已被注册' });
    }
    const hashed = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password, company, contact, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashed, company, contact, phone, address || '']);
    res.redirect('/login?registered=1');
  } catch (err) {
    console.error('Register error:', err);
    res.render('register', { title: '注册', error: '注册失败，请稍后重试' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', {
    title: '登录',
    error: null,
    registered: req.query.registered === '1'
  });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.render('login', { title: '登录', error: '请输入用户名和密码', registered: false });
    }
    const users = db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.render('login', { title: '登录', error: '用户名或密码错误', registered: false });
    }
    const valid = await bcrypt.compare(password, users[0].password);
    if (!valid) {
      return res.render('login', { title: '登录', error: '用户名或密码错误', registered: false });
    }
    req.session.user = {
      id: users[0].id,
      username: users[0].username,
      is_admin: users[0].is_admin ? true : false,
      company: users[0].company,
      contact: users[0].contact,
      phone: users[0].phone
    };
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', { title: '登录', error: '登录失败，请稍后重试', registered: false });
  }
});


router.get('/password', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('change_password', { title: '修改密码', error: null, success: null });
});

router.post('/password', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    var { current_password, new_password, confirm_password } = req.body;
    if (!current_password || !new_password || !confirm_password) {
      return res.render('change_password', { title: '修改密码', error: '请填写所有字段', success: null });
    }
    if (new_password.length < 4) {
      return res.render('change_password', { title: '修改密码', error: '新密码至少4位', success: null });
    }
    if (new_password !== confirm_password) {
      return res.render('change_password', { title: '修改密码', error: '两次输入的新密码不一致', success: null });
    }
    var users = db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    if (users.length === 0) {
      return res.render('change_password', { title: '修改密码', error: '用户不存在', success: null });
    }
    var valid = await bcrypt.compare(current_password, users[0].password);
    if (!valid) {
      return res.render('change_password', { title: '修改密码', error: '当前密码错误', success: null });
    }
    var hashed = await bcrypt.hash(new_password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.session.user.id]);
    res.render('change_password', { title: '修改密码', error: null, success: '密码修改成功' });
  } catch (err) {
    console.error('Password change error:', err);
    res.render('change_password', { title: '修改密码', error: '修改失败，请稍后重试', success: null });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
