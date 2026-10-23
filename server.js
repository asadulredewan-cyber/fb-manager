import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// API হ্যান্ডলারগুলো ইমপোর্ট করুন
import fbListenerHandler from './api/webhook/fb-listener.js';
import commentActionHandler from './api/comments/comment-action.js';
import getCommentsHandler from './api/comments/get-comments.js';
import getMessagesHandler from './api/messages/get-messages.js';
import sendReplyHandler from './api/messages/send-reply.js';
import fbExchangeTokenHandler from './api/auth/fb-exchange-token.js';
import verifyAdminHandler from './api/auth/verify-admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// বডি পার্সিং
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// স্ট্যাটিক ফাইল পরিবেশন (ড্যাশবোর্ড ও ফ্রন্টএন্ড UI)
app.use(express.static(path.join(__dirname, 'public')));

// Vercel ফাংশনগুলোকে Express রুটে র‍্যাপ করার হেল্পার
const adaptVercelHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

// Webhook রুট (মেটা ফেসবুক এখান থেকেই কল করবে)
app.all('/api/webhook/fb-listener', adaptVercelHandler(fbListenerHandler));

// কমেন্ট ও মেসেজ রুট
app.all('/api/comments/comment-action', adaptVercelHandler(commentActionHandler));
app.all('/api/comments/get-comments', adaptVercelHandler(getCommentsHandler));
app.all('/api/messages/get-messages', adaptVercelHandler(getMessagesHandler));
app.all('/api/messages/send-reply', adaptVercelHandler(sendReplyHandler));

// অথেন্টিকেশন রুট
app.all('/api/auth/fb-exchange-token', adaptVercelHandler(fbExchangeTokenHandler));
app.all('/api/auth/verify-admin', adaptVercelHandler(verifyAdminHandler));

// ফ্রন্টএন্ড হোমপেজ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});