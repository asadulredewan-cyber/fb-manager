import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

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

// --- ১. মেটা Webhook ভেরিফিকেশন (GET Request) ---
app.get('/api/webhook/fb-listener', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('Webhook verified successfully by Meta!');
    return res.status(200).send(challenge);
  }
  
  console.warn('Webhook verification token mismatch:', { received: token, expected: expectedToken });
  return res.status(403).send('Verification failed');
});

// --- ২. ইনকামিং মেসেজ ও কমেন্ট ইভেন্ট (POST Request) ---
app.post('/api/webhook/fb-listener', handleRoute(() => import('./api/webhook/fb-listener.js')));

// অন্যান্য এপিআই রাউটসমূহ
app.all('/api/dashboard/summary', handleRoute(() => import('./api/dashboard/summary.js')));
app.all('/api/comments/comment-action', handleRoute(() => import('./api/comments/comment-action.js')));
app.all('/api/comments/get-comments', handleRoute(() => import('./api/comments/get-comments.js')));
app.all('/api/messages/get-messages', handleRoute(() => import('./api/messages/get-messages.js')));
app.all('/api/messages/send-reply', handleRoute(() => import('./api/messages/send-reply.js')));
app.all('/api/auth/fb-exchange-token', handleRoute(() => import('./api/auth/fb-exchange-token.js')));
app.all('/api/auth/verify-admin', handleRoute(() => import('./api/auth/verify-admin.js')));
app.all('/api/posts/get-posts', handleRoute(() => import('./api/posts/get-posts.js')));
app.all('/api/posts/manual-schedule', handleRoute(() => import('./api/posts/manual-schedule.js')));
app.all('/api/posts/generate-image', handleRoute(() => import('./api/posts/generate-image.js')));
app.all('/api/scheduler/check-and-post', handleRoute(() => import('./api/scheduler/check-and-post.js')));

// হোমপেজ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// হেলথ চেক রুট
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
