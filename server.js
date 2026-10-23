import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// সেফ ইমপোর্ট হেল্পার
const loadHandler = async (modulePromise) => {
  try {
    const mod = await modulePromise;
    return mod.default || mod;
  } catch (err) {
    console.error('Module load error:', err.message);
    return null;
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// স্ট্যাটিক ফ্রন্টএন্ড ফাইল
app.use(express.static(path.join(__dirname, 'public')));

// রুট র‍্যাপার
const handleRoute = (importFn) => async (req, res) => {
  try {
    const handler = await loadHandler(importFn());
    if (typeof handler === 'function') {
      await handler(req, res);
    } else {
      res.status(500).json({ error: 'Handler not found or failed to load' });
    }
  } catch (err) {
    console.error('Request Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// Webhook ও API রাউটসমূহ
app.all('/api/webhook/fb-listener', handleRoute(() => import('./api/webhook/fb-listener.js')));
app.all('/api/comments/comment-action', handleRoute(() => import('./api/comments/comment-action.js')));
app.all('/api/comments/get-comments', handleRoute(() => import('./api/comments/get-comments.js')));
app.all('/api/messages/get-messages', handleRoute(() => import('./api/messages/get-messages.js')));
app.all('/api/messages/send-reply', handleRoute(() => import('./api/messages/send-reply.js')));
app.all('/api/auth/fb-exchange-token', handleRoute(() => import('./api/auth/fb-exchange-token.js')));
app.all('/api/auth/verify-admin', handleRoute(() => import('./api/auth/verify-admin.js')));

// হোমপেজ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// হেলথ চেক রুট (UptimeRobot / Cron-job এর জন্য)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
