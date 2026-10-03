require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const CONTENT_FILE = path.join(__dirname, 'content.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));
app.use(express.json({ limit: '250kb' }));
app.use(express.urlencoded({ extended: true, limit: '250kb' }));

function getContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Lalibera Admin"');
    return res.status(401).send('Authentication required');
  }
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const split = decoded.indexOf(':');
  const username = split >= 0 ? decoded.slice(0, split) : '';
  const password = split >= 0 ? decoded.slice(split + 1) : '';
  if (username === 'admin' && password === process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) return next();
  res.setHeader('WWW-Authenticate', 'Basic realm="Lalibera Admin"');
  return res.status(401).send('Access denied');
}

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function render(view, page) {
  return (req, res) => res.render(view, { content: getContent(), page });
}

app.get('/', render('index', 'home'));
app.get('/about', render('about', 'about'));
app.get('/rooms', render('rooms', 'rooms'));
app.get('/services', render('services', 'services'));
app.get('/menu', render('menu', 'menu'));
app.get('/contact', render('contact', 'contact'));

app.get('/admin', auth, (req, res) => res.render('admin', { content: getContent(), page: 'admin' }));
app.get('/api/content', auth, (req, res) => res.json(getContent()));
app.post('/api/save', auth, (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ error: 'Invalid content' });
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(req.body, null, 2) + '\n');
  res.json({ success: true });
});

app.post('/api/book', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required.' });
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return res.status(503).json({ error: 'Email service is not configured.' });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      replyTo: email,
      subject: 'Lalibera website inquiry: ' + (subject || 'Booking request'),
      text: 'Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + (phone || 'N/A') + '\n\n' + message,
      html: '<h2>New website inquiry</h2><p><strong>Name:</strong> ' + esc(name) + '</p><p><strong>Email:</strong> ' + esc(email) + '</p><p><strong>Phone:</strong> ' + esc(phone || 'N/A') + '</p><p><strong>Subject:</strong> ' + esc(subject || 'Booking request') + '</p><p>' + esc(message).replace(/\n/g, '<br>') + '</p>'
    });

    res.json({ success: true, message: 'Thank you. Your inquiry has been sent.' });
  } catch (error) {
    console.error('Mail error:', error);
    res.status(500).json({ error: 'Unable to send your inquiry right now.' });
  }
});

app.use((req, res) => res.status(404).render('404', { content: getContent(), page: '' }));

app.listen(PORT, '0.0.0.0', () => console.log('Lalibera website running on port ' + PORT));
